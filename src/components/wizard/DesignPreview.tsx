import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye,
  FileText,
  Layout,
  Star,
  Users,
  Settings,
  Mail,
  ExternalLink,
  Download,
  Share2
} from 'lucide-react';
import { useTemplateLoader } from './templates';

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

interface DesignPreviewProps {
  design: {
    pages: PageDesign[];
    currentPageId: string;
  };
  showActions?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
  onViewLive?: () => void;
}

const DesignPreview = ({ 
  design, 
  showActions = true, 
  onDownload, 
  onShare, 
  onViewLive 
}: DesignPreviewProps) => {
  const { templates, getTemplatesByCategory } = useTemplateLoader();

  // Render section component
  const renderSection = (section: PageSection) => {
    const layouts = getTemplatesByCategory(section.sectionType);
    const layout = layouts.find(l => l.id === section.layoutId) || layouts[0];
    
    if (!layout) {
      return (
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
          قالب در دسترس نیست
        </div>
      );
    }

    const LayoutComponent = layout.component;
    return <LayoutComponent className="w-full" />;
  };

  // Get section info
  const getSectionInfo = (sectionType: string) => {
    const sectionMap = {
      header: { name: 'هدر', icon: Layout, color: 'bg-blue-100 text-blue-800' },
      hero: { name: 'بخش اصلی', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
      about: { name: 'درباره', icon: Users, color: 'bg-green-100 text-green-800' },
      services: { name: 'خدمات', icon: Settings, color: 'bg-purple-100 text-purple-800' },
      contact: { name: 'تماس', icon: Mail, color: 'bg-red-100 text-red-800' },
      newsletter: { name: 'خبرنامه', icon: Mail, color: 'bg-indigo-100 text-indigo-800' },
      footer: { name: 'فوتر', icon: Layout, color: 'bg-gray-100 text-gray-800' },
    };
    return sectionMap[sectionType as keyof typeof sectionMap] || { name: sectionType, icon: Layout, color: 'bg-gray-100 text-gray-800' };
  };

  // Calculate total sections
  const totalSections = design.pages.reduce((total, page) => total + page.sections.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">پیش‌نمایش طراحی</h2>
          <p className="text-muted-foreground">
            {design.pages.length} صفحه • {totalSections} بخش
          </p>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                دانلود
              </Button>
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                اشتراک‌گذاری
              </Button>
            )}
            {onViewLive && (
              <Button size="sm" onClick={onViewLive}>
                <ExternalLink className="w-4 h-4 mr-2" />
                مشاهده زنده
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pages Navigation */}
      {design.pages.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              صفحات سایت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {design.pages.map((page) => (
                <div
                  key={page.id}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    design.currentPageId === page.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{page.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {page.sections.length} بخش
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Design Preview */}
      {design.pages.map((page) => (
        <Card key={page.id} className={design.currentPageId === page.id ? '' : 'hidden'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {page.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {page.sections.length} بخش • ابعاد: {page.canvasDimensions.width}×{page.canvasDimensions.height}px
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Page Preview */}
            <div className="relative">
              <div 
                className="border-2 border-gray-200 rounded-lg bg-white mx-auto overflow-hidden shadow-lg"
                style={{
                  width: Math.min(page.canvasDimensions.width, 800),
                  maxWidth: '100%'
                }}
              >
                <ScrollArea className="max-h-[600px]">
                  <div className="p-4 space-y-4">
                    {page.sections.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Layout className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p>هیچ بخشی در این صفحه وجود ندارد</p>
                        </div>
                      </div>
                    ) : (
                      page.sections.map((section, index) => {
                        const sectionInfo = getSectionInfo(section.sectionType);
                        const Icon = sectionInfo.icon;
                        
                        return (
                          <div
                            key={section.id}
                            className="relative border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {/* Section Header */}
                            <div className="absolute top-2 right-2 z-10">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${sectionInfo.color}`}
                              >
                                <Icon className="w-3 h-3 mr-1" />
                                {sectionInfo.name}
                              </Badge>
                            </div>

                            {/* Section Number */}
                            <div className="absolute top-2 left-2 z-10">
                              <Badge variant="outline" className="text-xs">
                                {index + 1}
                              </Badge>
                            </div>

                            {/* Section Content */}
                            <div className="p-4 pt-12">
                              {renderSection(section)}
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
      ))}

      {/* Design Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{design.pages.length}</div>
              <div className="text-sm text-muted-foreground">تعداد صفحات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalSections}</div>
              <div className="text-sm text-muted-foreground">تعداد بخش‌ها</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(totalSections / design.pages.length * 10) / 10}
              </div>
              <div className="text-sm text-muted-foreground">میانگین بخش در هر صفحه</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignPreview; 