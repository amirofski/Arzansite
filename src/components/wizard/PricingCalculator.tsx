import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  Star, 
  Zap, 
  Crown, 
  Palette,
  Smartphone,
  Globe,
  Shield,
  Rocket,
  HeadphonesIcon,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { 
  calculateTotalPrice, 
  calculateModulesPrice, 
  calculateAdditionalServicesPrice,
  calculatePackagePrice,
  calculateRushDeliveryFee,
  formatPrice,
  PRICING_CONFIG 
} from '@/lib/pricingUtils';

interface PricingCalculatorProps {
  data: any;
  updateData: (data: any) => void;
}

interface PricingPackage {
  id: string;
  name: string;
  icon: any;
  basePrice: number;
  features: string[];
  description: string;
  recommended?: boolean;
}

interface AdditionalService {
  id: string;
  name: string;
  icon: any;
  price: number;
  description: string;
  included: boolean;
}

const PricingCalculator = ({ data, updateData }: PricingCalculatorProps) => {
  const [selectedPackage, setSelectedPackage] = useState<string>(data.pricing?.selectedPackage || '');
  const [additionalServices, setAdditionalServices] = useState<string[]>(data.pricing?.additionalServices || []);
  const [customizationLevel, setCustomizationLevel] = useState<number[]>(data.pricing?.customizationLevel || [3]);
  const [rushDelivery, setRushDelivery] = useState<boolean>(data.pricing?.rushDelivery || false);

  const packages: PricingPackage[] = [
    {
      id: 'basic',
      name: 'پایه',
      icon: Star,
      basePrice: 500000,
      description: 'مناسب برای وب‌سایت‌های شخصی و کسب‌وکارهای کوچک',
      features: [
        'تا 5 ماژول',
        'طراحی ریسپانسیو',
        'سئو پایه',
        'پشتیبانی 3 ماهه',
        'هاستینگ 1 ساله'
      ]
    },
    {
      id: 'professional',
      name: 'حرفه‌ای',
      icon: Zap,
      basePrice: 1200000,
      description: 'مناسب برای کسب‌وکارهای متوسط با نیازهای پیشرفته‌تر',
      recommended: true,
      features: [
        'تا 10 ماژول',
        'طراحی اختصاصی',
        'سئو پیشرفته',
        'پشتیبانی 6 ماهه',
        'هاستینگ 1 ساله',
        'فرم‌های پیشرفته',
        'تحلیل آمار'
      ]
    },
    {
      id: 'enterprise',
      name: 'سازمانی',
      icon: Crown,
      basePrice: 2500000,
      description: 'مناسب برای شرکت‌ها و کسب‌وکارهای بزرگ',
      features: [
        'ماژول‌های نامحدود',
        'طراحی کاملاً سفارشی',
        'سئو پیشرفته + بازاریابی',
        'پشتیبانی 1 ساله',
        'هاستینگ premium',
        'امکانات e-commerce',
        'یکپارچه‌سازی سیستم‌ها',
        'مشاوره اختصاصی'
      ]
    }
  ];

  const additionalServicesData: AdditionalService[] = [
    {
      id: 'logo_design',
      name: 'طراحی لوگو',
      icon: Palette,
      price: 300000,
      description: 'طراحی لوگوی حرفه‌ای و منحصر به فرد',
      included: false
    },
    {
      id: 'mobile_app',
      name: 'اپلیکیشن موبایل',
      icon: Smartphone,
      price: 1500000,
      description: 'اپلیکیشن موبایل مکمل وب‌سایت',
      included: false
    },
    {
      id: 'domain_ssl',
      name: 'دامنه + SSL',
      icon: Globe,
      price: 150000,
      description: 'دامنه اختصاصی و گواهی امنیتی SSL',
      included: false
    },
    {
      id: 'security',
      name: 'امنیت پیشرفته',
      icon: Shield,
      price: 400000,
      description: 'فایروال و حفاظت در برابر حملات',
      included: false
    },
    {
      id: 'seo_premium',
      name: 'سئو premium',
      icon: Rocket,
      price: 600000,
      description: 'بهینه‌سازی کامل برای موتورهای جستجو',
      included: false
    },
    {
      id: 'support_24_7',
      name: 'پشتیبانی 24/7',
      icon: HeadphonesIcon,
      price: 500000,
      description: 'پشتیبانی کامل در تمام ساعات شبانه‌روز',
      included: false
    }
  ];

  // Use centralized pricing calculations
  const pricingBreakdown = calculateTotalPrice({
    siteType: data.siteType,
    modules: data.modules,
    pricing: {
      selectedPackage,
      additionalServices,
      customizationLevel,
      rushDelivery
    }
  });

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    updatePricingData({ selectedPackage: packageId });
  };

  const toggleAdditionalService = (serviceId: string) => {
    const updatedServices = additionalServices.includes(serviceId)
      ? additionalServices.filter(id => id !== serviceId)
      : [...additionalServices, serviceId];
    
    setAdditionalServices(updatedServices);
    updatePricingData({ additionalServices: updatedServices });
  };

  const handleCustomizationLevelChange = (value: number[]) => {
    setCustomizationLevel(value);
    updatePricingData({ customizationLevel: value });
  };

  const handleRushDeliveryChange = (checked: boolean) => {
    setRushDelivery(checked);
    updatePricingData({ rushDelivery: checked });
  };

  const updatePricingData = (updates: any) => {
    const pricingData = {
      selectedPackage,
      additionalServices,
      customizationLevel,
      rushDelivery,
      totalPrice: pricingBreakdown.totalPrice,
      ...updates
    };
    
    updateData({ 
      pricing: pricingData
    });
  };

  // Update pricing whenever dependencies change
  useEffect(() => {
    updatePricingData({});
  }, [selectedPackage, additionalServices, customizationLevel, rushDelivery, data.modules]);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">محاسبه قیمت هوشمند</h2>
        <p className="text-muted-foreground">
          قیمت نهایی براساس انتخاب‌های شما به‌صورت پویا محاسبه می‌شود
        </p>
      </div>

      {/* Package Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">انتخاب پکیج</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            const isSelected = selectedPackage === pkg.id;
            
            return (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5 transform scale-105'
                    : 'hover:shadow-lg hover:ring-1 hover:ring-primary/50'
                } ${pkg.recommended ? 'border-primary' : ''}`}
                onClick={() => handlePackageSelect(pkg.id)}
              >
                <CardHeader className="text-center relative">
                  {pkg.recommended && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      پیشنهادی
                    </Badge>
                  )}
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(pkg.basePrice)} تومان
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {pkg.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Customization Level */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">سطح سفارشی‌سازی</h3>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>سطح پیچیدگی طراحی:</span>
                <Badge variant="outline">سطح {customizationLevel[0]}</Badge>
              </div>
              <Slider
                value={customizationLevel}
                onValueChange={handleCustomizationLevelChange}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>ساده</span>
                <span>متوسط</span>
                <span>پیشرفته</span>
              </div>
              <p className="text-sm text-muted-foreground">
                سطح بالاتر شامل انیمیشن‌های پیچیده‌تر، طراحی منحصر به فرد و قابلیت‌های تعاملی بیشتر است
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Services */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">خدمات اضافی</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {additionalServicesData.map((service) => {
            const Icon = service.icon;
            const isSelected = additionalServices.includes(service.id);
            
            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                }`}
                onClick={() => toggleAdditionalService(service.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        {formatPrice(service.price)} تومان
                      </div>
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleAdditionalService(service.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Rush Delivery */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-warning" />
              <div>
                <h4 className="font-medium">تحویل فوری (نصف زمان)</h4>
                <p className="text-sm text-muted-foreground">
                  پروژه شما در نصف زمان معمول تحویل داده می‌شود
                </p>
              </div>
            </div>
            <div className="text-left">
              <div className="font-semibold text-warning">
                +30% هزینه اضافی
              </div>
              <Switch
                checked={rushDelivery}
                onCheckedChange={handleRushDeliveryChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            جزئیات محاسبه هزینه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Package Cost */}
          {selectedPackage && (
            <div className="flex justify-between items-center py-2">
              <span>پکیج {packages.find(p => p.id === selectedPackage)?.name}</span>
              <span className="font-semibold">
                {formatPrice(packages.find(p => p.id === selectedPackage)?.basePrice || 0)} تومان
              </span>
            </div>
          )}

          {/* Modules Cost */}
          {data.modules && data.modules.length > 0 && (
            <div>
              <div className="flex justify-between items-center py-2">
                <span>ماژول‌ها و سفارشی‌سازی</span>
                <span className="font-semibold">{formatPrice(pricingBreakdown.modulesPrice)} تومان</span>
              </div>
              <div className="ml-4 space-y-1">
                {data.modules.map((module: any) => {
                  const moduleConfig = PRICING_CONFIG.modules[module.id as keyof typeof PRICING_CONFIG.modules];
                  const basePrice = moduleConfig?.basePrice || 0;
                  const complexityMultiplier = customizationLevel[0] / 5;
                  const finalPrice = Math.round(basePrice * (1 + complexityMultiplier));
                  
                  return (
                    <div key={module.id} className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>• {moduleConfig?.name || module.name}</span>
                      <span>{formatPrice(finalPrice)} تومان</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Services */}
          {additionalServices.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex justify-between items-center py-2">
                  <span>خدمات اضافی</span>
                  <span className="font-semibold">{formatPrice(pricingBreakdown.additionalServicesPrice)} تومان</span>
                </div>
                <div className="ml-4 space-y-1">
                  {additionalServices.map((serviceId) => {
                    const service = additionalServicesData.find(s => s.id === serviceId);
                    return (
                      <div key={serviceId} className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>• {service?.name}</span>
                        <span>{formatPrice(service?.price || 0)} تومان</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Rush Delivery Fee */}
          {rushDelivery && (
            <>
              <Separator />
              <div className="flex justify-between items-center py-2 text-warning">
                <span>هزینه تحویل فوری</span>
                <span className="font-semibold">{formatPrice(pricingBreakdown.rushDeliveryFee)} تومان</span>
              </div>
            </>
          )}

          <Separator />
          
          {/* Total */}
          <div className="flex justify-between items-center py-3 text-lg font-bold bg-primary/5 px-4 rounded-lg">
            <span>مجموع هزینه نهایی</span>
            <span className="text-primary">{formatPrice(pricingBreakdown.totalPrice)} تومان</span>
          </div>
        </CardContent>
      </Card>

      {/* What's Included Summary */}
      <Card className="bg-gradient-to-r from-success/5 to-info/5">
        <CardHeader>
          <CardTitle className="text-success">✓ شامل این موارد است:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                طراحی ریسپانسیو (موبایل و دسکتاپ)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                بهینه‌سازی سرعت و عملکرد
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                تست کامل در مرورگرهای مختلف
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                آموزش کار با پنل مدیریت
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                یک سال گارانتی رفع اشکال
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                پشتیبانی فنی دوره‌ای
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                بک‌آپ خودکار هفتگی
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                اتصال به گوگل آنالیتیکس
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingCalculator;