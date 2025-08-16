export interface PricingData {
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
  // Legacy support for old structure
  pages?: string[];
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
  // New additional services interface
  additionalServices?: {
    seoOptimization?: boolean;
    socialMediaIntegration?: boolean;
    analyticsSetup?: boolean;
    backupService?: boolean;
    maintenancePlan?: boolean;
    rushDelivery?: boolean;
  };
  // New payment cycle interface
  paymentCycle?: 'monthly' | 'annual';
}

export interface PricingBreakdown {
  basePrice: number;
  pagesCost: number;
  sectionsCost: number;
  brandingCost: number;
  domainCost: number;
  additionalServicesCost: number;
  totalPrice: number;
  totalSections: number;
  pagesCount: number;
  monthlyPrice: number;
  annualPrice: number;
  annualDiscount: number;
}

// Updated pricing configuration for new system
export const PRICING_CONFIG = {
  // Base pricing for Full_page or single page with any sections
  basePrice: 2500000, // 2,500,000 تومان
  
  // Multi-page pricing
  additionalPageCost: 1000000, // 1,000,000 تومان per additional page
  additionalSectionCost: 250000, // 250,000 تومان per section
  
  // Additional services pricing
  additionalServices: {
    seoOptimization: 500000, // 500,000 تومان
    socialMediaIntegration: 300000, // 300,000 تومان
    analyticsSetup: 200000, // 200,000 تومان
    backupService: 150000, // 150,000 تومان
    maintenancePlan: 400000, // 400,000 تومان
    rushDelivery: 800000, // 800,000 تومان
  },
  
  // Payment cycle discount
  annualDiscountPercent: 10, // 10% discount for annual payment
  
  branding: {
    logoIntegration: 200000, // 200,000 تومان for logo integration
  }
};

export const calculateDynamicDesignPrice = (data: PricingData): { 
  pagesCost: number; 
  sectionsCost: number; 
  totalSections: number; 
  pagesCount: number 
} => {
  const pages = data.websiteFramework?.dynamicDesign?.pages || [];
  let totalSections = 0;
  let pagesCount = 0;
  
  if (pages.length > 0) {
    pagesCount = pages.length;
    totalSections = pages.reduce((total: number, page) => total + page.sections.length, 0);
  } else {
    // Fallback for old structure
    pagesCount = data.pages?.length || 1;
    totalSections = pagesCount * 4; // Assume 4 sections per page
  }

  // New pricing rules:
  // 1. Single page OR Full_page: Base price only (2,500,000 تومان) - no additional charges
  // 2. Multiple pages: No base price, charge 1,000,000 تومان per page + 250,000 تومان per section

  let pagesCost = 0;
  let sectionsCost = 0;
  
  if (pagesCount === 1) {
    // Single page or Full_page: No additional page cost, no section cost
    pagesCost = 0;
    sectionsCost = 0;
  } else {
    // Multiple pages: No base price, charge for all pages and sections
    pagesCost = pagesCount * PRICING_CONFIG.additionalPageCost; // Charge for ALL pages
    sectionsCost = totalSections * PRICING_CONFIG.additionalSectionCost; // Charge for ALL sections
  }
  
  return { pagesCost, sectionsCost, totalSections, pagesCount };
};

export const calculateAdditionalServicesCost = (services: PricingData['additionalServices']): number => {
  let cost = 0;
  
  if (services?.seoOptimization) cost += PRICING_CONFIG.additionalServices.seoOptimization;
  if (services?.socialMediaIntegration) cost += PRICING_CONFIG.additionalServices.socialMediaIntegration;
  if (services?.analyticsSetup) cost += PRICING_CONFIG.additionalServices.analyticsSetup;
  if (services?.backupService) cost += PRICING_CONFIG.additionalServices.backupService;
  if (services?.maintenancePlan) cost += PRICING_CONFIG.additionalServices.maintenancePlan;
  if (services?.rushDelivery) cost += PRICING_CONFIG.additionalServices.rushDelivery;
  
  return cost;
};

export const calculateBrandingCost = (branding: PricingData['branding']): number => {
  let cost = 0;
  
  if (branding?.logo) {
    cost += PRICING_CONFIG.branding.logoIntegration;
  }
  
  return cost;
};

export const calculateDomainCost = (userInfo: PricingData['userInfo']): number => {
  let cost = 0;
  
  if (userInfo?.additionalDomains) {
    cost = userInfo.additionalDomains.reduce((total: number, domain) => total + domain.price, 0);
  }
  
  return cost;
};

export const calculateTotalPrice = (data: PricingData): PricingBreakdown => {
  // Calculate dynamic design costs
  const { pagesCost, sectionsCost, totalSections, pagesCount } = calculateDynamicDesignPrice(data);
  
  // Base price is always 2,500,000 تومان
  const basePrice = PRICING_CONFIG.basePrice;
  
  // Calculate additional services cost
  const additionalServicesCost = calculateAdditionalServicesCost(data.additionalServices);
  
  // Calculate branding cost
  const brandingCost = calculateBrandingCost(data.branding);
  
  // Calculate domain cost
  const domainCost = calculateDomainCost(data.userInfo);
  
  // Calculate monthly total price
  const monthlyPrice = basePrice + pagesCost + sectionsCost + brandingCost + domainCost + additionalServicesCost;
  
  // Calculate annual price with 10% discount
  const annualDiscount = Math.round(monthlyPrice * (PRICING_CONFIG.annualDiscountPercent / 100));
  const annualPrice = (monthlyPrice * 12) - annualDiscount;
  
  return {
    basePrice,
    pagesCost,
    sectionsCost,
    brandingCost,
    domainCost,
    additionalServicesCost,
    totalPrice: monthlyPrice, // Default to monthly
    totalSections,
    pagesCount,
    monthlyPrice,
    annualPrice,
    annualDiscount
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

export const formatPriceWithUnit = (price: number): string => {
  return `${formatPrice(price)} تومان`;
};