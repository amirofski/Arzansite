import React, { useState } from 'react';
import { ordersService, paymentService } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, CreditCard, Clock, CheckCircle } from 'lucide-react';

interface WizardOrderManagerProps {
  sessionId: string;
  wizardData: {
    siteType: 'personal' | 'business' | '';
    websiteFramework?: {
      dynamicDesign?: {
        pages: Array<{
          id: string;
          name: string;
          sections: Array<{
            id: string;
            sectionType: string;
            layoutId: string;
            order: number;
            customData?: Record<string, unknown>;
          }>;
          canvasDimensions: {
            width: number;
            height: number;
          };
        }>;
        currentPageId: string;
      };
    };
    branding: {
      primaryColor: string;
      fontFamily: string;
      logo: string;
    };
    pricing: {
      additionalServices: Record<string, boolean>;
      additionalServicesList?: string[];
      customizationLevel: number[];
      rushDelivery: boolean;
      totalPrice: number;
    };
    userInfo: {
      domain: string;
      domainExtension?: string;
    };
  };
  onOrderComplete?: (orderId: string) => void;
  onOrderSaved?: (orderId: string) => void;
}

/**
 * Enhanced wizard order manager component that supports both immediate completion
 * and save for later functionality according to the backend guide
 */
export const WizardOrderManager: React.FC<WizardOrderManagerProps> = ({
  sessionId,
  wizardData,
  onOrderComplete,
  onOrderSaved
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    title: `وب‌سایت ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} - ${wizardData.userInfo.domain}`,
    description: `پروژه وب‌سایت ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} با دامنه ${wizardData.userInfo.domain}`,
    priceTomans: wizardData.pricing.totalPrice,
    comments: `پروژه ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} - دامنه: ${wizardData.userInfo.domain}${wizardData.userInfo.domainExtension ? '.' + wizardData.userInfo.domainExtension : ''}`,
    site_type: wizardData.siteType as 'personal' | 'business'
  });

  const handleCompleteOrder = async () => {
    setLoading(true);
    try {
      // Require token for protected endpoints
      let token = tokenManager.getAccessToken();
      if (!token) {
        tokenManager.forceRefreshFromStorage();
        token = tokenManager.getAccessToken();
        if (!token) {
          toast({ title: 'لطفاً ابتدا وارد شوید', variant: 'destructive' });
          return;
        }
      }

      // Build wizard data snapshot (used in order metadata)
      const wizardDataPayload = {
        websiteFramework: wizardData.websiteFramework,
        branding: wizardData.branding,
        additionalServices: wizardData.pricing.additionalServices,
        additionalServicesList: wizardData.pricing.additionalServicesList || [],
        domains: {
          primary_domain: wizardData.userInfo.domain,
          additional_domains: [] as string[],
        },
        pricing: {
          ...wizardData.pricing,
        },
      } as Record<string, unknown>;

      // Create order via /orders
      const order = await ordersService.createOrderFromWizard({
        sessionId: sessionId,
        order: {
          title: orderData.title,
          description: orderData.description,
          totalAmountTomans: orderData.priceTomans,
          comments: orderData.comments,
          siteType: orderData.site_type,
        },
        wizardData: wizardDataPayload,
        status: 'pending',
        paymentStatus: 'pending',
      });

      if (!order || !order.id) {
        throw new Error('ایجاد سفارش ناموفق بود');
      }

      // Persist payment info onto the order (optional fields)
      try {
        await ordersService.updateOrder(order.id, {
          paymentStatus: 'pending',
          paymentGateway: 'zarinpal',
          callbackUrl: `${window.location.origin}/payment/callback`,
          returnUrl: `${window.location.origin}/dashboard`,
        });
      } catch {}

      // Request payment via /payments/request
      const payment = await paymentService.requestPayment({
        amount: orderData.priceTomans || 0,
        description: `پرداخت سفارش ${order.id}`,
        orderId: order.id,
        paymentMethod: 'zarinpal',
        callbackUrl: `${window.location.origin}/payment/callback`,
        returnUrl: `${window.location.origin}/dashboard`,
      });

      if ((payment as any)?.paymentUrl) {
        window.location.href = (payment as any).paymentUrl as string;
        return;
      }

      throw new Error('آدرس پرداخت نامعتبر است');
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

  const handleSaveForLater = async () => {
    setLoading(true);
    try {
      // Require token for protected endpoints
      let token = tokenManager.getAccessToken();
      if (!token) {
        tokenManager.forceRefreshFromStorage();
        token = tokenManager.getAccessToken();
        if (!token) {
          toast({ title: 'لطفاً ابتدا وارد شوید', variant: 'destructive' });
          return;
        }
      }
      // Create order via /orders with pending payment (save for later)
      const wizardDataPayload = {
        websiteFramework: wizardData.websiteFramework,
        branding: wizardData.branding,
        additionalServices: wizardData.pricing.additionalServices,
        additionalServicesList: wizardData.pricing.additionalServicesList || [],
        domains: {
          primary_domain: wizardData.userInfo.domain,
          additional_domains: [] as string[],
        },
        pricing: {
          ...wizardData.pricing,
        },
      } as Record<string, unknown>;

      const order = await ordersService.createOrderFromWizard({
        sessionId: sessionId,
        order: {
          title: orderData.title,
          description: orderData.description,
          totalAmountTomans: orderData.priceTomans,
          comments: orderData.comments,
          siteType: orderData.site_type,
        },
        wizardData: wizardDataPayload,
        status: 'pending',
        paymentStatus: 'pending',
      });

      if (order && order.id) {
        try {
          localStorage.removeItem(`wizard_progress_${sessionId}`);
          localStorage.removeItem('wizard_session_id');
        } catch (e) {
          // ignore
        }
        toast({
          title: 'سفارش برای بعد ذخیره شد',
          description: `شناسه سفارش: ${order.id}`,
          variant: 'default'
        });

        onOrderSaved?.(order.id);
      } else {
        throw new Error('Failed to save order for later');
      }
    } catch (error) {
      console.error('Error saving order for later:', error);
      toast({
        title: 'خطا در ذخیره سفارش',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl">تکمیل سفارش ویزارد</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">خلاصه سفارش</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">نوع وب‌سایت</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={wizardData.siteType === 'personal' ? 'default' : 'secondary'}>
                  {wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">دامنه</Label>
              <div className="font-mono text-sm mt-1">
                {wizardData.userInfo.domain}
                {wizardData.userInfo.domainExtension && `.${wizardData.userInfo.domainExtension}`}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">قیمت کل</Label>
              <div className="text-lg font-bold text-primary mt-1">
                {wizardData.pricing.totalPrice.toLocaleString()} تومان
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">تعداد صفحات</Label>
              <div className="text-sm mt-1">
                {wizardData.websiteFramework?.dynamicDesign?.pages?.length || 0} صفحه
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Form */}
        <div className="space-y-4">
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
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">توضیحات اضافی</Label>
            <Textarea
              id="comments"
              value={orderData.comments}
              onChange={(e) => setOrderData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="توضیحات اضافی"
              rows={2}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCompleteOrder}
            disabled={loading}
            className="flex-1 flex items-center gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>در حال ایجاد سفارش...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>تکمیل سفارش و پرداخت</span>
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSaveForLater}
            disabled={loading}
            variant="outline"
            className="flex-1 flex items-center gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره برای بعد</span>
              </>
            )}
          </Button>
        </div>

        {/* Information */}
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>سفارش شما با موفقیت ثبت خواهد شد</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>می‌توانید سفارش را برای پرداخت بعدی ذخیره کنید</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <span>پرداخت از طریق کیف پول یا درگاه پرداخت</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WizardOrderManager;
