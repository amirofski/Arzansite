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
  userId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paymentGateway?: string;
  callbackUrl?: string;
  returnUrl?: string;
  zarinpalAuthority?: string;
  zarinpalRefId?: string;
}

export interface UpdateOrderRequest {
  title?: string;
  description?: string;
  price?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paymentGateway?: string;
  callbackUrl?: string;
  returnUrl?: string;
  zarinpalAuthority?: string;
  zarinpalRefId?: string;
  comments?: string;
  totalPages?: number;
  totalSections?: number;
  siteType?: string;
  wizardData?: unknown;
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
    from?: string;
    to?: string;
  }): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.mine) queryParams.append('mine', 'true');
      if (params?.admin) queryParams.append('admin', 'true');
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);
      
      const queryString = queryParams.toString();
      const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
      
      const raw = await withRetry(() => this.request<any>(endpoint));
      const t = FieldMapper.transformResponse(raw) as any;

      // Extract array of orders from multiple possible shapes
      const root = t?.data ?? t;
      let items: any[] = [];
      if (Array.isArray(root?.orders)) items = root.orders;
      else if (Array.isArray(root?.items)) items = root.items;
      else if (Array.isArray(t)) items = t as any[];
      else if (Array.isArray(raw?.data?.orders)) items = raw.data.orders;
      else if (Array.isArray(raw?.data?.items)) items = raw.data.items;

      // Normalize each order to always have id, status, price, wizardData
      const normalized = (items || []).map((o: any) => {
        const id = o.id || o.orderId || o.order_id || o._id || o.$id || o?.order?.id || '';
        const status = o.status || o?.order?.status || (o?.data?.status) || 'pending';
        const price = o.price ?? o.totalAmount ?? o.total_amount ?? o?.order?.totalAmount ?? 0;
        let wizardData: any = o.wizardData || o.wizard_data || o?.metadata?.wizardData || undefined;
        if (typeof wizardData === 'string') {
          try { wizardData = JSON.parse(wizardData); } catch {}
        }
        const createdAt = o.createdAt || o.created_at || o.$createdAt || o.$created_at;
        const updatedAt = o.updatedAt || o.updated_at || o.$updatedAt || o.$updated_at;
        return { ...o, id, status, price, wizardData, createdAt, updatedAt };
      });

      const pagination = root?.pagination || t?.pagination || {
        page: Number(params?.page || 1),
        limit: Number(params?.limit || normalized.length || 0),
        total: Number(root?.total || normalized.length || 0),
        pages: Number(root?.pages || 1),
      };

      return { success: true, orders: normalized as any, pagination } as OrderListResponse;
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.getOrders');
      throw error;
    }
  }

  /**
   * Unified create order endpoint supporting draft or payment flows.
   * Tries POST /orders/create first. Falls back to legacy POST /orders.
   */
  async createOrderUnified(args: {
    submitMode: 'draft' | 'payment';
    wizardData: Record<string, unknown> | undefined;
    totalAmount: number | string;
    currency?: string;
    title?: string;
    description?: string;
    comments?: string;
    siteType?: string;
  }): Promise<{
    orderId: string;
    status: string;
    payment?: { id?: string; redirectUrl?: string; expiresAt?: string };
  }> {
    try {
      // Send camelCase payload as-is to match new DTOs. Default wizardData to {} and coerce totalAmount to number.
      const camelPayload = {
        submitMode: args.submitMode,
        wizardData: (args.wizardData && typeof args.wizardData === 'object') ? args.wizardData : {},
        totalAmount: Number(args.totalAmount),
        currency: args.currency || 'IRR',
        title: args.title,
        description: args.description,
        comments: args.comments,
        siteType: args.siteType || 'personal',
      };

      try {
        const res = await withRetry(() =>
          this.request<any>('/orders/create', {
            method: 'POST',
            body: JSON.stringify(camelPayload),
          })
        );
        const data = FieldMapper.transformResponse(res) as any;
        // Normalize diverse backend shapes
        const orderId = data?.orderId || data?.order_id || data?.order?.id || data?.id;
        const status = data?.status || data?.order?.status || 'pending';
        const payment = data?.payment || (data?.paymentUrl ? { redirectUrl: data.paymentUrl } : undefined);
        return { orderId, status, payment };
      } catch (primaryErr) {
        // Fallback to legacy /orders
        const legacy = await this.createOrder({
          title: args.title || 'سفارش وب‌سایت',
          description: args.description || 'ثبت از ویزارد',
          price: Number(args.totalAmount) || 0,
          comments: args.comments,
          siteType: args.siteType || 'personal',
          wizardData: camelPayload.wizardData,
          status: 'pending',
          paymentStatus: 'pending',
        });
        // Extract orderId from various possible response shapes
        const legacyData = legacy as any;
        const orderId = legacyData?.id || legacyData?.orderId || legacyData?.order_id || 
                       legacyData?.$id || legacyData?.order?.id || legacyData?.data?.id || '';
        const status = legacyData?.status || legacyData?.order?.status || 'pending';
        
        console.log('Legacy order creation response:', { orderId, status, fullResponse: legacyData });
        return { orderId, status };
      }
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.createOrderUnified');
      throw error;
    }
  }

  /**
   * Update order status (primarily by webhook/admin)
   */
  async updateOrderStatus(
    orderId: string,
    updates: {
      status?: string; // e.g., 'completed' | 'pending' | 'canceled' | ...
      paymentStatus?: 'succeeded' | 'failed' | 'refunded' | 'pending';
      reason?: string;
    } = {}
  ): Promise<any> {
    try {
      // Prefer user-scoped RESTful endpoint first
      const patchBody = FieldMapper.transformRequest({
        status: updates.status,
        paymentStatus: updates.paymentStatus,
        reason: updates.reason,
      });
      try {
        const res = await withRetry(() =>
          this.request<any>(`/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify(patchBody),
          })
        );
        return res;
      } catch {
        // Fallback to legacy admin endpoint (may require admin role)
        const legacyBody = {
          orderId: String(orderId),
          ...patchBody,
        };
        const res = await withRetry(() =>
          this.request<any>('/orders/update-status', {
            method: 'POST',
            body: JSON.stringify(legacyBody),
          })
        );
        return res;
      }
    } catch (error) {
      ErrorHandler.logError(error, 'OrdersService.updateOrderStatus');
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
        title: request.title,
        description: request.description,
        totalAmount: request.price,
        siteType: request.siteType || 'personal',
        comments: request.comments,
        sessionId: request.sessionId,
        wizardData: request.wizardData,
        // Also include nested order object for backends expecting it
        order: {
          title: request.title,
          description: request.description,
          totalAmount: request.price,
          siteType: request.siteType || 'personal',
          comments: request.comments,
          totalPages: request.totalPages,
          totalSections: request.totalSections,
          currency: 'IRR',
          status: request.status || 'pending',
          paymentStatus: request.paymentStatus || 'pending',
        },
        // Do NOT send user_id – backend derives user from auth context
        status: request.status || 'pending',
        paymentStatus: request.paymentStatus || 'pending',
        paymentGateway: request.paymentGateway,
        callbackUrl: request.callbackUrl,
        returnUrl: request.returnUrl,
        zarinpalAuthority: request.zarinpalAuthority,
        zarinpalRefId: request.zarinpalRefId,
        totalPages: request.totalPages,
        totalSections: request.totalSections,
        currency: 'IRR',
        // Do NOT send order_number; backend generates it
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
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'refunded';
    paymentGateway?: string;
    callbackUrl?: string;
    returnUrl?: string;
  }): Promise<Order> {
    try {
      // Compute optional totals if wizardData contains design structure
      let totalPages: number | undefined;
      let totalSections: number | undefined;
      try {
        const wf = (args.wizardData as any)?.websiteFramework;
        const pages = wf?.dynamicDesign?.pages as Array<{ sections?: any[] }> | undefined;
        if (Array.isArray(pages)) {
          totalPages = pages.length;
          totalSections = pages.reduce((sum, p) => sum + (Array.isArray(p.sections) ? p.sections.length : 0), 0);
        }
      } catch {}

      const payload = {
        title: args.order.title,
        description: args.order.description,
        totalAmount: args.order.totalAmountTomans,
        siteType: args.order.siteType || 'personal',
        comments: args.order.comments,
        sessionId: args.sessionId,
        wizardData: args.wizardData,
        // Also include nested order object for backends expecting it
        order: {
          title: args.order.title,
          description: args.order.description,
          totalAmount: args.order.totalAmountTomans,
          siteType: args.order.siteType || 'personal',
          comments: args.order.comments,
          totalPages,
          totalSections,
          currency: 'IRR',
          status: args.status || 'pending',
          paymentStatus: args.paymentStatus || 'pending',
        },
        // Do NOT send user_id – backend derives user from auth context
        status: args.status || 'pending',
        paymentStatus: args.paymentStatus || 'pending',
        paymentGateway: args.paymentGateway,
        callbackUrl: args.callbackUrl,
        returnUrl: args.returnUrl,
        totalPages,
        totalSections,
        // Do NOT send order_number; backend generates it
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