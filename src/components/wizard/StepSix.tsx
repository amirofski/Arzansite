import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Smartphone, 
  Check, 
  Clock, 
  Shield, 
  Zap 
} from 'lucide-react';

interface StepSixProps {
  data: any;
  updateData: (data: any) => void;
}

const StepSix = ({ data }: StepSixProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const calculateCost = () => {
    let baseCost = data.siteType === 'personal' ? 500000 : 1200000;
    let pagesCost = Math.max(0, (data.pages?.length || 0) - 2) * 150000;
    let brandingCost = data.branding?.logo ? 200000 : 0;
    return baseCost + pagesCost + brandingCost;
  };

  const totalCost = calculateCost();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      alert('پرداخت با موفقیت انجام شد! وب‌سایت شما ظرف 24-48 ساعت آماده خواهد بود.');
      setIsProcessing(false);
    }, 2000);
  };

  const orderSummary = [
    {
      title: 'نوع وب‌سایت',
      value: data.siteType === 'personal' ? 'شخصی' : 'تجاری',
      icon: '🎯'
    },
    {
      title: 'تعداد صفحات',
      value: `${data.pages?.length || 0} صفحه`,
      icon: '📄'
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
      description: 'پرداخت امن با کارت‌های بانکی',
      icon: CreditCard,
      recommended: true
    },
    {
      id: 'mellat',
      name: 'درگاه بانک ملت',
      description: 'پرداخت مستقیم بانکی',
      icon: Smartphone,
      recommended: false
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">تکمیل سفارش و پرداخت</h2>
        <p className="text-muted-foreground">
          مرور نهایی سفارش و انتخاب روش پرداخت
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

          <Card className="card-modern">
            <CardHeader>
              <CardTitle>صفحات انتخاب شده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.pages?.map((pageId: string) => {
                  const pageNames: Record<string, string> = {
                    home: 'صفحه اصلی',
                    about: data.siteType === 'personal' ? 'درباره من' : 'درباره ما',
                    portfolio: 'نمونه کارها',
                    blog: 'وبلاگ',
                    services: 'خدمات',
                    products: 'محصولات',
                    team: 'تیم ما',
                    contact: data.siteType === 'personal' ? 'تماس با من' : 'تماس با ما'
                  };
                  return (
                    <Badge key={pageId} variant="secondary" className="text-sm">
                      {pageNames[pageId] || pageId}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>اطلاعات مشتری</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>نام:</span>
                  <span className="font-medium">{data.userInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>ایمیل:</span>
                  <span className="font-medium">{data.userInfo?.email}</span>
                </div>
                <div className="flex justify-between">
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
                {Math.max(0, (data.pages?.length || 0) - 2) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>صفحات اضافی</span>
                    <span>{formatPrice(Math.max(0, (data.pages?.length || 0) - 2) * 150000)} تومان</span>
                  </div>
                )}
                {data.branding?.logo && (
                  <div className="flex justify-between text-sm">
                    <span>طراحی لوگو</span>
                    <span>{formatPrice(200000)} تومان</span>
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

          {/* Payment Methods */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>روش پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          {method.recommended && (
                            <Badge variant="default" className="text-xs">توصیه شده</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full btn-gradient text-lg py-6"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال پردازش...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                پرداخت {formatPrice(totalCost)} تومان
              </div>
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-success mb-1">پرداخت امن</p>
              <p className="text-muted-foreground">
                تمام پرداخت‌ها از طریق درگاه‌های معتبر بانکی انجام می‌شود
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
                <span>پرداخت و شروع پروژه: امروز</span>
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

export default StepSix;