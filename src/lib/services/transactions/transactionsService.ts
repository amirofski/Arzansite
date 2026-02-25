// Transactions Service for ArzanSite
// Provides access to admin/user transaction logs with unified response shapes

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { withRetry } from '@/lib/utils/retry';

export interface TransactionItem {
  id: string;
  user_id?: string;
  order_id?: string;
  wallet_id?: string;
  type?: string;
  status?: string;
  amount: number;
  ref_id?: string;
  authority?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export class TransactionsService extends BaseApiService {
  /**
   * Get admin transactions (page/limit, from/to)
   */
  async getAdminTransactions(params: { page?: number; limit?: number; from?: string; to?: string } = {}): Promise<{
    items: TransactionItem[];
    pagination?: TransactionsPagination;
  }> {
    const query = new URLSearchParams();
    if (params.page != null) query.append('page', String(params.page));
    if (params.limit != null) query.append('limit', String(params.limit));
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);

    const response = await withRetry(() => this.request<any>(`/transactions${query.toString() ? `?${query.toString()}` : ''}`));
    if (response?.items) {
      return {
        items: FieldMapper.transformResponse(response.items),
        pagination: FieldMapper.transformResponse(response.pagination),
      };
    }
    // Fallbacks
    if (Array.isArray(response)) {
      return { items: FieldMapper.transformResponse(response) };
    }
    if (response?.data) {
      return { items: FieldMapper.transformResponse(response.data) };
    }
    return { items: [] };
  }

  /**
   * Get current user's transactions (page/limit, from/to)
   */
  async getMyTransactions(params: { page?: number; limit?: number; from?: string; to?: string } = {}): Promise<{
    items: TransactionItem[];
    pagination?: TransactionsPagination;
  }> {
    const query = new URLSearchParams();
    if (params.page != null) query.append('page', String(params.page));
    if (params.limit != null) query.append('limit', String(params.limit));
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);

    const response = await withRetry(() => this.request<any>(`/transactions/my${query.toString() ? `?${query.toString()}` : ''}`));
    if (response?.items) {
      return {
        items: FieldMapper.transformResponse(response.items),
        pagination: FieldMapper.transformResponse(response.pagination),
      };
    }
    if (Array.isArray(response)) return { items: FieldMapper.transformResponse(response) };
    if (response?.data) return { items: FieldMapper.transformResponse(response.data) };
    return { items: [] };
  }

  /**
   * Get transactions for a specific order (page/limit)
   */
  async getOrderTransactions(orderId: string, params: { page?: number; limit?: number } = {}): Promise<{
    items: TransactionItem[];
    pagination?: TransactionsPagination;
  }> {
    const query = new URLSearchParams();
    if (params.page != null) query.append('page', String(params.page));
    if (params.limit != null) query.append('limit', String(params.limit));

    const response = await withRetry(() => this.request<any>(`/transactions/order/${orderId}${query.toString() ? `?${query.toString()}` : ''}`));
    if (response?.items) {
      return {
        items: FieldMapper.transformResponse(response.items),
        pagination: FieldMapper.transformResponse(response.pagination),
      };
    }
    if (Array.isArray(response)) return { items: FieldMapper.transformResponse(response) };
    if (response?.data) return { items: FieldMapper.transformResponse(response.data) };
    return { items: [] };
  }
}

export const transactionsService = new TransactionsService();
