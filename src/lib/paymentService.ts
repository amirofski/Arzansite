// Compatibility adapter for legacy imports
// Prefer importing from '@/lib/services' directly in new code.
import {
  PaymentService as BasePaymentService,
  paymentService as basePaymentService,
  type PaymentRequest,
  type PaymentVerificationRequest,
  type PaymentStatusRequest,
  type PaymentResponse,
  type PaymentVerificationResponse,
  type PaymentStatusResponse,
  type PaymentMethod,
  type PaymentMethodsResponse,
} from '@/lib/services/payments/paymentService';

export class PaymentService extends BasePaymentService {
  static formatAmount(amount: number): string {
    try {
      return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
    } catch {
      return `${amount} تومان`;
    }
  }

  static getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'پرداخت شده';
      case 'pending':
        return 'در انتظار پرداخت';
      case 'failed':
        return 'ناموفق';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  }

  static getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const paymentService = basePaymentService;

export type {
  PaymentRequest,
  PaymentVerificationRequest,
  PaymentStatusRequest,
  PaymentResponse,
  PaymentVerificationResponse,
  PaymentStatusResponse,
  PaymentMethod,
  PaymentMethodsResponse,
};


