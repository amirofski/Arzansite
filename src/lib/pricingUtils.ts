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
}

export interface PricingBreakdown {
  basePrice: number;
  pagesCost: number;
  sectionsCost: number;
  brandingCost: number;
  domainCost: number;
  totalPrice: number;
  totalSections: number;
  pagesCount: number;
}

// New simplified pricing configuration
export const PRICING_CONFIG = {
  basePrice: 2500000, // 2,500,000 تومان base price for 1 page with any sections
  additionalPageCost: 500000, // 500,000 تومان per additional page
  additionalSectionCost: 250000, // 250,000 تومان per section beyond 6 total sections
  maxFreeSections: 6, // Maximum free sections across all pages
  branding: {
    logoIntegration: 200000, // 200,000 تومان for logo integration
  }
};

export const calculateDynamicDesignPrice = (data: any): { 
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
    totalSections = pages.reduce((total: number, page: any) => total + page.sections.length, 0);
  } else {
    // Fallback for old structure
    pagesCount = data.pages?.length || 1;
    totalSections = pagesCount * 4; // Assume 4 sections per page
  }

  // New pricing rules:
  // 1. Base price: 2,500,000 تومان for one page design with any sections
  // 2. Multi-page: additional cost for extra pages (500,000 تومان per page)
  // 3. More than 6 total sections: additional cost (250,000 تومان per section)

  let pagesCost = 0;
  if (pagesCount > 1) {
    // Multi-page design: additional cost for extra pages
    pagesCost = (pagesCount - 1) * PRICING_CONFIG.additionalPageCost;
  }

  // Additional cost for more than 6 total sections
  let sectionsCost = 0;
  if (totalSections > PRICING_CONFIG.maxFreeSections) {
    const extraSections = totalSections - PRICING_CONFIG.maxFreeSections;
    sectionsCost = extraSections * PRICING_CONFIG.additionalSectionCost;
  }
  
  return { pagesCost, sectionsCost, totalSections, pagesCount };
};

export const calculateBrandingCost = (branding: any): number => {
  let cost = 0;
  
  if (branding?.logo) {
    cost += PRICING_CONFIG.branding.logoIntegration;
  }
  
  return cost;
};

export const calculateDomainCost = (userInfo: any): number => {
  let cost = 0;
  
  if (userInfo?.additionalDomains) {
    cost = userInfo.additionalDomains.reduce((total: number, domain: any) => total + domain.price, 0);
  }
  
  return cost;
};

export const calculateTotalPrice = (data: PricingData): PricingBreakdown => {
  // Calculate dynamic design costs
  const { pagesCost, sectionsCost, totalSections, pagesCount } = calculateDynamicDesignPrice(data);
  
  // Base price is always 2,500,000 تومان
  const basePrice = PRICING_CONFIG.basePrice;
  
  // Calculate branding cost
  const brandingCost = calculateBrandingCost(data.branding);
  
  // Calculate domain cost
  const domainCost = calculateDomainCost(data.userInfo);
  
  // Calculate total price
  const totalPrice = basePrice + pagesCost + sectionsCost + brandingCost + domainCost;
  
  return {
    basePrice,
    pagesCost,
    sectionsCost,
    brandingCost,
    domainCost,
    totalPrice,
    totalSections,
    pagesCount
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fa-IR').format(price);
};