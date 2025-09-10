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
  role?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
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
   * Get admin payments
   */
  async getPayments(params: { page?: number; limit?: number; status?: string; user_id?: string } = {}): Promise<{
    success: boolean;
    payments: Array<{
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
      const endpoint = `/admin/payments${query.toString() ? `?${query.toString()}` : ''}`;

      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          payments: Array<{
            id: string;
            user_id: string;
            status: string;
            ref_id?: string;
            amount: number;
            created_at: string;
          }>;
          pagination?: { page: number; limit: number; total: number; pages: number };
        }>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getPayments');
      throw error;
    }
  }
  /**
   * Get orders for admin
   */
  async getOrders(request: GetOrdersRequest = {}): Promise<{
    success: boolean;
    orders: AdminOrder[];
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
      
      const queryString = queryParams.toString();
      const endpoint = `/admin/orders${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          orders: AdminOrder[];
          pagination?: {
            page: number;
            limit: number;
            total: number;
            pages: number;
          };
        }>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getOrders');
      throw error;
    }
  }

  /**
   * Get all user profiles
   */
  async getAllProfiles(): Promise<{
    success: boolean;
    users: AdminUser[];
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          users: AdminUser[];
        }>('/admin/users')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getAllProfiles');
      throw error;
    }
  }

  /**
   * Get email logs
   */
  async getEmailLogs(limit: number = 100, offset: number = 0): Promise<{
    success: boolean;
    logs: EmailLog[];
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
      
      const endpoint = `/admin/emails/logs?${queryParams.toString()}`;
      
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          logs: EmailLog[];
          pagination?: {
            limit: number;
            offset: number;
            total: number;
          };
        }>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getEmailLogs');
      throw error;
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
        }>('/admin/emails/test', {
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
    success: boolean;
    extensions: DomainExtension[];
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          success: boolean;
          extensions: DomainExtension[];
        }>('/admin/domains/prices')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getDomainPrices');
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await withRetry(() =>
        this.request<SystemMetrics>('/admin/system/metrics')
      );

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
          method: 'PATCH',
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
        }>('/admin/domains/check', {
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
   * Get admin statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await withRetry(() =>
        this.request<AdminStats>('/admin/stats')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AdminService.getAdminStats');
      throw error;
    }
  }

  /**
   * Download receipt
   */
  async downloadReceipt(receiptId: string, format: 'pdf' | 'html'): Promise<Blob> {
    try {
      const url = `${this.baseUrl}/admin/receipts/${receiptId}/download?format=${format}`;
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
