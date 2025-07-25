import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import ImageUploadSystem from './ImageUploadSystem';
import { supabase } from '@/integrations/supabase/client';
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
  ChevronDown,
  Maximize,
  Minimize,
  X,
  Settings,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  Save,
  Grid,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Play,
  Images,
  Upload,
  Database,
  Download,
  ZoomIn,
  ZoomOut,
  Hand,
  Plus,
  Edit2,
  Trash
} from 'lucide-react';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'text' | 'image' | 'button' | 'circle' | 'line' | 'menu' | 'header' | 'hero' | 'section' | 'footer' | 'logo' | 'navigation' | 'form' | 'video' | 'gallery' | 'testimonial' | 'cta';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  template?: string;
  content?: string;
  src?: string;
  href?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  zIndex?: number;
}

interface WireframePage {
  id: string;
  name: string;
  elements: WireframeElement[];
}

interface WireframeData {
  pages: WireframePage[];
  currentPageId: string;
  canvasWidth: number;
  canvasHeight: number;
}

interface WireframeEditorPagesProps {
  data: any;
  updateData: (data: any) => void;
}

const WireframeEditorPages: React.FC<WireframeEditorPagesProps> = ({ data, updateData }) => {
  // Initialize wireframe data with pages support
  const initializeWireframe = (): WireframeData => {
    if (data.wireframe && data.wireframe.pages) {
      return data.wireframe;
    }
    
    // Convert old format to new format
    const defaultPage: WireframePage = {
      id: 'page-1',
      name: 'صفحه اصلی',
      elements: data.wireframe?.elements || []
    };
    
    return {
      pages: [defaultPage],
      currentPageId: 'page-1',
      canvasWidth: data.wireframe?.canvasWidth || 900,
      canvasHeight: data.wireframe?.canvasHeight || 800
    };
  };

  const [wireframe, setWireframe] = useState<WireframeData>(initializeWireframe());
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState<string | null>(null);
  const [newPageName, setNewPageName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'templates' | 'layers'>('elements');
  const [canvasHeight, setCanvasHeight] = useState(wireframe.canvasHeight);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Helper functions for page management
  const getCurrentPage = (): WireframePage => {
    return wireframe.pages.find(page => page.id === wireframe.currentPageId) || wireframe.pages[0];
  };

  const getCurrentElements = (): WireframeElement[] => {
    return getCurrentPage().elements;
  };

  const updateCurrentPageElements = (elements: WireframeElement[]) => {
    setWireframe(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === prev.currentPageId 
          ? { ...page, elements }
          : page
      )
    }));
  };

  const addPage = () => {
    const newPageId = `page-${Date.now()}`;
    const newPageName = `صفحه ${wireframe.pages.length + 1}`;
    
    setWireframe(prev => ({
      ...prev,
      pages: [...prev.pages, {
        id: newPageId,
        name: newPageName,
        elements: []
      }],
      currentPageId: newPageId
    }));
  };

  const deletePage = (pageId: string) => {
    if (wireframe.pages.length === 1) {
      toast({ title: "خطا", description: "حداقل یک صفحه باید باقی بماند" });
      return;
    }

    setWireframe(prev => {
      const newPages = prev.pages.filter(page => page.id !== pageId);
      const newCurrentPageId = prev.currentPageId === pageId 
        ? newPages[0].id 
        : prev.currentPageId;
      
      return {
        ...prev,
        pages: newPages,
        currentPageId: newCurrentPageId
      };
    });
  };

  const renamePage = (pageId: string, newName: string) => {
    setWireframe(prev => ({
      ...prev,
      pages: prev.pages.map(page =>
        page.id === pageId ? { ...page, name: newName } : page
      )
    }));
  };

  const switchPage = (pageId: string) => {
    setWireframe(prev => ({ ...prev, currentPageId: pageId }));
    setSelectedElement(null);
  };

  // Update parent data whenever wireframe changes
  React.useEffect(() => {
    updateData({ wireframe });
  }, [wireframe, updateData]);

  // Basic tools
  const basicTools = [
    { type: 'rectangle', icon: RectangleHorizontal, label: 'مستطیل', width: 120, height: 80 },
    { type: 'text', icon: Type, label: 'متن', width: 100, height: 30 },
    { type: 'image', icon: Image, label: 'تصویر', width: 150, height: 100 },
    { type: 'button', icon: Square, label: 'دکمه', width: 100, height: 40 },
    { type: 'circle', icon: Circle, label: 'دایره', width: 80, height: 80 },
    { type: 'line', icon: Minus, label: 'خط', width: 150, height: 2 },
  ];

  const addElement = (type: string) => {
    const tool = basicTools.find(t => t.type === type);
    if (!tool) return;

    const newElement: WireframeElement = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      x: 50,
      y: 50,
      width: tool.width,
      height: tool.height,
      label: tool.label,
    };

    updateCurrentPageElements([...getCurrentElements(), newElement]);
  };

  const deleteElement = (elementId: string) => {
    const updatedElements = getCurrentElements().filter(el => el.id !== elementId);
    updateCurrentPageElements(updatedElements);
    setSelectedElement(null);
  };

  const renderElement = (element: WireframeElement) => {
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute border-2 cursor-move transition-all ${
          isSelected 
            ? 'border-primary border-dashed shadow-lg z-10' 
            : 'border-border border-solid hover:border-muted-foreground'
        }`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          backgroundColor: element.backgroundColor || '#f8f9fa',
          borderRadius: element.borderRadius || 0,
          transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
          opacity: element.opacity || 1,
          zIndex: element.zIndex || 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element.id);
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 overflow-hidden">
          {element.type === 'text' ? (
            <span style={{ fontSize: element.fontSize, textAlign: element.textAlign }}>
              {element.content || element.label}
            </span>
          ) : element.type === 'image' ? (
            element.src ? (
              <img src={element.src} alt={element.label} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center">
                <Image className="h-4 w-4 mb-1" />
                <span>{element.label}</span>
              </div>
            )
          ) : (
            <span>{element.label}</span>
          )}
        </div>
        
        {isSelected && (
          <>
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
              {element.label}
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Page Management */}
      <div className="border-b px-3 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {wireframe.pages.map((page) => (
              <div
                key={page.id}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                  page.id === wireframe.currentPageId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => switchPage(page.id)}
              >
                {editingPageName === page.id ? (
                  <Input
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    onBlur={() => {
                      if (newPageName.trim()) {
                        renamePage(page.id, newPageName.trim());
                      }
                      setEditingPageName(null);
                      setNewPageName('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (newPageName.trim()) {
                          renamePage(page.id, newPageName.trim());
                        }
                        setEditingPageName(null);
                        setNewPageName('');
                      }
                      if (e.key === 'Escape') {
                        setEditingPageName(null);
                        setNewPageName('');
                      }
                    }}
                    className="h-6 w-24 text-xs"
                    autoFocus
                  />
                ) : (
                  <>
                    <span>{page.name}</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPageName(page.id);
                          setNewPageName(page.name);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      {wireframe.pages.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 opacity-60 hover:opacity-100 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(page.id);
                          }}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addPage}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">صفحه جدید</span>
          </Button>
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="border-b p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">ویرایشگر صفحات</h2>
            <Badge variant="outline" className="text-xs">
              صفحه: {getCurrentPage().name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getCurrentElements().length} عنصر
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? "bg-primary/10 text-primary" : ""}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">ابزارهای پایه</h3>
            <div className="grid grid-cols-2 gap-2">
              {basicTools.map((tool) => (
                <Button
                  key={tool.type}
                  variant="outline"
                  size="sm"
                  onClick={() => addElement(tool.type)}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <tool.icon className="h-4 w-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden">
          <div className="flex-1 p-6 overflow-hidden">
            <div className="flex items-center justify-center h-full">
              <div
                ref={canvasRef}
                className="relative bg-white border shadow-lg mx-auto"
                style={{
                  width: wireframe.canvasWidth,
                  height: wireframe.canvasHeight,
                  minHeight: '600px',
                  backgroundImage: showGrid 
                    ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)` 
                    : 'none',
                  backgroundSize: showGrid ? '20px 20px' : 'auto',
                }}
                onClick={() => setSelectedElement(null)}
              >
                {getCurrentElements().length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Layout className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <h4 className="text-xl font-medium mb-2">صفحه خالی است</h4>
                      <p className="text-sm">از ابزارهای سمت چپ برای افزودن عناصر استفاده کنید</p>
                    </div>
                  </div>
                )}
                {getCurrentElements().map(renderElement)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        {selectedElement && (
          <div className="w-80 border-l bg-muted/30 flex flex-col">
            <div className="border-b p-4">
              <h3 className="text-sm font-medium">ویژگی‌های عنصر</h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  عنصر انتخاب شده: {selectedElement}
                </p>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default WireframeEditorPages;