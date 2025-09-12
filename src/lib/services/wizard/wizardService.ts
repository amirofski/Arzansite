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

      // Primary per integration guide: /wizard/complete-order
      try {
        const primary = await withRetry(() =>
          this.request<OrderResponse>('/wizard/complete-order', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(primary);
      } catch (e) {
        // Fallback: alternate route
        const fallback = await withRetry(() =>
          this.request<OrderResponse>('/wizard/complete', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(fallback);
      }
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
        this.request<{ success: boolean }>('/wizard/designs', {
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
        this.request<DesignResponse>(`/wizard/designs/${orderId}`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.getDesign');
      throw error;
    }
  }

  /**
   * Save wizard progress - Only POST /wizard/save-progress
   * Optionally include user_id when provided via opts
   */
  async saveProgress(
    sessionId: string,
    data: Record<string, unknown>,
    opts?: {
      userId?: string;
      currentStep?: number;
      isCompleted?: boolean;
      status?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  ): Promise<SaveProgressResponse> {
    try {
      const nowISO = new Date().toISOString();
      const isCompleted = !!opts?.isCompleted;
      const payload: Record<string, unknown> = {
        session_id: sessionId,
        // Backend expects wizard_data as string in collection; send stringified JSON
        wizard_data: JSON.stringify(data),
        current_step: typeof opts?.currentStep === 'number' ? opts.currentStep : 1,
        is_completed: isCompleted,
        status: typeof opts?.status === 'string' ? opts.status : (isCompleted ? 'completed' : 'in_progress'),
        created_at: opts?.createdAt || nowISO,
        updated_at: opts?.updatedAt || nowISO,
      };
      if (opts?.userId) {
        (payload as any).user_id = opts.userId;
      }
      if (typeof opts?.currentStep === 'number') {
        (payload as any).current_step = opts.currentStep;
      }
      const snakeCaseRequest = FieldMapper.transformRequest(payload);

      const primary = await withRetry(() =>
        this.request<SaveProgressResponse>('/wizard/save-progress', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );
      return FieldMapper.transformResponse(primary);
    } catch (error) {
      // Best-effort local backup to avoid data loss
      try {
        localStorage.setItem(`wizard_progress_${sessionId}`, JSON.stringify(data));
        localStorage.setItem('wizard_session_id', sessionId);
      } catch {}
      ErrorHandler.logError(error, 'WizardService.saveProgress');
      throw error;
    }
  }

  /**
   * Load wizard progress - Using localStorage as fallback since endpoint doesn't exist
   */
  async loadProgress(sessionId: string): Promise<Record<string, unknown>> {
    try {
      // Try server endpoints first
      const tryParseWizard = (obj: any): Record<string, unknown> => {
        if (!obj || typeof obj !== 'object') return {};
        // Prefer explicit wizardData if present
        let wizard = (obj as any).wizardData ?? (obj as any).progressData ?? (obj as any).designData;
        if (typeof wizard === 'string') {
          try {
            wizard = JSON.parse(wizard);
          } catch {}
        }
        if (wizard && typeof wizard === 'object') return wizard as Record<string, unknown>;
        // If no direct wizard payload, return obj as-is (may already be wizard-like)
        return obj as Record<string, unknown>;
      };

      try {
        // Option A (primary): GET /wizard/load-progress/:session_id
        const primary = await withRetry(() =>
          this.request<{ success?: boolean; data?: any }>(`/wizard/load-progress/${encodeURIComponent(sessionId)}`)
        );
        const normalized = FieldMapper.transformResponse(primary);
        if (normalized && typeof normalized === 'object') {
          const inner = (normalized as any).data ?? normalized;
          // If backend returns { wizard_data: "..." } inside data
          const maybeWizardString = (inner as any).wizard_data;
          if (typeof maybeWizardString === 'string') {
            try {
              const parsed = JSON.parse(maybeWizardString);
              if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
            } catch {}
          }
          const parsed = tryParseWizard(inner);
          if (Object.keys(parsed).length > 0) return parsed;
        }
      } catch (e1) {
        const msg = e1 instanceof Error ? e1.message : String(e1);
        const low = msg.toLowerCase();
        if (msg.includes('404') || low.includes('not found') || low.startsWith('cannot ')) {
          // Option B: GET /wizard/progress?session_id=...
          try {
            const query = new URLSearchParams({ session_id: sessionId }).toString();
            const fallback = await withRetry(() =>
              this.request<{ success?: boolean; data?: any }>(`/wizard/progress?${query}`)
            );
            const normalized = FieldMapper.transformResponse(fallback);
            if (normalized && typeof normalized === 'object') {
              const inner = (normalized as any).data ?? normalized;
              const maybeWizardString = (inner as any).wizard_data;
              if (typeof maybeWizardString === 'string') {
                try {
                  const parsed = JSON.parse(maybeWizardString);
                  if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
                } catch {}
              }
              const parsed = tryParseWizard(inner);
              if (Object.keys(parsed).length > 0) return parsed;
            }
          } catch (_) {
            // ignore and use local storage fallback
          }
        }
      }

      // LocalStorage fallback
      const savedProgress = localStorage.getItem(`wizard_progress_${sessionId}`);
      if (savedProgress) {
        try {
          const progressData = JSON.parse(savedProgress);
          const inner = progressData?.data ?? progressData;
          const maybeWizardString = (inner as any).wizard_data;
          if (typeof maybeWizardString === 'string') {
            try {
              const parsed = JSON.parse(maybeWizardString);
              if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
            } catch {}
          }
          const parsed = tryParseWizard(inner);
          if (Object.keys(parsed).length > 0) return parsed;
        } catch {}
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
   * Check domain availability
   * Primary per integration guide: POST /wizard/domains/check-availability
   * Fallback: POST /domains/check-availability
   */
  async checkDomainAvailability(request: CheckDomainRequest): Promise<DomainAvailabilityResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      try {
        const primary = await withRetry(() =>
          this.request<DomainAvailabilityResponse>('/wizard/domains/check-availability', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(primary);
      } catch (err) {
        const fallback = await withRetry(() =>
          this.request<DomainAvailabilityResponse>('/domains/check-availability', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(fallback);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.checkDomainAvailability');
      throw error;
    }
  }
}

// Export singleton instance
export const wizardService = new WizardService();