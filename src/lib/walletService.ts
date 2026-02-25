// Compatibility adapter for legacy imports
// Prefer importing from '@/lib/services' directly in new code.
import {
  WalletService as BaseWalletService,
  walletService as baseWalletService,
  type WalletDepositRequest,
  type WalletVerificationRequest,
  type WalletTopUpRequest,
  type CreateTransactionRequest,
  type WalletBalanceResponse,
  type WalletTransaction,
  type WalletDepositResponse,
  type WalletVerificationResponse,
  type WalletTopUpResponse,
  type WalletTransactionResponse,
  type WalletTransactionsResponse,
} from '@/lib/services/wallet/walletService';

export type Transaction = WalletTransaction;
export type TransactionType = 'deposit' | 'withdrawal' | 'refund' | 'credit' | 'debit';

export class WalletService extends BaseWalletService {
  static formatAmount(amount: number): string {
    try {
      return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
    } catch {
      return `${amount} تومان`;
    }
  }

  static getTransactionStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'موفق';
      case 'pending':
        return 'در انتظار';
      case 'failed':
        return 'ناموفق';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  }

  static getTransactionStatusColor(status: string): string {
    switch (status) {
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

  static getTransactionTypeText(type: TransactionType): string {
    switch (type) {
      case 'deposit':
        return 'واریز';
      case 'withdrawal':
        return 'برداشت';
      case 'refund':
        return 'بازپرداخت';
      case 'credit':
        return 'افزایش موجودی';
      case 'debit':
        return 'کاهش موجودی';
      default:
        return type;
    }
  }

  static getTransactionTypeColor(type: TransactionType): string {
    switch (type) {
      case 'deposit':
      case 'refund':
      case 'credit':
        return 'text-green-600';
      case 'withdrawal':
      case 'debit':
        return 'text-red-600';
      default:
        return '';
    }
  }
}

export const walletService = baseWalletService;

export type {
  WalletDepositRequest,
  WalletVerificationRequest,
  WalletTopUpRequest,
  CreateTransactionRequest,
  WalletBalanceResponse,
  WalletTransaction,
  WalletDepositResponse,
  WalletVerificationResponse,
  WalletTopUpResponse,
  WalletTransactionResponse,
  WalletTransactionsResponse,
};


