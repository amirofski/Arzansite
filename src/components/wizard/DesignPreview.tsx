import React, { useState, useEffect } from 'react';
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
  Share2,
  Image as ImageIcon,
  ShoppingBag,
  BarChart3,
  Monitor
} from 'lucide-react';
import { getAdjacentImage, SECTION_NAMES, getSectionImages } from '@/lib/imageLoader';
import LazyImage from '@/components/ui/lazy-image';

// Define SkeletonTemplate interface
interface SkeletonTemplate {
  id: string;
  name: string;
  previewImage: string;
  component?: React.ComponentType<any>;
}

// Hook to load templates
const useTemplateLoader = () => {
  const [templates, setTemplates] = useState<Record<string, SkeletonTemplate[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTemplatesByCategory = async (category: string): Promise<SkeletonTemplate[]> => {
    if (templates[category]) {
      return templates[category];
    }

    try {
      setLoading(true);
      const images = await getSectionImages(category);

      const skeletonTemplates: SkeletonTemplate[] = images.map(img => ({
        id: img.id,
        name: img.name,
        previewImage: img.path,
        component: undefined // We'll use previewImage instead
      }));

      setTemplates(prev => ({
        ...prev,
        [category]: skeletonTemplates
      }));

      return skeletonTemplates;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { templates, loading, error, getTemplatesByCategory };
};

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
  design: { pages: PageDesign[]; currentPageId: string };
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
  const { templates } = useTemplateLoader();
  const [imageTemplates, setImageTemplates] = useState<Record<string, SkeletonTemplate[]>>({});
  const [fullPreview, setFullPreview] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Load image templates only when needed (lazy loading)
  const loadImageTemplatesForCategory = async (category: string) => {
    // Check if already loaded
    if (imageTemplates[category]) {
      return imageTemplates[category];
    }

    try {
      console.log(`🔄 Loading templates for ${category} in preview...`);
      const temps = await getTemplatesByCategory(category);

      setImageTemplates(prev => ({
        ...prev,
        [category]: temps
      }));

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

  // Generate full website preview
  const generateFullPreview = async () => {
    if (!design || generatingPreview) return;
    
    setGeneratingPreview(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setGeneratingPreview(false);
        return;
      }
      
      // Calculate total height and collect images
      let totalHeight = 0;
      const sectionImages: HTMLImageElement[] = [];
      const imagePromises: Promise<void>[] = [];
      
      for (const page of design.pages) {
        for (const section of page.sections) {
          const templates = imageTemplates[section.sectionType] || [];
          const template = templates.find(t => t.id === section.layoutId);
          
          if (template?.previewImage) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const loadPromise = new Promise<void>((resolve, reject) => {
              img.onload = () => {
                sectionImages.push(img);
                totalHeight += img.height;
                resolve();
              };
              img.onerror = reject;
            });
            
            imagePromises.push(loadPromise);
            img.src = template.previewImage;
          }
        }
      }
      
      // Wait for all images to load
      await Promise.all(imagePromises);
      
      if (sectionImages.length === 0) {
        setGeneratingPreview(false);
        return;
      }
      
      // Set canvas dimensions
      const maxWidth = 1200;
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      
      // Draw sections
      let currentY = 0;
      for (const img of sectionImages) {
        const scale = maxWidth / img.width;
        const scaledHeight = img.height * scale;
        
        ctx.drawImage(img, 0, currentY, maxWidth, scaledHeight);
        currentY += scaledHeight;
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      setFullPreview(dataUrl);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Auto-generate preview when design changes
  useEffect(() => {
    if (design && Object.keys(imageTemplates).length > 0) {
      generateFullPreview();
    }
  }, [design, imageTemplates]);

  // Render section component using image
  const renderSection = (section: PageSection) => {
    // 1) Prefer explicit customData images when present
    const customImages = Array.isArray(section.customData?.images)
      ? section.customData!.images
      : (typeof (section.customData as any)?.images === 'string' ? [(section.customData as any).images] : []);

    if (customImages && customImages.length > 0) {
      return (
        <div className="grid gap-3">
          {customImages.map((img, idx) => {
            const src = resolveImageSrc(String(img));
            if (!src) return null;
            return (
              <LazyImage
                key={`${section.id}-${idx}`}
                src={src}
                alt={`${section.sectionType}-${section.layoutId}-${idx}`}
                className="w-full h-auto rounded-lg"
                fallback="/placeholder.svg"
              />
            );
          })}
        </div>
      );
    }

    // 2) If no custom images, derive a direct asset path by layoutId under public/designs
    try {
      const layout = String(section.layoutId || '1');
      const parts = layout.split('-');
      const index = parts.length > 1 ? parts[1] : layout;
      const direct = `/designs/${section.sectionType}/${index}.png`;
      return (
        <LazyImage
          src={direct}
          alt={`${section.sectionType}-${layout}`}
          className="w-full h-auto rounded-lg"
          fallback="/placeholder.svg"
        />
      );
    } catch {}

    // 3) Otherwise use template preview images if available
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
          onLoad={() => console.log(`✅ Preview image loaded: ${template.previewImage}`)}
          onError={(error) => console.error(`❌ Failed to load preview image: ${template.previewImage}`, error)}
        />
      );
    }

    // 4) Fallback to component if no image
    const LayoutComponent = template.component;
    return <LayoutComponent className="w-full" />;
  };

  // Get section info - dynamically generated from SECTION_NAMES
  const getSectionInfo = (sectionType: string) => {
    // Map section types to appropriate icons and colors
    const getIcon = (type: string) => {
      switch (type) {
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
        case 'blog_posts':
        case 'content':
        case 'forms':
        case 'accordion':
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

    const getColor = (type: string) => {
      switch (type) {
        case 'headers':
          return 'bg-blue-100 text-blue-800';
        case 'hero':
          return 'bg-yellow-100 text-yellow-800';
        case 'about':
          return 'bg-green-100 text-green-800';
        case 'services':
          return 'bg-purple-100 text-purple-800';
        case 'contact':
          return 'bg-red-100 text-red-800';
        case 'newsletter':
          return 'bg-indigo-100 text-indigo-800';
        case 'footer':
          return 'bg-gray-100 text-gray-800';
        case 'features':
          return 'bg-emerald-100 text-emerald-800';
        case 'gallery':
          return 'bg-pink-100 text-pink-800';
        case 'testimonials':
          return 'bg-amber-100 text-amber-800';
        case 'team':
          return 'bg-cyan-100 text-cyan-800';
        case 'pricing':
          return 'bg-orange-100 text-orange-800';
        case 'faqs':
          return 'bg-lime-100 text-lime-800';
        case 'blog_posts':
          return 'bg-violet-100 text-violet-800';
        case 'call_to_actions':
          return 'bg-rose-100 text-rose-800';
        case 'content':
          return 'bg-slate-100 text-slate-800';
        case 'forms':
          return 'bg-teal-100 text-teal-800';
        case 'accordion':
          return 'bg-fuchsia-100 text-fuchsia-800';
        case 'tables':
          return 'bg-sky-100 text-sky-800';
        case 'stats':
          return 'bg-amber-100 text-amber-800';
        case 'socials':
          return 'bg-indigo-100 text-indigo-800';
        case 'logos':
          return 'bg-purple-100 text-purple-800';
        case 'left_right_sections':
          return 'bg-gray-100 text-gray-800';
        case 'full_page':
          return 'bg-neutral-100 text-neutral-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return {
      name: SECTION_NAMES[sectionType] || sectionType,
      icon: getIcon(sectionType),
      color: getColor(sectionType)
    };
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
              <Button onClick={onDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                دانلود
              </Button>
            )}
            {onShare && (
              <Button onClick={onShare} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                اشتراک‌گذاری
              </Button>
            )}
            {onViewLive && (
              <Button onClick={onViewLive}>
                <ExternalLink className="w-4 h-4 mr-2" />
                مشاهده زنده
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Full Website Preview */}
      {fullPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              پیش‌نمایش کامل سایت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                src={fullPreview}
                alt="Full website preview"
                className="w-full h-auto border rounded-lg shadow-lg"
              />
              {generatingPreview && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">در حال تولید پیش‌نمایش...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Pages */}
      {design.pages.map((page, pageIndex) => (
        <Card key={page.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {page.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {page.sections.length} بخش • {page.canvasDimensions.width}×{page.canvasDimensions.height}px
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {page.sections.length === 0 ? (
                <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                  هیچ بخشی در این صفحه وجود ندارد
                </div>
              ) : (
                page.sections.map((section, index) => {
                  const sectionInfo = getSectionInfo(section.sectionType);
                  const templates = imageTemplates[section.sectionType] || [];
                  const currentTemplate = templates.find(t => t.id === section.layoutId);
                  
                  return (
                    <div
                      key={section.id}
                      className="relative border rounded-lg p-4 bg-gray-50"
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={sectionInfo.color}>
                            {sectionInfo.icon && <sectionInfo.icon className="w-3 h-3" />}
                            {sectionInfo.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            بخش {index + 1}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {currentTemplate?.name || 'قالب پیش‌فرض'}
                        </Badge>
                      </div>

                      {/* Section Content */}
                      <div className="relative">
                        {renderSection(section)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Regenerate Preview Button */}
      {!fullPreview && !generatingPreview && (
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={generateFullPreview} 
              className="w-full"
              disabled={generatingPreview}
            >
              {generatingPreview ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  در حال تولید پیش‌نمایش...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  تولید پیش‌نمایش کامل
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesignPreview; 