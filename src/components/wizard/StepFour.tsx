import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calculator, Globe, Check, Zap, Shield, BarChart3, Database, Wrench, Clock } from 'lucide-react';
import { calculateTotalPrice, formatPriceWithUnit } from '@/lib/pricingUtils';
import { useAuth } from '@/hooks/useAuth';

interface StepFourProps {
  data: {
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
    branding?: {
      primaryColor?: string;
      fontFamily?: string;
      logo?: string;
    };
    userInfo?: {
      domain?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
    additionalServices?: {
      seoOptimization?: boolean;
      socialMediaIntegration?: boolean;
      analyticsSetup?: boolean;
      backupService?: boolean;
      maintenancePlan?: boolean;
      rushDelivery?: boolean;
    };
    pricing?: {
      totalPrice?: number;
    };
  };
  updateData: (data: Partial<{
    pricing: {
      totalPrice?: number;
    };
    additionalServices: {
      seoOptimization?: boolean;
      socialMediaIntegration?: boolean;
      analyticsSetup?: boolean;
      backupService?: boolean;
      maintenancePlan?: boolean;
      rushDelivery?: boolean;
    };
  }>) => void;
}

const StepFour = ({ data, updateData }: StepFourProps) => {
  const { user } = useAuth();
  const [additionalServices, setAdditionalServices] = useState(data.additionalServices || {});
  
  // Use the new pricing calculation
  const pricingBreakdown = calculateTotalPrice({
    ...data,
    additionalServices
  });
  
  // Update pricing data when costs change
  useEffect(() => {
    updateData({
      pricing: {
        ...data.pricing,
        totalPrice: pricingBreakdown.totalPrice
      },
      additionalServices
    });
  }, [pricingBreakdown.totalPrice, additionalServices, updateData, data.pricing]);

  const handleServiceToggle = (service: string, checked: boolean) => {
    setAdditionalServices(prev => ({
      ...prev,
      [service]: checked
    }));
  };

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
          {/* Base Price - Only show for single page/Full_page */}
          {pricingBreakdown.pagesCount === 1 && (
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
                <div className="text-lg font-bold">{formatPriceWithUnit(pricingBreakdown.basePrice)}</div>
              </div>
            </div>
          )}

          {/* Pages Cost - Show for multiple pages */}
          {pricingBreakdown.pagesCost > 0 && (
            <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">هزینه صفحات</h4>
                  <p className="text-sm text-muted-foreground">
                    {pricingBreakdown.pagesCount} صفحه × 1,000,000 تومان
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatPriceWithUnit(pricingBreakdown.pagesCost)}</div>
              </div>
            </div>
          )}

          {/* Sections Cost - Show for multiple pages */}
          {pricingBreakdown.sectionsCost > 0 && (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold">هزینه بخش‌ها</h4>
                  <p className="text-sm text-muted-foreground">
                    {pricingBreakdown.totalSections} بخش × 250,000 تومان
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatPriceWithUnit(pricingBreakdown.sectionsCost)}</div>
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
                <div className="text-lg font-bold">{formatPriceWithUnit(pricingBreakdown.brandingCost)}</div>
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
                <div className="text-lg font-bold">{formatPriceWithUnit(pricingBreakdown.domainCost)}</div>
              </div>
            </div>
          )}

          {/* Additional Services Cost */}
          {pricingBreakdown.additionalServicesCost > 0 && (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">خدمات اضافی</h4>
                  <p className="text-sm text-muted-foreground">
                    خدمات انتخاب شده
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatPriceWithUnit(pricingBreakdown.additionalServicesCost)}</div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">قیمت نهایی (ماهانه)</h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{formatPriceWithUnit(pricingBreakdown.monthlyPrice)}</div>
                <div className="text-sm text-muted-foreground">تومان</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Services Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            خدمات اضافی (اختیاری)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="seoOptimization"
                checked={additionalServices.seoOptimization || false}
                onCheckedChange={(checked) => handleServiceToggle('seoOptimization', checked as boolean)}
              />
              <Label htmlFor="seoOptimization" className="flex items-center gap-2 cursor-pointer">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                بهینه‌سازی SEO
                <Badge variant="secondary" className="text-xs">500,000 تومان</Badge>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="socialMediaIntegration"
                checked={additionalServices.socialMediaIntegration || false}
                onCheckedChange={(checked) => handleServiceToggle('socialMediaIntegration', checked as boolean)}
              />
              <Label htmlFor="socialMediaIntegration" className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-4 h-4 text-green-600" />
                یکپارچه‌سازی شبکه‌های اجتماعی
                <Badge variant="secondary" className="text-xs">300,000 تومان</Badge>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="analyticsSetup"
                checked={additionalServices.analyticsSetup || false}
                onCheckedChange={(checked) => handleServiceToggle('analyticsSetup', checked as boolean)}
              />
              <Label htmlFor="analyticsSetup" className="flex items-center gap-2 cursor-pointer">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                راه‌اندازی آنالیتیکس
                <Badge variant="secondary" className="text-xs">200,000 تومان</Badge>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="backupService"
                checked={additionalServices.backupService || false}
                onCheckedChange={(checked) => handleServiceToggle('backupService', checked as boolean)}
              />
              <Label htmlFor="backupService" className="flex items-center gap-2 cursor-pointer">
                <Database className="w-4 h-4 text-orange-600" />
                سرویس پشتیبان‌گیری
                <Badge variant="secondary" className="text-xs">150,000 تومان</Badge>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="maintenancePlan"
                checked={additionalServices.maintenancePlan || false}
                onCheckedChange={(checked) => handleServiceToggle('maintenancePlan', checked as boolean)}
              />
              <Label htmlFor="maintenancePlan" className="flex items-center gap-2 cursor-pointer">
                <Wrench className="w-4 h-4 text-red-600" />
                طرح نگهداری
                <Badge variant="secondary" className="text-xs">400,000 تومان</Badge>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="rushDelivery"
                checked={additionalServices.rushDelivery || false}
                onCheckedChange={(checked) => handleServiceToggle('rushDelivery', checked as boolean)}
              />
              <Label htmlFor="rushDelivery" className="flex items-center gap-2 cursor-pointer">
                <Clock className="w-4 h-4 text-yellow-600" />
                تحویل فوری
                <Badge variant="secondary" className="text-xs">800,000 تومان</Badge>
              </Label>
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
              <span>قیمت پایه: 2,500,000 تومان برای یک صفحه با هر تعداد بخش (فقط برای طراحی تک صفحه‌ای)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full"></span>
              <span>طراحی چند صفحه‌ای: 1,000,000 تومان به ازای هر صفحه</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>بخش‌ها (برای چند صفحه‌ای): 250,000 تومان به ازای هر بخش</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>برندینگ: 200,000 تومان برای یکپارچه‌سازی لوگو</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>خدمات اضافی: قیمت‌های مختلف بر اساس نوع خدمت</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepFour;