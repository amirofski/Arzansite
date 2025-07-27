import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Download, Share2, ExternalLink } from 'lucide-react';
import DesignPreview from '../wizard/DesignPreview';

interface OrderDesignPreviewProps {
  order: {
    id: string;
    title: string;
    description: string;
    status: string;
    price: number;
    created_at: string;
    profiles: {
      full_name: string;
      email: string;
    } | null;
  };
  designData?: {
    pages: any[];
    currentPageId: string;
  };
}

const OrderDesignPreview = ({ order, designData }: OrderDesignPreviewProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Mock design data if not provided
  const mockDesign = designData || {
    pages: [
      {
        id: 'main',
        name: 'صفحه اصلی',
        sections: [
          {
            id: 'header-1',
            sectionType: 'header',
            layoutId: 'header-1',
            order: 0,
            customData: {}
          },
          {
            id: 'hero-1',
            sectionType: 'hero',
            layoutId: 'hero-1',
            order: 1,
            customData: {}
          },
          {
            id: 'about-1',
            sectionType: 'about',
            layoutId: 'about-1',
            order: 2,
            customData: {}
          },
          {
            id: 'services-1',
            sectionType: 'services',
            layoutId: 'services-1',
            order: 3,
            customData: {}
          },
          {
            id: 'contact-1',
            sectionType: 'contact',
            layoutId: 'contact-1',
            order: 4,
            customData: {}
          },
          {
            id: 'footer-1',
            sectionType: 'footer',
            layoutId: 'footer-1',
            order: 5,
            customData: {}
          }
        ],
        canvasDimensions: { width: 1200, height: 800 }
      }
    ],
    currentPageId: 'main'
  };

  const handleDownload = () => {
    // Implementation for downloading design files
    console.log('Downloading design for order:', order.id);
  };

  const handleShare = () => {
    // Implementation for sharing design
    console.log('Sharing design for order:', order.id);
  };

  const handleViewLive = () => {
    // Implementation for viewing live site
    console.log('Viewing live site for order:', order.id);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{order.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                توسط {order.profiles?.full_name || 'کاربر ناشناس'}
              </p>
            </div>
            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
              {order.status === 'completed' ? 'تکمیل شده' : 'در حال انجام'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {mockDesign.pages.length} صفحه • {mockDesign.pages.reduce((total, page) => total + page.sections.length, 0)} بخش
              </div>
              <div className="text-lg font-bold">
                {order.price.toLocaleString()} تومان
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => setPreviewOpen(true)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                مشاهده طراحی
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش طراحی - {order.title}</DialogTitle>
          </DialogHeader>
          
          <DesignPreview
            design={mockDesign}
            showActions={true}
            onDownload={handleDownload}
            onShare={handleShare}
            onViewLive={handleViewLive}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderDesignPreview; 