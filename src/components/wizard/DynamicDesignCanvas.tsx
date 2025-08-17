import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Copy,
  Eye,
  Layout,
  FileText,
  Star,
  Users,
  Settings,
  Mail,
  ShoppingBag,
  Home,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Image as ImageIcon,
  BarChart3,
  Share2
} from 'lucide-react';
import { useTemplateLoader, SkeletonTemplate, getImageTemplatesByCategory } from './templates';
import { getAdjacentImage, SECTION_NAMES } from '@/lib/imageLoader';
import LazyImage from '@/components/ui/lazy-image';
import CacheClearButton from '@/components/ui/cache-clear-button';

interface PageSection {
  id: string;
  sectionType: string;
  layoutId: string;
  order: number;
  customData?: {
    title?: string;
    content?: string;
    images?: string[];
  };
}

interface PageDesign {
  id: string;
  name: string;
  sections: PageSection[];
  canvasDimensions: {
    width: number;
    height: number;
  };
}

interface DynamicDesignCanvasProps {
  initialDesign?: {
    pages: PageDesign[];
    currentPageId: string;
  };
  onDesignChange: (design: { pages: PageDesign[]; currentPageId: string }) => void;
  isPreview?: boolean;
}

const DynamicDesignCanvas = ({ 
  initialDesign, 
  onDesignChange, 
  isPreview = false 
}: DynamicDesignCanvasProps) => {
  const [pages, setPages] = useState<PageDesign[]>(
    initialDesign?.pages || [
      {
        id: 'main',
        name: 'صفحه اصلی',
        sections: [],
        canvasDimensions: { width: 1200, height: 800 }
      }
    ]
  );
  const [currentPageId, setCurrentPageId] = useState<string>(
    initialDesign?.currentPageId || 'main'
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [editingPageName, setEditingPageName] = useState<string | null>(null);
  const [tempPageName, setTempPageName] = useState<string>('');
  const [canvasWidth, setCanvasWidth] = useState<number>(800);
  const [imageTemplates, setImageTemplates] = useState<Record<string, SkeletonTemplate[]>>({});

  const { templates, loading, getTemplatesByCategory } = useTemplateLoader();

  // Update canvas width based on screen size
  useEffect(() => {
    const updateCanvasWidth = () => {
      const maxWidth = Math.min(800, window.innerWidth - 100);
      setCanvasWidth(maxWidth);
    };

    updateCanvasWidth();
    window.addEventListener('resize', updateCanvasWidth);
    return () => window.removeEventListener('resize', updateCanvasWidth);
  }, []);

  // Load image templates only when needed (lazy loading)
  const loadImageTemplatesForCategory = async (category: string) => {
    // Check if already loaded
    if (imageTemplates[category]) {
      return imageTemplates[category];
    }

    try {
      console.log(`🔄 Loading templates for ${category}...`);
      const temps = await getImageTemplatesByCategory(category);
      
      setImageTemplates(prev => ({
        ...prev,
        [category]: temps
      }));
      
      console.log(`✅ Loaded ${temps.length} templates for ${category}`);
      return temps;
    } catch (error) {
      console.error(`Failed to load image templates for ${category}:`, error);
      
      setImageTemplates(prev => ({
        ...prev,
        [category]: []
      }));
      
      return [];
    }
  };

  // Available sections for adding - dynamically generated from SECTION_NAMES
  const availableSections = Object.entries(SECTION_NAMES).map(([id, name]) => {
    // Map section types to appropriate icons
    const getIcon = (sectionId: string) => {
      switch (sectionId) {
        case 'headers':
        case 'footer':
          return Layout;
        case 'hero':
          return Star;
        case 'about':
        case 'team':
          return Users;
        case 'services':
        case 'features':
          return Settings;
        case 'contact':
        case 'newsletter':
          return Mail;
        case 'gallery':
          return ImageIcon;
        case 'pricing':
          return ShoppingBag;
        case 'faqs':
          return FileText;
        case 'blog_posts':
          return FileText;
        case 'call_to_actions':
          return Star;
        case 'content':
          return FileText;
        case 'forms':
          return FileText;
        case 'accordion':
          return FileText;
        case 'tables':
          return FileText;
        case 'stats':
          return BarChart3;
        case 'socials':
          return Share2;
        case 'logos':
          return ImageIcon;
        case 'left_right_sections':
          return Layout;
        case 'full_page':
          return Monitor;
        default:
          return Layout;
      }
    };

    // Generate descriptions based on section type
    const getDescription = (sectionId: string) => {
      switch (sectionId) {
        case 'headers':
          return 'منوی ناوبری و لوگو';
        case 'hero':
          return 'معرفی اولیه و جذاب';
        case 'about':
          return 'معرفی و توضیحات';
        case 'services':
          return 'خدمات و محصولات';
        case 'contact':
          return 'اطلاعات تماس';
        case 'newsletter':
          return 'عضویت در خبرنامه';
        case 'footer':
          return 'اطلاعات تکمیلی';
        case 'features':
          return 'ویژگی‌های محصول';
        case 'gallery':
          return 'نمایش تصاویر و گالری';
        case 'testimonials':
          return 'نظرات مشتریان';
        case 'team':
          return 'معرفی تیم';
        case 'pricing':
          return 'قیمت‌گذاری و پلن‌ها';
        case 'faqs':
          return 'سوالات متداول';
        case 'blog_posts':
          return 'مقالات و اخبار';
        case 'call_to_actions':
          return 'فراخوان عمل';
        case 'content':
          return 'محتوای متنی';
        case 'forms':
          return 'فرم‌های تماس و ثبت‌نام';
        case 'accordion':
          return 'بخش‌های قابل گسترش';
        case 'tables':
          return 'جداول اطلاعات';
        case 'stats':
          return 'آمار و ارقام';
        case 'socials':
          return 'شبکه‌های اجتماعی';
        case 'logos':
          return 'لوگوها و برندها';
        case 'left_right_sections':
          return 'بخش‌های چپ و راست';
        case 'full_page':
          return 'صفحه کامل';
        default:
          return 'بخش سایت';
      }
    };

    return {
      id,
      name,
      icon: getIcon(id),
      description: getDescription(id)
    };
  });

  const currentPage = pages.find(p => p.id === currentPageId);
  const currentPageSections = currentPage?.sections || [];

  // Calculate total page height based on sections
  const calculatePageHeight = (sections: PageSection[]) => {
    const baseHeight = 200; // Minimum page height
    const sectionHeight = 300; // Average section height
    return Math.max(baseHeight, sections.length * sectionHeight);
  };

  // Add new page
  const addNewPage = () => {
    const newPageId = `page-${Date.now()}`;
    const newPage: PageDesign = {
      id: newPageId,
      name: `صفحه ${pages.length + 1}`,
      sections: [],
      canvasDimensions: { width: 1200, height: 800 }
    };
    
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    setCurrentPageId(newPageId);
    onDesignChange({ pages: updatedPages, currentPageId: newPageId });
  };

  // Add section to current page
  const addSection = async (sectionType: string) => {
    if (!currentPage) return;

    // Close modal immediately for better UX
    setShowSectionSelector(false);

    // Create section with placeholder template ID
    const newSection: PageSection = {
      id: `${sectionType}-${Date.now()}`,
      sectionType,
      layoutId: `${sectionType}-1`, // Default template ID
      order: currentPageSections.length,
      customData: {}
    };

    // Add section immediately
    const updatedSections = [...currentPageSections, newSection];
    const updatedPage = { ...currentPage, sections: updatedSections };
    const updatedPages = pages.map(p => p.id === currentPageId ? updatedPage : p);
    
    setPages(updatedPages);
    onDesignChange({ pages: updatedPages, currentPageId });

    // Load templates in background
    loadImageTemplatesForCategory(sectionType).then((templates) => {
      if (templates.length > 0) {
        // Update section with first available template
        const finalSections = updatedSections.map(s => 
          s.id === newSection.id ? { ...s, layoutId: templates[0].id } : s
        );
        
        const finalPage = { ...currentPage, sections: finalSections };
        const finalPages = pages.map(p => p.id === currentPageId ? finalPage : p);
        
        setPages(finalPages);
        onDesignChange({ pages: finalPages, currentPageId });
      }
    }).catch((error) => {
      console.error(`Failed to load templates for ${sectionType}:`, error);
    });
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    if (!currentPage) return;

    const updatedSections = currentPageSections
      .filter(s => s.id !== sectionId)
      .map((s, index) => ({ ...s, order: index }));
    
    const updatedPage = { ...currentPage, sections: updatedSections };
    const updatedPages = pages.map(p => p.id === currentPageId ? updatedPage : p);
    
    setPages(updatedPages);
    onDesignChange({ pages: updatedPages, currentPageId });
  };

  // Move section up/down
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!currentPage) return;

    const sectionIndex = currentPageSections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    if (newIndex < 0 || newIndex >= currentPageSections.length) return;

    const updatedSections = [...currentPageSections];
    [updatedSections[sectionIndex], updatedSections[newIndex]] = [updatedSections[newIndex], updatedSections[sectionIndex]];
    
    // Update order
    updatedSections.forEach((s, index) => {
      s.order = index;
    });

    const updatedPage = { ...currentPage, sections: updatedSections };
    const updatedPages = pages.map(p => p.id === currentPageId ? updatedPage : p);
    
    setPages(updatedPages);
    onDesignChange({ pages: updatedPages, currentPageId });
  };

  // Change section layout using navigation arrows
  const changeSectionLayout = async (sectionId: string, direction: 'left' | 'right') => {
    if (!currentPage) return;

    const section = currentPageSections.find(s => s.id === sectionId);
    if (!section) return;

    const currentTemplate = imageTemplates[section.sectionType]?.find(t => t.id === section.layoutId);
    if (!currentTemplate) return;

    try {
      const adjacentTemplate = await getAdjacentImage(currentTemplate.id, direction === 'left' ? 'prev' : 'next');
      if (!adjacentTemplate) return;

      const updatedSections = currentPageSections.map(s => 
        s.id === sectionId ? { ...s, layoutId: adjacentTemplate.id } : s
      );
      
      const updatedPage = { ...currentPage, sections: updatedSections };
      const updatedPages = pages.map(p => p.id === currentPageId ? updatedPage : p);
      
      setPages(updatedPages);
      onDesignChange({ pages: updatedPages, currentPageId });
    } catch (error) {
      console.error('Failed to change section layout:', error);
    }
  };

  // Render section component using image
  const renderSection = (section: PageSection) => {
    const templates = imageTemplates[section.sectionType] || [];
    const template = templates.find(t => t.id === section.layoutId) || templates[0];
    
    if (!template) {
      // Try to load templates for this category
      loadImageTemplatesForCategory(section.sectionType);
      
      return (
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>در حال بارگذاری قالب...</p>
          </div>
        </div>
      );
    }

    if (template.previewImage) {
      return (
        <LazyImage
          src={template.previewImage}
          alt={template.name}
          className="w-full h-auto rounded-lg"
          fallback="/placeholder.svg"
          onLoad={() => console.log(`✅ Image loaded: ${template.previewImage}`)}
          onError={(error) => console.error(`❌ Failed to load image: ${template.previewImage}`, error)}
        />
      );
    }

    // Fallback to component if no image
    const LayoutComponent = template.component;
    return <LayoutComponent className="w-full" />;
  };

  // Update canvas dimensions
  const updateCanvasDimensions = (dimension: 'width' | 'height', value: number) => {
    if (!currentPage) return;

    const updatedPage = {
      ...currentPage,
      canvasDimensions: {
        ...currentPage.canvasDimensions,
        [dimension]: value
      }
    };
    
    const updatedPages = pages.map(p => p.id === currentPageId ? updatedPage : p);
    setPages(updatedPages);
    onDesignChange({ pages: updatedPages, currentPageId });
  };

  // Update page name
  const updatePageName = (pageId: string, newName: string) => {
    const updatedPages = pages.map(p => 
      p.id === pageId ? { ...p, name: newName } : p
    );
    setPages(updatedPages);
    onDesignChange({ pages: updatedPages, currentPageId });
    setEditingPageName(null);
  };

  // Start editing page name
  const startEditingPageName = (pageId: string, currentName: string) => {
    setEditingPageName(pageId);
    setTempPageName(currentName);
  };

  // Cancel editing page name
  const cancelEditingPageName = () => {
    setEditingPageName(null);
    setTempPageName('');
  };

  return (
    <div className="space-y-6">
      {/* Page Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              صفحات سایت
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* General Cache Clear Button */}
              <CacheClearButton 
                variant="outline" 
                size="sm"
                className="text-xs"
              />
              {!isPreview && (
                <Button onClick={addNewPage}>
                  <Plus className="w-4 h-4 mr-2" />
                  افزودن صفحه جدید
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center gap-2">
                {editingPageName === page.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempPageName}
                      onChange={(e) => setTempPageName(e.target.value)}
                      className="h-8 w-32"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updatePageName(page.id, tempPageName);
                        } else if (e.key === 'Escape') {
                          cancelEditingPageName();
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => updatePageName(page.id, tempPageName)}
                      className="h-8 px-2"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingPageName}
                      className="h-8 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="relative group">
                    <Button
                      variant={currentPageId === page.id ? "default" : "outline"}
                      onClick={() => {
                        setCurrentPageId(page.id);
                        onDesignChange({ pages, currentPageId: page.id });
                      }}
                      className="whitespace-nowrap pr-8"
                    >
                      <span>{page.name}</span>
                      <Badge variant="secondary" className="mr-2 text-xs">
                        {page.sections.length} بخش
                      </Badge>
                    </Button>
                    {!isPreview && (
                      <button
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingPageName(page.id, page.name);
                        }}
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Design Canvas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                بوم طراحی - {currentPage?.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {currentPageSections.length} بخش • ارتفاع فعلی: {Math.max(calculatePageHeight(currentPageSections), 400)}px
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Cache Clear Button for debugging image loading issues */}
              <CacheClearButton 
                category="headers" 
                variant="outline" 
                size="sm"
                className="text-xs"
              />
              {!isPreview && (
                <Button onClick={() => setShowSectionSelector(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  افزودن بخش جدید
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Canvas Dimensions (only in edit mode) */}
          {!isPreview && (
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-medium">ابعاد صفحه:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCanvasDimensions('width', 1200)}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCanvasDimensions('width', 768)}
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCanvasDimensions('width', 375)}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">عرض (px)</Label>
                  <Input
                    type="number"
                    value={currentPage?.canvasDimensions.width || 1200}
                    onChange={(e) => updateCanvasDimensions('width', Number(e.target.value))}
                    className="h-8"
                    min="300"
                    max="2000"
                  />
                </div>
                <div>
                  <Label className="text-xs">ارتفاع (px)</Label>
                  <Input
                    type="number"
                    value={Math.max(calculatePageHeight(currentPageSections), 400)}
                    onChange={(e) => updateCanvasDimensions('height', Number(e.target.value))}
                    className="h-8"
                    min="400"
                    max="3000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Canvas Content */}
          <div className="relative">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg bg-white mx-auto overflow-hidden"
              style={{
                width: Math.min(currentPage?.canvasDimensions.width || 1200, canvasWidth),
                height: Math.max(calculatePageHeight(currentPageSections), 400),
                maxWidth: '100%'
              }}
            >
              <ScrollArea className="h-full w-full">
                <div className="p-4 space-y-4" style={{ minHeight: '100%' }}>
                  {currentPageSections.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Layout className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>هیچ بخشی اضافه نشده است</p>
                        {!isPreview && (
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setShowSectionSelector(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            افزودن اولین بخش
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    currentPageSections.map((section, index) => {
                      const sectionInfo = availableSections.find(s => s.id === section.sectionType);
                      const templates = imageTemplates[section.sectionType] || [];
                      const currentTemplate = templates.find(t => t.id === section.layoutId);
                      
                      return (
                        <div
                          key={section.id}
                          className={`relative border-2 rounded-lg transition-all duration-200 ${
                            selectedSectionId === section.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedSectionId(section.id)}
                        >
                          {/* Section Header */}
                          <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {sectionInfo?.name}
                            </Badge>
                            {!isPreview && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveSection(section.id, 'up');
                                  }}
                                  disabled={index === 0}
                                >
                                  <MoveUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveSection(section.id, 'down');
                                  }}
                                  disabled={index === currentPageSections.length - 1}
                                >
                                  <MoveDown className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSection(section.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Navigation Arrows */}
                          {!isPreview && (
                            <>
                              {/* Left Navigation Arrow */}
                              <button
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white border border-gray-300 rounded-full p-2 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeSectionLayout(section.id, 'left');
                                }}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              
                              {/* Right Navigation Arrow */}
                              <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white border border-gray-300 rounded-full p-2 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeSectionLayout(section.id, 'right');
                                }}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Section Content */}
                          <div className="p-4 pt-12">
                            {renderSection(section)}
                          </div>

                          {/* Section Info */}
                          <div className="absolute bottom-2 left-2 z-10">
                            <Badge variant="outline" className="text-xs">
                              {currentTemplate?.name || (
                                <div className="flex items-center gap-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  <span>در حال بارگذاری...</span>
                                </div>
                              )}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Selector Modal */}
      {showSectionSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-[80vh] overflow-hidden">
            <CardHeader>
              <CardTitle>انتخاب بخش جدید</CardTitle>
              <p className="text-sm text-muted-foreground">
                بخش انتخاب شده بلافاصله اضافه می‌شود و تصاویر در پس‌زمینه بارگذاری می‌شوند
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {availableSections.map((section) => (
                    <Button
                      key={section.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={() => addSection(section.id)}
                    >
                      <section.icon className="w-5 h-5 mr-3" />
                      <div className="text-right">
                        <div className="font-medium">{section.name}</div>
                        <div className="text-xs text-muted-foreground">{section.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setShowSectionSelector(false)}>
                  انصراف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DynamicDesignCanvas; 