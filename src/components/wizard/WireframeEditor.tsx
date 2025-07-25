import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RectangleHorizontal, 
  Type, 
  Image, 
  Menu, 
  Circle,
  Square,
  Minus,
  MoreHorizontal,
  Trash2,
  Copy,
  Move,
  Layout,
  Zap,
  Users,
  MessageSquare,
  Phone,
  FileText,
  Star,
  Globe,
  ChevronDown
} from 'lucide-react';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'text' | 'image' | 'button' | 'circle' | 'line' | 'menu' | 'header' | 'hero' | 'section' | 'footer';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  template?: string;
}

interface WireframeData {
  elements: WireframeElement[];
  canvasWidth: number;
  canvasHeight: number;
}

interface Template {
  id: string;
  name: string;
  type: string;
  elements: Omit<WireframeElement, 'id'>[];
}

interface WireframeEditorProps {
  data: any;
  updateData: (data: any) => void;
}

const WireframeEditor: React.FC<WireframeEditorProps> = ({ data, updateData }) => {
  const [wireframe, setWireframe] = useState<WireframeData>(
    data.wireframe || { elements: [], canvasWidth: 900, canvasHeight: 800 }
  );
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const basicTools = [
    { type: 'rectangle', icon: RectangleHorizontal, label: 'مستطیل', width: 120, height: 80 },
    { type: 'text', icon: Type, label: 'متن', width: 100, height: 30 },
    { type: 'image', icon: Image, label: 'تصویر', width: 150, height: 100 },
    { type: 'button', icon: Square, label: 'دکمه', width: 100, height: 40 },
    { type: 'circle', icon: Circle, label: 'دایره', width: 80, height: 80 },
    { type: 'line', icon: Minus, label: 'خط', width: 150, height: 2 },
  ];

  const componentTemplates: Template[] = [
    // Header Templates
    {
      id: 'header-minimal',
      name: 'هدر مینیمال',
      type: 'header',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 80, label: 'هدر', template: 'header-bg' },
        { type: 'text', x: 50, y: 30, width: 100, height: 20, label: 'لوگو' },
        { type: 'rectangle', x: 700, y: 25, width: 150, height: 30, label: 'منوی ناوبری' },
      ]
    },
    {
      id: 'header-full',
      name: 'هدر کامل',
      type: 'header',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 120, label: 'هدر', template: 'header-bg' },
        { type: 'image', x: 50, y: 30, width: 60, height: 60, label: 'لوگو' },
        { type: 'text', x: 130, y: 45, width: 150, height: 30, label: 'نام شرکت' },
        { type: 'rectangle', x: 500, y: 45, width: 300, height: 30, label: 'منوی اصلی' },
        { type: 'button', x: 820, y: 40, width: 70, height: 40, label: 'ورود' },
      ]
    },
    // Hero Section Templates
    {
      id: 'hero-centered',
      name: 'هیرو متمرکز',
      type: 'hero',
      elements: [
        { type: 'rectangle', x: 0, y: 120, width: 900, height: 400, label: 'بخش هیرو', template: 'hero-bg' },
        { type: 'text', x: 300, y: 220, width: 300, height: 40, label: 'عنوان اصلی' },
        { type: 'text', x: 250, y: 280, width: 400, height: 60, label: 'توضیح محصول یا خدمات' },
        { type: 'button', x: 350, y: 370, width: 200, height: 50, label: 'شروع کنید' },
      ]
    },
    {
      id: 'hero-split',
      name: 'هیرو تقسیم شده',
      type: 'hero',
      elements: [
        { type: 'rectangle', x: 0, y: 120, width: 900, height: 400, label: 'بخش هیرو', template: 'hero-bg' },
        { type: 'text', x: 50, y: 200, width: 350, height: 40, label: 'عنوان جذاب' },
        { type: 'text', x: 50, y: 260, width: 350, height: 80, label: 'توضیحات تفصیلی' },
        { type: 'button', x: 50, y: 370, width: 150, height: 50, label: 'اطلاعات بیشتر' },
        { type: 'image', x: 500, y: 170, width: 350, height: 260, label: 'تصویر اصلی' },
      ]
    },
    // Feature Section Templates
    {
      id: 'features-grid',
      name: 'ویژگی‌ها - شبکه‌ای',
      type: 'section',
      elements: [
        { type: 'text', x: 350, y: 550, width: 200, height: 40, label: 'ویژگی‌های ما' },
        { type: 'rectangle', x: 50, y: 620, width: 250, height: 150, label: 'ویژگی ۱' },
        { type: 'rectangle', x: 325, y: 620, width: 250, height: 150, label: 'ویژگی ۲' },
        { type: 'rectangle', x: 600, y: 620, width: 250, height: 150, label: 'ویژگی ۳' },
      ]
    },
    {
      id: 'testimonials',
      name: 'نظرات مشتریان',
      type: 'section',
      elements: [
        { type: 'text', x: 350, y: 800, width: 200, height: 40, label: 'نظرات مشتریان' },
        { type: 'rectangle', x: 100, y: 870, width: 700, height: 120, label: 'نظر مشتری' },
        { type: 'circle', x: 400, y: 1010, width: 60, height: 60, label: 'عکس' },
        { type: 'text', x: 350, y: 1080, width: 200, height: 30, label: 'نام مشتری' },
      ]
    },
    // Footer Templates
    {
      id: 'footer-simple',
      name: 'فوتر ساده',
      type: 'footer',
      elements: [
        { type: 'rectangle', x: 0, y: 1150, width: 900, height: 100, label: 'فوتر', template: 'footer-bg' },
        { type: 'text', x: 50, y: 1180, width: 200, height: 20, label: 'حق نشر ©' },
        { type: 'rectangle', x: 650, y: 1170, width: 200, height: 30, label: 'لینک‌های اجتماعی' },
      ]
    },
  ];

  const pageTemplates: Template[] = [
    {
      id: 'landing-page',
      name: 'صفحه فرود',
      type: 'page',
      elements: [
        // Header
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 80, label: 'هدر', template: 'header-bg' },
        { type: 'text', x: 50, y: 30, width: 100, height: 20, label: 'لوگو' },
        { type: 'rectangle', x: 650, y: 25, width: 200, height: 30, label: 'منوی ناوبری' },
        // Hero
        { type: 'rectangle', x: 0, y: 80, width: 900, height: 350, label: 'بخش هیرو', template: 'hero-bg' },
        { type: 'text', x: 300, y: 180, width: 300, height: 40, label: 'عنوان اصلی' },
        { type: 'text', x: 250, y: 240, width: 400, height: 60, label: 'توضیح محصول' },
        { type: 'button', x: 350, y: 330, width: 200, height: 50, label: 'شروع کنید' },
        // Features
        { type: 'text', x: 350, y: 460, width: 200, height: 40, label: 'ویژگی‌ها' },
        { type: 'rectangle', x: 50, y: 520, width: 250, height: 120, label: 'ویژگی ۱' },
        { type: 'rectangle', x: 325, y: 520, width: 250, height: 120, label: 'ویژگی ۲' },
        { type: 'rectangle', x: 600, y: 520, width: 250, height: 120, label: 'ویژگی ۳' },
        // Footer
        { type: 'rectangle', x: 0, y: 680, width: 900, height: 80, label: 'فوتر', template: 'footer-bg' },
      ]
    },
    {
      id: 'about-page',
      name: 'صفحه درباره ما',
      type: 'page',
      elements: [
        // Header
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 80, label: 'هدر' },
        { type: 'text', x: 50, y: 30, width: 100, height: 20, label: 'لوگو' },
        // Page Header
        { type: 'text', x: 350, y: 120, width: 200, height: 40, label: 'درباره ما' },
        // Content
        { type: 'image', x: 50, y: 180, width: 350, height: 200, label: 'تصویر شرکت' },
        { type: 'text', x: 450, y: 180, width: 400, height: 150, label: 'داستان شرکت' },
        { type: 'text', x: 50, y: 420, width: 800, height: 100, label: 'ماموریت و چشم‌انداز' },
        // Team
        { type: 'text', x: 350, y: 560, width: 200, height: 40, label: 'تیم ما' },
        { type: 'circle', x: 150, y: 620, width: 100, height: 100, label: 'عضو تیم ۱' },
        { type: 'circle', x: 400, y: 620, width: 100, height: 100, label: 'عضو تیم ۲' },
        { type: 'circle', x: 650, y: 620, width: 100, height: 100, label: 'عضو تیم ۳' },
      ]
    },
    {
      id: 'contact-page',
      name: 'صفحه تماس',
      type: 'page',
      elements: [
        // Header
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 80, label: 'هدر' },
        // Page Title
        { type: 'text', x: 350, y: 120, width: 200, height: 40, label: 'تماس با ما' },
        // Contact Form
        { type: 'rectangle', x: 50, y: 180, width: 400, height: 300, label: 'فرم تماس' },
        { type: 'text', x: 70, y: 200, width: 100, height: 20, label: 'نام' },
        { type: 'text', x: 70, y: 240, width: 100, height: 20, label: 'ایمیل' },
        { type: 'text', x: 70, y: 280, width: 100, height: 80, label: 'پیام' },
        { type: 'button', x: 70, y: 380, width: 100, height: 40, label: 'ارسال' },
        // Contact Info
        { type: 'rectangle', x: 500, y: 180, width: 350, height: 200, label: 'اطلاعات تماس' },
        { type: 'text', x: 520, y: 200, width: 200, height: 20, label: 'آدرس' },
        { type: 'text', x: 520, y: 240, width: 200, height: 20, label: 'تلفن' },
        { type: 'text', x: 520, y: 280, width: 200, height: 20, label: 'ایمیل' },
        // Map
        { type: 'rectangle', x: 50, y: 520, width: 800, height: 200, label: 'نقشه' },
      ]
    },
  ];

  const addElement = (toolType: string) => {
    const tool = basicTools.find(t => t.type === toolType);
    if (!tool) return;

    const newElement: WireframeElement = {
      id: `element-${Date.now()}`,
      type: toolType as any,
      x: 50,
      y: 50,
      width: tool.width,
      height: tool.height,
      label: tool.label
    };

    updateWireframe([...wireframe.elements, newElement]);
  };

  const addTemplate = (template: Template) => {
    const newElements = template.elements.map((element, index) => ({
      ...element,
      id: `template-${Date.now()}-${index}`,
    }));

    updateWireframe([...wireframe.elements, ...newElements]);
  };

  const loadPageTemplate = (template: Template) => {
    const newElements = template.elements.map((element, index) => ({
      ...element,
      id: `page-${Date.now()}-${index}`,
    }));

    updateWireframe(newElements);
  };

  const updateWireframe = (elements: WireframeElement[]) => {
    const updatedWireframe = { ...wireframe, elements };
    setWireframe(updatedWireframe);
    updateData({ wireframe: updatedWireframe });
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = wireframe.elements.find(el => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    const updatedElements = wireframe.elements.map(element =>
      element.id === selectedElement
        ? { ...element, x: Math.max(0, newX), y: Math.max(0, newY) }
        : element
    );

    setWireframe({ ...wireframe, elements: updatedElements });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      updateData({ wireframe });
    }
    setIsDragging(false);
  };

  const deleteElement = (elementId: string) => {
    const updatedElements = wireframe.elements.filter(el => el.id !== elementId);
    updateWireframe(updatedElements);
    setSelectedElement(null);
  };

  const duplicateElement = (elementId: string) => {
    const element = wireframe.elements.find(el => el.id === elementId);
    if (!element) return;

    const newElement = {
      ...element,
      id: `element-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20
    };

    updateWireframe([...wireframe.elements, newElement]);
  };

  const clearCanvas = () => {
    updateWireframe([]);
    setSelectedElement(null);
  };

  const renderElement = (element: WireframeElement) => {
    const isSelected = selectedElement === element.id;

    let baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
      cursor: 'move',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      userSelect: 'none',
      overflow: 'hidden',
    };

    // Apply template styles
    if (element.template === 'header-bg') {
      baseStyle.backgroundColor = 'hsl(var(--primary) / 0.1)';
      baseStyle.color = 'hsl(var(--primary))';
    } else if (element.template === 'hero-bg') {
      baseStyle.backgroundColor = 'hsl(var(--secondary) / 0.1)';
      baseStyle.color = 'hsl(var(--secondary-foreground))';
    } else if (element.template === 'footer-bg') {
      baseStyle.backgroundColor = 'hsl(var(--muted))';
      baseStyle.color = 'hsl(var(--muted-foreground))';
    } else {
      baseStyle.backgroundColor = 'hsl(var(--background))';
      baseStyle.color = 'hsl(var(--muted-foreground))';
    }

    let content;
    switch (element.type) {
      case 'rectangle':
        content = element.label || 'مستطیل';
        break;
      case 'text':
        content = element.label || 'متن نمونه';
        break;
      case 'image':
        content = '🖼️ ' + (element.label || 'تصویر');
        break;
      case 'button':
        content = element.label || 'دکمه';
        Object.assign(baseStyle, {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '6px',
        });
        break;
      case 'circle':
        content = element.label || '⭕';
        Object.assign(baseStyle, { borderRadius: '50%' });
        break;
      case 'line':
        content = '';
        Object.assign(baseStyle, { 
          backgroundColor: 'hsl(var(--border))',
          height: 2,
        });
        break;
      default:
        content = element.label;
    }

    return (
      <div
        key={element.id}
        style={baseStyle}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        onClick={() => setSelectedElement(element.id)}
      >
        {content}
        {isSelected && (
          <div className="absolute -top-8 left-0 flex gap-1 z-10">
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-background"
              onClick={(e) => {
                e.stopPropagation();
                duplicateElement(element.id);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-background"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">ویرایشگر Wireframe حرفه‌ای</h3>
        <p className="text-muted-foreground">
          با استفاده از قالب‌های آماده و ابزارهای حرفه‌ای، طرح صفحات خود را طراحی کنید
        </p>
      </div>

      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">قالب‌های جزء</TabsTrigger>
          <TabsTrigger value="pages">قالب‌های صفحه</TabsTrigger>
          <TabsTrigger value="tools">ابزارهای پایه</TabsTrigger>
          <TabsTrigger value="canvas">بوم طراحی</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layout className="h-4 w-4" />
                قالب‌های آماده اجزا
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="grid grid-cols-1 gap-3">
                  {componentTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {template.type === 'header' && <Menu className="h-4 w-4 text-primary" />}
                        {template.type === 'hero' && <Zap className="h-4 w-4 text-primary" />}
                        {template.type === 'section' && <RectangleHorizontal className="h-4 w-4 text-primary" />}
                        {template.type === 'footer' && <Minus className="h-4 w-4 text-primary" />}
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {template.elements.length} عنصر
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addTemplate(template)}
                        className="text-xs"
                      >
                        افزودن
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                قالب‌های صفحه کامل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {pageTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.elements.length} عنصر - طراحی کامل
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addTemplate(template)}
                        >
                          افزودن به بوم
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => loadPageTemplate(template)}
                        >
                          جایگزینی کامل
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      این قالب شامل تمام بخش‌های مورد نیاز یک صفحه حرفه‌ای است
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ابزارهای پایه</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {basicTools.map((tool) => (
                  <Button
                    key={tool.type}
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(tool.type)}
                    className="flex items-center gap-2 justify-start"
                  >
                    <tool.icon className="h-4 w-4" />
                    {tool.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canvas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">بوم طراحی</CardTitle>
                <div className="flex gap-2 items-center">
                  <Badge variant="outline">
                    {wireframe.elements.length} عنصر
                  </Badge>
                  {selectedElement && (
                    <Badge variant="default">
                      <Move className="h-3 w-3 mr-1" />
                      انتخاب شده
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearCanvas}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div
                  ref={canvasRef}
                  className="relative border-2 border-dashed border-border bg-muted/20 overflow-hidden"
                  style={{
                    width: wireframe.canvasWidth,
                    height: wireframe.canvasHeight,
                    minHeight: '600px'
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={() => setSelectedElement(null)}
                >
                  {wireframe.elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MoreHorizontal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-medium mb-2">بوم خالی است</h4>
                        <p className="text-sm">از قالب‌های آماده یا ابزارهای پایه استفاده کنید</p>
                      </div>
                    </div>
                  )}
                  {wireframe.elements.map(renderElement)}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{wireframe.elements.length}</div>
              <div className="text-sm text-muted-foreground">کل عناصر</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {wireframe.elements.filter(el => el.template).length}
              </div>
              <div className="text-sm text-muted-foreground">قالب‌های اعمال شده</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{wireframe.canvasWidth}×{wireframe.canvasHeight}</div>
              <div className="text-sm text-muted-foreground">اندازه بوم</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {selectedElement ? '✓' : '○'}
              </div>
              <div className="text-sm text-muted-foreground">عنصر انتخاب شده</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WireframeEditor;