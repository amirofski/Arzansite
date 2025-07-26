export interface PricingData {
  siteType: 'personal' | 'business' | '';
  modules?: Array<{
    id: string;
    name: string;
    nameEn: string;
    complexity: number;
  }>;
  pricing?: {
    selectedPackage: string;
    additionalServices: string[];
    customizationLevel: number[];
    rushDelivery: boolean;
  };
}

export interface PricingBreakdown {
  basePrice: number;
  modulesPrice: number;
  additionalServicesPrice: number;
  packagePrice: number;
  rushDeliveryFee: number;
  totalPrice: number;
  packageDiscount: number;
}

// Base pricing configuration
export const PRICING_CONFIG = {
  siteTypes: {
    personal: { basePrice: 500000, name: 'شخصی' },
    business: { basePrice: 1200000, name: 'تجاری' }
  },
  packages: {
    basic: { basePrice: 500000, name: 'پایه' },
    professional: { basePrice: 1200000, name: 'حرفه‌ای' },
    enterprise: { basePrice: 2500000, name: 'سازمانی' }
  },
  modules: {
    header: { basePrice: 0, name: 'هدر' },
    hero: { basePrice: 100000, name: 'قسمت قهرمان' },
    footer: { basePrice: 0, name: 'پاورقی' },
    about: { basePrice: 150000, name: 'درباره ما' },
    services: { basePrice: 200000, name: 'خدمات' },
    portfolio: { basePrice: 250000, name: 'نمونه کارها' },
    blog: { basePrice: 300000, name: 'وبلاگ' },
    contact: { basePrice: 100000, name: 'تماس با ما' },
    products: { basePrice: 400000, name: 'محصولات' },
    testimonials: { basePrice: 150000, name: 'نظرات مشتریان' },
    booking: { basePrice: 800000, name: 'رزرو آنلاین' },
    search: { basePrice: 500000, name: 'جستجوی پیشرفته' },
    analytics: { basePrice: 600000, name: 'آنالیتیکس' }
  },
  additionalServices: {
    logo_design: { price: 300000, name: 'طراحی لوگو' },
    mobile_app: { price: 1500000, name: 'اپلیکیشن موبایل' },
    domain_ssl: { price: 150000, name: 'دامنه + SSL' },
    security: { price: 400000, name: 'امنیت پیشرفته' },
    seo_premium: { price: 600000, name: 'سئو premium' },
    support_24_7: { price: 500000, name: 'پشتیبانی 24/7' }
  }
};

export const calculateModulesPrice = (modules: any[], customizationLevel: number = 3): number => {
  if (!modules || modules.length === 0) return 0;
  
  let total = 0;
  
  modules.forEach((module: any) => {
    const moduleConfig = PRICING_CONFIG.modules[module.id as keyof typeof PRICING_CONFIG.modules];
    if (moduleConfig) {
      let modulePrice = moduleConfig.basePrice;
      
      // Add complexity multiplier based on customization level (1-5 scale)
      const complexityMultiplier = customizationLevel / 5;
      modulePrice *= (1 + complexityMultiplier);
      
      total += modulePrice;
    }
  });
  
  return Math.round(total);
};

export const calculateAdditionalServicesPrice = (services: string[]): number => {
  return services.reduce((total, serviceId) => {
    const service = PRICING_CONFIG.additionalServices[serviceId as keyof typeof PRICING_CONFIG.additionalServices];
    return total + (service?.price || 0);
  }, 0);
};

export const calculatePackagePrice = (packageId: string): number => {
  const pkg = PRICING_CONFIG.packages[packageId as keyof typeof PRICING_CONFIG.packages];
  return pkg?.basePrice || 0;
};

export const calculateRushDeliveryFee = (baseTotal: number, rushDelivery: boolean): number => {
  if (!rushDelivery) return 0;
  return Math.round(baseTotal * 0.3); // 30% rush fee
};

export const calculateTotalPrice = (data: PricingData): PricingBreakdown => {
  const siteTypeConfig = data.siteType ? PRICING_CONFIG.siteTypes[data.siteType] : null;
  const basePrice = siteTypeConfig?.basePrice || 0;
  
  const customizationLevel = data.pricing?.customizationLevel?.[0] || 3;
  const modulesPrice = calculateModulesPrice(data.modules || [], customizationLevel);
  
  const additionalServicesPrice = calculateAdditionalServicesPrice(
    data.pricing?.additionalServices || []
  );
  
  const packagePrice = calculatePackagePrice(data.pricing?.selectedPackage || '');
  
  // Calculate the main cost (either package price or site type base + modules, whichever is higher)
  const mainCost = Math.max(packagePrice, basePrice + modulesPrice);
  
  // Package discount if modules cost less than package
  const packageDiscount = packagePrice > 0 ? Math.max(0, packagePrice - (basePrice + modulesPrice)) : 0;
  
  const subtotal = mainCost + additionalServicesPrice;
  const rushDeliveryFee = calculateRushDeliveryFee(subtotal, data.pricing?.rushDelivery || false);
  
  const totalPrice = subtotal + rushDeliveryFee;
  
  return {
    basePrice,
    modulesPrice,
    additionalServicesPrice,
    packagePrice,
    rushDeliveryFee,
    totalPrice,
    packageDiscount
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fa-IR').format(price);
};