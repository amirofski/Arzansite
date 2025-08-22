import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calculator, Globe, Check, Zap, BarChart3, Database, Wrench, Clock } from 'lucide-react';
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
      additionalServices?: {
        seoOptimization?: boolean;
        socialMediaIntegration?: boolean;
        analyticsSetup?: boolean;
        backupService?: boolean;
        maintenancePlan?: boolean;
        rushDelivery?: boolean;
      };
    };
  };
  updateData: (data: Partial<{
    pricing: {
      totalPrice?: number;
      additionalServices?: {
        seoOptimization?: boolean;
        socialMediaIntegration?: boolean;
        analyticsSetup?: boolean;
        backupService?: boolean;
        maintenancePlan?: boolean;
        rushDelivery?: boolean;
      };
    };
  }>) => void;
}

// Reusable pricing item component
const PricingItem = ({ 
  icon: Icon, 
  title, 
  description, 
  price, 
  bgColor, 
  iconColor 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  price: number;
  bgColor: string;
  iconColor: string;
}) => (
  <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 ${bgColor} rounded-lg gap-3`}>
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className={`w-10 h-10 ${bgColor.replace('bg-', 'bg-').replace('/5', '/10')} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-sm sm:text-base">{title}</h4>
        <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{description}</p>
      </div>
    </div>
    <div className="text-left sm:text-right flex-shrink-0">
      <div className="text-base sm:text-lg font-bold">{formatPriceWithUnit(price)}</div>
    </div>
  </div>
);

// Reusable service item component
const ServiceItem = ({ 
  id, 
  icon: Icon, 
  label, 
  price, 
  checked, 
  onToggle,
  iconColor 
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  price: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  iconColor: string;
}) => (
  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(checked) => onToggle(checked as boolean)}
    />
    <Label htmlFor={id} className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
      <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
      <span className="text-sm leading-tight">{label}</span>
      <Badge variant="secondary" className="text-xs flex-shrink-0">{price}</Badge>
    </Label>
  </div>
);

// Reusable summary card component
const SummaryCard = ({ 
  icon: Icon, 
  title, 
  value, 
  bgColor, 
  iconColor 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}) => (
  <Card>
    <CardContent className="p-4 sm:p-6 text-center">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
      </div>
      <h3 className="font-semibold mb-2 text-sm sm:text-base">{title}</h3>
      <div className={`text-xl sm:text-2xl font-bold ${iconColor}`}>{value}</div>
    </CardContent>
  </Card>
);

const StepFour = ({ data, updateData }: StepFourProps) => {
  const { user } = useAuth();
  // Source of truth for additional services should live under pricing.additionalServices
  const [additionalServices, setAdditionalServices] = useState(
    (data.pricing as { additionalServices?: StepFourProps['data']['additionalServices'] } | undefined)?.additionalServices ||
    data.additionalServices ||
    {}
  );
  
  // Use the new pricing calculation
  const pricingBreakdown = calculateTotalPrice({
    ...data,
    additionalServices
  });
  
  // Update pricing data when costs change and persist services under pricing
  useEffect(() => {
    updateData({
      pricing: {
        ...data.pricing,
        additionalServices,
        totalPrice: pricingBreakdown.totalPrice
      }
    });
  }, [pricingBreakdown.totalPrice, additionalServices, updateData, data.pricing]);

  const handleServiceToggle = (service: string, checked: boolean) => {
    setAdditionalServices(prev => ({
      ...prev,
      [service]: checked
    }));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">محاسبه قیمت نهایی</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          قیمت وب‌سایت شما بر اساس انتخاب‌های شما محاسبه شده است
        </p>
      </div>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="w-5 h-5 text-primary" />
            جزئیات قیمت‌گذاری
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Base Price - Only show for single page/Full_page */}
          {pricingBreakdown.pagesCount === 1 && (
            <PricingItem
              icon={Check}
              title="قیمت پایه"
              description="طراحی یک صفحه با هر تعداد بخش"
              price={pricingBreakdown.basePrice}
              bgColor="bg-primary/5"
              iconColor="text-primary"
            />
          )}

          {/* Pages Cost - Show for multiple pages */}
          {pricingBreakdown.pagesCost > 0 && (
            <PricingItem
              icon={Globe}
              title="هزینه صفحات"
              description={`${pricingBreakdown.pagesCount} صفحه × 1,000,000 تومان`}
              price={pricingBreakdown.pagesCost}
              bgColor="bg-secondary/5"
              iconColor="text-secondary"
            />
          )}

          {/* Sections Cost - Show for multiple pages */}
          {pricingBreakdown.sectionsCost > 0 && (
            <PricingItem
              icon={Calculator}
              title="هزینه بخش‌ها"
              description={`${pricingBreakdown.totalSections} بخش × 250,000 تومان`}
              price={pricingBreakdown.sectionsCost}
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
            />
          )}

          {/* Branding Cost */}
          {pricingBreakdown.brandingCost > 0 && (
            <PricingItem
              icon={Check}
              title="برندینگ"
              description="یکپارچه‌سازی لوگو"
              price={pricingBreakdown.brandingCost}
              bgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
          )}

          {/* Domain Cost */}
          {pricingBreakdown.domainCost > 0 && (
            <PricingItem
              icon={Globe}
              title="دامنه‌های اضافی"
              description="دامنه‌های اضافی انتخاب شده"
              price={pricingBreakdown.domainCost}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
          )}

          {/* Additional Services Cost */}
          {pricingBreakdown.additionalServicesCost > 0 && (
            <PricingItem
              icon={Zap}
              title="خدمات اضافی"
              description="خدمات انتخاب شده"
              price={pricingBreakdown.additionalServicesCost}
              bgColor="bg-green-50"
              iconColor="text-green-600"
            />
          )}

          {/* Total */}
          <div className="border-t pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-lg sm:text-xl font-bold">قیمت نهایی (ماهانه)</h3>
              <div className="text-center sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{formatPriceWithUnit(pricingBreakdown.monthlyPrice)}</div>
                <div className="text-sm text-muted-foreground">تومان</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Services Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="w-5 h-5 text-primary" />
            خدمات اضافی (اختیاری)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ServiceItem
              id="seoOptimization"
              icon={BarChart3}
              label="بهینه‌سازی SEO"
              price="500,000 تومان"
              checked={additionalServices.seoOptimization || false}
              onToggle={(checked) => handleServiceToggle('seoOptimization', checked)}
              iconColor="text-blue-600"
            />

            <ServiceItem
              id="socialMediaIntegration"
              icon={Globe}
              label="یکپارچه‌سازی شبکه‌های اجتماعی"
              price="300,000 تومان"
              checked={additionalServices.socialMediaIntegration || false}
              onToggle={(checked) => handleServiceToggle('socialMediaIntegration', checked)}
              iconColor="text-green-600"
            />

            <ServiceItem
              id="analyticsSetup"
              icon={BarChart3}
              label="راه‌اندازی آنالیتیکس"
              price="200,000 تومان"
              checked={additionalServices.analyticsSetup || false}
              onToggle={(checked) => handleServiceToggle('analyticsSetup', checked)}
              iconColor="text-purple-600"
            />

            <ServiceItem
              id="backupService"
              icon={Database}
              label="سرویس پشتیبان‌گیری"
              price="150,000 تومان"
              checked={additionalServices.backupService || false}
              onToggle={(checked) => handleServiceToggle('backupService', checked)}
              iconColor="text-orange-600"
            />

            <ServiceItem
              id="maintenancePlan"
              icon={Wrench}
              label="طرح نگهداری"
              price="400,000 تومان"
              checked={additionalServices.maintenancePlan || false}
              onToggle={(checked) => handleServiceToggle('maintenancePlan', checked)}
              iconColor="text-red-600"
            />

            <ServiceItem
              id="rushDelivery"
              icon={Clock}
              label="تحویل فوری"
              price="800,000 تومان"
              checked={additionalServices.rushDelivery || false}
              onToggle={(checked) => handleServiceToggle('rushDelivery', checked)}
              iconColor="text-yellow-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <SummaryCard
          icon={Globe}
          title="تعداد صفحات"
          value={pricingBreakdown.pagesCount}
          bgColor="bg-primary/10"
          iconColor="text-primary"
        />

        <SummaryCard
          icon={Calculator}
          title="تعداد بخش‌ها"
          value={pricingBreakdown.totalSections}
          bgColor="bg-secondary/10"
          iconColor="text-secondary"
        />

        <SummaryCard
          icon={Check}
          title="وضعیت"
          value="آماده برای پرداخت"
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {/* Pricing Information */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">اطلاعات قیمت‌گذاری</h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
              <span>قیمت پایه: 2,500,000 تومان برای یک صفحه با هر تعداد بخش (فقط برای طراحی تک صفحه‌ای)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></span>
              <span>طراحی چند صفحه‌ای: 1,000,000 تومان به ازای هر صفحه</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>بخش‌ها (برای چند صفحه‌ای): 250,000 تومان به ازای هر بخش</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>برندینگ: 200,000 تومان برای یکپارچه‌سازی لوگو</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>خدمات اضافی: قیمت‌های مختلف بر اساس نوع خدمت</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepFour;