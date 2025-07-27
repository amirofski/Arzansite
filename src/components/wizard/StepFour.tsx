import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Globe, Check } from 'lucide-react';
import React from 'react'; // Added missing import for React

interface StepFourProps {
  data: any;
  updateData: (data: any) => void;
}

const StepFour = ({ data, updateData }: StepFourProps) => {
  const calculateCost = () => {
    let baseCost = 2500000; // Base price: 2,500,000 تومان for monthly payment
    let pagesCost = 0;
    let sectionsCost = 0;
    let brandingCost = 0;
    let domainCost = 0;

    // Base cost is now fixed at 2,500,000 تومان for all site types
    // The pricing model is now:
    // 1. Base price: 2,500,000 تومان (monthly)
    // 2. Single page designs: free (any number of sections)
    // 3. Multi-page designs: 250,000 تومان per page
    // 4. Total 6 sections across all pages is free
    // 5. More than 6 total sections adds 150,000 تومان

    // New pricing model based on pages and sections
    // Support both old and new data structures
    const pages = data.websiteFramework?.dynamicDesign?.pages || [];
    let totalSections = 0;
    let pagesCount = 0;
    
    if (pages.length > 0) {
      // New dynamic design structure
      pagesCount = pages.length;
      totalSections = pages.reduce((total, page) => total + page.sections.length, 0);
    } else {
      // Old structure - estimate sections based on pages
      pagesCount = data.pages?.length || 0;
      totalSections = pagesCount * 4; // Assume 4 sections per page for old structure
    }

    // New pricing rules:
    // 1. Base price: 2,500,000 تومان for one page design with any sections
    // 2. Multi-page: additional cost for extra pages
    // 3. More than 6 total sections: additional cost

    if (pagesCount > 1) {
      // Multi-page design: additional cost for extra pages
      pagesCost = (pagesCount - 1) * 250000; // 250,000 تومان per additional page
    }

    // Additional cost for more than 6 total sections
    if (totalSections > 6) {
      sectionsCost = 150000; // 150,000 تومان for sections
    }

    // Branding cost
    if (data.branding?.logo) {
      brandingCost += 200000; // Logo integration: 200,000 تومان
    }

    // Domain costs
    if (data.userInfo?.additionalDomains) {
      domainCost = data.userInfo.additionalDomains.reduce((total, domain) => total + domain.price, 0);
    }

    const totalCost = baseCost + pagesCost + sectionsCost + brandingCost + domainCost;
    
    return {
      baseCost,
      pagesCost,
      sectionsCost,
      brandingCost,
      domainCost,
      totalCost,
      totalSections,
      pagesCount
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const costs = calculateCost();

  // Update pricing data when costs change
  React.useEffect(() => {
    updateData({
      pricing: {
        ...data.pricing,
        totalPrice: costs.totalCost
      }
    });
  }, [costs.totalCost]);

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
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span>هزینه پایه (یک صفحه)</span>
            <span className="font-semibold">{formatPrice(costs.baseCost)} تومان</span>
          </div>
          
          {costs.pagesCost > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>صفحات اضافی ({costs.pagesCount - 1} صفحه اضافی - {costs.pagesCount - 1} × 250,000 تومان)</span>
              <span className="font-semibold">{formatPrice(costs.pagesCost)} تومان</span>
            </div>
          )}
          
          {costs.sectionsCost > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>بخش‌های اضافی ({costs.totalSections} بخش - بیش از 6 بخش)</span>
              <span className="font-semibold">{formatPrice(costs.sectionsCost)} تومان</span>
            </div>
          )}
          
          {costs.brandingCost > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>طراحی و برندینگ (لوگو)</span>
              <span className="font-semibold">{formatPrice(costs.brandingCost)} تومان</span>
            </div>
          )}

          {costs.domainCost > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>دامنه‌های اضافی</span>
              <span className="font-semibold">{formatPrice(costs.domainCost)} تومان</span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-3 text-lg font-bold bg-primary/5 px-4 rounded-lg">
            <span>مجموع هزینه</span>
            <span className="text-primary">{formatPrice(costs.totalCost)} تومان</span>
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
                  <Badge variant="success" className="text-xs">رایگان</Badge>
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