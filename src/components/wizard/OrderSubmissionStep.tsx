import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { calculateTotalPrice, formatPrice } from '@/lib/pricingUtils';
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
  Globe
} from 'lucide-react';

interface OrderSubmissionStepProps {
  data: any;
  updateData: (data: any) => void;
}

const OrderSubmissionStep = ({ data }: OrderSubmissionStepProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use centralized pricing calculation
  const pricingBreakdown = calculateTotalPrice(data);
  const totalCost = pricingBreakdown.totalPrice;

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
          moduleLayout: data.modules?.map((m: any, index: number) => ({
            ...m,
            position: index
          }))
        }),
        price: totalCost,
        status: 'pending',
        payment_status: 'pending',
        comments: `دامنه: ${data.userInfo?.domain || 'mywebsite'}.ir`
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
              pricing: data.pricing
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
          } as any);
        } catch (e) {
          console.warn('Profile update warning:', e);
        }
      }

      // Now initiate Zarinpal payment
      const paymentRequest = {
        action: 'request',
        amount: Math.floor(totalCost / 10), // Convert from Rials to Tomans
        description: `پرداخت سفارش وب‌سایت - ${data.userInfo?.domain || 'mywebsite'}`,
        orderId: newOrder.id
      };

      console.log('Payment request data:', paymentRequest);

      const paymentRes = await apiClient.requestPayment({
        amount: paymentRequest.amount,
        description: paymentRequest.description,
        orderId: paymentRequest.orderId,
      });

      if (paymentRes?.paymentUrl) {
        // Redirect to Zarinpal payment page
        window.location.href = paymentRes.paymentUrl;
      } else {
        throw new Error('Failed to create payment request');
      }

    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: "خطا در ثبت سفارش",
        description: error.message || "مشکلی در ثبت سفارش پیش آمد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  

  const orderSummary = [
    {
      title: 'نوع وب‌سایت',
      value: data.siteType === 'personal' ? 'شخصی' : 'تجاری',
      icon: '🎯'
    },
    {
      title: 'تعداد ماژول‌ها',
      value: `${data.modules?.length || 0} ماژول`,
      icon: '📦'
    },
    {
      title: 'رنگ اصلی',
      value: data.branding?.primaryColor || '#8B5CF6',
      icon: '🎨',
      isColor: true
    },
    {
      title: 'فونت',
      value: data.branding?.fontFamily || 'vazir',
      icon: '📝'
    },
    {
      title: 'لوگو',
      value: data.branding?.logo ? 'آپلود شده' : 'ندارد',
      icon: '🖼️'
    },
    {
      title: 'دامنه',
      value: `${data.userInfo?.domain || 'mywebsite'}.ir`,
      icon: '🌐'
    }
  ];

  const paymentMethods = [
    {
      id: 'zarinpal',
      name: 'زرین‌پال',
      description: 'پرداخت امن با کارت‌های بانکی ایرانی',
      icon: CreditCard,
      recommended: true
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">تکمیل سفارش و پرداخت</h2>
        <p className="text-muted-foreground">
          مرور نهایی سفارش و ثبت در سیستم
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderSummary.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isColor ? (
                        <>
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: item.value }}
                          />
                          <span className="text-sm">{item.value}</span>
                        </>
                      ) : (
                        <span className="font-medium">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Modules */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>ماژول‌های انتخاب شده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.modules?.map((module: any, index: number) => (
                  <div key={module.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{module.name}</div>
                      <div className="text-xs text-muted-foreground">{module.nameEn}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      پیچیدگی: {module.complexity}/5
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                اطلاعات مشتری
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>نام:</span>
                  <span className="font-medium">{data.userInfo?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>ایمیل:</span>
                  <span className="font-medium">{data.userInfo?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>دامنه:</span>
                  <span className="font-medium">{data.userInfo?.domain}.ir</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="space-y-6">
          {/* Cost Breakdown */}
          <Card className="card-modern sticky top-4">
            <CardHeader>
              <CardTitle>محاسبه هزینه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>هزینه پایه</span>
                  <span>{formatPrice(pricingBreakdown.basePrice)} تومان</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ماژول‌ها و سفارشی‌سازی</span>
                  <span>{formatPrice(pricingBreakdown.modulesPrice)} تومان</span>
                </div>
                {pricingBreakdown.packagePrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>پکیج انتخابی</span>
                    <span>{formatPrice(pricingBreakdown.packagePrice)} تومان</span>
                  </div>
                )}
                {pricingBreakdown.additionalServicesPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>خدمات اضافی</span>
                    <span>{formatPrice(pricingBreakdown.additionalServicesPrice)} تومان</span>
                  </div>
                )}
                {pricingBreakdown.rushDeliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-warning">
                    <span>تحویل فوری (30%)</span>
                    <span>+{formatPrice(pricingBreakdown.rushDeliveryFee)} تومان</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>مجموع:</span>
                <span>{formatPrice(totalCost)} تومان</span>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 text-success text-sm">
                  <Check className="w-4 h-4" />
                  <span>شامل هاستینگ رایگان برای 1 سال</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Order Button */}
          <Button
            onClick={submitOrder}
            disabled={isProcessing}
            className="w-full btn-gradient text-lg py-6"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال ثبت سفارش...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                پرداخت امن {formatPrice(totalCost)} تومان
              </div>
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-success mb-1">ثبت امن</p>
              <p className="text-muted-foreground">
                اطلاعات شما به صورت امن در سیستم ذخیره می‌شود
              </p>
            </div>
          </div>

          {/* Timeline */}
          <Card className="bg-gradient-to-r from-info/5 to-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                زمان‌بندی پروژه
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>ثبت سفارش و شروع پروژه: امروز</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>طراحی و توسعه: 24-48 ساعت</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>تحویل نهایی: حداکثر 72 ساعت</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderSubmissionStep;