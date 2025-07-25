import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const calculateTotalPrice = () => {
    if (!data.modules) return 0;
    
    let totalPrice = 0;
    
    // Base price for site type
    totalPrice += data.siteType === 'personal' ? 500000 : 1200000;
    
    // Module prices
    data.modules.forEach((module: any) => {
      // You can define module pricing logic here
      const modulePrices: Record<string, number> = {
        'hero': 100000,
        'about': 150000,
        'services': 200000,
        'portfolio': 250000,
        'blog': 300000,
        'contact': 100000,
        'products': 400000,
        'testimonials': 150000,
        'booking': 800000,
        'search': 500000,
        'analytics': 600000
      };
      totalPrice += modulePrices[module.id] || 0;
    });
    
    // Rush delivery
    if (data.pricing?.rushDelivery) {
      totalPrice += totalPrice * 0.5; // 50% extra for rush
    }
    
    return totalPrice;
  };

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
        price: calculateTotalPrice(),
        status: 'pending',
        payment_status: 'pending',
        comments: `دامنه: ${data.userInfo?.domain || 'mywebsite'}.ir`
      };

      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Also create/update user profile if needed
      if (data.userInfo) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: data.userInfo.name,
            email: data.userInfo.email,
            updated_at: new Date().toISOString()
          });

        if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
          console.warn('Profile update warning:', profileError);
        }
      }

      // Now initiate Zarinpal payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('zarinpal-payment', {
        body: {
          action: 'request',
          amount: Math.floor(calculateTotalPrice() / 10), // Convert from Rials to Tomans
          description: `پرداخت سفارش وب‌سایت - ${data.userInfo?.domain || 'mywebsite'}`,
          orderId: newOrder.id
        }
      });

      if (paymentError) {
        throw paymentError;
      }

      if (paymentData.success) {
        // Redirect to Zarinpal payment page
        window.location.href = paymentData.paymentUrl;
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

  const totalCost = calculateTotalPrice();

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
                  <span>{formatPrice(data.siteType === 'personal' ? 500000 : 1200000)} تومان</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ماژول‌های اضافی</span>
                  <span>{formatPrice(totalCost - (data.siteType === 'personal' ? 500000 : 1200000))} تومان</span>
                </div>
                {data.pricing?.rushDelivery && (
                  <div className="flex justify-between text-sm text-warning">
                    <span>تحویل فوری (50%)</span>
                    <span>+{formatPrice(totalCost * 0.33)} تومان</span>
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
                ثبت سفارش {formatPrice(totalCost)} تومان
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