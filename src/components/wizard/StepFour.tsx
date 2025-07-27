import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Globe, Check } from 'lucide-react';
import React from 'react';
import { calculateTotalPrice, formatPrice } from '@/lib/pricingUtils';

interface StepFourProps {
  data: any;
  updateData: (data: any) => void;
}

const StepFour = ({ data, updateData }: StepFourProps) => {
  // Use the centralized pricing calculation to ensure consistency
  const pricingBreakdown = calculateTotalPrice(data);

  // Update pricing data when costs change
  React.useEffect(() => {
    updateData({
      pricing: {
        ...data.pricing,
        totalPrice: pricingBreakdown.totalPrice
      }
    });
  }, [pricingBreakdown.totalPrice]);

  // Calculate some display metrics for the new structure
  const getDisplayMetrics = () => {
    const pages = data.websiteFramework?.dynamicDesign?.pages || [];
    let totalSections = 0;
    let pagesCount = 0;
    
    if (pages.length > 0) {
      pagesCount = pages.length;
      totalSections = pages.reduce((total: number, page: any) => total + page.sections.length, 0);
    } else {
      pagesCount = data.pages?.length || 1;
      totalSections = pagesCount * 4;
    }

    return { totalSections, pagesCount };
  };

  const displayMetrics = getDisplayMetrics();

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">قیمت‌گذاری</h2>
        <p className="text-muted-foreground">
          هزینه وب‌سایت شما براساس انتخاب‌های انجام شده محاسبه شده است
        </p>
      </div>

      {/* Detailed Cost Breakdown */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            جزئیات محاسبه هزینه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>قیمت پایه:</span>
                  <span>{formatPrice(pricingBreakdown.basePrice)} تومان</span>
                </div>
                
                {pricingBreakdown.modulesPrice > 0 && (
                  <div className="flex justify-between">
                    <span>ماژول‌ها و سفارشی‌سازی:</span>
                    <span>{formatPrice(pricingBreakdown.modulesPrice)} تومان</span>
                  </div>
                )}
                
                {pricingBreakdown.packagePrice > 0 && (
                  <div className="flex justify-between">
                    <span>پکیج انتخابی:</span>
                    <span>{formatPrice(pricingBreakdown.packagePrice)} تومان</span>
                  </div>
                )}
                
                {pricingBreakdown.pagesCost > 0 && (
                  <div className="flex justify-between">
                    <span>هزینه صفحات اضافی:</span>
                    <span>{formatPrice(pricingBreakdown.pagesCost)} تومان</span>
                  </div>
                )}
                
                {pricingBreakdown.sectionsCost > 0 && (
                  <div className="flex justify-between">
                    <span>هزینه بخش‌های اضافی:</span>
                    <span>{formatPrice(pricingBreakdown.sectionsCost)} تومان</span>
                  </div>
                )}
                
                {pricingBreakdown.additionalServicesPrice > 0 && (
                  <div className="flex justify-between">
                    <span>خدمات اضافی:</span>
                    <span>{formatPrice(pricingBreakdown.additionalServicesPrice)} تومان</span>
                  </div>
                )}
                
                {pricingBreakdown.rushDeliveryFee > 0 && (
                  <div className="flex justify-between text-warning">
                    <span>تحویل فوری (30%):</span>
                    <span>+{formatPrice(pricingBreakdown.rushDeliveryFee)} تومان</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center text-lg font-bold text-primary">
                  <span>مجموع:</span>
                  <span>{formatPrice(pricingBreakdown.totalPrice)} تومان</span>
                </div>
              </div>
        </CardContent>
      </Card>

      {/* Domain Summary */}
      {data.userInfo?.domain && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
              خلاصه دامنه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>دامنه اصلی:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{data.userInfo.domain}.ir</span>
                  <Badge variant="secondary" className="text-xs text-green-600">رایگان</Badge>
                </div>
              </div>
              
              {data.userInfo?.additionalDomains && data.userInfo.additionalDomains.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">دامنه‌های اضافی:</span>
                  {data.userInfo.additionalDomains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{domain.domain}{domain.extension}</span>
                      <span className="font-medium">{formatPrice(domain.price)} تومان</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* What's Included */}
      <Card className="bg-gradient-to-r from-success/5 to-info/5">
        <CardHeader>
          <CardTitle className="text-success">✓ شامل این موارد است:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                طراحی ریسپانسیو (موبایل و دسکتاپ)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                سئو پایه (بهینه‌سازی موتورهای جستجو)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                فرم تماس کاربردی
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                سرعت بالا و امنیت
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                هاستینگ رایگان برای 1 سال
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                ادغام شبکه‌های اجتماعی
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                پنل مدیریت آسان
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                پشتیبانی فنی
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepFour;