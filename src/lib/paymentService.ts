import { apiClient, PaymentRequest, PaymentResponse } from '@/lib/api-client';

export interface PaymentTransaction {
  id: string;
  order_id: string;
  user_id: string;
  transaction_type: 'payment_request' | 'payment_verification' | 'refund' | 'cancellation';
  zarinpal_authority?: string;
  zarinpal_ref_id?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  gateway_response?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class PaymentService {
  /**
   * Request payment from Zarinpal
   */
  static async requestPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await apiClient.createPayment(request);
      return response;
    } catch (error: unknown) {
      console.error('Payment request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment request failed'
      };
    }
  }

  /**
   * Verify payment with Zarinpal
   */
  static async verifyPayment(authority: string, orderId: string): Promise<PaymentResponse> {
    try {
      const response = await apiClient.verifyPayment({ authority, orderId });
      return response;
    } catch (error: unknown) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      };
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(orderId: string, amount?: number): Promise<PaymentResponse> {
    try {
      // Get order details first
      const order = await apiClient.getOrder(orderId);
      const refundAmount = amount || order.price || 0;

      // For now, we'll use the wallet refund endpoint
      const response = await apiClient.refundOrder(orderId);
      return {
        success: !!response.transactionId,
        refId: response.transactionId,
      };
    } catch (error: unknown) {
      console.error('Payment refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment refund failed'
      };
    }
  }

  /**
   * Cancel payment
   */
  static async cancelPayment(orderId: string): Promise<PaymentResponse> {
    try {
      // Update order status to cancelled
      await apiClient.updateOrder(orderId, { status: 'cancelled' });
      return {
        success: true,
      };
    } catch (error: unknown) {
      console.error('Payment cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment cancellation failed'
      };
    }
  }

  /**
   * Get payment status for an order
   */
  static async getPaymentStatus(orderId: string): Promise<{
    status: string;
    authority?: string;
    refId?: string;
    lastTransaction?: PaymentTransaction;
  }> {
    try {
      const order = await apiClient.getOrder(orderId);
      return {
        status: order.payment_status || 'pending',
        authority: undefined, // Would need to be stored in order or fetched separately
        refId: undefined, // Would need to be stored in order or fetched separately
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        status: 'unknown'
      };
    }
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get payment status text
   */
  static getPaymentStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'در انتظار پرداخت',
      'paid': 'پرداخت شده',
      'failed': 'ناموفق',
      'cancelled': 'لغو شده',
      'refunded': 'بازپرداخت شده'
    };
    return statusMap[status] || status;
  }

  /**
   * Get payment status color
   */
  static getPaymentStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'refunded': 'bg-blue-100 text-blue-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
} 