import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Image as ImageIcon,
  Layout,
  Palette,
  Settings,
  Plus,
  Trash2,
  Home,
  Users,
  Mail,
  FileText,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  Edit,
  Eye,
  Loader2,
  Grid3X3,
  PenTool
} from 'lucide-react';
import { useTemplateLoader, SkeletonTemplate } from './templates';
import DynamicDesignCanvas from './DynamicDesignCanvas';

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

interface StepTwoProps {
  data: {
    siteType: string;
    websiteFramework?: {
      // Legacy support for old format
      selectedLayouts?: Record<string, string>;
      uploadedImages?: Record<string, string>;
      pageStructure?: 'single' | 'multi';
      customPages?: string[];
      canvasDimensions?: {
        width: number;
        height: number;
      };
      // New dynamic design format
      dynamicDesign?: {
        pages: PageDesign[];
        currentPageId: string;
      };
    };
  };
  updateData: (data: Partial<{
    websiteFramework: {
      selectedLayouts?: Record<string, string>;
      uploadedImages?: Record<string, string>;
      pageStructure?: 'single' | 'multi';
      customPages?: string[];
      canvasDimensions?: {
        width: number;
        height: number;
      };
      dynamicDesign?: {
        pages: PageDesign[];
        currentPageId: string;
      };
    };
  }>) => void;
}

const StepTwo = ({ data, updateData }: StepTwoProps) => {
  const [currentPhase, setCurrentPhase] = useState<'structure' | 'design'>('structure');
  const [selectedDesignMethod, setSelectedDesignMethod] = useState<'template' | 'dynamic' | ''>('');
  
  // Initialize dynamic design from existing data or create new
  const [dynamicDesign, setDynamicDesign] = useState<{
    pages: PageDesign[];
    currentPageId: string;
  }>(() => {
    // If we have existing dynamic design, use it
    if (data.websiteFramework?.dynamicDesign) {
      return data.websiteFramework.dynamicDesign;
    }
    
    // If we have legacy data, convert it to new format
    if (data.websiteFramework?.selectedLayouts) {
      const legacyPages: PageDesign[] = [];
      
      // Convert single page structure
      if (data.websiteFramework.pageStructure === 'single') {
        const sections: PageSection[] = [];
        Object.entries(data.websiteFramework.selectedLayouts).forEach(([sectionType, layoutId], index) => {
          sections.push({
            id: `${sectionType}-${index}`,
            sectionType,
            layoutId,
            order: index,
            customData: {}
          });
        });
        
        legacyPages.push({
          id: 'main',
          name: 'صفحه اصلی',
          sections,
          canvasDimensions: data.websiteFramework.canvasDimensions || { width: 1200, height: 800 }
        });
      } else {
        // Convert multi-page structure
        const customPages = data.websiteFramework.customPages || ['صفحه اصلی'];
        customPages.forEach((pageName, pageIndex) => {
          const sections: PageSection[] = [];
          Object.entries(data.websiteFramework.selectedLayouts).forEach(([sectionType, layoutId], index) => {
            sections.push({
              id: `${sectionType}-${pageIndex}-${index}`,
              sectionType,
              layoutId,
              order: index,
              customData: {}
            });
          });
          
          legacyPages.push({
            id: `page-${pageIndex}`,
            name: pageName,
            sections,
            canvasDimensions: data.websiteFramework.canvasDimensions || { width: 1200, height: 800 }
          });
        });
      }
      
      return {
        pages: legacyPages.length > 0 ? legacyPages : [{
          id: 'main',
          name: 'صفحه اصلی',
          sections: [],
          canvasDimensions: { width: 1200, height: 800 }
        }],
        currentPageId: 'main'
      };
    }
    
    // Default new design
    return {
      pages: [{
        id: 'main',
        name: 'صفحه اصلی',
        sections: [],
        canvasDimensions: { width: 1200, height: 800 }
      }],
      currentPageId: 'main'
    };
  });

  // Template loader hook
  const { templates, loading, error } = useTemplateLoader();

  // Handle design changes
  const handleDesignChange = (newDesign: { pages: PageDesign[]; currentPageId: string }) => {
    setDynamicDesign(newDesign);
    updateData({
      websiteFramework: {
        ...data.websiteFramework,
        dynamicDesign: newDesign
      }
    });
  };

  // Handle page structure change
  const handlePageStructureChange = (structure: 'single' | 'multi') => {
    if (structure === 'single') {
      // Convert to single page - keep only the first page
      const singlePageDesign = {
        pages: [dynamicDesign.pages[0]],
        currentPageId: dynamicDesign.pages[0].id
      };
      handleDesignChange(singlePageDesign);
    } else {
      // Convert to multi-page - add a second page if only one exists
      if (dynamicDesign.pages.length === 1) {
        const multiPageDesign = {
          pages: [
            dynamicDesign.pages[0],
            {
              id: 'page-2',
              name: 'صفحه دوم',
              sections: [],
              canvasDimensions: { width: 1200, height: 800 }
            }
          ],
          currentPageId: dynamicDesign.pages[0].id
        };
        handleDesignChange(multiPageDesign);
      }
    }
  };

  // Handle design method selection
  const handleDesignMethodSelect = (method: 'template' | 'dynamic') => {
    setSelectedDesignMethod(method);
    setCurrentPhase('design');
  };

  // Calculate total sections across all pages
  const totalSections = dynamicDesign.pages.reduce((total, page) => total + page.sections.length, 0);

  // Render page structure selection phase
  const renderStructurePhase = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">ساختار صفحات وب‌سایت</h2>
        <p className="text-muted-foreground">
          نوع ساختار صفحات وب‌سایت خود را انتخاب کنید
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
            dynamicDesign.pages.length === 1
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => handlePageStructureChange('single')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">صفحه واحد</h3>
            <p className="text-muted-foreground mb-6">
              تمام محتوا در یک صفحه با هر تعداد بخش
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-primary font-medium">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>قیمت پایه: 2,500,000 تومان</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>هر تعداد بخش رایگان</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>مناسب برای سایت‌های ساده</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
            dynamicDesign.pages.length > 1
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => handlePageStructureChange('multi')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-secondary" />
                <FileText className="w-8 h-8 text-secondary -ml-2" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">چند صفحه</h3>
            <p className="text-muted-foreground mb-6">
              محتوای جداگانه در صفحات مختلف
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-secondary font-medium">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                <span>قیمت پایه: 2,500,000 تومان</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>500,000 تومان به ازای هر صفحه اضافی</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>250,000 تومان به ازای هر بخش بیش از 6</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {dynamicDesign.pages.length > 0 && (
        <div className="text-center mt-8 p-4 bg-success/10 rounded-xl border border-success/20">
          <p className="text-success font-medium">
            ✓ ساختار انتخاب شد: {dynamicDesign.pages.length === 1 ? 'صفحه واحد' : `${dynamicDesign.pages.length} صفحه`}
          </p>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Button
          onClick={() => setCurrentPhase('design')}
          disabled={dynamicDesign.pages.length === 0}
          className="btn-gradient"
        >
          ادامه به انتخاب روش طراحی
          <ChevronLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );

  // Render design method selection phase
  const renderDesignMethodPhase = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">روش طراحی وب‌سایت</h2>
        <p className="text-muted-foreground">
          روش طراحی وب‌سایت خود را انتخاب کنید
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
            selectedDesignMethod === 'template'
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => handleDesignMethodSelect('template')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Grid3X3 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">قالب آماده</h3>
            <p className="text-muted-foreground mb-6">
              انتخاب از قالب‌های آماده و شخصی‌سازی آن‌ها
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-primary font-medium">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>قالب‌های آماده و بهینه</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>شخصی‌سازی آسان</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>سرعت بالا در طراحی</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
            selectedDesignMethod === 'dynamic'
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => handleDesignMethodSelect('dynamic')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <PenTool className="w-8 h-8 text-secondary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">طراحی پویا</h3>
            <p className="text-muted-foreground mb-6">
              طراحی کاملاً سفارشی با ابزارهای پیشرفته
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-secondary font-medium">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                <span>طراحی کاملاً سفارشی</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>کنترل کامل بر طراحی</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full"></span>
                <span>ابزارهای پیشرفته طراحی</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedDesignMethod && (
        <div className="text-center mt-8 p-4 bg-success/10 rounded-xl border border-success/20">
          <p className="text-success font-medium">
            ✓ روش طراحی انتخاب شد: {selectedDesignMethod === 'template' ? 'قالب آماده' : 'طراحی پویا'}
          </p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button
          onClick={() => setCurrentPhase('structure')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت به ساختار صفحات
        </Button>
        
        {selectedDesignMethod && (
          <Button
            onClick={() => {
              // Continue to design phase
              if (selectedDesignMethod === 'template') {
                // Handle template selection
                console.log('Template design selected');
              } else {
                // Handle dynamic design
                console.log('Dynamic design selected');
              }
            }}
            className="btn-gradient"
          >
            ادامه به طراحی
            <ChevronRight className="w-4 h-4 mr-2" />
          </Button>
        )}
      </div>
    </div>
  );

  // Render design canvas phase
  const renderDesignPhase = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">طراحی وب‌سایت</h2>
        <p className="text-muted-foreground">
          {selectedDesignMethod === 'template' 
            ? 'قالب مورد نظر خود را انتخاب کنید' 
            : 'بخش‌های مورد نظر خود را به بوم طراحی اضافه کنید'
          }
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p>در حال بارگذاری قالب‌ها...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">خطا در بارگذاری قالب‌ها: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Design Canvas */}
      {!loading && !error && selectedDesignMethod === 'dynamic' && (
        <DynamicDesignCanvas
          initialDesign={dynamicDesign}
          onDesignChange={handleDesignChange}
          isPreview={false}
        />
      )}

      {/* Template Selection */}
      {!loading && !error && selectedDesignMethod === 'template' && (
        <div className="space-y-8">
          {Object.entries(templates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 capitalize">{category}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-medium transition-all">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                        <template.component className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Summary */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-2">پیشرفت طراحی</h3>
              <div className="flex gap-2 flex-wrap">
                {dynamicDesign.pages.map((page) => (
                  <Badge
                    key={page.id}
                    variant={page.sections.length > 0 ? "default" : "outline"}
                    className="text-xs"
                  >
                    {page.name}: {page.sections.length} بخش
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {totalSections}
              </div>
              <div className="text-sm text-muted-foreground">بخش کل</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button
          onClick={() => setCurrentPhase('design')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت به انتخاب روش
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {currentPhase === 'structure' && renderStructurePhase()}
      {currentPhase === 'design' && !selectedDesignMethod && renderDesignMethodPhase()}
      {currentPhase === 'design' && selectedDesignMethod && renderDesignPhase()}
    </div>
  );
};

export default StepTwo;