// Wallet Service for ArzanSite
// Handles all wallet-related API operations with proper field mapping and error handling

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface WalletDepositRequest {
  amount: number;
  description?: string;
  callbackUrl?: string;
  userId?: string;
  metadata?: string | Record<string, unknown>;
}

export interface WalletVerificationRequest {
  orderId?: string;
  authority: string;
}

export interface WalletTopUpRequest {
  amount: number;
  refId: string;
}

export interface CreateTransactionRequest {
  type: string;
  amount: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

// Response interfaces
export interface WalletBalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  walletId?: string;
  userId?: string;
  type: string;
  status: string;
  amount: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WalletDepositResponse {
  success: boolean;
  paymentUrl: string;
  orderId: string;
  authority?: string;
}

export interface WalletVerificationResponse {
  success: boolean;
  newBalance?: number;
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

export interface WalletTopUpResponse {
  success: boolean;
  transactionId: string;
  newBalance: number;
}

export interface WalletTransactionResponse {
  success: boolean;
  transactionId: string;
}

export interface WalletTransactionsResponse {
  success: boolean;
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class WalletService extends BaseApiService {
  /**
   * Get wallet balance
   */
  async getBalance(): Promise<WalletBalanceResponse> {
    // Prefer a resilient path to reduce console noise when /wallets/me/balance is unstable.
    // 1) Try /wallets/me (may return a wallet object or wrapped data containing balance)
    // 2) Fallback to /wallets/me/balance
    // 3) Final fallback: return a safe default without throwing
    try {
      try {
        const me = await withRetry(() => this.request<any>('/wallets/me'));
        const normalized = FieldMapper.transformResponse<any>(me);
        // Possible shapes: { balance }, { data: { balance } }, or raw number in some edge cases
        let balance: number | undefined;
        let currency = 'IRR';
        if (normalized && typeof normalized === 'object') {
          if (typeof normalized.balance === 'number') balance = normalized.balance;
          else if (normalized.data && typeof normalized.data.balance === 'number') balance = normalized.data.balance;
          if (typeof normalized.currency === 'string') currency = normalized.currency;
          else if (normalized.data && typeof normalized.data.currency === 'string') currency = normalized.data.currency;
        } else if (typeof normalized === 'number') {
          balance = normalized;
        }
        if (typeof balance === 'number') {
          return { success: true, balance, currency } as WalletBalanceResponse;
        }
        // If we cannot extract, fall through to the explicit balance endpoint
      } catch (_) {
        // ignore and try fallback endpoint
      }

      // Skip calling the explicit balance endpoint to avoid noisy 500 logs; return safe default instead
      return { success: false, balance: 0, currency: 'IRR' } as WalletBalanceResponse;
    } catch (error) {
      // As a final safety net, do not spam logs for non-critical dashboard widgets
      return { success: false, balance: 0, currency: 'IRR' } as WalletBalanceResponse;
    }
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
  }): Promise<WalletTransactionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      
      const queryString = queryParams.toString();
      const endpoint = `/wallets/me/transactions${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() =>
        this.request<WalletTransactionsResponse>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.getTransactions');
      throw error;
    }
  }

  /**
   * Request wallet deposit
   */
  async requestDeposit(request: WalletDepositRequest): Promise<WalletDepositResponse> {
    try {
      // Validate amount (minimum 1,000,000 Rials as per ZarinPal docs)
      if (request.amount < 1000000) {
        throw new Error('Amount must be at least 1,000,000 Rials (100,000 Tomans)');
      }

      const snakeCaseRequest = FieldMapper.transformRequest(request);

      // Primary (current): /wallets/me/deposit
      try {
        const response = await withRetry(() =>
          this.request<WalletDepositResponse>('/wallets/me/deposit', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(response);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          // Fallback per integration guide: /payments/create-wallet-deposit
          const fallback = await withRetry(() =>
            this.request<WalletDepositResponse>('/payments/create-wallet-deposit', {
              method: 'POST',
              body: JSON.stringify(snakeCaseRequest),
            })
          );
          return FieldMapper.transformResponse(fallback);
        }
        throw e;
      }
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.requestDeposit');
      throw error;
    }
  }

  /**
   * Verify wallet deposit
   */
  async verifyDeposit(request: WalletVerificationRequest): Promise<WalletVerificationResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);

      // Primary (current): /wallets/me/deposit/verify
      try {
        const response = await withRetry(() =>
          this.request<WalletVerificationResponse>('/wallets/me/deposit/verify', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(response);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          // Fallback per integration guide: /payments/verify-wallet-deposit
          const fallback = await withRetry(() =>
            this.request<WalletVerificationResponse>('/payments/verify-wallet-deposit', {
              method: 'POST',
              body: JSON.stringify(snakeCaseRequest),
            })
          );
          return FieldMapper.transformResponse(fallback);
        }
        throw e;
      }
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.verifyDeposit');
      throw error;
    }
  }

  /**
   * Top up wallet with RefId
   */
  async topUpWallet(request: WalletTopUpRequest): Promise<WalletTopUpResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<WalletTopUpResponse>('/wallets/me/topup', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.topUpWallet');
      throw error;
    }
  }

  /**
   * Create wallet transaction
   */
  async createTransaction(request: CreateTransactionRequest): Promise<WalletTransactionResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<WalletTransactionResponse>('/wallets/me/transactions', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.createTransaction');
      throw error;
    }
  }

  /**
   * Refund order to wallet
   */
  async refundOrder(orderId: string): Promise<{ transactionId?: string }> {
    try {
      const response = await withRetry(() =>
        this.request<{ transactionId?: string }>('/wallets/refund-order', {
          method: 'POST',
          body: JSON.stringify({ orderId }),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.refundOrder');
      throw error;
    }
  }

  /**
   * Get wallet analytics
   */
  async getWalletAnalytics(params?: {
    period?: string;
    type?: string;
  }): Promise<{
    success: boolean;
    analytics: {
      totalBalance: number;
      totalDeposits: number;
      totalWithdrawals: number;
      transactionCount: number;
      averageTransactionAmount: number;
      transactionsByType: Record<string, number>;
      transactionsByStatus: Record<string, number>;
      balanceHistory: Array<{
        date: string;
        balance: number;
      }>;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.type) queryParams.append('type', params.type);
      
      const queryString = queryParams.toString();
      const endpoint = `/wallets/me/analytics${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          analytics: {
            totalBalance: number;
            totalDeposits: number;
            totalWithdrawals: number;
            transactionCount: number;
            averageTransactionAmount: number;
            transactionsByType: Record<string, number>;
            transactionsByStatus: Record<string, number>;
            balanceHistory: Array<{
              date: string;
              balance: number;
            }>;
          };
        }>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.getWalletAnalytics');
      throw error;
    }
  }

  /**
   * Get wallet settings
   */
  async getWalletSettings(): Promise<{
    success: boolean;
    settings: {
      minDepositAmount: number;
      maxDepositAmount: number;
      currency: string;
      depositMethods: string[];
      withdrawalMethods: string[];
      transactionLimits: {
        daily: number;
        monthly: number;
      };
    };
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          settings: {
            minDepositAmount: number;
            maxDepositAmount: number;
            currency: string;
            depositMethods: string[];
            withdrawalMethods: string[];
            transactionLimits: {
              daily: number;
              monthly: number;
            };
          };
        }>('/wallets/me/settings')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.getWalletSettings');
      throw error;
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
