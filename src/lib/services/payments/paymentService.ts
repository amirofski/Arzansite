// Payment Service for ArzanSite
// Handles all payment-related API operations with proper field mapping and error handling

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface PaymentRequest {
  orderId?: string;
  amount: number;
  currency?: string;
  description: string;
  paymentMethod?: string;
  callbackUrl?: string;
  returnUrl?: string;
}

export interface PaymentVerificationRequest {
  authority: string;
  orderId?: string;
}

export interface PaymentStatusRequest {
  paymentId: string;
}

// Response interfaces
export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  authority?: string;
  refId?: string;
  error?: string;
  paymentId?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  refId?: string;
  orderId?: string;
  amount?: number;
  description?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  retryable?: boolean;
  supportRequired?: boolean;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: string;
  paymentId: string;
  amount?: number;
  refId?: string;
  authority?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface PaymentMethodsResponse {
  success: boolean;
  methods: PaymentMethod[];
}

export class PaymentService extends BaseApiService {
  /**
   * Create payment request
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      // Primary per integration guide: /payments/request
      try {
        const primary = await withRetry(() =>
          this.request<PaymentResponse>('/payments/request', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(primary);
      } catch (e) {
        // Fallback to legacy route /payments
        const fallback = await withRetry(() =>
          this.request<PaymentResponse>('/payments', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(fallback);
      }

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.createPayment');
      throw error;
    }
  }

  /**
   * Request payment (legacy method)
   */
  async requestPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<PaymentResponse>('/payments/request', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.requestPayment');
      throw error;
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<PaymentVerificationResponse>('/payments/verify', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.verifyPayment');
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(request: PaymentStatusRequest): Promise<PaymentStatusResponse> {
    try {
      // Primary per integration guide: GET /payments/status?payment_id=...
      try {
        const query = new URLSearchParams({ payment_id: request.paymentId }).toString();
        const primary = await withRetry(() =>
          this.request<PaymentStatusResponse>(`/payments/status?${query}`)
        );
        return FieldMapper.transformResponse(primary);
      } catch (e) {
        // Fallback to legacy path /payments/:id
        const fallback = await withRetry(() =>
          this.request<PaymentStatusResponse>(`/payments/${request.paymentId}`)
        );
        return FieldMapper.transformResponse(fallback);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.getPaymentStatus');
      throw error;
    }
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    try {
      const response = await withRetry(() =>
        this.request<PaymentMethodsResponse>('/payments/methods')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.getPaymentMethods');
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    from?: string;
    to?: string;
  }): Promise<{
    success: boolean;
    payments: Array<{
      id: string;
      orderId?: string;
      amount: number;
      currency: string;
      status: string;
      method: string;
      refId?: string;
      authority?: string;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.method) queryParams.append('method', params.method);
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);
      
      const queryString = queryParams.toString();
      const endpoint = `/payments/history${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          payments: Array<{
            id: string;
            orderId?: string;
            amount: number;
            currency: string;
            status: string;
            method: string;
            refId?: string;
            authority?: string;
            createdAt: string;
            updatedAt: string;
          }>;
          pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
          };
        }>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.getPaymentHistory');
      throw error;
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string): Promise<{ success: boolean }> {
    try {
      // Primary per integration guide: POST /payments/cancel
      try {
        const primary = await withRetry(() =>
          this.request<{ success: boolean }>(`/payments/cancel`, {
            method: 'POST',
            body: JSON.stringify({ payment_id: paymentId }),
          })
        );
        return primary;
      } catch (e) {
        // Fallback to legacy path /payments/:id/cancel
        const fallback = await withRetry(() =>
          this.request<{ success: boolean }>(`/payments/${paymentId}/cancel`, {
            method: 'POST',
          })
        );
        return fallback;
      }
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.cancelPayment');
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    amount?: number;
  }> {
    try {
      const request = amount ? { amount } : {};
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      // Primary per integration guide: POST /payments/refund
      try {
        const primary = await withRetry(() =>
          this.request<{
            success: boolean;
            refundId?: string;
            amount?: number;
          }>(`/payments/refund`, {
            method: 'POST',
            body: JSON.stringify({ payment_id: paymentId, ...snakeCaseRequest }),
          })
        );
        return FieldMapper.transformResponse(primary);
      } catch (e) {
        // Fallback to legacy path /payments/:id/refund
        const fallback = await withRetry(() =>
          this.request<{
            success: boolean;
            refundId?: string;
            amount?: number;
          }>(`/payments/${paymentId}/refund`, {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(fallback);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.refundPayment');
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(params?: {
    period?: string;
    method?: string;
  }): Promise<{
    success: boolean;
    stats: {
      totalPayments: number;
      successfulPayments: number;
      failedPayments: number;
      pendingPayments: number;
      totalAmount: number;
      averageAmount: number;
      paymentsByMethod: Record<string, number>;
      paymentsByStatus: Record<string, number>;
      revenueHistory: Array<{
        date: string;
        amount: number;
        count: number;
      }>;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.method) queryParams.append('method', params.method);
      
      const queryString = queryParams.toString();
      const endpoint = `/payments/stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          stats: {
            totalPayments: number;
            successfulPayments: number;
            failedPayments: number;
            pendingPayments: number;
            totalAmount: number;
            averageAmount: number;
            paymentsByMethod: Record<string, number>;
            paymentsByStatus: Record<string, number>;
            revenueHistory: Array<{
              date: string;
              amount: number;
              count: number;
            }>;
          };
        }>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'PaymentService.getPaymentStats');
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
