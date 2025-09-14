// Admin Service for ArzanSite
// Handles all admin-specific API operations with proper field mapping and error handling

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface GetOrdersRequest {
  admin?: boolean;
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
}

export interface UpdateOrderRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
  comments?: string;
}

export interface TestEmailRequest {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface UpdateDomainPriceRequest {
  price: number;
  description?: string;
  category?: string;
}

export interface CreateDomainExtensionRequest {
  extension: string;
  price: number;
  description: string;
  category: 'generic' | 'country' | 'specialized';
}

export interface CheckDomainRequest {
  domain: string;
  extension: string;
}

export interface DeleteUserRequest {
  reason: string;
}

// Response interfaces
export interface AdminOrder {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  payment_status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  role?: string;
  status?: string; // 'active' | 'banned' | ...
  verification_status?: string; // e.g., 'verified' | 'pending'
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

export interface AdminWallet {
  $id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
  userProfile?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export interface AdminInvoice {
  $id: string;
  user_id: string;
  order_id: string;
  amount: number;
  due_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  userProfile?: {
    full_name?: string;
    email?: string;
  };
}

export interface AdminWalletAdjustment {
  id: string;
  wallet_id: string;
  adminId: string;
  adminName?: string;
  type: 'credit' | 'debit' | 'correction';
  amount: number;
  reason: string;
  notes?: string;
  balanceBefore: number;
  balanceAfter: number;
  created_at: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: string;
  sent_at: string;
  error_message?: string;
}

export interface DomainExtension {
  id: string;
  extension: string;
  price: number;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemMetrics {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  active_sessions: number;
  system_load: number;
  database_size: number;
  last_backup: string;
  uptime: string;
}

export interface AdminStats {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  activeUsers: number;
  emailSentToday: number;
  averageOrderValue: number;
}

export class AdminService extends BaseApiService {
  /**
   * Get wallets (admin)
   */
  async getWallets(params: { page?: number; limit?: number; search?: string } = {}): Promise<{
    items: AdminWallet[];
    pagination?: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.search) query.append('search', params.search);
      const endpoint = `/admin/wallets${query.toString() ? `?${query.toString()}` : ''}`;

      const response = await withRetry(() => this.request<any>(endpoint));
      // Normalize possible shapes: { items }, { data }, or raw array
      if (Array.isArray(response)) {
        return { items: FieldMapper.transformResponse(response) };
      }
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.data) {
        return { items: FieldMapper.transformResponse(response.data) };
      }
      return { items: FieldMapper.transformResponse(response) };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getWallets');
      throw error;
    }
  }

  /**
   * Get wallet adjustments (admin)
   */
  async getWalletAdjustments(walletId: string, params: { page?: number; limit?: number } = {}): Promise<{
    items: AdminWalletAdjustment[];
    pagination?: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      const endpoint = `/admin/wallets/${walletId}/adjustments${query.toString() ? `?${query.toString()}` : ''}`;

      const response = await withRetry(() => this.request<any>(endpoint));
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.adjustments) {
        return {
          items: FieldMapper.transformResponse(response.adjustments),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (Array.isArray(response)) {
        return { items: FieldMapper.transformResponse(response) };
      }
      return { items: FieldMapper.transformResponse(response?.data ?? []) };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getWalletAdjustments');
      throw error;
    }
  }

  /**
   * Get admin payments
   */
  async getPayments(params: { page?: number; limit?: number; status?: string; user_id?: string; from?: string; to?: string } = {}): Promise<{
    items: Array<{
      id: string;
      user_id: string;
      status: string;
      ref_id?: string;
      amount: number;
      created_at: string;
    }>;
    pagination?: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.status) query.append('status', params.status);
      if (params.user_id) query.append('user_id', params.user_id);
      if (params.from) query.append('from', params.from);
      if (params.to) query.append('to', params.to);
      const endpoint = `/admin/payments${query.toString() ? `?${query.toString()}` : ''}`;

      const response = await withRetry(() => this.request<any>(endpoint));
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.payments) {
        return {
          items: FieldMapper.transformResponse(response.payments),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      return { items: FieldMapper.transformResponse(response?.data ?? []) };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getPayments');
      throw error;
    }
  }
  /**
   * Get orders for admin
   */
  async getOrders(request: GetOrdersRequest = {}): Promise<{
    items: AdminOrder[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (request.admin) queryParams.append('admin', 'true');
      if (request.page) queryParams.append('page', request.page.toString());
      if (request.limit) queryParams.append('limit', request.limit.toString());
      if (request.status) queryParams.append('status', request.status);
      if (request.from) queryParams.append('from', request.from);
      if (request.to) queryParams.append('to', request.to);
      
      const queryString = queryParams.toString();
      // Admin orders are served from /orders with admin=true
      const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() => this.request<any>(endpoint));
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.orders) {
        return {
          items: FieldMapper.transformResponse(response.orders),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      // Some backends may return an array
      if (Array.isArray(response)) {
        return { items: FieldMapper.transformResponse(response) };
      }
      return { items: FieldMapper.transformResponse(response?.data ?? []) };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getOrders');
      throw error;
    }
  }

  /**
   * Get all user profiles
   */
  async getAllProfiles(params: { search?: string; page?: number; limit?: number } = {}): Promise<{
    items: AdminUser[];
    pagination?: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));

      // Admin users listing is exposed via /admin/users
      const response = await withRetry(() => this.request<any>(`/admin/users${query.toString() ? `?${query.toString()}` : ''}`));
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.data?.items) {
        return {
          items: FieldMapper.transformResponse(response.data.items),
          pagination: FieldMapper.transformResponse(response.data.pagination),
        };
      }
      if (response?.users) {
        return {
          items: FieldMapper.transformResponse(response.users),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (Array.isArray(response)) {
        return { items: FieldMapper.transformResponse(response) };
      }
      if (Array.isArray(response?.data)) {
        return { items: FieldMapper.transformResponse(response.data) };
      }
      return { items: [] };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getAllProfiles');
      throw error;
    }
  }

  /**
   * Get invoices (admin)
   */
  async getInvoices(params: { page?: number; limit?: number; status?: string; user_id?: string; from?: string; to?: string } = {}): Promise<{
    items: AdminInvoice[];
    pagination?: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.status) query.append('status', params.status);
      if (params.user_id) query.append('user_id', params.user_id);
      if (params.from) query.append('from', params.from);
      if (params.to) query.append('to', params.to);
      const endpoint = `/admin/invoices${query.toString() ? `?${query.toString()}` : ''}`;

      const response = await withRetry(() => this.request<any>(endpoint));
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.invoices) {
        return {
          items: FieldMapper.transformResponse(response.invoices),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      return { items: FieldMapper.transformResponse(response?.data ?? []) };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getInvoices');
      throw error;
    }
  }

  /**
   * Get email logs
   */
  async getEmailLogs(limit: number = 100, offset: number = 0): Promise<{
    items: EmailLog[];
    pagination?: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());
      
      // Logs are exposed via /emails/logs (not /admin/emails/logs)
      const endpoint = `/emails/logs?${queryParams.toString()}`;
      
      const response = await withRetry(() => this.request<any>(endpoint));
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.logs) {
        return {
          items: FieldMapper.transformResponse(response.logs),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (Array.isArray(response)) {
        return { items: FieldMapper.transformResponse(response) };
      }
      return { items: FieldMapper.transformResponse(response?.data ?? []) };
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message.toLowerCase() : String(error).toLowerCase();
      // Gracefully degrade when email logging is not configured or server returns 500
      if (msg.includes('email logging not configured') || msg.includes('500')) {
        return { items: [], pagination: { limit, offset, total: 0 } };
      }
      ErrorHandler.logError(error, 'AdminService.getEmailLogs');
      return { items: [], pagination: { limit, offset, total: 0 } };
    }
  }

  /**
   * Update order status
   */
  async updateOrder(orderId: string, request: UpdateOrderRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          message: string;
        }>(`/admin/orders/${orderId}`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.updateOrder');
      throw error;
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          message: string;
        }>(`/admin/orders/${orderId}`, {
          method: 'DELETE',
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.deleteOrder');
      throw error;
    }
  }

  /**
   * Test email service
   */
  async testEmailService(request: TestEmailRequest): Promise<{
    success: boolean;
    message: string;
    logId?: string;
  }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          message: string;
          logId?: string;
        }>('/admin/emails/test-service', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.testEmailService');
      throw error;
    }
  }

  /**
   * Get domain prices
   */
  async getDomainPrices(): Promise<{
    items: DomainExtension[];
  }> {
    try {
      const response = await withRetry(() => this.request<any>('/admin/domains/prices'));
      // Backend returns { success, data: [] }
      if (response?.data) {
        return { items: FieldMapper.transformResponse(response.data) };
      }
      if (response?.extensions) {
        return { items: FieldMapper.transformResponse(response.extensions) };
      }
      if (Array.isArray(response)) {
        return { items: FieldMapper.transformResponse(response) };
      }
      return { items: [] };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getDomainPrices');
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<any> {
    try {
      const response = await withRetry(() => this.request<any>('/admin/system/metrics'));
      // Backend returns { success, data: {...} }
      if (response?.data) {
        return FieldMapper.transformResponse(response.data);
      }
      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getSystemMetrics');
      throw error;
    }
  }

  /**
   * Update domain price
   */
  async updateDomainPrice(extensionId: string, request: UpdateDomainPriceRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          message: string;
        }>(`/admin/domains/prices/${extensionId}`, {
          method: 'PUT',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.updateDomainPrice');
      throw error;
    }
  }

  /**
   * Create domain extension
   */
  async createDomainExtension(request: CreateDomainExtensionRequest): Promise<{
    success: boolean;
    message: string;
    extension: DomainExtension;
  }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          message: string;
          extension: DomainExtension;
        }>('/admin/domains/extensions', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.createDomainExtension');
      throw error;
    }
  }

  /**
   * Check domain availability
   */
  async checkDomainAvailability(request: CheckDomainRequest): Promise<{
    success: boolean;
    available: boolean;
    domain: string;
    extension: string;
    price?: number;
    message: string;
  }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          available: boolean;
          domain: string;
          extension: string;
          price?: number;
          message: string;
        }>('/admin/domains/check-availability', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.checkDomainAvailability');
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, request: DeleteUserRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          message: string;
        }>(`/admin/users/${userId}`, {
          method: 'DELETE',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.deleteUser');
      throw error;
    }
  }

  /**
   * Get single user (admin)
   */
  async getUser(userId: string): Promise<AdminUser> {
    try {
      const response = await withRetry(() => this.request<any>(`/admin/users/${encodeURIComponent(userId)}`));
      const data = response?.data || response;
      return FieldMapper.transformResponse(data) as AdminUser;
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getUser');
      throw error;
    }
  }

  /**
   * Ban user (admin)
   */
  async banUser(userId: string): Promise<{ success: boolean; user_id: string; status: string }> {
    try {
      const response = await withRetry(() =>
        this.request<{ success: boolean; user_id: string; status: string }>(`/admin/users/${encodeURIComponent(userId)}/ban`, {
          method: 'POST',
        })
      );
      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.banUser');
      throw error;
    }
  }

  /**
   * Unban user (admin)
   */
  async unbanUser(userId: string): Promise<{ success: boolean; user_id: string; status: string }> {
    try {
      const response = await withRetry(() =>
        this.request<{ success: boolean; user_id: string; status: string }>(`/admin/users/${encodeURIComponent(userId)}/unban`, {
          method: 'POST',
        })
      );
      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.unbanUser');
      throw error;
    }
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await withRetry(() =>
        this.request<AdminStats>('/admin/dashboard/stats')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getAdminStats');
      throw error;
    }
  }

  /**
   * Get admin receipts
   */
  async getAdminReceipts(params: { page?: number; limit?: number; from?: string; to?: string; search?: string } = {}): Promise<{
    items: Array<{
      id: string;
      service?: string;
      user_id: string;
      ref_id?: string;
      amount: number;
      created_at: string;
    }>;
    pagination?: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.from) query.append('from', params.from);
      if (params.to) query.append('to', params.to);
      if (params.search) query.append('search', params.search);
      const endpoint = `/receipts/admin/all${query.toString() ? `?${query.toString()}` : ''}`;

      const response = await withRetry(() => this.request<any>(endpoint));
      if (response?.items) {
        return {
          items: FieldMapper.transformResponse(response.items),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      if (response?.receipts) {
        return {
          items: FieldMapper.transformResponse(response.receipts),
          pagination: FieldMapper.transformResponse(response.pagination),
        };
      }
      return { items: FieldMapper.transformResponse(response?.data ?? []) };
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getAdminReceipts');
      throw error;
    }
  }

  /**
   * Download receipt
   */
  async downloadReceipt(receiptId: string, format: 'pdf' | 'html'): Promise<Blob> {
    try {
      const url = `${this.baseUrl}/receipts/${receiptId}/download${format ? `?format=${format}` : ''}`;
      const token = this.getAuthToken();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.downloadReceipt');
      throw error;
    }
  }

  /**
   * Adjust wallet balance
   */
  async adjustWalletBalance(walletId: string, request: {
    amount: number;
    type: 'credit' | 'debit' | 'correction';
    reason: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    balanceBefore: number;
    balanceAfter: number;
  }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          message: string;
          balanceBefore: number;
          balanceAfter: number;
        }>(`/admin/wallets/${walletId}/adjust`, {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.adjustWalletBalance');
      throw error;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
