import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Layers, FileText, Palette, Settings, Loader2 } from 'lucide-react';
import { DesignService, type DynamicDesign } from '@/lib/designService';
import { useToast } from '@/hooks/use-toast';
import { formatAmount } from '@/lib/currencyUtils';

interface OrderDesignPreviewProps {
  orderId: string;
  orderTitle: string;
  orderPrice: number;
  paymentStatus: string;
  isAdmin?: boolean;
  onStatusUpdate?: () => void;
  initialDesign?: DynamicDesign | null; // optional to skip API calls
}

const OrderDesignPreview = ({ 
  orderId, 
  orderTitle, 
  orderPrice, 
  paymentStatus, 
  isAdmin = false,
  onStatusUpdate,
  initialDesign,
}: OrderDesignPreviewProps) => {
  const [design, setDesign] = useState<DynamicDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  const loadDesignData = useCallback(async () => {
    try {
      setLoading(true);
      // If provided, use the initial design and skip API
      if (initialDesign) {
        setDesign(initialDesign);
        return;
      }
      const designData = await DesignService.loadDesign(orderId);
      setDesign(designData);
    } catch (error) {
      // Suppress noisy errors if design endpoints are not available
      console.warn('Design preview fallback:', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [orderId, initialDesign]);

  useEffect(() => {
    loadDesignData();
  }, [loadDesignData]);

  const renderDesignPreview = () => {
    if (!design) {
      return (
        <div className="text-center py-8">
          <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">هیچ طراحی برای این سفارش یافت نشد</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {design.pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {page.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>ابعاد بوم:</span>
                  <Badge variant="outline">
                    {page.canvasDimensions.width} × {page.canvasDimensions.height}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">بخش‌ها ({page.sections.length})</h4>
                  {page.sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">هیچ بخشی اضافه نشده</p>
                  ) : (
                    <div className="grid gap-2">
                      {page.sections.map((section, index) => (
                        <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Layers className="w-4 h-4" />
                          <span className="font-medium">{section.sectionType}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPreviewOpen(true)}
        className="flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        مشاهده طراحی
      </Button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              پیش‌نمایش طراحی - {orderTitle}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="design" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="design">طراحی</TabsTrigger>
              <TabsTrigger value="payment">پرداخت</TabsTrigger>
            </TabsList>

            <div className="mt-4 h-[calc(90vh-200px)]">
              <TabsContent value="design" className="h-full">
                <ScrollArea className="h-full">
                  {renderDesignPreview()}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="payment" className="h-full">
                <ScrollArea className="h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        اطلاعات پرداخت
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">وضعیت پرداخت</label>
                          <div className="mt-1">
                            <Badge className={paymentStatus === 'paid' || paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                              {paymentStatus === 'paid' || paymentStatus === 'completed' ? 'پرداخت شده' : paymentStatus === 'pending' ? 'در انتظار پرداخت' : paymentStatus === 'failed' ? 'ناموفق' : 'لغو شده'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">مبلغ</label>
                          <p className="mt-1 font-medium">{formatAmount(orderPrice, 'RIAL')}</p>
                        </div>
                      </div>

                      {!isAdmin && paymentStatus === 'pending' && (
                        <Button className="w-full">
                          پرداخت سفارش
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderDesignPreview; 