import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { calculateTotalPrice, formatPriceWithUnit } from '@/lib/pricingUtils';
import { apiClient } from '@/lib/api-client';
import { DesignService } from '@/lib/designService';
import { 
  CreditCard, 
  Smartphone, 
  Check, 
  Clock, 
  Shield, 
  Zap,
  User,
  Mail,
  Globe,
  Loader2,
  Calculator
} from 'lucide-react';

interface OrderSubmissionStepProps {
  data: any;
  updateData: (data: any) => void;
}

const OrderSubmissionStep = ({ data }: OrderSubmissionStepProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCycle, setPaymentCycle] = useState<'monthly' | 'annual'>('monthly');
  const [autoRenewal, setAutoRenewal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use centralized pricing calculation with payment cycle
  const pricingBreakdown = calculateTotalPrice({
    ...data,
    paymentCycle
  });
  
  const totalCost = paymentCycle === 'annual' ? pricingBreakdown.annualPrice : pricingBreakdown.monthlyPrice;

  const submitOrder = async () => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای ثبت سفارش باید وارد شوید",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    try {
      // First create the order in database
      const orderData = {
        user_id: user.id,
        title: `وب‌سایت ${data.siteType === 'personal' ? 'شخصی' : 'تجاری'} - ${data.userInfo?.domain || 'mywebsite'}`,
        description: JSON.stringify({
          siteType: data.siteType,
          modules: data.modules,
          branding: data.branding,
          userInfo: data.userInfo,
          pricing: data.pricing,
          additionalServices: data.additionalServices,
          paymentCycle,
          autoRenewal,
          moduleLayout: data.modules?.map((m: any, index: number) => ({
            ...m,
            position: index
          }))
        }),
        price: totalCost,
        status: 'pending',
        payment_status: 'pending',
        comments: `دامنه: ${data.userInfo?.domain || 'mywebsite'}.ir | دوره پرداخت: ${paymentCycle === 'annual' ? 'سالانه' : 'ماهانه'} | تمدید خودکار: ${autoRenewal ? 'بله' : 'خیر'}`
      };

      const newOrder = await apiClient.createOrder(orderData);

      // Save design data if available
      if (data.websiteFramework?.dynamicDesign) {
        try {
          await DesignService.saveDesign(
            newOrder.id,
            data.websiteFramework.dynamicDesign,
            {
              siteType: data.siteType,
              modules: data.modules,
              branding: data.branding,
              userInfo: data.userInfo,
              pricing: data.pricing,
              additionalServices: data.additionalServices,
              paymentCycle,
              autoRenewal
            }
          );
        } catch (designError) {
          console.warn('Design save warning:', designError);
          // Don't throw error for design issues, continue with order
        }
      }

      // Also create/update user profile if needed
      if (data.userInfo) {
        try {
          await apiClient.updateProfile({
            full_name: data.userInfo.name,
            email: data.userInfo.email,
            domain: data.userInfo.domain
          });
        } catch (profileError) {
          console.warn('Profile update warning:', profileError);
          // Don't throw error for profile issues, continue with order
        }
      }

      // Redirect to payment page or show success
      toast({
        title: "سفارش ثبت شد",
        description: "سفارش شما با موفقیت ثبت شد. در حال انتقال به صفحه پرداخت...",
        variant: "default",
      });

      // Here you would redirect to Zarrin Pal payment gateway
      // For now, just show success
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Order submission error:', error);
      toast({
        title: "خطا در ثبت سفارش",
        description: "متأسفانه خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.",
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
                  {data.siteType === 'personal' ? 'شخصی' : 'تجاری'}
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
                  {data.userInfo?.domain || 'mywebsite'}.ir
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

          {data.additionalServices && Object.values(data.additionalServices).some(Boolean) && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">خدمات اضافی انتخاب شده:</h4>
              <div className="flex flex-wrap gap-2">
                {data.additionalServices.seoOptimization && (
                  <Badge variant="secondary">SEO</Badge>
                )}
                {data.additionalServices.socialMediaIntegration && (
                  <Badge variant="secondary">شبکه‌های اجتماعی</Badge>
                )}
                {data.additionalServices.analyticsSetup && (
                  <Badge variant="secondary">آنالیتیکس</Badge>
                )}
                {data.additionalServices.backupService && (
                  <Badge variant="secondary">پشتیبان‌گیری</Badge>
                )}
                {data.additionalServices.maintenancePlan && (
                  <Badge variant="secondary">نگهداری</Badge>
                )}
                {data.additionalServices.rushDelivery && (
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
              onValueChange={(value) => setPaymentCycle(value as 'monthly' | 'annual')}
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
              onCheckedChange={setAutoRenewal}
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
    </div>
  );
};

export default OrderSubmissionStep;