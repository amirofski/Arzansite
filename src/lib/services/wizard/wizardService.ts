// Wizard Service for ArzanSite
// Handles all wizard-related API operations with proper field mapping and error handling

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface CompleteOrderRequest {
  session_id: string;  // Changed from sessionId to match backend
  order: {
    title: string;
    description: string;
    priceTomans: number;
    comments?: string;
    site_type?: 'personal' | 'business';  // Changed from siteType to match backend
  };
  design_snapshot: {  // Changed from designSnapshot to match backend
    websiteFramework: {
      dynamicDesign: {
        pages: Array<{
          id: string;
          name: string;
          sections: Array<{
            id: string;
            section_type: string;  // Changed from sectionType to match backend
            layout_id: string;     // Changed from layoutId to match backend
            order: number;
            custom_data: Record<string, unknown>;  // Changed from customData to match backend
          }>;
          canvas_dimensions: {     // Changed from canvasDimensions to match backend
            width: number;
            height: number;
          };
        }>;
        current_page_id: string;   // Changed from currentPageId to match backend
      };
    };
    branding: {
      primaryColor: string;
      fontFamily: string;
      logo?: string;
    };
    additionalServices: {
      socialMediaIntegration: boolean;
      seoOptimization: boolean;
      analyticsSetup: boolean;
      maintenancePlan: boolean;
      rushDelivery: boolean;
    };
    domains: {
      primary_domain: string;      // Changed from primaryDomain to match backend
      additional_domains: string[]; // Changed from additionalDomains to match backend
    };
    pricing: {
      additionalServices: Record<string, boolean>;
      customizationLevel: number[];
      rushDelivery: boolean;
      totalPrice: number;
    };
    paymentOptions: Record<string, unknown>;
  };
}

// Note: save-for-later is handled via /orders; no separate wizard interface required

export interface CalculatePriceRequest {
  siteType: string;
  modules: Array<{
    id: string;
    complexity: number;
    customizations?: Record<string, unknown>;
  }>;
  additionalServices?: Record<string, boolean>;
  rushDelivery?: boolean;
  paymentCycle?: 'monthly' | 'annual';
}

export interface SaveDesignRequest {
  orderId: string;
  designData: {
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
  options?: {
    theme?: string;
    font?: string;
    spacing?: string;
    customCss?: string;
  };
}

export interface CheckDomainRequest {
  domain: string;
  extension: string;
}

// Response interfaces
export interface OrderResponse {
  success: true;
  order_id: string;        // Changed from orderId to match backend
  invoiceId: string;
  message: string;
  order: {
    id: string;
    title: string;
    description: string;
    price: number;          // Price in Rials (Tomans × 10)
    status: 'pending';
    user_id: string;        // Changed from userId to match backend
    created_at: string;     // Changed from createdAt to match backend
    updated_at: string;     // Changed from updatedAt to match backend
  };
  invoice: {
    id: string;
    order_id: string;       // Changed from orderId to match backend
    user_id: string;        // Changed from userId to match backend
    amount: number;          // Amount in Rials
    dueDate: string;        // Due date (30 days from creation)
    status: 'pending';
    description: string;
    created_at: string;     // Changed from createdAt to match backend
    updated_at: string;     // Changed from updatedAt to match backend
  };
}

export interface PriceCalculationResponse {
  success: boolean;
  price: number;
  breakdown: {
    basePrice: number;
    modulesPrice: number;
    additionalServicesPrice: number;
    rushDeliveryPrice: number;
    totalPrice: number;
  };
  currency: string;
}

export interface DomainAvailabilityResponse {
  available: boolean;
  domain: string;
  extension: string;
  price: number;
  description: string;
  message: string;
  error?: string;
  checkedAt?: string;
}

export interface DesignResponse {
  success: boolean;
  design: {
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
  options?: {
    theme?: string;
    font?: string;
    spacing?: string;
    customCss?: string;
  };
}

export interface SaveProgressResponse {
  success: boolean;
  sessionId: string;
  message: string;
}

export class WizardService extends BaseApiService {
  /**
   * Complete wizard order
   */
  async completeOrder(request: CompleteOrderRequest): Promise<OrderResponse> {
    try {
      // Backend expects total_amount (Tomans) inside order
      const payload = {
        session_id: request.session_id,
        order: {
          title: request.order.title,
          description: request.order.description,
          total_amount: request.order.priceTomans,
          comments: request.order.comments,
          site_type: request.order.site_type,
          order_number: `WZ-${Date.now()}`,
          currency: 'IRR',
        },
        design_snapshot: request.design_snapshot,
      };
      const snakeCaseRequest = FieldMapper.transformRequest(payload);
      
      const response = await withRetry(() =>
        this.request<OrderResponse>('/wizard/complete-order', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.completeOrder');
      throw error;
    }
  }

  // Save for later flow is implemented via OrdersService.createOrderFromWizard

  /**
   * Calculate order price
   */
  async calculatePrice(request: CalculatePriceRequest): Promise<PriceCalculationResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<PriceCalculationResponse>('/wizard/calculate-price', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.calculatePrice');
      throw error;
    }
  }

  /**
   * Save design data
   */
  async saveDesign(request: SaveDesignRequest): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>('/wizard/save-design', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.saveDesign');
      throw error;
    }
  }

  /**
   * Get design data
   */
  async getDesign(orderId: string): Promise<DesignResponse> {
    try {
      const response = await withRetry(() =>
        this.request<DesignResponse>(`/wizard/design/${orderId}`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.getDesign');
      throw error;
    }
  }

  /**
   * Save wizard progress - Use existing backend endpoint /wizard/save-session
   */
  async saveProgress(sessionId: string, data: Record<string, unknown>): Promise<SaveProgressResponse> {
    try {
      const payload = {
        session_id: sessionId,
        wizard_data: data,
      };
      const snakeCaseRequest = FieldMapper.transformRequest(payload);
      let response: SaveProgressResponse;
      try {
        response = await withRetry(() =>
          this.request<SaveProgressResponse>('/wizard/save-session', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
      } catch (err) {
        // If endpoint not found (404), fallback to local storage
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('404') || message.toLowerCase().includes('not found')) {
          localStorage.setItem(`wizard_progress_${sessionId}`, JSON.stringify({ data }));
          localStorage.setItem('wizard_session_id', sessionId);
          return { success: false, sessionId, message: 'Saved locally (backend endpoint missing)' };
        }
        throw err;
      }
      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.saveProgress');
      throw error;
    }
  }

  /**
   * Load wizard progress - Using localStorage as fallback since endpoint doesn't exist
   */
  async loadProgress(sessionId: string): Promise<Record<string, unknown>> {
    try {
      // Since the backend endpoint doesn't exist, we'll use localStorage as fallback
      const savedProgress = localStorage.getItem(`wizard_progress_${sessionId}`);
      
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        return progressData.data || {};
      }
      
      return {};
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.loadProgress');
      return {};
    }
  }

  /**
   * Update design options
   */
  async updateDesignOptions(orderId: string, options: Record<string, unknown>): Promise<{ success: boolean }> {
    // Narrow type to Record<string, unknown>
    try {
      const snakeCaseRequest = FieldMapper.transformRequest({ options });
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(`/wizard/design/${orderId}/options`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.updateDesignOptions');
      throw error;
    }
  }

  /**
   * Get design options
   */
  async getDesignOptions(orderId: string): Promise<Record<string, unknown>> {
    try {
      const response = await withRetry(() =>
        this.request<Record<string, unknown>>(`/wizard/design/${orderId}/options`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.getDesignOptions');
      throw error;
    }
  }

  /**
   * Update preview URL
   */
  async updatePreviewUrl(orderId: string, previewUrl: string): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest({ previewUrl });
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(`/wizard/design/${orderId}/preview-url`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.updatePreviewUrl');
      throw error;
    }
  }

  /**
   * Get order design summary
   */
  async getOrderDesignSummary(orderId: string): Promise<{
    totalPages: number;
    totalSections: number;
    hasDesign: boolean;
    previewUrl: string | null;
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          totalPages: number;
          totalSections: number;
          hasDesign: boolean;
          previewUrl: string | null;
        }>(`/wizard/order/${orderId}/design-summary`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.getOrderDesignSummary');
      throw error;
    }
  }

  /**
   * Check domain availability - Note: This endpoint doesn't exist on the backend
   * Domain checking should be handled by the admin service or a different endpoint
   */
  async checkDomainAvailability(request: CheckDomainRequest): Promise<DomainAvailabilityResponse> {
    // Since the endpoint doesn't exist, we'll return a mock response
    // In production, this should be implemented with the correct endpoint
    console.warn('Domain checking endpoint /wizard/check-domain does not exist');
    
    return {
      available: false,
      message: 'Domain checking not available',
      domain: request.domain,
      extension: request.extension,
      price: 0,
    } as unknown as DomainAvailabilityResponse;
  }
}

// Export singleton instance
export const wizardService = new WizardService();