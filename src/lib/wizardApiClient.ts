import { wizardErrorHandler, WizardErrorHandler } from './wizardErrorHandler';

// API base configuration
const API_BASE = 'https://nest.arzansite.com';

// Types for API requests and responses
export interface SaveProgressDto {
  sessionId: string;
  userId?: string;
  [key: string]: any;
}

export interface WizardOrderDto {
  id: string;
  sessionId: string;
  userId?: string;
  siteType: 'personal' | 'business' | '';
  websiteFramework?: any;
  branding?: any;
  additionalServices?: any;
  domains?: any;
  pricing?: any;
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

// Generic API call wrapper with error handling
export const apiCall = async <T>(
  apiFunction: () => Promise<T>,
  context: string,
  retryCount: number = 3
): Promise<T> => {
  try {
    return await WizardErrorHandler.retryOperation(apiFunction, retryCount);
  } catch (error) {
    const wizardError = WizardErrorHandler.handle(error, context);
    throw wizardError;
  }
};

// Get authentication headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('jwt_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Core API Functions

// Save wizard progress
export const saveWizardProgress = async (data: SaveProgressDto): Promise<WizardOrderDto> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/save-progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'saveWizardProgress');
};

// Get wizard progress
export const getWizardProgress = async (sessionId: string, userId?: string): Promise<WizardOrderDto> => {
  return apiCall(async () => {
    const url = userId 
      ? `${API_BASE}/progress/user/${userId}`
      : `${API_BASE}/progress/${sessionId}`;
      
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'getWizardProgress');
};

// Complete wizard order
export const completeWizardOrder = async (data: any): Promise<WizardOrderDto> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/complete-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'completeWizardOrder');
};

// Calculate pricing
export const calculatePricing = async (data: any): Promise<PricingDto> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/calculate-price`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'calculatePricing');
};

// Domain Management APIs

// Get available domain extensions
export const getAvailableDomainExtensions = async (): Promise<DomainExtension[]> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/domains/extensions`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'getAvailableDomainExtensions');
};

// Check domain availability
export const checkDomainAvailability = async (
  domain: string, 
  extension: string
): Promise<DomainAvailability> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/domains/check-availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ domain, extension }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'checkDomainAvailability');
};

// Get domain prices
export const getDomainPrices = async (): Promise<DomainExtension[]> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/domains/prices`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'getDomainPrices');
};

// Order Management APIs

// Get user orders
export const getUserOrders = async (userId: string): Promise<WizardOrderDto[]> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/orders/user/${userId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'getUserOrders');
};

// Update order
export const updateOrder = async (
  orderId: string, 
  data: any
): Promise<WizardOrderDto> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'updateOrder');
};

// File Management APIs

// Upload project files
export const uploadProjectFiles = async (
  orderId: string,
  sessionId: string,
  files: File[]
): Promise<{ uploadedFiles: ProjectFile[]; errors: string[] }> => {
  return apiCall(async () => {
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('sessionId', sessionId);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE}/upload-files`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }

    return response.json();
  }, 'uploadProjectFiles');
};

// List order files
export const listOrderFiles = async (orderId: string): Promise<ProjectFile[]> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/orders/${orderId}/files`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
    
    return response.json();
  }, 'listOrderFiles');
};

// Delete file
export const deleteFile = async (fileId: string, orderId: string): Promise<void> => {
  return apiCall(async () => {
    const response = await fetch(`${API_BASE}/files/${fileId}?orderId=${orderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status },
        message: errorData.message || `HTTP error! status: ${response.status}`,
        details: errorData
      };
    }
  }, 'deleteFile');
};

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

  calculatePricing: async (data: any): Promise<PricingDto> => {
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
