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
    try {
      const response = await withRetry(() =>
        this.request<WalletBalanceResponse>('/wallets/me/balance')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'WalletService.getBalance');
      throw error;
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
      
      const response = await withRetry(() =>
        this.request<WalletDepositResponse>('/wallets/me/deposit', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
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
      
      const response = await withRetry(() =>
        this.request<WalletVerificationResponse>('/wallets/me/deposit/verify', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
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
