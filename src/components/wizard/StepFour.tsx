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
  // Use the new simplified pricing calculation
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

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">محاسبه قیمت نهایی</h2>
        <p className="text-muted-foreground">
          قیمت وب‌سایت شما بر اساس انتخاب‌های شما محاسبه شده است
        </p>
      </div>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            جزئیات قیمت‌گذاری
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Price */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">قیمت پایه</h4>
                <p className="text-sm text-muted-foreground">
                  طراحی یک صفحه با هر تعداد بخش
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{formatPrice(pricingBreakdown.basePrice)}</div>
              <div className="text-sm text-muted-foreground">تومان</div>
            </div>
          </div>

          {/* Pages Cost */}
          {pricingBreakdown.pagesCost > 0 && (
            <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">صفحات اضافی</h4>
                  <p className="text-sm text-muted-foreground">
                    {pricingBreakdown.pagesCount - 1} صفحه اضافی × 500,000 تومان
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatPrice(pricingBreakdown.pagesCost)}</div>
                <div className="text-sm text-muted-foreground">تومان</div>
              </div>
            </div>
          )}

          {/* Sections Cost */}
          {pricingBreakdown.sectionsCost > 0 && (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold">بخش‌های اضافی</h4>
                  <p className="text-sm text-muted-foreground">
                    {pricingBreakdown.totalSections - 6} بخش اضافی × 250,000 تومان
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatPrice(pricingBreakdown.sectionsCost)}</div>
                <div className="text-sm text-muted-foreground">تومان</div>
              </div>
            </div>
          )}

          {/* Branding Cost */}
          {pricingBreakdown.brandingCost > 0 && (
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">برندینگ</h4>
                  <p className="text-sm text-muted-foreground">
                    یکپارچه‌سازی لوگو
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatPrice(pricingBreakdown.brandingCost)}</div>
                <div className="text-sm text-muted-foreground">تومان</div>
              </div>
            </div>
          )}

          {/* Domain Cost */}
          {pricingBreakdown.domainCost > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">دامنه‌های اضافی</h4>
                  <p className="text-sm text-muted-foreground">
                    دامنه‌های اضافی انتخاب شده
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatPrice(pricingBreakdown.domainCost)}</div>
                <div className="text-sm text-muted-foreground">تومان</div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">قیمت نهایی</h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{formatPrice(pricingBreakdown.totalPrice)}</div>
                <div className="text-sm text-muted-foreground">تومان</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">تعداد صفحات</h3>
            <div className="text-2xl font-bold text-primary">{pricingBreakdown.pagesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">تعداد بخش‌ها</h3>
            <div className="text-2xl font-bold text-secondary">{pricingBreakdown.totalSections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">وضعیت</h3>
            <div className="text-sm text-green-600 font-medium">آماده برای پرداخت</div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Information */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">اطلاعات قیمت‌گذاری</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <span>قیمت پایه: 2,500,000 تومان برای یک صفحه با هر تعداد بخش</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full"></span>
              <span>صفحات اضافی: 500,000 تومان به ازای هر صفحه</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>بخش‌های اضافی: 250,000 تومان به ازای هر بخش بیش از 6</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>برندینگ: 200,000 تومان برای یکپارچه‌سازی لوگو</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepFour;