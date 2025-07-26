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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'width' | 'height' | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [canvasWidth, setCanvasWidth] = useState(wireframe.canvasWidth);
  const [dimensionInput, setDimensionInput] = useState({ width: wireframe.canvasWidth, height: wireframe.canvasHeight });
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
        { type: 'logo', x: 50, y: 20, width: 120, height: 40, label: 'لوگو' },
        { type: 'navigation', x: 650, y: 20, width: 200, height: 40, label: 'منوی اصلی' }
      ]
    },
    {
      id: 'header-modern',
      name: 'هدر مدرن',
      type: 'header',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 100, label: 'هدر مدرن', backgroundColor: '#1f2937' },
        { type: 'logo', x: 60, y: 25, width: 100, height: 50, label: 'لوگو برند' },
        { type: 'navigation', x: 300, y: 25, width: 300, height: 50, label: 'منوی ناوبری' },
        { type: 'button', x: 750, y: 30, width: 100, height: 40, label: 'ورود', backgroundColor: '#3b82f6' }
      ]
    },
    {
      id: 'header-ecommerce',
      name: 'هدر فروشگاهی',
      type: 'header',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 120, label: 'هدر فروشگاه', backgroundColor: '#ffffff', borderWidth: 1 },
        { type: 'logo', x: 40, y: 20, width: 140, height: 40, label: 'لوگو فروشگاه' },
        { type: 'text', x: 250, y: 25, width: 300, height: 30, label: 'جستجو در محصولات...', backgroundColor: '#f3f4f6' },
        { type: 'button', x: 570, y: 25, width: 80, height: 30, label: 'جستجو', backgroundColor: '#059669' },
        { type: 'navigation', x: 40, y: 70, width: 500, height: 30, label: 'دسته‌بندی ها | ویژه | تخفیفات | تماس' },
        { type: 'button', x: 780, y: 70, width: 80, height: 30, label: 'سبد خرید', backgroundColor: '#dc2626' }
      ]
    },
    // Hero Section Templates
    {
      id: 'hero-center',
      name: 'هیرو مرکزی',
      type: 'hero',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 400, label: 'بخش هیرو', backgroundColor: '#f8fafc' },
        { type: 'text', x: 200, y: 120, width: 500, height: 60, label: 'عنوان اصلی', fontSize: 48, textAlign: 'center' },
        { type: 'text', x: 150, y: 200, width: 600, height: 40, label: 'توضیحات کوتاه', fontSize: 18, textAlign: 'center' },
        { type: 'button', x: 375, y: 280, width: 150, height: 50, label: 'شروع کنید', backgroundColor: '#10b981' }
      ]
    },
    {
      id: 'hero-split',
      name: 'هیرو دو قسمتی',
      type: 'hero',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 500, label: 'بخش هیرو', backgroundColor: '#f1f5f9' },
        { type: 'text', x: 50, y: 100, width: 400, height: 50, label: 'راه‌حل جدید برای کسب‌وکار شما', fontSize: 36, fontWeight: 'bold' },
        { type: 'text', x: 50, y: 170, width: 380, height: 60, label: 'با استفاده از تکنولوژی‌های روز دنیا، کسب‌وکار خود را متحول کنید', fontSize: 16 },
        { type: 'button', x: 50, y: 250, width: 140, height: 45, label: 'مشاهده دمو', backgroundColor: '#3b82f6' },
        { type: 'button', x: 210, y: 250, width: 120, height: 45, label: 'تماس با ما', backgroundColor: '#6b7280' },
        { type: 'image', x: 500, y: 80, width: 350, height: 300, label: 'تصویر اصلی محصول' }
      ]
    },
    {
      id: 'hero-video',
      name: 'هیرو ویدیویی',
      type: 'hero',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 600, label: 'پس‌زمینه ویدیو', backgroundColor: '#1e293b' },
        { type: 'rectangle', x: 200, y: 150, width: 500, height: 300, label: 'ویدیو معرفی', backgroundColor: '#000000' },
        { type: 'circle', x: 425, y: 275, width: 50, height: 50, label: '▶', backgroundColor: '#ffffff', textAlign: 'center' },
        { type: 'text', x: 250, y: 480, width: 400, height: 40, label: 'مشاهده ویدیو معرفی محصول', fontSize: 18, textAlign: 'center' }
      ]
    },
    // Card Templates
    {
      id: 'card-product',
      name: 'کارت محصول',
      type: 'card',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 280, height: 350, label: 'کارت محصول', backgroundColor: '#ffffff', borderWidth: 1 },
        { type: 'image', x: 20, y: 20, width: 240, height: 180, label: 'تصویر محصول' },
        { type: 'text', x: 20, y: 220, width: 240, height: 30, label: 'نام محصول', fontSize: 18, fontWeight: 'bold' },
        { type: 'text', x: 20, y: 250, width: 240, height: 40, label: 'توضیحات محصول', fontSize: 14 },
        { type: 'text', x: 20, y: 300, width: 120, height: 30, label: '۲۵۰٬۰۰۰ تومان', fontSize: 16, fontWeight: 'bold' },
        { type: 'button', x: 160, y: 300, width: 100, height: 30, label: 'خرید', backgroundColor: '#3b82f6' }
      ]
    },
    {
      id: 'card-service',
      name: 'کارت خدمات',
      type: 'card',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 300, height: 250, label: 'کارت خدمات', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 12 },
        { type: 'circle', x: 125, y: 30, width: 50, height: 50, label: '🚀', backgroundColor: '#3b82f6', textAlign: 'center' },
        { type: 'text', x: 20, y: 100, width: 260, height: 30, label: 'خدمات طراحی', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 20, y: 140, width: 260, height: 60, label: 'طراحی حرفه‌ای وب‌سایت و اپلیکیشن موبایل', fontSize: 14, textAlign: 'center' },
        { type: 'button', x: 100, y: 210, width: 100, height: 30, label: 'اطلاعات بیشتر', backgroundColor: '#10b981' }
      ]
    },
    {
      id: 'card-team',
      name: 'کارت عضو تیم',
      type: 'card',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 250, height: 300, label: 'کارت تیم', backgroundColor: '#ffffff', borderWidth: 1 },
        { type: 'circle', x: 100, y: 30, width: 50, height: 50, label: 'عکس', backgroundColor: '#e5e7eb' },
        { type: 'text', x: 20, y: 100, width: 210, height: 25, label: 'علی احمدی', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 20, y: 130, width: 210, height: 20, label: 'مدیر فنی', fontSize: 14, textAlign: 'center' },
        { type: 'text', x: 20, y: 160, width: 210, height: 80, label: 'متخصص در زمینه توسعه نرم‌افزار با بیش از ۵ سال تجربه', fontSize: 12, textAlign: 'center' },
        { type: 'text', x: 20, y: 260, width: 210, height: 20, label: '📧 ali@example.com', fontSize: 12, textAlign: 'center' }
      ]
    },
    // Form Templates
    {
      id: 'form-contact',
      name: 'فرم تماس',
      type: 'form',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 400, height: 350, label: 'فرم تماس', backgroundColor: '#ffffff', borderWidth: 1 },
        { type: 'text', x: 30, y: 20, width: 340, height: 30, label: 'تماس با ما', fontSize: 24, fontWeight: 'bold' },
        { type: 'text', x: 30, y: 60, width: 100, height: 20, label: 'نام و نام خانوادگی', fontSize: 14 },
        { type: 'text', x: 30, y: 85, width: 340, height: 35, label: 'نام خود را وارد کنید...', backgroundColor: '#f9fafb', borderWidth: 1 },
        { type: 'text', x: 30, y: 135, width: 100, height: 20, label: 'ایمیل', fontSize: 14 },
        { type: 'text', x: 30, y: 160, width: 340, height: 35, label: 'example@email.com', backgroundColor: '#f9fafb', borderWidth: 1 },
        { type: 'text', x: 30, y: 210, width: 100, height: 20, label: 'پیام', fontSize: 14 },
        { type: 'text', x: 30, y: 235, width: 340, height: 60, label: 'پیام خود را بنویسید...', backgroundColor: '#f9fafb', borderWidth: 1 },
        { type: 'button', x: 30, y: 310, width: 120, height: 35, label: 'ارسال پیام', backgroundColor: '#3b82f6' }
      ]
    },
    {
      id: 'form-newsletter',
      name: 'فرم خبرنامه',
      type: 'form',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 450, height: 180, label: 'خبرنامه', backgroundColor: '#1f2937', borderRadius: 8 },
        { type: 'text', x: 30, y: 30, width: 390, height: 30, label: 'عضویت در خبرنامه', fontSize: 20, fontWeight: 'bold' },
        { type: 'text', x: 30, y: 65, width: 390, height: 25, label: 'آخرین اخبار و تخفیفات را دریافت کنید', fontSize: 14 },
        { type: 'text', x: 30, y: 105, width: 280, height: 40, label: 'ایمیل شما...', backgroundColor: '#ffffff', borderRadius: 4 },
        { type: 'button', x: 320, y: 105, width: 100, height: 40, label: 'عضویت', backgroundColor: '#059669' }
      ]
    },
    // Navigation Templates
    {
      id: 'nav-horizontal',
      name: 'منوی افقی',
      type: 'navigation',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 600, height: 50, label: 'منوی ناوبری', backgroundColor: '#ffffff', borderWidth: 1 },
        { type: 'text', x: 20, y: 15, width: 80, height: 20, label: 'خانه', fontSize: 14, textAlign: 'center' },
        { type: 'text', x: 120, y: 15, width: 80, height: 20, label: 'محصولات', fontSize: 14, textAlign: 'center' },
        { type: 'text', x: 220, y: 15, width: 80, height: 20, label: 'خدمات', fontSize: 14, textAlign: 'center' },
        { type: 'text', x: 320, y: 15, width: 80, height: 20, label: 'درباره ما', fontSize: 14, textAlign: 'center' },
        { type: 'text', x: 420, y: 15, width: 80, height: 20, label: 'تماس', fontSize: 14, textAlign: 'center' }
      ]
    },
    {
      id: 'nav-vertical',
      name: 'منوی عمودی',
      type: 'navigation',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 200, height: 300, label: 'منوی کناری', backgroundColor: '#1f2937' },
        { type: 'text', x: 20, y: 20, width: 160, height: 40, label: 'داشبورد', fontSize: 16 },
        { type: 'text', x: 20, y: 70, width: 160, height: 40, label: 'کاربران', fontSize: 16 },
        { type: 'text', x: 20, y: 120, width: 160, height: 40, label: 'محصولات', fontSize: 16 },
        { type: 'text', x: 20, y: 170, width: 160, height: 40, label: 'گزارشات', fontSize: 16 },
        { type: 'text', x: 20, y: 220, width: 160, height: 40, label: 'تنظیمات', fontSize: 16 }
      ]
    },
    // Footer Templates
    {
      id: 'footer-simple',
      name: 'فوتر ساده',
      type: 'footer',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 100, label: 'فوتر', backgroundColor: '#374151' },
        { type: 'text', x: 50, y: 25, width: 200, height: 25, label: 'شرکت نمونه', fontSize: 18, fontWeight: 'bold' },
        { type: 'text', x: 50, y: 50, width: 300, height: 20, label: '© ۲۰۲۴ تمامی حقوق محفوظ است', fontSize: 12 },
        { type: 'text', x: 650, y: 25, width: 200, height: 50, label: 'شبکه‌های اجتماعی | حریم خصوصی | قوانین', fontSize: 12, textAlign: 'right' }
      ]
    },
    {
      id: 'footer-detailed',
      name: 'فوتر کامل',
      type: 'footer',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 900, height: 200, label: 'فوتر کامل', backgroundColor: '#1f2937' },
        { type: 'text', x: 50, y: 30, width: 150, height: 25, label: 'درباره شرکت', fontSize: 16, fontWeight: 'bold' },
        { type: 'text', x: 50, y: 60, width: 150, height: 80, label: 'خدمات\nمحصولات\nتیم ما\nاخبار', fontSize: 12 },
        { type: 'text', x: 250, y: 30, width: 150, height: 25, label: 'خدمات', fontSize: 16, fontWeight: 'bold' },
        { type: 'text', x: 250, y: 60, width: 150, height: 80, label: 'طراحی وب\nتوسعه اپ\nمشاوره\nپشتیبانی', fontSize: 12 },
        { type: 'text', x: 450, y: 30, width: 150, height: 25, label: 'تماس با ما', fontSize: 16, fontWeight: 'bold' },
        { type: 'text', x: 450, y: 60, width: 150, height: 80, label: 'تهران، ایران\n+98 21 1234 5678\ninfo@example.com', fontSize: 12 },
        { type: 'text', x: 650, y: 30, width: 200, height: 25, label: 'عضویت در خبرنامه', fontSize: 16, fontWeight: 'bold' },
        { type: 'text', x: 650, y: 60, width: 150, height: 30, label: 'ایمیل شما...', backgroundColor: '#374151' },
        { type: 'button', x: 810, y: 60, width: 70, height: 30, label: 'عضویت', backgroundColor: '#3b82f6' },
        { type: 'rectangle', x: 0, y: 160, width: 900, height: 40, label: 'خط جداکننده', backgroundColor: '#374151' },
        { type: 'text', x: 50, y: 170, width: 400, height: 20, label: '© ۲۰۲۴ شرکت نمونه. تمامی حقوق محفوظ است.', fontSize: 12 }
      ]
    },
    // Dashboard Templates
    {
      id: 'dashboard-stats',
      name: 'آمار داشبورد',
      type: 'dashboard',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 800, height: 300, label: 'پنل آماری', backgroundColor: '#f8fafc' },
        { type: 'rectangle', x: 20, y: 20, width: 180, height: 120, label: 'کارت آمار ۱', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 8 },
        { type: 'text', x: 40, y: 40, width: 140, height: 20, label: 'کل فروش', fontSize: 14 },
        { type: 'text', x: 40, y: 65, width: 140, height: 30, label: '۱۲٬۳۴۵٬۰۰۰', fontSize: 24, fontWeight: 'bold' },
        { type: 'text', x: 40, y: 100, width: 140, height: 15, label: '+۱۲% نسبت به ماه قبل', fontSize: 10 },
        
        { type: 'rectangle', x: 220, y: 20, width: 180, height: 120, label: 'کارت آمار ۲', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 8 },
        { type: 'text', x: 240, y: 40, width: 140, height: 20, label: 'کاربران جدید', fontSize: 14 },
        { type: 'text', x: 240, y: 65, width: 140, height: 30, label: '۲٬۴۵۳', fontSize: 24, fontWeight: 'bold' },
        { type: 'text', x: 240, y: 100, width: 140, height: 15, label: '+۸% نسبت به ماه قبل', fontSize: 10 },
        
        { type: 'rectangle', x: 420, y: 20, width: 180, height: 120, label: 'کارت آمار ۳', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 8 },
        { type: 'text', x: 440, y: 40, width: 140, height: 20, label: 'سفارشات', fontSize: 14 },
        { type: 'text', x: 440, y: 65, width: 140, height: 30, label: '۹۸۷', fontSize: 24, fontWeight: 'bold' },
        { type: 'text', x: 440, y: 100, width: 140, height: 15, label: '-۳% نسبت به ماه قبل', fontSize: 10 },
        
        { type: 'rectangle', x: 620, y: 20, width: 160, height: 120, label: 'کارت آمار ۴', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 8 },
        { type: 'text', x: 640, y: 40, width: 120, height: 20, label: 'درآمد ماهانه', fontSize: 14 },
        { type: 'text', x: 640, y: 65, width: 120, height: 30, label: '۴۵٬۶۷۸٬۰۰۰', fontSize: 20, fontWeight: 'bold' },
        { type: 'text', x: 640, y: 100, width: 120, height: 15, label: '+۱۵% نسبت به ماه قبل', fontSize: 10 },
        
        { type: 'rectangle', x: 20, y: 160, width: 760, height: 120, label: 'نمودار فروش', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 8 },
        { type: 'text', x: 40, y: 180, width: 200, height: 20, label: 'نمودار فروش ۶ ماه گذشته', fontSize: 16, fontWeight: 'bold' },
        { type: 'rectangle', x: 40, y: 210, width: 720, height: 60, label: 'نمودار خطی', backgroundColor: '#f1f5f9' }
      ]
    },
    // Blog Templates
    {
      id: 'blog-post',
      name: 'پست وبلاگ',
      type: 'blog',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 600, height: 500, label: 'مقاله وبلاگ', backgroundColor: '#ffffff' },
        { type: 'image', x: 20, y: 20, width: 560, height: 200, label: 'تصویر شاخص مقاله' },
        { type: 'text', x: 20, y: 240, width: 560, height: 40, label: 'عنوان مقاله: راهنمای کامل طراحی UX/UI', fontSize: 24, fontWeight: 'bold' },
        { type: 'text', x: 20, y: 290, width: 200, height: 20, label: 'نویسنده: احمد رضایی | ۱۵ مهر ۱۴۰۳', fontSize: 12 },
        { type: 'text', x: 20, y: 320, width: 560, height: 100, label: 'در این مقاله به بررسی اصول طراحی تجربه کاربری و رابط کاربری می‌پردازیم. طراحی UX/UI یکی از مهم‌ترین عوامل موفقیت محصولات دیجیتال است که...', fontSize: 14 },
        { type: 'button', x: 20, y: 440, width: 120, height: 35, label: 'ادامه مطلب', backgroundColor: '#3b82f6' },
        { type: 'text', x: 460, y: 450, width: 120, height: 20, label: '👁 ۱۲۳ بازدید | 💬 ۵ نظر', fontSize: 12 }
      ]
    },
    // Pricing Templates
    {
      id: 'pricing-table',
      name: 'جدول قیمت',
      type: 'pricing',
      elements: [
        { type: 'rectangle', x: 0, y: 0, width: 750, height: 400, label: 'جدول قیمت‌گذاری', backgroundColor: '#f8fafc' },
        { type: 'text', x: 300, y: 20, width: 150, height: 30, label: 'پلان‌های قیمت‌گذاری', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
        
        // Basic Plan
        { type: 'rectangle', x: 50, y: 70, width: 200, height: 300, label: 'پلان پایه', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 8 },
        { type: 'text', x: 70, y: 90, width: 160, height: 25, label: 'پایه', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 70, y: 120, width: 160, height: 30, label: '۹۹٬۰۰۰ تومان', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 70, y: 155, width: 160, height: 80, label: '• ۵ صفحه\n• پشتیبانی ایمیل\n• ۱ GB فضای ذخیره\n• SSL رایگان', fontSize: 12 },
        { type: 'button', x: 80, y: 320, width: 140, height: 35, label: 'انتخاب پلان', backgroundColor: '#6b7280' },
        
        // Premium Plan
        { type: 'rectangle', x: 275, y: 70, width: 200, height: 300, label: 'پلان حرفه‌ای', backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#3b82f6', borderRadius: 8 },
        { type: 'text', x: 295, y: 90, width: 160, height: 25, label: 'حرفه‌ای', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 295, y: 120, width: 160, height: 30, label: '۱۹۹٬۰۰۰ تومان', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 295, y: 155, width: 160, height: 80, label: '• ۲۰ صفحه\n• پشتیبانی ۲۴/۷\n• ۱۰ GB فضای ذخیره\n• تحلیلات پیشرفته', fontSize: 12 },
        { type: 'button', x: 305, y: 320, width: 140, height: 35, label: 'انتخاب پلان', backgroundColor: '#3b82f6' },
        
        // Enterprise Plan
        { type: 'rectangle', x: 500, y: 70, width: 200, height: 300, label: 'پلان سازمانی', backgroundColor: '#ffffff', borderWidth: 1, borderRadius: 8 },
        { type: 'text', x: 520, y: 90, width: 160, height: 25, label: 'سازمانی', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 520, y: 120, width: 160, height: 30, label: '۴۹۹٬۰۰۰ تومان', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
        { type: 'text', x: 520, y: 155, width: 160, height: 80, label: '• نامحدود\n• مدیر اختصاصی\n• ۱۰۰ GB فضا\n• API دسترسی', fontSize: 12 },
        { type: 'button', x: 530, y: 320, width: 140, height: 35, label: 'تماس با فروش', backgroundColor: '#059669' }
      ]
    }
  ];

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

  const updateCanvasHeight = (height: number) => {
    setCanvasHeight(height);
    setWireframe(prev => ({ ...prev, canvasHeight: height }));
    setDimensionInput(prev => ({ ...prev, height }));
  };

  const updateCanvasWidth = (width: number) => {
    setCanvasWidth(width);
    setWireframe(prev => ({ ...prev, canvasWidth: width }));
    setDimensionInput(prev => ({ ...prev, width }));
  };

  const handleDimensionInputChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 0;
    setDimensionInput(prev => ({ ...prev, [dimension]: numValue }));
    
    if (numValue >= 300 && numValue <= 3000) {
      if (dimension === 'width') {
        updateCanvasWidth(numValue);
      } else {
        updateCanvasHeight(numValue);
      }
    }
  };

  // Enhanced mouse wheel zoom with limits
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(Math.max(0.2, zoom + delta), 3);
    setZoom(newZoom);
  };

  const addElement = (type: string) => {
    const tool = basicTools.find(t => t.type === type);
    if (!tool) return;

    const newElement: WireframeElement = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      width: tool.width,
      height: tool.height,
      label: tool.label,
      backgroundColor: type === 'button' ? '#3b82f6' : '#f8f9fa',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: type === 'circle' ? 50 : type === 'button' ? 8 : 4,
      opacity: 1,
      zIndex: 1
    };

    updateCurrentPageElements([...getCurrentElements(), newElement]);
  };

  const addTemplate = (template: Template) => {
    const newElements = template.elements.map((element, index) => ({
      ...element,
      id: `${element.type}-${Date.now()}-${index}`,
      x: element.x + Math.random() * 50,
      y: element.y + Math.random() * 50
    }));

    updateCurrentPageElements([...getCurrentElements(), ...newElements]);
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = getCurrentElements().find(el => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX - rect.left) / zoom - element.x,
        y: (e.clientY - rect.top) / zoom - element.y
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && canvasRef.current) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (isResizing && canvasRef.current) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      if (resizeDirection === 'width') {
        const newWidth = Math.max(300, resizeStart.width + deltaX);
        updateCanvasWidth(newWidth);
      } else if (resizeDirection === 'height') {
        const newHeight = Math.max(300, resizeStart.height + deltaY);
        updateCanvasHeight(newHeight);
      }
      return;
    }

    if (isDragging && selectedElement && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = (e.clientX - rect.left) / zoom - dragOffset.x;
      const newY = (e.clientY - rect.top) / zoom - dragOffset.y;

      const updatedElements = getCurrentElements().map(element =>
        element.id === selectedElement
          ? { ...element, x: Math.max(0, newX), y: Math.max(0, newY) }
          : element
      );

      updateCurrentPageElements(updatedElements);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.button === 1 || (e.button === 0 && panMode)) && !selectedElement) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.button === 0 && !panMode) {
      setSelectedElement(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  const handleResizeStart = (direction: 'width' | 'height', e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: canvasWidth,
      height: canvasHeight
    });
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoom + 0.2, 3);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 0.1);
    setZoom(newZoom);
  };

  const deleteElement = (elementId: string) => {
    const updatedElements = getCurrentElements().filter(el => el.id !== elementId);
    updateCurrentPageElements(updatedElements);
    setSelectedElement(null);
  };

  const duplicateElement = (elementId: string) => {
    const element = getCurrentElements().find(el => el.id === elementId);
    if (!element) return;

    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20
    };

    updateCurrentPageElements([...getCurrentElements(), newElement]);
  };

  const clearCanvas = () => {
    updateCurrentPageElements([]);
    setSelectedElement(null);
  };

  const updateElementProperty = (elementId: string, property: string, value: any) => {
    const updatedElements = getCurrentElements().map(element =>
      element.id === elementId
        ? { ...element, [property]: value }
        : element
    );
    updateCurrentPageElements(updatedElements);
  };

  const getSelectedElementData = () => {
    return getCurrentElements().find(el => el.id === selectedElement);
  };

  const saveWireframe = async () => {
    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "خطا", description: "لطفاً ابتدا وارد شوید" });
        return;
      }

      const { error } = await supabase
        .from('wireframes')
        .insert({
          user_id: user.id,
          name: `وایرفریم ${new Date().toLocaleDateString('fa-IR')}`,
          data: wireframe as any
        });

      if (error) throw error;
      toast({ title: "موفقیت", description: "وایرفریم با موفقیت ذخیره شد" });
    } catch (error) {
      console.error('Error saving wireframe:', error);
      toast({ title: "خطا", description: "خطا در ذخیره‌سازی وایرفریم" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderElement = (element: WireframeElement) => {
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute border-2 cursor-move transition-all select-none ${
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
          borderWidth: element.borderWidth || 1,
          borderColor: element.borderColor || '#e5e7eb',
          transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
          opacity: element.opacity || 1,
          zIndex: element.zIndex || 1,
        }}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element.id);
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 overflow-hidden">
          {element.type === 'text' ? (
            <span 
              style={{ 
                fontSize: element.fontSize || 14, 
                fontWeight: element.fontWeight || 'normal',
                textAlign: element.textAlign || 'center',
                width: '100%'
              }}
            >
              {element.content || element.label}
            </span>
          ) : element.type === 'image' ? (
            element.src ? (
              <img src={element.src} alt={element.label} className="w-full h-full object-cover rounded" />
            ) : (
              <div className="flex flex-col items-center">
                <Image className="h-6 w-6 mb-1" />
                <span className="text-center">{element.label}</span>
              </div>
            )
          ) : element.type === 'button' ? (
            <span className="text-white font-medium">{element.content || element.label}</span>
          ) : (
            <span className="text-center">{element.label}</span>
          )}
        </div>
        
        {isSelected && (
          <>
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground px-2 py-1 rounded text-xs whitespace-nowrap">
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
            <Button
              size="sm"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                duplicateElement(element.id);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    );
  };

  const selectedElementData = getSelectedElementData();

  return (
    <>
      {/* Fullscreen Canvas Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            {/* Fullscreen Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {/* Page Management in Fullscreen */}
              <div className="border-b px-4 py-2">
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
                        <span>{page.name}</span>
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
                    صفحه جدید
                  </Button>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">بوم طراحی - حالت تمام صفحه</h2>
                  <Badge variant="outline">
                    {getCurrentElements().length} عنصر
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
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={zoomOut}
                      disabled={zoom <= 0.1}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs min-w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={zoomIn}
                      disabled={zoom >= 3}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPanMode(!panMode)}
                    className={panMode ? "bg-primary/10 text-primary" : ""}
                    title="حالت جابجایی آزاد"
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
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
                    onClick={clearCanvas}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setIsFullscreen(false)}
                  >
                    <Minimize className="h-4 w-4 mr-2" />
                    خروج از حالت تمام صفحه
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Fullscreen Canvas */}
            <div 
              className="flex-1 overflow-hidden p-4"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isPanning ? 'grabbing' : (panMode ? 'grab' : 'default') }}
            >
              <div className="h-full flex items-center justify-center">
                <div
                  ref={canvasRef}
                  className="relative bg-white border shadow-lg mx-auto"
                  style={{
                    width: wireframe.canvasWidth,
                    height: Math.max(wireframe.canvasHeight, 800),
                    minHeight: '800px',
                    transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                    transformOrigin: 'center center'
                  }}
                  onClick={() => setSelectedElement(null)}
                >
                  {getCurrentElements().length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MoreHorizontal className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h4 className="text-xl font-medium mb-2">بوم خالی است</h4>
                        <p className="text-base">از قالب‌های آماده یا ابزارهای پایه استفاده کنید</p>
                      </div>
                    </div>
                  )}
                  {getCurrentElements().map(renderElement)}
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
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-foreground">ویرایشگر حرفه‌ای</h2>
              <Badge variant="outline" className="text-xs">
                {getCurrentElements().length} عنصر
              </Badge>
              <Badge variant="outline" className="text-xs">
                زوم: {Math.round(zoom * 100)}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={zoomOut}
                  disabled={zoom <= 0.1}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs min-w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={zoomIn}
                  disabled={zoom >= 3}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPanMode(!panMode)}
                className={panMode ? "bg-primary/10 text-primary" : ""}
                title="حالت جابجایی آزاد"
              >
                <Hand className="h-4 w-4" />
              </Button>
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
              <Button
                size="sm"
                variant="outline"
                onClick={saveWireframe}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Upload className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearCanvas}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 border-r bg-muted/30 flex flex-col">
            <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as any)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 m-2">
                <TabsTrigger value="elements" className="text-xs">عناصر</TabsTrigger>
                <TabsTrigger value="templates" className="text-xs">قالب‌ها</TabsTrigger>
                <TabsTrigger value="layers" className="text-xs">لایه‌ها</TabsTrigger>
              </TabsList>

              {sidebarTab === 'elements' && (
                <div className="flex-1 p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">ابزارهای پایه</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {basicTools.map((tool) => (
                        <Button
                          key={tool.type}
                          variant="outline"
                          size="sm"
                          onClick={() => addElement(tool.type)}
                          className="flex flex-col items-center gap-1 h-auto py-3"
                        >
                          <tool.icon className="h-4 w-4" />
                          <span className="text-xs">{tool.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-3">آپلود تصاویر</h3>
                    <ImageUploadSystem onFilesUploaded={setUploadedFiles} />
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-xs font-medium">تصاویر آپلود شده:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="relative border rounded cursor-pointer hover:border-primary"
                              onClick={() => {
                                const newElement: WireframeElement = {
                                  id: `image-${Date.now()}`,
                                  type: 'image',
                                  x: 50,
                                  y: 50,
                                  width: 150,
                                  height: 100,
                                  label: 'تصویر آپلود شده',
                                  src: file.url,
                                  borderWidth: 1,
                                  borderColor: '#e5e7eb',
                                  borderRadius: 4
                                };
                                updateCurrentPageElements([...getCurrentElements(), newElement]);
                              }}
                            >
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-16 object-cover rounded"
                              />
                              <p className="text-xs text-center p-1 truncate">{file.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sidebarTab === 'templates' && (
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-medium mb-3">قالب‌های آماده</h3>
                  {componentTemplates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3" onClick={() => addTemplate(template)}>
                        <div className="flex items-center gap-2">
                          <Layout className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <h4 className="text-sm font-medium">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">{template.type}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {sidebarTab === 'layers' && (
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-medium mb-3">لایه‌ها</h3>
                  {getCurrentElements().length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">هیچ عنصری وجود ندارد</p>
                  ) : (
                    getCurrentElements().map((element) => (
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
                            <div className="w-3 h-3 rounded border" style={{ backgroundColor: element.backgroundColor }} />
                            <span className="text-sm">{element.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
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
            </Tabs>
          </div>

          {/* Main Canvas Area */}
          <div 
            className="flex-1 flex flex-col bg-muted/10 overflow-hidden"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheelZoom}
            style={{ cursor: isPanning ? 'grabbing' : (panMode ? 'grab' : 'default') }}
          >
            <div className="flex-1 p-6 overflow-hidden relative">
              <div className="flex items-center justify-center h-full">
                <div className="relative">
                  {/* Canvas Container with Resize Handles */}
                  <div
                    ref={canvasRef}
                    className="relative bg-white border shadow-lg mx-auto"
                    style={{
                      width: canvasWidth,
                      height: canvasHeight,
                      minHeight: '300px',
                      minWidth: '300px',
                      backgroundImage: showGrid 
                        ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)` 
                        : 'none',
                      backgroundSize: showGrid ? `${20 * zoom}px ${20 * zoom}px` : 'auto',
                      transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                      transformOrigin: 'center center'
                    }}
                    onClick={() => setSelectedElement(null)}
                  >
                    {/* Resize Handles */}
                    <div
                      className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/20 hover:bg-primary/40 opacity-0 hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleResizeStart('width', e)}
                      title="اندازه عرض را تغییر دهید"
                    />
                    <div
                      className="absolute left-0 right-0 -bottom-1 h-2 cursor-ns-resize bg-primary/20 hover:bg-primary/40 opacity-0 hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleResizeStart('height', e)}
                      title="اندازه ارتفاع را تغییر دهید"
                    />
                    
                    {getCurrentElements().length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Layout className="h-16 w-16 mx-auto mb-4 opacity-30" />
                          <h4 className="text-xl font-medium mb-2">بوم خالی است</h4>
                          <p className="text-sm">از عناصر یا قالب‌های سمت چپ استفاده کنید</p>
                        </div>
                      </div>
                    )}
                    {getCurrentElements().map(renderElement)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Properties Panel */}
          {selectedElement && selectedElementData && (
            <div className="w-80 border-l bg-muted/30 flex flex-col">
              <div className="border-b p-4">
                <h3 className="text-sm font-medium">ویژگی‌های عنصر</h3>
                <p className="text-xs text-muted-foreground mt-1">{selectedElementData.label}</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Position and Size */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">موقعیت و اندازه</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={selectedElementData.x}
                          onChange={(e) => updateElementProperty(selectedElement, 'x', Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={selectedElementData.y}
                          onChange={(e) => updateElementProperty(selectedElement, 'y', Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">عرض</Label>
                        <Input
                          type="number"
                          value={selectedElementData.width}
                          onChange={(e) => updateElementProperty(selectedElement, 'width', Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ارتفاع</Label>
                        <Input
                          type="number"
                          value={selectedElementData.height}
                          onChange={(e) => updateElementProperty(selectedElement, 'height', Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Content */}
                  {(selectedElementData.type === 'text' || selectedElementData.type === 'button') && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">محتوا</h4>
                      <div>
                        <Label className="text-xs">متن</Label>
                        <Textarea
                          value={selectedElementData.content || selectedElementData.label || ''}
                          onChange={(e) => updateElementProperty(selectedElement, 'content', e.target.value)}
                          className="min-h-16"
                          placeholder="متن خود را وارد کنید..."
                        />
                      </div>
                      {selectedElementData.type === 'text' && (
                        <>
                          <div>
                            <Label className="text-xs">اندازه فونت</Label>
                            <Input
                              type="number"
                              value={selectedElementData.fontSize || 14}
                              onChange={(e) => updateElementProperty(selectedElement, 'fontSize', Number(e.target.value))}
                              className="h-8"
                              min="8"
                              max="72"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">تراز متن</Label>
                            <Select
                              value={selectedElementData.textAlign || 'center'}
                              onValueChange={(value) => updateElementProperty(selectedElement, 'textAlign', value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">راست</SelectItem>
                                <SelectItem value="center">وسط</SelectItem>
                                <SelectItem value="right">چپ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {selectedElementData.type === 'image' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">تصویر</h4>
                      <div>
                        <Label className="text-xs">آدرس تصویر</Label>
                        <Input
                          value={selectedElementData.src || ''}
                          onChange={(e) => updateElementProperty(selectedElement, 'src', e.target.value)}
                          className="h-8"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Appearance */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">ظاهر</h4>
                    <div>
                      <Label className="text-xs">رنگ پس‌زمینه</Label>
                      <Input
                        type="color"
                        value={selectedElementData.backgroundColor || '#f8f9fa'}
                        onChange={(e) => updateElementProperty(selectedElement, 'backgroundColor', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">رنگ حاشیه</Label>
                      <Input
                        type="color"
                        value={selectedElementData.borderColor || '#e5e7eb'}
                        onChange={(e) => updateElementProperty(selectedElement, 'borderColor', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ضخامت حاشیه</Label>
                      <Input
                        type="number"
                        value={selectedElementData.borderWidth || 1}
                        onChange={(e) => updateElementProperty(selectedElement, 'borderWidth', Number(e.target.value))}
                        className="h-8"
                        min="0"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">شعاع گرد کردن</Label>
                      <Input
                        type="number"
                        value={selectedElementData.borderRadius || 0}
                        onChange={(e) => updateElementProperty(selectedElement, 'borderRadius', Number(e.target.value))}
                        className="h-8"
                        min="0"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">شفافیت: {Math.round((selectedElementData.opacity || 1) * 100)}%</Label>
                      <Slider
                        value={[(selectedElementData.opacity || 1) * 100]}
                        onValueChange={(value) => updateElementProperty(selectedElement, 'opacity', value[0] / 100)}
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>
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