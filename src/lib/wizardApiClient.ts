// NOTE: Frontend uses mock-only client in this module.
// All real API calls should go through `apiClient` or `sessionApiService`.

// Types for API requests and responses
export interface SaveProgressDto {
  sessionId: string;
  userId?: string;
  siteType?: 'personal' | 'business' | '';
  websiteFramework?: unknown;
  branding?: unknown;
  additionalServices?: unknown;
  domains?: unknown;
  pricing?: PricingDto | unknown;
}

export interface WizardOrderDto {
  id: string;
  sessionId: string;
  userId?: string;
  siteType: 'personal' | 'business' | '';
  websiteFramework?: unknown;
  branding?: unknown;
  additionalServices?: unknown;
  domains?: unknown;
  pricing?: PricingDto | unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingDto {
  basePrice: number;
  pagesCost: number;
  sectionsCost: number;
  additionalServicesCost: number;
  domainCost: number;
  totalPrice: number;
  monthlyPrice: number;
  annualPrice: number;
  annualDiscount: number;
}

export interface DomainExtension {
  id: string;
  extension: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: string;
}

export interface DomainAvailability {
  domain: string;
  extension: string;
  available: boolean;
  price?: number;
  message?: string;
}

export interface ProjectFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// All real endpoints were removed from this module to avoid localStorage JWT usage.
// Use `apiClient`/`sessionApiService` for any real network calls.

// Mock API functions for development (when backend is not ready)
export const mockApiClient = {
  saveWizardProgress: async (data: SaveProgressDto): Promise<WizardOrderDto> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: 'mock_' + Date.now(),
      sessionId: data.sessionId,
      userId: data.userId,
      siteType: data.siteType || '',
      websiteFramework: data.websiteFramework,
      branding: data.branding,
      additionalServices: data.additionalServices,
      domains: data.domains,
      pricing: data.pricing,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getWizardProgress: async (sessionId: string): Promise<WizardOrderDto> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const savedProgress = localStorage.getItem(`wizard_progress_${sessionId}`);
    if (savedProgress) {
      return JSON.parse(savedProgress);
    }
    
    throw new Error('Progress not found');
  },

  calculatePricing: async (_data: unknown): Promise<PricingDto> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock pricing calculation
    return {
      basePrice: 2500000,
      pagesCost: 0,
      sectionsCost: 0,
      additionalServicesCost: 0,
      domainCost: 0,
      totalPrice: 2500000,
      monthlyPrice: 2500000,
      annualPrice: 27000000,
      annualDiscount: 3000000,
    };
  },
};
