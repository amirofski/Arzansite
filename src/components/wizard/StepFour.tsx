import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Star, Zap, Crown } from 'lucide-react';

interface StepFourProps {
  data: any;
  updateData: (data: any) => void;
}

const StepFour = ({ data }: StepFourProps) => {
  const calculateCost = () => {
    let baseCost = 0;
    let pagesCost = 0;
    let brandingCost = 0;

    // Base cost based on site type
    if (data.siteType === 'personal') {
      baseCost = 500000; // 500,000 تومان
    } else if (data.siteType === 'business') {
      baseCost = 1200000; // 1,200,000 تومان
    }

    // Additional pages cost
    const additionalPages = Math.max(0, (data.pages?.length || 0) - 2); // First 2 pages free
    pagesCost = additionalPages * 150000; // 150,000 تومان per additional page

    // Branding cost
    if (data.branding?.logo) {
      brandingCost += 200000; // Logo integration: 200,000 تومان
    }

    const totalCost = baseCost + pagesCost + brandingCost;
    
    return {
      baseCost,
      pagesCost,
      brandingCost,
      totalCost
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const costs = calculateCost();

  const packages = [
    {
      name: 'پایه',
      icon: Star,
      price: 500000,
      features: [
        'وب‌سایت شخصی',
        'تا 3 صفحه',
        'قالب آماده',
        'پشتیبانی 3 ماهه'
      ],
      isSelected: data.siteType === 'personal' && (data.pages?.length || 0) <= 3
    },
    {
      name: 'حرفه‌ای',
      icon: Zap,
      price: 1200000,
      features: [
        'وب‌سایت تجاری',
        'تا 6 صفحه',
        'طراحی اختصاصی',
        'پشتیبانی 6 ماهه'
      ],
      isSelected: data.siteType === 'business' && (data.pages?.length || 0) <= 6
    },
    {
      name: 'پیشرفته',
      icon: Crown,
      price: 2000000,
      features: [
        'وب‌سایت کامل',
        'صفحات نامحدود',
        'امکانات پیشرفته',
        'پشتیبانی 1 ساله'
      ],
      isSelected: (data.pages?.length || 0) > 6
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">محاسبه هزینه</h2>
        <p className="text-muted-foreground">
          هزینه وب‌سایت شما براساس انتخاب‌های انجام شده محاسبه شده است
        </p>
      </div>

      {/* Package Recommendations */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {packages.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <Card 
              key={pkg.name}
              className={`transition-all duration-300 ${
                pkg.isSelected 
                  ? 'ring-2 ring-primary bg-primary/5 transform scale-105' 
                  : 'hover:shadow-medium'
              }`}
            >
              <CardHeader className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  pkg.isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                {pkg.isSelected && (
                  <Badge variant="default" className="w-fit mx-auto">
                    انتخاب شما
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-primary mb-4">
                  {formatPrice(pkg.price)} تومان
                </div>
                <ul className="space-y-2 text-sm">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
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
            <span>هزینه پایه ({data.siteType === 'personal' ? 'شخصی' : 'تجاری'})</span>
            <span className="font-semibold">{formatPrice(costs.baseCost)} تومان</span>
          </div>
          
          {costs.pagesCost > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>صفحات اضافی ({Math.max(0, (data.pages?.length || 0) - 2)} صفحه)</span>
              <span className="font-semibold">{formatPrice(costs.pagesCost)} تومان</span>
            </div>
          )}
          
          {costs.brandingCost > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>طراحی و برندینگ (لوگو)</span>
              <span className="font-semibold">{formatPrice(costs.brandingCost)} تومان</span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-3 text-lg font-bold bg-primary/5 px-4 rounded-lg">
            <span>مجموع هزینه</span>
            <span className="text-primary">{formatPrice(costs.totalCost)} تومان</span>
          </div>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card className="bg-gradient-to-r from-success/5 to-info/5">
        <CardHeader>
          <CardTitle className="text-success">✓ شامل این موارد است:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                طراحی ریسپانسیو (موبایل و دسکتاپ)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                سئو پایه (بهینه‌سازی موتورهای جستجو)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                فرم تماس کاربردی
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                سرعت بالا و امنیت
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                هاستینگ رایگان برای 1 سال
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                ادغام شبکه‌های اجتماعی
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                پنل مدیریت آسان
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
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