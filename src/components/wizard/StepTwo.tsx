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
  Loader2
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

  // Calculate total sections across all pages
  const totalSections = dynamicDesign.pages.reduce((total, page) => total + page.sections.length, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">طراحی چارچوب وب‌سایت</h2>
        <p className="text-muted-foreground">
          بخش‌های مورد نظر خود را به بوم طراحی اضافه کنید و ترتیب آن‌ها را تنظیم کنید
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
      {!loading && !error && (
        <DynamicDesignCanvas
          initialDesign={dynamicDesign}
          onDesignChange={handleDesignChange}
          isPreview={false}
        />
      )}

          {/* Page Structure Selection */}
      <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
                ساختار صفحات
              </CardTitle>
            </CardHeader>
            <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                dynamicDesign.pages.length === 1 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => {
                if (dynamicDesign.pages.length > 1) {
                  // Convert to single page - keep only the first page
                  const singlePageDesign = {
                    pages: [dynamicDesign.pages[0]],
                    currentPageId: dynamicDesign.pages[0].id
                  };
                  handleDesignChange(singlePageDesign);
                }
              }}
            >
                             <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                   <FileText className="w-4 h-4 text-primary" />
                 </div>
                 <div>
                   <h4 className="font-semibold">صفحه واحد</h4>
                   <p className="text-sm text-muted-foreground">تمام محتوا در یک صفحه</p>
                    </div>
                  </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>رایگان با هر تعداد بخش</span>
                    </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>مناسب برای سایت‌های ساده</span>
                  </div>
              </div>
                  </div>

            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                dynamicDesign.pages.length > 1 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => {
                if (dynamicDesign.pages.length === 1) {
                  // Convert to multi-page - add a second page
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
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                  <FileText className="w-4 h-4 text-primary -ml-2" />
                </div>
                <div>
                  <h4 className="font-semibold">چند صفحه</h4>
                  <p className="text-sm text-muted-foreground">محتوای جداگانه در صفحات مختلف</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>250,000 تومان به ازای هر صفحه</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>مناسب برای سایت‌های پیچیده</span>
                </div>
              </div>
                    </div>
              </div>
            </CardContent>
          </Card>

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
    </div>
  );
};

export default StepTwo;