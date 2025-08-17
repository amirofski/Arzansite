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
    websiteFramework?: {
      dynamicDesign?: {
        pages: PageDesign[];
        currentPageId: string;
      };
      selectedLayouts?: Record<string, string>;
      pageStructure?: 'single' | 'multi';
      customPages?: string[];
      canvasDimensions?: {
        width: number;
        height: number;
      };
    };
  };
  updateData: (data: Partial<{
    websiteFramework: {
      dynamicDesign?: {
        pages: PageDesign[];
        currentPageId: string;
      };
    };
  }>) => void;
  onAutoAdvance?: () => void;
}

const StepTwo = ({ data, updateData, onAutoAdvance }: StepTwoProps) => {
  const [currentPhase, setCurrentPhase] = useState<'design-method' | 'design'>('design-method');
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
            layoutId: layoutId as string,
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
              layoutId: layoutId as string,
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
    
    // Default new design - start with single page
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

  // Handle design method selection
  const handleDesignMethodSelect = (method: 'template' | 'dynamic') => {
    setSelectedDesignMethod(method);
    
    if (method === 'template') {
      // For template selection, pre-populate with Full_page design and go to design phase
      const templateDesign = {
        pages: [{
          id: 'main',
          name: 'صفحه اصلی',
          sections: [
            {
              id: 'full-page-hero',
              sectionType: 'full_page',
              layoutId: 'full-page-1',
              order: 0,
              customData: {
                title: 'قالب آماده',
                content: 'قالب آماده انتخاب شده',
                imageIndex: 0, // Start with first Full_page image
                totalImages: 36 // Total Full_page images available
              }
            }
          ],
          canvasDimensions: { width: 1200, height: 800 }
        }],
        currentPageId: 'main'
      };
      
      handleDesignChange(templateDesign);
      
      // Go to design phase instead of auto-advancing
      setCurrentPhase('design');
    } else {
      // For dynamic design, proceed to design canvas
      setCurrentPhase('design');
    }
  };

  // Calculate total sections across all pages
  const totalSections = dynamicDesign.pages.reduce((total, page) => total + page.sections.length, 0);

  // Render design method selection phase
  const renderDesignMethodPhase = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">روش طراحی وب‌سایت</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          روش طراحی وب‌سایت خود را انتخاب کنید
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
            selectedDesignMethod === 'template'
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => handleDesignMethodSelect('template')}
        >
          <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
            <div className="mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Grid3X3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">قالب آماده</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-tight">
              انتخاب از قالب‌های آماده و شخصی‌سازی آن‌ها
            </p>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-primary font-medium">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                <span>قالب‌های آماده و بهینه</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full flex-shrink-0"></span>
                <span>شخصی‌سازی آسان</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full flex-shrink-0"></span>
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
          <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
            <div className="mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">طراحی پویا</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-tight">
              طراحی کاملاً سفارشی با ابزارهای پیشرفته
            </p>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-secondary font-medium">
                <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0"></span>
                <span>طراحی کاملاً سفارشی</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full flex-shrink-0"></span>
                <span>کنترل کامل بر طراحی</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted rounded-full flex-shrink-0"></span>
                <span>ابزارهای پیشرفته طراحی</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedDesignMethod && (
        <div className="text-center mt-6 sm:mt-8 p-3 sm:p-4 bg-success/10 rounded-xl border border-success/20">
          <p className="text-success font-medium text-sm sm:text-base">
            ✓ روش طراحی انتخاب شد: {selectedDesignMethod === 'template' ? 'قالب آماده' : 'طراحی پویا'}
          </p>
          {selectedDesignMethod === 'template' && (
            <p className="text-xs sm:text-sm text-success/80 mt-1 leading-tight">
              قالب آماده با بخش Full_page اضافه شد. حالا می‌توانید طراحی را شخصی‌سازی کنید.
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Render design canvas phase
  const renderDesignPhase = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">طراحی پویا</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          صفحات و بخش‌های وب‌سایت خود را طراحی کنید
        </p>
      </div>

      {/* Dynamic Design Canvas */}
      <div className="w-full overflow-x-auto">
        <DynamicDesignCanvas
          initialDesign={dynamicDesign}
          onDesignChange={handleDesignChange}
          isPreview={false}
        />
      </div>

      {/* Progress Summary */}
      <Card className="mt-6 sm:mt-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">پیشرفت طراحی</h3>
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
            <div className="text-center sm:text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {totalSections}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">بخش کل</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
        <Button
          onClick={() => setCurrentPhase('design-method')}
          variant="outline"
          className="flex items-center justify-center gap-2 order-2 sm:order-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">بازگشت به انتخاب روش</span>
          <span className="sm:hidden">بازگشت</span>
        </Button>
        
        <Button
          onClick={() => onAutoAdvance && onAutoAdvance()}
          disabled={totalSections === 0}
          className="btn-gradient flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          <span className="hidden sm:inline">ادامه به مرحله بعد</span>
          <span className="sm:hidden">ادامه</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {currentPhase === 'design-method' && renderDesignMethodPhase()}
      {currentPhase === 'design' && renderDesignPhase()}
    </div>
  );
};

export default StepTwo;