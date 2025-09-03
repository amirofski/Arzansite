import React, { useState } from 'react';
import { wizardService } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * Example component demonstrating how to use the wizard service
 * to complete orders according to the backend guide
 */
export const WizardOrderExample: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    title: 'وب‌سایت شخصی - مثال',
    description: 'پروژه نمونه',
    priceTomans: 1000000,
    comments: 'پروژه نمونه - دامنه: example.ir',
    site_type: 'personal' as 'personal' | 'business'
  });

  const handleCompleteOrder = async () => {
    setLoading(true);
    try {
      // Create the request according to the backend guide
      const request = {
        session_id: `wizard_${Date.now()}`, // Unique session ID
        order: {
          title: orderData.title,
          description: orderData.description,
          priceTomans: orderData.priceTomans,
          comments: orderData.comments,
          site_type: orderData.site_type
        },
        design_snapshot: {
          websiteFramework: {
            dynamicDesign: {
              pages: [
                {
                  id: 'main',
                  name: 'صفحه اصلی',
                  sections: [
                    {
                      id: 'header-1',
                      section_type: 'headers',
                      layout_id: 'headers-1',
                      order: 0,
                      custom_data: {}
                    },
                    {
                      id: 'footer-1',
                      section_type: 'footer',
                      layout_id: 'footer-1',
                      order: 1,
                      custom_data: {}
                    }
                  ],
                  canvas_dimensions: {
                    width: 1200,
                    height: 800
                  }
                }
              ],
              current_page_id: 'main'
            }
          },
          branding: {
            primaryColor: '#8B5CF6',
            fontFamily: 'vazir',
            logo: ''
          },
          additionalServices: {
            socialMediaIntegration: true,
            seoOptimization: true,
            analyticsSetup: true,
            maintenancePlan: true,
            rushDelivery: false
          },
          domains: {
            primary_domain: 'example',
            additional_domains: []
          },
          pricing: {
            additionalServices: {
              socialMediaIntegration: true,
              seoOptimization: true,
              analyticsSetup: true,
              maintenancePlan: true,
              rushDelivery: false
            },
            customizationLevel: [3],
            rushDelivery: false,
            totalPrice: orderData.priceTomans
          },
          paymentOptions: {}
        }
      };

      console.log('Sending wizard order request:', request);

      const response = await wizardService.completeOrder(request);

      if (response.success) {
        toast({
          title: 'سفارش با موفقیت ایجاد شد',
          description: `شناسه سفارش: ${response.order_id}`,
          variant: 'default'
        });

        console.log('Order created successfully:', {
          orderId: response.order_id,
          invoiceId: response.invoiceId,
          message: response.message,
          order: response.order,
          invoice: response.invoice
        });
      } else {
        throw new Error('Order creation failed');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'خطا در ایجاد سفارش',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>مثال ایجاد سفارش ویزارد</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">عنوان وب‌سایت</Label>
          <Input
            id="title"
            value={orderData.title}
            onChange={(e) => setOrderData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="عنوان وب‌سایت"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">توضیحات</Label>
          <Textarea
            id="description"
            value={orderData.description}
            onChange={(e) => setOrderData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="توضیحات پروژه"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">قیمت (تومان)</Label>
          <Input
            id="price"
            type="number"
            value={orderData.priceTomans}
            onChange={(e) => setOrderData(prev => ({ ...prev, priceTomans: parseInt(e.target.value) || 0 }))}
            placeholder="1000000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">توضیحات اضافی</Label>
          <Textarea
            id="comments"
            value={orderData.comments}
            onChange={(e) => setOrderData(prev => ({ ...prev, comments: e.target.value }))}
            placeholder="توضیحات اضافی"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site_type">نوع وب‌سایت</Label>
          <select
            id="site_type"
            value={orderData.site_type}
            onChange={(e) => setOrderData(prev => ({ ...prev, site_type: e.target.value as 'personal' | 'business' }))}
            className="w-full p-2 border rounded-md"
          >
            <option value="personal">شخصی</option>
            <option value="business">تجاری</option>
          </select>
        </div>

        <Button
          onClick={handleCompleteOrder}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'در حال ایجاد سفارش...' : 'ایجاد سفارش'}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>این مثال نشان می‌دهد چگونه از سرویس ویزارد برای ایجاد سفارش استفاده کنید.</p>
          <p>بر اساس راهنمای بک‌اند، درخواست به <code>/api/wizard/complete-order</code> ارسال می‌شود.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WizardOrderExample;
