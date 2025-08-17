import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  User, 
  Globe, 
  Palette, 
  Layers, 
  CreditCard, 
  Loader2, 
  Calculator,
  AlertCircle,
  LogIn,
  Shield
} from 'lucide-react';
import { calculateTotalPrice } from '@/lib/pricingUtils';
import { formatPriceWithUnit } from '@/lib/pricingUtils';
import { PRICING_CONFIG } from '@/lib/pricingUtils';
import { apiClient } from '@/lib/api-client';
import { DesignService } from '@/lib/designService';
import { mockApiClient } from '@/lib/wizardApiClient';

interface OrderSubmissionStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

interface WizardData {
  siteType: 'personal' | 'business' | '';
  modules: Array<{
    id: string;
    name: string;
    nameEn: string;
    complexity: number;
    customizations: {
      layout: string;
      colors: string;
      animations: string;
    };
  }>;
  websiteFramework?: {
    dynamicDesign?: {
      pages?: Array<{
        sections: Array<{
          id: string;
          sectionType: string;
          layoutId: string;
          order: number;
          customData?: Record<string, unknown>;
        }>;
      }>;
    };
  };
  branding?: {
    primaryColor?: string;
    fontFamily?: string;
    logo?: string;
  };
  pricing?: {
    additionalServices?: Record<string, boolean>;
    customizationLevel?: number[];
    rushDelivery?: boolean;
    totalPrice?: number;
  };
  paymentCycle?: 'monthly' | 'annual';
  autoRenewal?: boolean;
  userInfo?: {
    domain?: string;
    name?: string;
    email?: string;
    additionalDomains?: Array<{
      domain: string;
      extension: string;
      price: number;
      available: boolean;
    }>;
  };
}

const OrderSubmissionStep = ({ data: wizardData, updateData }: OrderSubmissionStepProps) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCycle, setPaymentCycle] = useState<'monthly' | 'annual'>('monthly');
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Check authentication status when component mounts
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated, authLoading]);

  // Calculate pricing based on current selections
  const pricingBreakdown = calculateTotalPrice({
    ...wizardData,
    additionalServices: wizardData.additionalServices || [],
    paymentCycle
  });

  const totalCost = paymentCycle === 'annual' ? pricingBreakdown.annualPrice : pricingBreakdown.monthlyPrice;

  const handlePaymentCycleChange = (value: 'monthly' | 'annual') => {
    setPaymentCycle(value);
    updateData({ paymentCycle: value });
  };

  const handleAutoRenewalChange = (checked: boolean) => {
    setAutoRenewal(checked);
    updateData({ autoRenewal: checked });
  };

  // Zarrin Pal payment integration
  const initiateZarrinPalPayment = async (orderData: any) => {
    try {
      // Call the Zarrin Pal API endpoint
      const response = await fetch('https://nest.arzansite.com/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify({
          ...orderData,
          payment_gateway: 'zarrinpal',
          callback_url: `${window.location.origin}/payment/callback`,
          return_url: `${window.location.origin}/payment/success`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Payment initiation failed: ${response.status}`);
      }

      const paymentData = await response.json();
      
      // Redirect to Zarrin Pal payment page
      if (paymentData.payment_url) {
        window.location.href = paymentData.payment_url;
      } else {
        throw new Error('Payment URL not received from Zarrin Pal');
      }

    } catch (error) {
      console.error('Zarrin Pal payment error:', error);
      throw error;
    }
  };

  const submitOrder = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      toast({
        title: "نیاز به ورود",
        description: "برای ادامه پرداخت، لطفاً ابتدا وارد حساب کاربری خود شوید.",
        variant: "destructive",
      });
      setShowAuthPrompt(true);
      return;
    }

    setIsProcessing(true);
    try {
      // First, create the order in our system
      let newOrder;
      try {
        // Format order data according to API interface
        const apiOrderData = {
          title: `وب‌سایت ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} - ${wizardData.userInfo?.domain || 'mywebsite'}.ir`,
          description: JSON.stringify({
            siteType: wizardData.siteType,
            websiteFramework: wizardData.websiteFramework,
            branding: wizardData.branding,
            additionalServices: wizardData.additionalServices,
            domains: {
              primary_domain: wizardData.userInfo?.domain || 'mywebsite.ir',
              additional_domains: wizardData.userInfo?.additionalDomains || []
            },
            pricing: {
              base_price: pricingBreakdown.basePrice,
              pages_cost: pricingBreakdown.pagesCost,
              sections_cost: pricingBreakdown.sectionsCost,
              additional_services_cost: pricingBreakdown.additionalServicesCost,
              total_price: totalCost,
              payment_cycle: paymentCycle,
              auto_renewal: autoRenewal,
              annual_discount: paymentCycle === 'annual' ? pricingBreakdown.annualDiscount : 0
            },
            paymentCycle,
            autoRenewal
          }),
          price: totalCost,
          comments: `دامنه: ${wizardData.userInfo?.domain || 'mywebsite'}.ir | دوره پرداخت: ${paymentCycle === 'annual' ? 'سالانه' : 'ماهانه'} | تمدید خودکار: ${autoRenewal ? 'بله' : 'خیر'}`,
          total_pages: wizardData.websiteFramework?.dynamicDesign?.pages?.length || 1,
          total_sections: wizardData.websiteFramework?.dynamicDesign?.pages?.reduce((total: number, page: any) => total + (page.sections?.length || 0), 0) || 0
        };

        newOrder = await apiClient.createOrder(apiOrderData);
      } catch (orderError) {
        console.error('Order creation error:', orderError);
        // Try using mock API as fallback
        newOrder = await mockApiClient.saveWizardProgress({
          sessionId: 'temp_' + Date.now(),
          siteType: wizardData.siteType,
          websiteFramework: wizardData.websiteFramework,
          branding: wizardData.branding,
          additionalServices: wizardData.additionalServices,
          domains: {
            primaryDomain: wizardData.userInfo?.domain || 'mywebsite.ir',
            additionalDomains: wizardData.userInfo?.additionalDomains || []
          },
          pricing: {
            basePrice: pricingBreakdown.basePrice,
            pagesCost: pricingBreakdown.pagesCost,
            sectionsCost: pricingBreakdown.sectionsCost,
            additionalServicesCost: pricingBreakdown.additionalServicesCost,
            totalPrice: totalCost,
            paymentCycle,
            autoRenewal,
            annualDiscount: paymentCycle === 'annual' ? pricingBreakdown.annualDiscount : 0
          }
        });
      }

      // Save design data if available
      if (wizardData.websiteFramework?.dynamicDesign) {
        try {
          await DesignService.saveDesign(
            newOrder.id,
            wizardData.websiteFramework.dynamicDesign,
            {
              siteType: wizardData.siteType,
              modules: wizardData.modules,
              branding: wizardData.branding,
              userInfo: wizardData.userInfo,
              pricing: wizardData.pricing
            }
          );
        } catch (designError) {
          console.warn('Design save warning:', designError);
          // Don't throw error for design issues, continue with order
        }
      }

      // Update user profile if needed
      if (wizardData.userInfo) {
        try {
          await apiClient.updateProfile({
            full_name: wizardData.userInfo.name,
            email: wizardData.userInfo.email
          });
        } catch (profileError) {
          console.warn('Profile update warning:', profileError);
          // Don't throw error for profile issues, continue with order
        }
      }

      // Show success message
      toast({
        title: "سفارش ثبت شد",
        description: "سفارش شما با موفقیت ثبت شد. در حال انتقال به درگاه پرداخت...",
        variant: "default",
      });

      // Initiate Zarrin Pal payment
      await initiateZarrinPalPayment({
        ...newOrder, // Use the newOrder object directly
        order_id: newOrder.id
      });

    } catch (error) {
      console.error('Order submission error:', error);
      
      let errorMessage = "متأسفانه خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.";
      
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || error.message.includes('Authentication failed')) {
          errorMessage = "جلسه شما منقضی شده است. لطفاً دوباره وارد شوید.";
          setShowAuthPrompt(true);
        } else if (error.message.includes('Payment')) {
          errorMessage = "خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطا در ثبت سفارش",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">تأیید و پرداخت سفارش</h2>
        <p className="text-muted-foreground">
          اطلاعات سفارش خود را بررسی کرده و روش پرداخت را انتخاب کنید
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            خلاصه سفارش
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">نوع وب‌سایت</h4>
                <p className="text-sm text-muted-foreground">
                  {wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-semibold">دامنه</h4>
                <p className="text-sm text-muted-foreground">
                  {wizardData.userInfo?.domain || 'mywebsite'}.ir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">تعداد صفحات</h4>
                <p className="text-sm text-muted-foreground">
                  {pricingBreakdown.pagesCount} صفحه
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">تعداد بخش‌ها</h4>
                <p className="text-sm text-muted-foreground">
                  {pricingBreakdown.totalSections} بخش
                </p>
              </div>
            </div>
          </div>

          {wizardData.additionalServices && Object.values(wizardData.additionalServices).some(Boolean) && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">خدمات اضافی انتخاب شده:</h4>
              <div className="flex flex-wrap gap-2">
                {wizardData.additionalServices.seoOptimization && (
                  <Badge variant="secondary">SEO</Badge>
                )}
                {wizardData.additionalServices.socialMediaIntegration && (
                  <Badge variant="secondary">شبکه‌های اجتماعی</Badge>
                )}
                {wizardData.additionalServices.analyticsSetup && (
                  <Badge variant="secondary">آنالیتیکس</Badge>
                )}
                {wizardData.additionalServices.backupService && (
                  <Badge variant="secondary">پشتیبان‌گیری</Badge>
                )}
                {wizardData.additionalServices.maintenancePlan && (
                  <Badge variant="secondary">نگهداری</Badge>
                )}
                {wizardData.additionalServices.rushDelivery && (
                  <Badge variant="secondary">تحویل فوری</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            گزینه‌های پرداخت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Cycle Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">دوره پرداخت</Label>
            <RadioGroup
              value={paymentCycle}
              onValueChange={handlePaymentCycleChange}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  <div className="text-sm font-medium">پرداخت ماهانه</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPriceWithUnit(pricingBreakdown.monthlyPrice)} در ماه
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="annual" id="annual" />
                <Label htmlFor="annual" className="cursor-pointer">
                  <div className="text-sm font-medium">پرداخت سالانه</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPriceWithUnit(pricingBreakdown.annualPrice)} در سال
                    <Badge variant="secondary" className="ml-2">10% تخفیف</Badge>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Auto-Renewal Option */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">تمدید خودکار</Label>
              <p className="text-xs text-muted-foreground">
                {paymentCycle === 'annual' 
                  ? 'صورتحساب سالانه به صورت خودکار ایجاد و ارسال می‌شود'
                  : 'صورتحساب ماهانه به صورت خودکار ایجاد و ارسال می‌شود'
                }
              </p>
            </div>
            <Switch
              checked={autoRenewal}
              onCheckedChange={handleAutoRenewalChange}
            />
          </div>

          {/* Final Price Display */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">قیمت نهایی</h3>
                <p className="text-sm text-muted-foreground">
                  {paymentCycle === 'annual' ? 'پرداخت سالانه' : 'پرداخت ماهانه'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatPriceWithUnit(totalCost)}
                </div>
                {paymentCycle === 'annual' && (
                  <div className="text-sm text-green-600">
                    صرفه‌جویی: {formatPriceWithUnit(pricingBreakdown.annualDiscount)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <div className="flex justify-center">
        <Button
          onClick={submitOrder}
          disabled={isProcessing || !user}
          size="lg"
          className="btn-gradient px-8 py-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              در حال پردازش...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              پرداخت و تکمیل سفارش
            </>
          )}
        </Button>
      </div>

      {/* Payment Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">اطلاعات پرداخت</p>
              <p>پرداخت شما از طریق درگاه امن زرین‌پال انجام می‌شود. تمام اطلاعات محافظت شده و امن هستند.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showAuthPrompt && (
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            برای ادامه پرداخت، لطفاً ابتدا وارد حساب کاربری خود شوید.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="btn-gradient mt-4"
          >
            <LogIn className="w-4 h-4 mr-2" />
            ورود به حساب کاربری
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderSubmissionStep;