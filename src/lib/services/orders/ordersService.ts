// Orders Service for ArzanSite
// Handles all order-related API operations with proper field mapping and error handling

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface CreateOrderRequest {
  title: string;
  description: string;
  price: number;
  comments?: string;
  totalPages?: number;
  totalSections?: number;
  siteType?: string;
  sessionId?: string;
  wizardData?: unknown;
  paymentStatus?: string;
}

export interface UpdateOrderRequest {
  title?: string;
  description?: string;
  price?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus?: string;
  comments?: string;
  totalPages?: number;
  totalSections?: number;
}

// Response interfaces
export interface Order {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus?: string;
  comments?: string;
  totalPages?: number;
  totalSections?: number;
  userId: string;
  siteType?: string;
  sessionId?: string;
  wizardData?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedOrderData {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_method?: 'wallet' | 'zarinpal';
  transaction_id?: string;
  zarinpal_authority?: string;
  zarinpal_ref_id?: string;
  user_id: string;
  wizard_data: {
    siteType: 'personal' | 'business';
    websiteFramework: Record<string, unknown>;
    branding: Record<string, unknown>;
    additionalServices: Record<string, unknown>;
    domains: Record<string, unknown>;
    pricing: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrderDetailResponse {
  success: boolean;
  order: Order;
  design?: {
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
  invoice?: {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    dueDate: string;
    status: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class OrdersService extends BaseApiService {
  /**
   * Get user orders
   */
  async getOrders(params?: { 
    mine?: boolean; 
    admin?: boolean;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.mine) queryParams.append('mine', 'true');
      if (params?.admin) queryParams.append('admin', 'true');
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      
      const queryString = queryParams.toString();
      const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() =>
        this.request<OrderListResponse>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getOrders');
      throw error;
    }
  }

  /**
   * Get single order
   */
  async getOrder(orderId: string): Promise<OrderDetailResponse> {
    try {
      const response = await withRetry(() =>
        this.request<OrderDetailResponse>(`/orders/${orderId}`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getOrder');
      throw error;
    }
  }

  /**
   * Create new order
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      const enriched = {
        ...request,
        currency: 'IRR',
        order_number: `ORD-${Date.now()}`,
      } as Record<string, unknown>;
      const snakeCaseRequest = FieldMapper.transformRequest(enriched);
      
      const response = await withRetry(() =>
        this.request<Order>('/orders', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.createOrder');
      throw error;
    }
  }

  /**
   * Create order from wizard data (save for later; pending payment)
   */
  async createOrderFromWizard(args: {
    sessionId: string;
    order: { title: string; description: string; totalAmountTomans: number; comments?: string; siteType?: string };
    wizardData: Record<string, unknown>;
  }): Promise<Order> {
    try {
      const payload = {
        title: args.order.title,
        description: args.order.description,
        total_amount: args.order.totalAmountTomans,
        site_type: args.order.siteType,
        comments: args.order.comments,
        session_id: args.sessionId,
        wizard_data: args.wizardData,
        order_number: `ORD-${Date.now()}`,
        currency: 'IRR',
      };
      const snakeCaseRequest = FieldMapper.transformRequest(payload);
      const response = await withRetry(() =>
        this.request<Order>('/orders', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.createOrderFromWizard');
      throw error;
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, request: UpdateOrderRequest): Promise<Order> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<Order>(`/orders/${orderId}`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.updateOrder');
      throw error;
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId: string): Promise<{ success: boolean }> {
    try {
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(`/orders/${orderId}`, {
          method: 'DELETE',
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.deleteOrder');
      throw error;
    }
  }

  /**
   * Save order design
   */
  async saveDesign(orderId: string, design: Record<string, unknown>, options?: Record<string, unknown>): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest({ design, options });
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(`/orders/${orderId}/design`, {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.saveDesign');
      throw error;
    }
  }

  /**
   * Get order design
   */
  async getDesign(orderId: string): Promise<{
    design: Record<string, unknown>;
    options?: Record<string, unknown>;
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          design: Record<string, unknown>;
          options?: Record<string, unknown>;
        }>(`/orders/${orderId}/design`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getDesign');
      throw error;
    }
  }

  /**
   * Get order design options
   */
  async getDesignOptions(orderId: string): Promise<Record<string, unknown>> {
    try {
      const response = await withRetry(() =>
        this.request<Record<string, unknown>>(`/orders/${orderId}/design/options`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getDesignOptions');
      throw error;
    }
  }

  /**
   * Update order design options
   */
  async updateDesignOptions(orderId: string, options: Record<string, unknown>): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest({ options });
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(`/orders/${orderId}/design/options`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.updateDesignOptions');
      throw error;
    }
  }

  /**
   * Update order preview URL
   */
  async updatePreviewUrl(orderId: string, previewUrl: string): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest({ previewUrl });
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(`/orders/${orderId}/design/preview-url`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.updatePreviewUrl');
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          totalOrders: number;
          pendingOrders: number;
          inProgressOrders: number;
          completedOrders: number;
          cancelledOrders: number;
          totalRevenue: number;
        }>('/orders/stats')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getOrderStats');
      throw error;
    }
  }

  /**
   * Get order progress
   */
  async getOrderProgress(orderId: string): Promise<{
    orderId: string;
    status: string;
    progress: number;
    steps: Array<{
      step: string;
      status: 'completed' | 'in_progress' | 'pending';
      completedAt?: string;
      estimatedDuration: string;
      description: string;
    }>;
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          orderId: string;
          status: string;
          progress: number;
          steps: Array<{
            step: string;
            status: 'completed' | 'in_progress' | 'pending';
            completedAt?: string;
            estimatedDuration: string;
            description: string;
          }>;
        }>(`/orders/${orderId}/progress`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getOrderProgress');
      throw error;
    }
  }

  /**
   * Get enhanced order data
   */
  async getEnhancedOrder(orderId: string): Promise<EnhancedOrderData> {
    try {
      const response = await withRetry(() =>
        this.request<EnhancedOrderData>(`/orders/${orderId}/enhanced`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getEnhancedOrder');
      throw error;
    }
  }
}

// Export singleton instance
export const ordersService = new OrdersService();