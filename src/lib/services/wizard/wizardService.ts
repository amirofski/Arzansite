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


export class WizardService extends BaseApiService {
  /**
   * Upload files for an order via wizard endpoint
   */
  async uploadFiles(args: { orderId: string; files: File[]; sessionId?: string; description?: string }): Promise<{ success: boolean; items?: any[] }> {
    try {
      const fd = new FormData();
      fd.append('order_id', args.orderId);
      if (args.sessionId) fd.append('session_id', args.sessionId);
      if (args.description) fd.append('description', args.description);
      args.files.forEach((f) => fd.append('files[]', f, f.name));

      const response = await withRetry(() =>
        this.request<{ success: boolean; items?: any[] }>('/wizard/upload-files', {
          method: 'POST',
          body: fd,
        })
      );
      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.uploadFiles');
      throw error;
    }
  }

  /**
   * List files for an order via wizard endpoint
   */
  async listOrderFiles(orderId: string): Promise<{ items: any[] }> {
    try {
      const response = await withRetry(() =>
        this.request<any>(`/wizard/orders/${encodeURIComponent(orderId)}/files`)
      );
      const items = Array.isArray(response?.items) ? response.items : (Array.isArray(response) ? response : (Array.isArray(response?.files) ? response.files : []));
      return { items: FieldMapper.transformResponse(items) };
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.listOrderFiles');
      throw error;
    }
  }

  /**
   * Delete a wizard project file
   */
  async deleteOrderFile(fileId: string, orderId: string): Promise<{ success: boolean }> {
    try {
      const endpoint = `/wizard/files/${encodeURIComponent(fileId)}?order_id=${encodeURIComponent(orderId)}`;
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(endpoint, { method: 'DELETE' })
      );
      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WizardService.deleteOrderFile');
      throw error;
    }
  }

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

  // Deprecated: saveProgress removed in unified server-only flow

  // Deprecated: loadProgress removed in unified server-only flow

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