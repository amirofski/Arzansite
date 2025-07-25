import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Move
} from 'lucide-react';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'text' | 'image' | 'button' | 'circle' | 'line' | 'menu';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface WireframeData {
  elements: WireframeElement[];
  canvasWidth: number;
  canvasHeight: number;
}

interface WireframeEditorProps {
  data: any;
  updateData: (data: any) => void;
}

const WireframeEditor: React.FC<WireframeEditorProps> = ({ data, updateData }) => {
  const [wireframe, setWireframe] = useState<WireframeData>(
    data.wireframe || { elements: [], canvasWidth: 800, canvasHeight: 600 }
  );
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const tools = [
    { type: 'rectangle', icon: RectangleHorizontal, label: 'مستطیل', width: 120, height: 80 },
    { type: 'text', icon: Type, label: 'متن', width: 100, height: 30 },
    { type: 'image', icon: Image, label: 'تصویر', width: 150, height: 100 },
    { type: 'button', icon: Square, label: 'دکمه', width: 100, height: 40 },
    { type: 'circle', icon: Circle, label: 'دایره', width: 80, height: 80 },
    { type: 'line', icon: Minus, label: 'خط', width: 150, height: 2 },
    { type: 'menu', icon: Menu, label: 'منو', width: 200, height: 150 },
  ];

  const addElement = (toolType: string) => {
    const tool = tools.find(t => t.type === toolType);
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

    const updatedWireframe = {
      ...wireframe,
      elements: [...wireframe.elements, newElement]
    };

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

    const updatedWireframe = { ...wireframe, elements: updatedElements };
    setWireframe(updatedWireframe);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      updateData({ wireframe });
    }
    setIsDragging(false);
  };

  const deleteElement = (elementId: string) => {
    const updatedElements = wireframe.elements.filter(el => el.id !== elementId);
    const updatedWireframe = { ...wireframe, elements: updatedElements };
    setWireframe(updatedWireframe);
    updateData({ wireframe: updatedWireframe });
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

    const updatedWireframe = {
      ...wireframe,
      elements: [...wireframe.elements, newElement]
    };

    setWireframe(updatedWireframe);
    updateData({ wireframe: updatedWireframe });
  };

  const renderElement = (element: WireframeElement) => {
    const isSelected = selectedElement === element.id;

    const baseStyle = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
      backgroundColor: 'hsl(var(--background))',
      cursor: 'move',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: 'hsl(var(--muted-foreground))',
      userSelect: 'none' as const,
    };

    let content;
    switch (element.type) {
      case 'rectangle':
        content = 'مستطیل';
        break;
      case 'text':
        content = 'متن نمونه';
        break;
      case 'image':
        content = '🖼️ تصویر';
        break;
      case 'button':
        content = 'دکمه';
        Object.assign(baseStyle, {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '6px',
        });
        break;
      case 'circle':
        content = '⭕';
        Object.assign(baseStyle, { borderRadius: '50%' });
        break;
      case 'line':
        content = '';
        Object.assign(baseStyle, { 
          backgroundColor: 'hsl(var(--border))',
          height: 2,
        });
        break;
      case 'menu':
        content = (
          <div className="text-xs">
            <div>منو</div>
            <div className="mt-1 text-xs">• آیتم ۱</div>
            <div className="text-xs">• آیتم ۲</div>
            <div className="text-xs">• آیتم ۳</div>
          </div>
        );
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
          <div className="absolute -top-8 left-0 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
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
              className="h-6 w-6 p-0"
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
        <h3 className="text-lg font-semibold mb-2">ویرایشگر Wireframe</h3>
        <p className="text-muted-foreground">
          با کشیدن و رها کردن عناصر، الگوی صفحه خود را طراحی کنید
        </p>
      </div>

      {/* Tools Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ابزارها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.type}
                variant="outline"
                size="sm"
                onClick={() => addElement(tool.type)}
                className="flex items-center gap-2"
              >
                <tool.icon className="h-4 w-4" />
                {tool.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">بوم طراحی</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">
                {wireframe.elements.length} عنصر
              </Badge>
              {selectedElement && (
                <Badge variant="default">
                  <Move className="h-3 w-3 mr-1" />
                  انتخاب شده
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={canvasRef}
            className="relative border-2 border-dashed border-border bg-muted/20 overflow-hidden"
            style={{
              width: wireframe.canvasWidth,
              height: wireframe.canvasHeight,
              minHeight: '400px'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedElement(null)}
          >
            {wireframe.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MoreHorizontal className="h-8 w-8 mx-auto mb-2" />
                  <p>عنصری اضافه نشده است</p>
                  <p className="text-sm">از ابزارهای بالا استفاده کنید</p>
                </div>
              </div>
            )}
            {wireframe.elements.map(renderElement)}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• برای افزودن عنصر، روی ابزار مورد نظر کلیک کنید</p>
            <p>• برای جابجایی عنصر، آن را بکشید و رها کنید</p>
            <p>• برای انتخاب عنصر، روی آن کلیک کنید</p>
            <p>• برای کپی یا حذف، عنصر را انتخاب کنید و از دکمه‌های ظاهر شده استفاده کنید</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WireframeEditor;