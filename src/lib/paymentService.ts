import { supabase } from '@/integrations/supabase/client';

export interface PaymentRequest {
  amount: number;
  description: string;
  orderId: string;
  callbackUrl?: string;
  mobile?: string;
  email?: string;
}

export interface PaymentResponse {
  success: boolean;
  authority?: string;
  paymentUrl?: string;
  refId?: string;
  error?: string;
  code?: number;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  user_id: string;
  transaction_type: 'payment_request' | 'payment_verification' | 'refund' | 'cancellation';
  zarinpal_authority?: string;
  zarinpal_ref_id?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  gateway_response?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export class PaymentService {
  /**
   * Request payment from Zarinpal
   */
  static async requestPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('zarinpal-payment', {
        body: {
          action: 'request',
          amount: Math.floor(request.amount / 10), // Convert from Rials to Tomans
          description: request.description,
          orderId: request.orderId,
          callbackUrl: request.callbackUrl,
          mobile: request.mobile,
          email: request.email
        }
      });

      if (error) throw error;

      // Log payment transaction
      await this.logPaymentTransaction({
        order_id: request.orderId,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        transaction_type: 'payment_request',
        zarinpal_authority: data.authority,
        amount: request.amount,
        status: data.success ? 'pending' : 'failed',
        gateway_response: data,
        metadata: {
          description: request.description,
          mobile: request.mobile,
          email: request.email
        }
      });

      return data;
    } catch (error: any) {
      console.error('Payment request error:', error);
      return {
        success: false,
        error: error.message || 'Payment request failed'
      };
    }
  }

  /**
   * Verify payment with Zarinpal
   */
  static async verifyPayment(authority: string, orderId: string): Promise<PaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('zarinpal-payment', {
        body: {
          action: 'verify',
          authority,
          orderId
        }
      });

      if (error) throw error;

      // Log payment transaction
      await this.logPaymentTransaction({
        order_id: orderId,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        transaction_type: 'payment_verification',
        zarinpal_authority: authority,
        zarinpal_ref_id: data.refId,
        amount: data.amount || 0,
        status: data.success ? 'completed' : 'failed',
        gateway_response: data,
        metadata: {
          authority,
          refId: data.refId
        }
      });

      return data;
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(orderId: string, amount?: number): Promise<PaymentResponse> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const refundAmount = amount || order.price || 0;

      const { data, error } = await supabase.functions.invoke('zarinpal-payment', {
        body: {
          action: 'refund',
          orderId,
          amount: refundAmount,
          refId: order.zarinpal_ref_id
        }
      });

      if (error) throw error;

      // Log refund transaction
      await this.logPaymentTransaction({
        order_id: orderId,
        user_id: order.user_id,
        transaction_type: 'refund',
        zarinpal_ref_id: order.zarinpal_ref_id,
        amount: refundAmount,
        status: data.success ? 'completed' : 'failed',
        gateway_response: data,
        metadata: {
          originalRefId: order.zarinpal_ref_id,
          refundAmount
        }
      });

      return data;
    } catch (error: any) {
      console.error('Payment refund error:', error);
      return {
        success: false,
        error: error.message || 'Payment refund failed'
      };
    }
  }

  /**
   * Cancel payment
   */
  static async cancelPayment(orderId: string): Promise<PaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('zarinpal-payment', {
        body: {
          action: 'cancel',
          orderId
        }
      });

      if (error) throw error;

      // Log cancellation transaction
      await this.logPaymentTransaction({
        order_id: orderId,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        transaction_type: 'cancellation',
        amount: 0,
        status: 'cancelled',
        gateway_response: data,
        metadata: {
          reason: 'user_cancelled'
        }
      });

      return data;
    } catch (error: any) {
      console.error('Payment cancellation error:', error);
      return {
        success: false,
        error: error.message || 'Payment cancellation failed'
      };
    }
  }

  /**
   * Get payment transactions for an order
   */
  static async getPaymentTransactions(orderId: string): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting payment transactions:', error);
      return [];
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
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('payment_status, zarinpal_authority, zarinpal_ref_id')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const transactions = await this.getPaymentTransactions(orderId);
      const lastTransaction = transactions[0];

      return {
        status: order.payment_status || 'pending',
        authority: order.zarinpal_authority,
        refId: order.zarinpal_ref_id,
        lastTransaction
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        status: 'unknown'
      };
    }
  }

  /**
   * Log payment transaction
   */
  private static async logPaymentTransaction(transaction: {
    order_id: string;
    user_id: string;
    transaction_type: PaymentTransaction['transaction_type'];
    zarinpal_authority?: string;
    zarinpal_ref_id?: string;
    amount: number;
    status: PaymentTransaction['status'];
    gateway_response?: any;
    metadata?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_transactions')
        .insert([transaction]);

      if (error) {
        console.error('Error logging payment transaction:', error);
      }
    } catch (error) {
      console.error('Error logging payment transaction:', error);
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