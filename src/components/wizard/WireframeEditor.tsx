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
  Download
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'templates' | 'layers'>('elements');
  const [canvasHeight, setCanvasHeight] = useState(wireframe.canvasHeight);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const basicTools = [
    { type: 'rectangle', icon: RectangleHorizontal, label: 'مستطیل', width: 120, height: 80 },
    { type: 'text', icon: Type, label: 'متن', width: 100, height: 30 },
    { type: 'image', icon: Image, label: 'تصویر', width: 150, height: 100 },
    { type: 'button', icon: Square, label: 'دکمه', width: 100, height: 40 },
    { type: 'circle', icon: Circle, label: 'دایره', width: 80, height: 80 },
    { type: 'line', icon: Minus, label: 'خط', width: 150, height: 2 },
    { type: 'logo', icon: ImageIcon, label: 'لوگو', width: 100, height: 60 },
    { type: 'navigation', icon: Menu, label: 'منوی ناوبری', width: 300, height: 50 },
    { type: 'form', icon: FileText, label: 'فرم', width: 250, height: 200 },
    { type: 'video', icon: Play, label: 'ویدیو', width: 300, height: 200 },
    { type: 'gallery', icon: Images, label: 'گالری', width: 400, height: 250 },
    { type: 'testimonial', icon: MessageSquare, label: 'نظرات', width: 300, height: 150 },
    { type: 'cta', icon: Zap, label: 'فراخوان عمل', width: 200, height: 80 },
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
        { type: 'text', x: 350, y: 550, width: 200, height: 40, label: 'ویژگی‌های ما', fontSize: 24 },
        { type: 'rectangle', x: 50, y: 620, width: 250, height: 150, label: 'ویژگی ۱' },
        { type: 'rectangle', x: 325, y: 620, width: 250, height: 150, label: 'ویژگی ۲' },
        { type: 'rectangle', x: 600, y: 620, width: 250, height: 150, label: 'ویژگی ۳' },
      ]
    },
    {
      id: 'pricing-table',
      name: 'جدول قیمت‌گذاری',
      type: 'section',
      elements: [
        { type: 'text', x: 350, y: 550, width: 200, height: 40, label: 'پکیج‌های قیمتی', fontSize: 24 },
        { type: 'rectangle', x: 100, y: 620, width: 200, height: 250, label: 'پکیج پایه' },
        { type: 'rectangle', x: 350, y: 620, width: 200, height: 250, label: 'پکیج حرفه‌ای' },
        { type: 'rectangle', x: 600, y: 620, width: 200, height: 250, label: 'پکیج پیشرفته' },
      ]
    },
    {
      id: 'contact-form',
      name: 'فرم تماس پیشرفته',
      type: 'section',
      elements: [
        { type: 'text', x: 50, y: 550, width: 200, height: 40, label: 'تماس با ما', fontSize: 24 },
        { type: 'form', x: 50, y: 600, width: 400, height: 300, label: 'فرم تماس کامل' },
        { type: 'rectangle', x: 500, y: 600, width: 350, height: 200, label: 'اطلاعات تماس' },
        { type: 'rectangle', x: 500, y: 820, width: 350, height: 120, label: 'نقشه موقعیت' },
      ]
    },
    {
      id: 'testimonials',
      name: 'نظرات مشتریان',
      type: 'section',
      elements: [
        { type: 'text', x: 350, y: 800, width: 200, height: 40, label: 'نظرات مشتریان', fontSize: 24 },
        { type: 'testimonial', x: 100, y: 870, width: 700, height: 120, label: 'نظر مشتری اول' },
        { type: 'circle', x: 400, y: 1010, width: 60, height: 60, label: 'عکس مشتری' },
        { type: 'text', x: 350, y: 1080, width: 200, height: 30, label: 'نام مشتری' },
      ]
    },
    {
      id: 'team-section',
      name: 'تیم ما',
      type: 'section',
      elements: [
        { type: 'text', x: 350, y: 800, width: 200, height: 40, label: 'تیم ما', fontSize: 24 },
        { type: 'circle', x: 150, y: 870, width: 120, height: 120, label: 'عضو تیم ۱' },
        { type: 'circle', x: 390, y: 870, width: 120, height: 120, label: 'عضو تیم ۲' },
        { type: 'circle', x: 630, y: 870, width: 120, height: 120, label: 'عضو تیم ۳' },
        { type: 'text', x: 150, y: 1010, width: 120, height: 60, label: 'نام و سمت' },
        { type: 'text', x: 390, y: 1010, width: 120, height: 60, label: 'نام و سمت' },
        { type: 'text', x: 630, y: 1010, width: 120, height: 60, label: 'نام و سمت' },
      ]
    },
    {
      id: 'stats-section',
      name: 'آمار و ارقام',
      type: 'section',
      elements: [
        { type: 'text', x: 350, y: 800, width: 200, height: 40, label: 'آمار ما', fontSize: 24 },
        { type: 'rectangle', x: 100, y: 870, width: 150, height: 100, label: '۱۰۰+\nمشتری' },
        { type: 'rectangle', x: 275, y: 870, width: 150, height: 100, label: '۵۰۰+\nپروژه' },
        { type: 'rectangle', x: 450, y: 870, width: 150, height: 100, label: '۵ سال\nتجربه' },
        { type: 'rectangle', x: 625, y: 870, width: 150, height: 100, label: '۹۸%\nرضایت' },
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
        { type: 'logo', x: 50, y: 20, width: 100, height: 40, label: 'لوگو شرکت' },
        { type: 'navigation', x: 650, y: 25, width: 200, height: 30, label: 'منوی اصلی' },
        // Hero
        { type: 'rectangle', x: 0, y: 80, width: 900, height: 350, label: 'بخش هیرو', template: 'hero-bg' },
        { type: 'text', x: 300, y: 180, width: 300, height: 40, label: 'عنوان اصلی', fontSize: 32, fontWeight: 'bold' },
        { type: 'text', x: 250, y: 240, width: 400, height: 60, label: 'توضیح محصول یا خدمات شما' },
        { type: 'cta', x: 350, y: 330, width: 200, height: 50, label: 'شروع کنید' },
        // Features
        { type: 'text', x: 350, y: 460, width: 200, height: 40, label: 'ویژگی‌های ما', fontSize: 24, fontWeight: 'bold' },
        { type: 'rectangle', x: 50, y: 520, width: 250, height: 120, label: 'ویژگی ۱' },
        { type: 'rectangle', x: 325, y: 520, width: 250, height: 120, label: 'ویژگی ۲' },
        { type: 'rectangle', x: 600, y: 520, width: 250, height: 120, label: 'ویژگی ۳' },
        // Footer
        { type: 'rectangle', x: 0, y: 680, width: 900, height: 80, label: 'فوتر', template: 'footer-bg' },
      ]
    },
    {
      id: 'ecommerce-page',
      name: 'فروشگاه آنلاین',
      type: 'page',
      elements: [
        // Header
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 80, label: 'هدر فروشگاه', template: 'header-bg' },
        { type: 'logo', x: 50, y: 20, width: 120, height: 40, label: 'لوگو فروشگاه' },
        { type: 'navigation', x: 200, y: 25, width: 400, height: 30, label: 'منوی محصولات' },
        { type: 'button', x: 750, y: 25, width: 100, height: 30, label: 'سبد خرید' },
        // Banner
        { type: 'rectangle', x: 0, y: 80, width: 900, height: 200, label: 'بنر تبلیغاتی', template: 'hero-bg' },
        { type: 'text', x: 50, y: 150, width: 400, height: 60, label: 'تخفیف ویژه محصولات', fontSize: 28 },
        // Products Grid
        { type: 'text', x: 50, y: 300, width: 200, height: 30, label: 'محصولات پیشنهادی', fontSize: 20 },
        { type: 'rectangle', x: 50, y: 340, width: 180, height: 220, label: 'محصول ۱' },
        { type: 'rectangle', x: 250, y: 340, width: 180, height: 220, label: 'محصول ۲' },
        { type: 'rectangle', x: 450, y: 340, width: 180, height: 220, label: 'محصول ۳' },
        { type: 'rectangle', x: 650, y: 340, width: 180, height: 220, label: 'محصول ۴' },
        // Newsletter
        { type: 'rectangle', x: 0, y: 580, width: 900, height: 100, label: 'عضویت در خبرنامه', template: 'footer-bg' },
      ]
    },
    {
      id: 'portfolio-page',
      name: 'نمونه کار',
      type: 'page',
      elements: [
        // Header
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 80, label: 'هدر', template: 'header-bg' },
        { type: 'logo', x: 50, y: 20, width: 100, height: 40, label: 'نام هنرمند' },
        { type: 'navigation', x: 650, y: 25, width: 200, height: 30, label: 'منوی نمونه کارها' },
        // Hero
        { type: 'text', x: 350, y: 120, width: 200, height: 40, label: 'نمونه کارهای من', fontSize: 28 },
        // Gallery
        { type: 'gallery', x: 50, y: 180, width: 800, height: 400, label: 'گالری پروژه‌ها' },
        // About
        { type: 'text', x: 50, y: 600, width: 400, height: 100, label: 'درباره من و تجربه‌هایم در این حوزه' },
        { type: 'image', x: 500, y: 600, width: 350, height: 200, label: 'عکس شخصی' },
      ]
    },
    {
      id: 'blog-page',
      name: 'صفحه وبلاگ',
      type: 'page',
      elements: [
        // Header
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 80, label: 'هدر وبلاگ', template: 'header-bg' },
        { type: 'logo', x: 50, y: 20, width: 100, height: 40, label: 'نام وبلاگ' },
        { type: 'navigation', x: 650, y: 25, width: 200, height: 30, label: 'منوی دسته‌بندی' },
        // Featured Post
        { type: 'rectangle', x: 50, y: 100, width: 500, height: 200, label: 'مقاله ویژه' },
        { type: 'text', x: 60, y: 120, width: 400, height: 30, label: 'عنوان مقاله اصلی', fontSize: 20 },
        // Sidebar
        { type: 'rectangle', x: 600, y: 100, width: 250, height: 400, label: 'نوار کناری' },
        // Recent Posts
        { type: 'text', x: 50, y: 320, width: 200, height: 30, label: 'مقالات اخیر', fontSize: 18 },
        { type: 'rectangle', x: 50, y: 360, width: 500, height: 80, label: 'مقاله ۱' },
        { type: 'rectangle', x: 50, y: 450, width: 500, height: 80, label: 'مقاله ۲' },
        { type: 'rectangle', x: 50, y: 540, width: 500, height: 80, label: 'مقاله ۳' },
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

  const updateCanvasHeight = (height: number) => {
    setCanvasHeight(height);
    const updatedWireframe = { ...wireframe, canvasHeight: height };
    setWireframe(updatedWireframe);
    updateData({ wireframe: updatedWireframe });
  };

  const saveToDatabase = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطا",
          description: "برای ذخیره طرح باید وارد شوید",
          variant: "destructive"
        });
        return;
      }

      const wireframeData = {
        user_id: user.id,
        name: `طرح ${new Date().toLocaleDateString('fa-IR')}`,
        data: wireframe as any,
      };

      const { error } = await supabase
        .from('wireframes')
        .insert(wireframeData);

      if (error) throw error;
      
      toast({
        title: "ذخیره شد",
        description: "طرح شما با موفقیت ذخیره شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ذخیره طرح",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
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

  const updateElementProperty = (elementId: string, property: string, value: any) => {
    const updatedElements = wireframe.elements.map(element =>
      element.id === elementId
        ? { ...element, [property]: value }
        : element
    );
    updateWireframe(updatedElements);
  };

  const getSelectedElementData = () => {
    return wireframe.elements.find(el => el.id === selectedElement);
  };

  const exportWireframe = () => {
    const dataStr = JSON.stringify(wireframe, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `wireframe-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "صادر شد",
      description: "فایل طرح دانلود شد",
    });
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
        case 'logo':
          content = element.src ? (
            <img src={element.src} alt={element.label || 'لوگو'} className="w-full h-full object-contain" />
          ) : '🏢 ' + (element.label || 'لوگو');
          break;
        case 'navigation':
          content = '📋 ' + (element.label || 'منوی ناوبری');
          Object.assign(baseStyle, {
            backgroundColor: 'hsl(var(--muted))',
            justifyContent: 'flex-start',
            padding: '10px',
          });
          break;
        case 'form':
          content = '📝 ' + (element.label || 'فرم');
          Object.assign(baseStyle, {
            backgroundColor: 'hsl(var(--card))',
            border: '2px dashed hsl(var(--border))',
          });
          break;
        case 'video':
          content = '📺 ' + (element.label || 'ویدیو');
          Object.assign(baseStyle, {
            backgroundColor: 'hsl(var(--muted))',
            color: 'hsl(var(--muted-foreground))',
          });
          break;
        case 'gallery':
          content = '🖼️ ' + (element.label || 'گالری');
          Object.assign(baseStyle, {
            backgroundColor: 'hsl(var(--secondary) / 0.1)',
            border: '2px dashed hsl(var(--secondary))',
          });
          break;
        case 'testimonial':
          content = '💬 ' + (element.label || 'نظرات');
          Object.assign(baseStyle, {
            backgroundColor: 'hsl(var(--accent) / 0.1)',
            border: '1px solid hsl(var(--accent))',
          });
          break;
        case 'cta':
          content = element.label || 'فراخوان عمل';
          Object.assign(baseStyle, {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: '8px',
            fontWeight: 'bold',
          });
          break;
        default:
          content = element.label;
      }

      // Apply custom styles
      if (element.fontSize) baseStyle.fontSize = `${element.fontSize}px`;
      if (element.fontWeight) baseStyle.fontWeight = element.fontWeight;
      if (element.textAlign) baseStyle.textAlign = element.textAlign;
      if (element.backgroundColor) baseStyle.backgroundColor = element.backgroundColor;
      if (element.borderColor) baseStyle.borderColor = element.borderColor;
      if (element.borderWidth) baseStyle.borderWidth = `${element.borderWidth}px`;
      if (element.borderRadius) baseStyle.borderRadius = `${element.borderRadius}px`;
      if (element.opacity) baseStyle.opacity = element.opacity;
      if (element.rotation) baseStyle.transform = `${baseStyle.transform || ''} rotate(${element.rotation}deg)`;
      if (element.zIndex) baseStyle.zIndex = element.zIndex;

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
    <>
      {/* Fullscreen Canvas Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            {/* Fullscreen Header */}
            <div className="border-b p-4 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">بوم طراحی - حالت تمام صفحه</h2>
                <Badge variant="outline">
                  {wireframe.elements.length} عنصر
                </Badge>
                <div className="flex items-center gap-2">
                  <Label htmlFor="canvas-height" className="text-sm">ارتفاع بوم:</Label>
                  <Input
                    id="canvas-height"
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => updateCanvasHeight(Number(e.target.value))}
                    className="w-20 h-8"
                    min="400"
                    max="5000"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
                {selectedElement && (
                  <Badge variant="default">
                    <Move className="h-3 w-3 mr-1" />
                    انتخاب شده
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearCanvas}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  پاک کردن
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsFullscreen(false)}
                >
                  <Minimize className="h-4 w-4 ml-1" />
                  خروج از تمام صفحه
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Fullscreen Canvas */}
            <div className="flex-1 overflow-auto p-4">
              <div className="h-full flex items-center justify-center">
                <div
                  className="relative border-2 border-dashed border-border bg-muted/20 overflow-hidden shadow-lg"
                  style={{
                    width: Math.max(wireframe.canvasWidth, 1200),
                    height: Math.max(wireframe.canvasHeight, 800),
                    minHeight: '800px'
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={() => setSelectedElement(null)}
                >
                  {wireframe.elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MoreHorizontal className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h4 className="text-xl font-medium mb-2">بوم خالی است</h4>
                        <p className="text-base">از قالب‌های آماده یا ابزارهای پایه استفاده کنید</p>
                      </div>
                    </div>
                  )}
                  {wireframe.elements.map(renderElement)}
                </div>
              </div>
            </div>

            {/* Fullscreen Quick Tools */}
            <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex justify-center gap-2 flex-wrap">
                {basicTools.map((tool) => (
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
            </div>
          </div>
        </div>
      )}

      {/* Professional Editor Layout */}
      <div className="h-screen flex flex-col bg-background">
        {/* Top Toolbar */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-foreground">ویرایشگر حرفه‌ای</h2>
              <Badge variant="outline" className="text-xs">
                {wireframe.elements.length} عنصر
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearCanvas}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 border-r bg-muted/30 flex flex-col">
            <div className="border-b">
              <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none h-12">
                  <TabsTrigger value="elements" className="text-xs">عناصر</TabsTrigger>
                  <TabsTrigger value="templates" className="text-xs">قالب‌ها</TabsTrigger>
                  <TabsTrigger value="layers" className="text-xs">لایه‌ها</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1">
              {sidebarTab === 'elements' && (
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-foreground">ابزارهای پایه</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {basicTools.map((tool) => (
                        <Button
                          key={tool.type}
                          variant="outline"
                          size="sm"
                          onClick={() => addElement(tool.type)}
                          className="h-16 flex flex-col items-center gap-1 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <tool.icon className="h-5 w-5" />
                          <span>{tool.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sidebarTab === 'templates' && (
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">قالب‌های اجزا</h3>
                    <div className="space-y-2">
                      {componentTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => addTemplate(template)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {template.type === 'header' && <Menu className="h-4 w-4 text-primary" />}
                            {template.type === 'hero' && <Zap className="h-4 w-4 text-primary" />}
                            {template.type === 'section' && <RectangleHorizontal className="h-4 w-4 text-primary" />}
                            {template.type === 'footer' && <Minus className="h-4 w-4 text-primary" />}
                            <span className="text-sm font-medium">{template.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{template.elements.length} عنصر</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">قالب‌های صفحه</h3>
                    <div className="space-y-2">
                      {pageTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{template.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addTemplate(template)}
                              className="text-xs"
                            >
                              افزودن
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => loadPageTemplate(template)}
                              className="text-xs"
                            >
                              جایگزینی
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sidebarTab === 'layers' && (
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-medium mb-3">لایه‌ها</h3>
                  {wireframe.elements.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">هیچ عنصری وجود ندارد</p>
                  ) : (
                    wireframe.elements.map((element) => (
                      <div
                        key={element.id}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          selectedElement === element.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            <span className="text-sm">{element.label || element.type}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
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
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(element.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col bg-muted/10">
            <div className="flex-1 p-6 overflow-auto">
              <div className="flex items-center justify-center h-full">
                <div
                  ref={canvasRef}
                  className={`relative bg-background shadow-xl overflow-hidden transition-all duration-200 ${
                    showGrid ? 'bg-grid-pattern' : ''
                  }`}
                  style={{
                    width: wireframe.canvasWidth,
                    height: wireframe.canvasHeight,
                    minHeight: '600px',
                    backgroundImage: showGrid ? 
                      'radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)' : 
                      'none',
                    backgroundSize: showGrid ? '20px 20px' : 'auto'
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={() => setSelectedElement(null)}
                >
                  {wireframe.elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Layout className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <h4 className="text-xl font-medium mb-2">بوم خالی است</h4>
                        <p className="text-sm">از عناصر یا قالب‌های سمت چپ استفاده کنید</p>
                      </div>
                    </div>
                  )}
                  {wireframe.elements.map(renderElement)}
                </div>
              </div>
            </div>
          </div>

          {/* Right Properties Panel */}
          {selectedElement && (
            <div className="w-80 border-l bg-muted/30 flex flex-col">
              <div className="border-b p-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  تنظیمات عنصر
                </h3>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {(() => {
                    const element = getSelectedElementData();
                    if (!element) return null;
                    
                    return (
                      <>
                        <div>
                          <Label className="text-xs">نام عنصر</Label>
                          <Input
                            value={element.label || ''}
                            onChange={(e) => updateElementProperty(element.id, 'label', e.target.value)}
                            className="mt-1"
                            placeholder="نام عنصر"
                          />
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label className="text-xs mb-2 block">موقعیت</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">X</Label>
                              <Input
                                type="number"
                                value={element.x}
                                onChange={(e) => updateElementProperty(element.id, 'x', parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Y</Label>
                              <Input
                                type="number"
                                value={element.y}
                                onChange={(e) => updateElementProperty(element.id, 'y', parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs mb-2 block">اندازه</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">عرض</Label>
                              <Input
                                type="number"
                                value={element.width}
                                onChange={(e) => updateElementProperty(element.id, 'width', parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">ارتفاع</Label>
                              <Input
                                type="number"
                                value={element.height}
                                onChange={(e) => updateElementProperty(element.id, 'height', parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label className="text-xs">اعمال</Label>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => duplicateElement(element.id)}
                              className="flex-1"
                            >
                              <Copy className="h-3 w-3 ml-1" />
                              کپی
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteElement(element.id)}
                              className="flex-1 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </>
  );

};

export default WireframeEditor;