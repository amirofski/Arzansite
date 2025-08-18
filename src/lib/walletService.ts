import { sessionApiService } from '@/lib/sessionApiService';
export interface WalletBalanceResponse { balance: number }
export interface WalletTransaction {
  id: string;
  wallet_id?: string;
  user_id?: string;
  type: string;
  status: string;
  amount: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  balance_after?: number;
}

// Temporary type definitions until database types are regenerated
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: string;
  status: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'credit' | 'debit';

export class WalletService {
  // Get user's wallet balance
  static async getWalletBalance(userId: string): Promise<number> {
    try {
      const res = await sessionApiService.getWalletBalance();
      const data = res.success && res.data ? res.data as WalletBalanceResponse : { balance: 0 };
      return typeof (data as WalletBalanceResponse).balance === 'number' ? (data as WalletBalanceResponse).balance : 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }

  // Get user's wallet with transactions
  static async getWallet(userId: string): Promise<Wallet | null> {
    try {
      // For now, backend exposes balance and transactions endpoints; wallet object isn't needed
      const balance = await this.getWalletBalance(userId);
      return { id: 'me', user_id: userId, balance, created_at: '', updated_at: '' } as Wallet;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  }

  // Create wallet for user
  static async createWallet(userId: string): Promise<Wallet | null> {
    try {
      // Backend ensures wallet existence automatically
      return { id: 'me', user_id: userId, balance: 0, created_at: '', updated_at: '' } as Wallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      return null;
    }
  }

  // Get user's transactions
  static async getTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Transaction[]> {
    try {
      const res = await sessionApiService.getWalletTransactions();
      const data = (res.success && Array.isArray(res.data) ? res.data : []) as unknown as Transaction[];
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // Process a wallet transaction using the database function
  static async processTransaction(
    userId: string,
    type: TransactionType,
    amount: number,
    description?: string,
    referenceId?: string,
    referenceType?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    try {
      // First ensure wallet exists
      const payload = {
        type,
        amount,
        description,
        referenceId,
        referenceType,
        metadata,
      };
      
      console.log('Creating wallet transaction with payload:', payload);
      const res = await sessionApiService.createWalletTransaction(payload);
      console.log('Wallet transaction response:', res);
      const data = res.data as { id?: string } | undefined;
      return res.success && data?.id ? data.id : null;
    } catch (error) {
      console.error('Error processing transaction:', error);
      return null;
    }
  }

  // Add money to wallet (deposit)
  static async deposit(
    userId: string,
    amount: number,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.processTransaction(
      userId,
      'deposit',
      amount,
      description || 'Wallet deposit',
      undefined,
      undefined,
      metadata
    );
  }

  // Pay for order from wallet
  static async payForOrder(
    userId: string,
    orderId: string,
    amount: number,
    orderTitle: string
  ): Promise<string | null> {
    return this.processTransaction(
      userId,
      'payment',
      amount,
      `Payment for order: ${orderTitle}`,
      orderId,
      'order',
      { order_id: orderId, order_title: orderTitle }
    );
  }

  // Refund order to wallet
  static async refundOrder(orderId: string): Promise<string | null> {
    try {
      const res = await sessionApiService.refundOrder(orderId);
      const data = res.data as { transactionId?: string } | undefined;
      return res.success ? (data?.transactionId ?? null) : null;
    } catch (error) {
      console.error('Error refunding order:', error);
      return null;
    }
  }

  // Admin credit to user wallet
  static async creditUser(
    userId: string,
    amount: number,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.processTransaction(
      userId,
      'credit',
      amount,
      description || 'Admin credit',
      undefined,
      undefined,
      metadata
    );
  }

  // Admin debit from user wallet
  static async debitUser(
    userId: string,
    amount: number,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.processTransaction(
      userId,
      'debit',
      amount,
      description || 'Admin debit',
      undefined,
      undefined,
      metadata
    );
  }

  // Check if user has sufficient balance
  static async hasSufficientBalance(userId: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getWalletBalance(userId);
    return balance >= requiredAmount;
  }

  // Format amount for display
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  }

  // Get transaction type display text
  static getTransactionTypeText(type: TransactionType): string {
    switch (type) {
      case 'deposit': return 'شارژ کیف پول';
      case 'withdrawal': return 'برداشت از کیف پول';
      case 'payment': return 'پرداخت سفارش';
      case 'refund': return 'بازپرداخت';
      case 'credit': return 'اعتبار ادمین';
      case 'debit': return 'کسر ادمین';
      default: return type;
    }
  }

  // Get transaction type color
  static getTransactionTypeColor(type: TransactionType): string {
    switch (type) {
      case 'deposit':
      case 'refund':
      case 'credit':
        return 'text-green-600';
      case 'withdrawal':
      case 'payment':
      case 'debit':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  // Get transaction status text
  static getTransactionStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'در انتظار';
      case 'completed': return 'تکمیل شده';
      case 'failed': return 'ناموفق';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  }

  // Get transaction status color
  static getTransactionStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }
} 