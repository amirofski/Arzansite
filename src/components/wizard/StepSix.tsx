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
import { useAuth } from "@/hooks/useAuth";

interface StepSixProps {
  data: any;
  updateData: (data: any) => void;
}

const StepSix = ({ data }: StepSixProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isYearlyPayment, setIsYearlyPayment] = useState(false);
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  // Use pricing data from StepFour if available, otherwise calculate
  const getTotalCost = () => {
    if (data.pricing?.totalPrice) {
      return data.pricing.totalPrice;
    }
    
    // Fallback calculation if pricing data is not available
    const baseCost = 2500000; // Base price: 2,500,000 تومان
    
    const pages = data.websiteFramework?.dynamicDesign?.pages || [];
    let totalSections = 0;
    let pagesCount = 0;
    
    if (pages.length > 0) {
      pagesCount = pages.length;
      totalSections = pages.reduce((total, page) => total + page.sections.length, 0);
    } else {
      pagesCount = data.pages?.length || 0;
      totalSections = pagesCount * 4;
    }

    let pagesCost = 0;
    if (pagesCount > 1) {
      pagesCost = (pagesCount - 1) * 250000; // Fixed: only charge for additional pages
    }

    let sectionsCost = 0;
    if (totalSections > 6) {
      sectionsCost = 150000;
    }
    
    const brandingCost = data.branding?.logo ? 200000 : 0;
    
    let domainCost = 0;
    if (data.userInfo?.additionalDomains) {
      domainCost = data.userInfo.additionalDomains.reduce((total, domain) => total + domain.price, 0);
    }
    
    return baseCost + pagesCost + sectionsCost + brandingCost + domainCost;
  };

  const baseCost = getTotalCost();
  const yearlyDiscount = 0.2; // 20% discount for yearly payment
  const yearlyCost = Math.round(baseCost * 12 * (1 - yearlyDiscount));
  const totalCost = isYearlyPayment ? yearlyCost : baseCost;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      alert('پرداخت با موفقیت انجام شد! وب‌سایت شما ظرف 24-48 ساعت آماده خواهد بود.');
      setIsProcessing(false);
    }, 2000);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    // Handle payment method selection
    console.log('Selected payment method:', methodId);
  };

  const orderSummary = [
    {
      title: 'نوع وب‌سایت',
      value: data.siteType === 'personal' ? 'شخصی' : 'تجاری',
      icon: '🎯'
    },
    {
      title: 'تعداد صفحات',
      value: `${(() => {
        const pages = data.websiteFramework?.dynamicDesign?.pages || [];
        if (pages.length > 0) {
          return pages.length;
        } else {
          return data.pages?.length || 1;
        }
      })()} صفحه`,
      icon: '📄'
    },
    {
      title: 'تعداد بخش‌ها',
      value: `${(() => {
        const pages = data.websiteFramework?.dynamicDesign?.pages || [];
        if (pages.length > 0) {
          return pages.reduce((total, page) => total + page.sections.length, 0);
        } else {
          const pagesCount = data.pages?.length || 0;
          return pagesCount * 4; // Estimate for old structure
        }
      })()} بخش`,
      icon: '🔧'
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
      title: 'دامنه اصلی',
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
              <CardTitle>طراحی انتخاب شده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Support both old and new data structures */}
                {data.websiteFramework?.dynamicDesign?.pages ? (
                  // New dynamic design structure
                  <div className="space-y-3">
                    {data.websiteFramework.dynamicDesign.pages.map((page: any) => (
                      <div key={page.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📄</span>
                          <div>
                            <div className="font-medium">{page.name}</div>
                            <div className="text-sm text-muted-foreground">{page.sections.length} بخش</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {page.sections.length > 0 ? 'تکمیل شده' : 'خالی'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Old pages structure
                  <div className="space-y-3">
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
                        <div key={pageId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📄</span>
                            <div className="font-medium">{pageNames[pageId] || pageId}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">تکمیل شده</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  <span>وضعیت:</span>
                  <span className="font-medium">
                    {user ? 'کاربر ثبت‌نام شده' : 'کاربر مهمان'}
                  </span>
                </div>
                {user && (
                  <div className="flex justify-between">
                    <span>ایمیل:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>دامنه اصلی:</span>
                  <span className="font-medium">{data.userInfo?.domain || 'mywebsite'}.ir</span>
                </div>
                {data.userInfo?.additionalDomains && data.userInfo.additionalDomains.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>دامنه‌های اضافی:</span>
                      <span className="font-medium">{data.userInfo.additionalDomains.length} دامنه</span>
                    </div>
                    {data.userInfo.additionalDomains.map((domain, index) => (
                      <div key={index} className="flex justify-between text-sm text-muted-foreground">
                        <span>• {domain.domain}{domain.extension}</span>
                        <span>{formatPrice(domain.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                {data.pricing?.totalPrice ? (
                  // Use pricing data from StepFour
                  <>
                    <div className="flex justify-between text-sm">
                      <span>هزینه پایه (یک صفحه)</span>
                      <span>{formatPrice(2500000)} تومان</span>
                    </div>
                    
                    {(() => {
                      const pages = data.websiteFramework?.dynamicDesign?.pages || [];
                      const pagesCount = pages.length > 0 ? pages.length : (data.pages?.length || 0);
                      return pagesCount > 1;
                    })() && (
                      <div className="flex justify-between text-sm">
                        <span>صفحات اضافی</span>
                        <span>{formatPrice((() => {
                          const pages = data.websiteFramework?.dynamicDesign?.pages || [];
                          const pagesCount = pages.length > 0 ? pages.length : (data.pages?.length || 0);
                          return pagesCount > 1 ? (pagesCount - 1) * 250000 : 0;
                        })())} تومان</span>
                      </div>
                    )}
                    
                    {(() => {
                      const pages = data.websiteFramework?.dynamicDesign?.pages || [];
                      let totalSections = 0;
                      if (pages.length > 0) {
                        totalSections = pages.reduce((total, page) => total + page.sections.length, 0);
                      } else {
                        const pagesCount = data.pages?.length || 0;
                        totalSections = pagesCount * 4;
                      }
                      return totalSections > 6;
                    })() && (
                      <div className="flex justify-between text-sm">
                        <span>بخش‌های اضافی</span>
                        <span>{formatPrice(150000)} تومان</span>
                      </div>
                    )}
                    
                    {data.branding?.logo && (
                      <div className="flex justify-between text-sm">
                        <span>طراحی لوگو</span>
                        <span>{formatPrice(200000)} تومان</span>
                      </div>
                    )}
                    
                    {data.userInfo?.additionalDomains && data.userInfo.additionalDomains.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>دامنه‌های اضافی</span>
                        <span>{formatPrice(data.userInfo.additionalDomains.reduce((total, domain) => total + domain.price, 0))} تومان</span>
                      </div>
                    )}
                  </>
                ) : (
                  // Fallback to basic calculation
                  <>
                    <div className="flex justify-between text-sm">
                      <span>هزینه پایه (یک صفحه)</span>
                      <span>{formatPrice(2500000)} تومان</span>
                    </div>
                    {data.userInfo?.additionalDomains && data.userInfo.additionalDomains.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>دامنه‌های اضافی</span>
                        <span>{formatPrice(data.userInfo.additionalDomains.reduce((total, domain) => total + domain.price, 0))} تومان</span>
                      </div>
                    )}
                  </>
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

          {/* Payment Plan Selection */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>انتخاب پلن پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Monthly Payment */}
                <Button
                  variant="outline"
                  className={`h-auto p-4 text-left ${
                    !isYearlyPayment
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setIsYearlyPayment(false)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">پرداخت ماهانه</h4>
                      <p className="text-sm text-muted-foreground">پرداخت ماهانه</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>{formatPrice(baseCost)} تومان در ماه</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>انعطاف‌پذیری بیشتر</span>
                    </div>
                  </div>
                </Button>

                {/* Yearly Payment */}
                <Button
                  variant="outline"
                  className={`h-auto p-4 text-left ${
                    isYearlyPayment
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setIsYearlyPayment(true)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">پرداخت سالانه</h4>
                      <p className="text-sm text-muted-foreground">پرداخت سالانه با تخفیف</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>{formatPrice(yearlyCost)} تومان در سال</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-success rounded-full"></span>
                      <span>تخفیف 20%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>صرفه‌جویی {formatPrice(baseCost * 12 - yearlyCost)} تومان</span>
                    </div>
                  </div>
                </Button>
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
                  <Button
                    key={method.id}
                    variant="outline"
                    className="w-full h-auto p-4 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => handlePaymentMethodSelect(method.id)}
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
                  </Button>
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
                <span className="text-sm opacity-80">
                  ({isYearlyPayment ? 'سالانه' : 'ماهانه'})
                </span>
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