import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Layout, 
  Image, 
  Navigation, 
  FileText, 
  Mail, 
  ShoppingCart, 
  Users, 
  Star,
  Images,
  MessageSquare,
  Calendar,
  Search,
  BarChart3,
  GripVertical,
  Eye,
  Palette
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  nameEn: string;
  icon: any;
  category: 'essential' | 'content' | 'business' | 'advanced';
  description: string;
  features: string[];
  basePrice: number;
  complexity: number;
  customizable: boolean;
  required?: boolean;
  position?: number;
}

interface ModuleLayoutDesignerProps {
  data: any;
  updateData: (data: any) => void;
}

const SortableModuleItem = ({ module, isSelected, onToggle, onCustomize }: {
  module: Module;
  isSelected: boolean;
  onToggle: () => void;
  onCustomize: (field: string, value: any) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = module.icon;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-primary bg-primary/5'
          : 'hover:ring-1 hover:ring-primary/50 hover:shadow-lg'
      } ${isDragging ? 'scale-105 shadow-lg z-50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 hover:bg-muted rounded"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{module.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{module.nameEn}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {module.required && (
              <Badge variant="secondary" className="text-xs">
                ضروری
              </Badge>
            )}
            <Switch
              checked={isSelected}
              onCheckedChange={onToggle}
              disabled={module.required}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {module.description}
        </p>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-xs font-medium">قابلیت‌ها:</p>
          <ul className="text-xs space-y-1">
            {module.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                {feature}
              </li>
            ))}
            {module.features.length > 3 && (
              <li className="text-muted-foreground">
                + {module.features.length - 3} مورد دیگر
              </li>
            )}
          </ul>
        </div>

        {/* Price and Complexity */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-sm">
            <span className="font-medium">
              {module.basePrice === 0 
                ? 'رایگان' 
                : `${new Intl.NumberFormat('fa-IR').format(module.basePrice)} تومان`
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < module.complexity ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Customization Options (shown when selected) */}
        {isSelected && module.customizable && (
          <div className="space-y-3 pt-3 border-t bg-muted/30 p-3 rounded-lg">
            <p className="text-xs font-medium">تنظیمات سفارشی:</p>
            
            {/* Layout Style */}
            <div className="space-y-2">
              <label className="text-xs">طرح‌بندی:</label>
              <select
                onChange={(e) => onCustomize('layout', e.target.value)}
                className="w-full text-xs p-1 border rounded"
                defaultValue="default"
              >
                <option value="default">پیش‌فرض</option>
                <option value="minimal">مینیمال</option>
                <option value="modern">مدرن</option>
                <option value="classic">کلاسیک</option>
              </select>
            </div>

            {/* Animation Level */}
            <div className="space-y-2">
              <label className="text-xs">انیمیشن:</label>
              <select
                onChange={(e) => onCustomize('animations', e.target.value)}
                className="w-full text-xs p-1 border rounded"
                defaultValue="subtle"
              >
                <option value="none">بدون انیمیشن</option>
                <option value="subtle">ملایم</option>
                <option value="smooth">روان</option>
                <option value="dynamic">پویا</option>
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ModuleLayoutDesigner = ({ data, updateData }: ModuleLayoutDesignerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('essential');
  const [moduleLayout, setModuleLayout] = useState<Module[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const modules: Module[] = [
    // Essential Modules
    {
      id: 'header',
      name: 'هدر',
      nameEn: 'Header',
      icon: Layout,
      category: 'essential',
      description: 'نوار بالای سایت شامل لوگو، منو و دکمه‌های اصلی',
      features: ['لوگو', 'منوی اصلی', 'دکمه CTA', 'منوی موبایل'],
      basePrice: 0,
      complexity: 1,
      customizable: true,
      required: true
    },
    {
      id: 'hero',
      name: 'قسمت قهرمان',
      nameEn: 'Hero Section',
      icon: Image,
      category: 'essential',
      description: 'بخش اصلی صفحه اول با عنوان، توضیحات و تصویر جذاب',
      features: ['عنوان اصلی', 'زیرنویس', 'دکمه عمل', 'تصویر پس‌زمینه'],
      basePrice: 100000,
      complexity: 2,
      customizable: true,
      required: true
    },
    {
      id: 'footer',
      name: 'پاورقی',
      nameEn: 'Footer',
      icon: Layout,
      category: 'essential',
      description: 'بخش پایین سایت با اطلاعات تماس و لینک‌های مهم',
      features: ['اطلاعات تماس', 'لینک‌های سریع', 'شبکه‌های اجتماعی', 'کپی‌رایت'],
      basePrice: 0,
      complexity: 1,
      customizable: true,
      required: true
    },

    // Content Modules
    {
      id: 'about',
      name: 'درباره ما',
      nameEn: 'About Section',
      icon: Users,
      category: 'content',
      description: 'معرفی شما یا کسب‌وکارتان',
      features: ['متن معرفی', 'تصاویر تیم', 'آمار و ارقام', 'مسیر شرکت'],
      basePrice: 150000,
      complexity: 2,
      customizable: true
    },
    {
      id: 'services',
      name: 'خدمات',
      nameEn: 'Services',
      icon: Star,
      category: 'content',
      description: 'نمایش خدمات و قابلیت‌های شما',
      features: ['کارت‌های خدمات', 'توضیحات تفصیلی', 'قیمت‌گذاری', 'درخواست قیمت'],
      basePrice: 200000,
      complexity: 3,
      customizable: true
    },
    {
      id: 'portfolio',
      name: 'نمونه کارها',
      nameEn: 'Portfolio',
      icon: Images,
      category: 'content',
      description: 'گالری پروژه‌ها و نمونه کارهای شما',
      features: ['گالری تصاویر', 'فیلترینگ', 'جزئیات پروژه', 'لایت‌باکس'],
      basePrice: 250000,
      complexity: 3,
      customizable: true
    },
    {
      id: 'blog',
      name: 'وبلاگ',
      nameEn: 'Blog',
      icon: FileText,
      category: 'content',
      description: 'بخش مقالات و اخبار',
      features: ['فهرست مقالات', 'دسته‌بندی', 'جستجو', 'اشتراک‌گذاری'],
      basePrice: 300000,
      complexity: 4,
      customizable: true
    },

    // Business Modules
    {
      id: 'contact',
      name: 'تماس با ما',
      nameEn: 'Contact',
      icon: Mail,
      category: 'business',
      description: 'فرم تماس و اطلاعات دسترسی',
      features: ['فرم تماس', 'نقشه', 'اطلاعات تماس', 'ساعات کاری'],
      basePrice: 100000,
      complexity: 2,
      customizable: true,
      required: true
    },
    {
      id: 'products',
      name: 'محصولات',
      nameEn: 'Products',
      icon: ShoppingCart,
      category: 'business',
      description: 'کاتالوگ محصولات و خدمات',
      features: ['کارت محصولات', 'فیلترینگ', 'جستجو', 'مقایسه'],
      basePrice: 400000,
      complexity: 4,
      customizable: true
    },
    {
      id: 'testimonials',
      name: 'نظرات مشتریان',
      nameEn: 'Testimonials',
      icon: MessageSquare,
      category: 'business',
      description: 'بازخوردها و نظرات مثبت مشتریان',
      features: ['کارت‌های نظرات', 'امتیازدهی', 'عکس مشتریان', 'اسلایدر'],
      basePrice: 150000,
      complexity: 2,
      customizable: true
    },

    // Advanced Modules
    {
      id: 'booking',
      name: 'رزرو آنلاین',
      nameEn: 'Booking System',
      icon: Calendar,
      category: 'advanced',
      description: 'سیستم رزرو نوبت آنلاین',
      features: ['تقویم رزرو', 'انتخاب زمان', 'تأیید ایمیلی', 'مدیریت رزروها'],
      basePrice: 800000,
      complexity: 5,
      customizable: true
    },
    {
      id: 'search',
      name: 'جستجوی پیشرفته',
      nameEn: 'Advanced Search',
      icon: Search,
      category: 'advanced',
      description: 'موتور جستجوی قدرتمند',
      features: ['جستجوی لحظه‌ای', 'فیلترهای پیشرفته', 'پیشنهادات', 'تاریخچه جستجو'],
      basePrice: 500000,
      complexity: 4,
      customizable: true
    },
    {
      id: 'analytics',
      name: 'آنالیتیکس',
      nameEn: 'Analytics Dashboard',
      icon: BarChart3,
      category: 'advanced',
      description: 'داشبورد آمار و گزارش‌گیری',
      features: ['آمار بازدید', 'نمودارها', 'گزارش‌های تفصیلی', 'صادرات داده'],
      basePrice: 600000,
      complexity: 5,
      customizable: true
    }
  ];

  const categories = [
    { id: 'essential', name: 'ضروری', description: 'ماژول‌های پایه هر وب‌سایت' },
    { id: 'content', name: 'محتوا', description: 'بخش‌های نمایش محتوا' },
    { id: 'business', name: 'کسب‌وکار', description: 'امکانات تجاری و بازاریابی' },
    { id: 'advanced', name: 'پیشرفته', description: 'قابلیت‌های تخصصی' }
  ];

  // Initialize required modules
  useEffect(() => {
    if (!data.modules || data.modules.length === 0) {
      const requiredModules = modules
        .filter(m => m.required)
        .map((m, index) => ({
          ...m,
          position: index,
          customizations: {
            layout: 'default',
            colors: 'inherit',
            animations: 'subtle'
          }
        }));
      updateData({ modules: requiredModules });
      setModuleLayout(requiredModules);
    } else {
      setModuleLayout(data.modules);
    }
  }, []);

  const filteredModules = modules.filter(module => module.category === selectedCategory);

  const toggleModule = (moduleId: string) => {
    const currentModules = data.modules || [];
    const isSelected = currentModules.some((m: any) => m.id === moduleId);
    const module = modules.find(m => m.id === moduleId);

    if (!module) return;

    // Don't allow removing required modules
    if (isSelected && module.required) return;

    let updatedModules;
    if (isSelected) {
      updatedModules = currentModules.filter((m: any) => m.id !== moduleId);
    } else {
      const newModule = {
        ...module,
        position: currentModules.length,
        customizations: {
          layout: 'default',
          colors: 'inherit',
          animations: 'subtle'
        }
      };
      updatedModules = [...currentModules, newModule];
    }

    setModuleLayout(updatedModules);
    updateData({ modules: updatedModules });
  };

  const updateModuleCustomization = (moduleId: string, field: string, value: any) => {
    const updatedModules = moduleLayout.map((m: any) => {
      if (m.id === moduleId) {
        return {
          ...m,
          customizations: {
            ...m.customizations,
            [field]: value
          }
        };
      }
      return m;
    });
    setModuleLayout(updatedModules);
    updateData({ modules: updatedModules });
  };

  const isModuleSelected = (moduleId: string) => {
    return moduleLayout.some((m: any) => m.id === moduleId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = moduleLayout.findIndex((item) => item.id === active.id);
      const newIndex = moduleLayout.findIndex((item) => item.id === over?.id);

      const newLayout = arrayMove(moduleLayout, oldIndex, newIndex).map((item, index) => ({
        ...item,
        position: index
      }));

      setModuleLayout(newLayout);
      updateData({ modules: newLayout });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">طراحی چیدمان ماژول‌ها</h2>
        <p className="text-muted-foreground">
          ماژول‌ها را انتخاب کرده و به ترتیب دلخواه خود بچینید
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Module Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex-1 md:flex-none"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Selected Category Description */}
          <div className="text-center">
            <p className="text-muted-foreground">
              {categories.find(c => c.id === selectedCategory)?.description}
            </p>
          </div>

          {/* Modules Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredModules.map((module) => (
              <SortableModuleItem
                key={module.id}
                module={module}
                isSelected={isModuleSelected(module.id)}
                onToggle={() => toggleModule(module.id)}
                onCustomize={(field, value) => updateModuleCustomization(module.id, field, value)}
              />
            ))}
          </div>
        </div>

        {/* Layout Preview */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                پیش‌نمای چیدمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moduleLayout.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={moduleLayout.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {moduleLayout
                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                        .map((module, index) => {
                          const ModuleIcon = module.icon;
                          return (
                            <SortablePreviewItem
                              key={module.id}
                              id={module.id}
                              icon={ModuleIcon}
                              name={module.name}
                              index={index + 1}
                            />
                          );
                        })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ماژول انتخاب کنید</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {moduleLayout.length > 0 && (
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold text-success mb-2">
                    ✓ {moduleLayout.length} ماژول انتخاب شده
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    مجموع پیچیدگی: {moduleLayout.reduce((sum: number, m: any) => sum + m.complexity, 0)} / 25
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const SortablePreviewItem = ({ id, icon: Icon, name, index }: {
  id: string;
  icon: any;
  name: string;
  index: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-3 bg-background border rounded-lg cursor-grab hover:cursor-grabbing hover:bg-muted/50 transition-colors ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-muted px-2 py-1 rounded">{index}</span>
          <span className="text-sm font-medium truncate">{name}</span>
        </div>
      </div>
      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
};

export default ModuleLayoutDesigner;