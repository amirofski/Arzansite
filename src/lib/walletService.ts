import { supabase } from '@/integrations/supabase/client';
import type { Wallet, Transaction, TransactionType } from '@/integrations/supabase/types';

export class WalletService {
  // Get user's wallet balance
  static async getWalletBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching wallet balance:', error);
        // If wallet doesn't exist, create one
        if (error.code === 'PGRST116') { // No rows returned
          await this.createWallet(userId);
          return 0;
        }
        return 0;
      }

      return data?.balance || 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }

  // Get user's wallet with transactions
  static async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        // If wallet doesn't exist, create one
        if (error.code === 'PGRST116') { // No rows returned
          return await this.createWallet(userId);
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  }

  // Create wallet for user
  static async createWallet(userId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0.00
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating wallet:', error);
        return null;
      }

      return data;
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
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data || [];
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
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        console.error('Could not create or find wallet for user:', userId);
        return null;
      }

      const { data, error } = await supabase.rpc('process_wallet_transaction', {
        p_user_id: userId,
        p_type: type,
        p_amount: amount,
        p_description: description || null,
        p_reference_id: referenceId || null,
        p_reference_type: referenceType || null,
        p_metadata: metadata || null
      });

      if (error) {
        console.error('Error processing transaction:', error);
        return null;
      }

      return data;
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
      const { data, error } = await supabase.rpc('refund_order_to_wallet', {
        p_order_id: orderId
      });

      if (error) {
        console.error('Error refunding order:', error);
        return null;
      }

      return data;
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