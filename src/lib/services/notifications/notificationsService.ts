// Notifications Service for ArzanSite
// Handles in-app notifications and system notifications

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface MarkNotificationReadRequest {
  notificationId: string;
}

// Response interfaces
export interface Notification {
  id: string;
  userId: string;
  type: 'order_update' | 'payment_update' | 'system' | 'support_reply' | 'general';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  notifications: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MarkNotificationReadResponse {
  success: boolean;
  message: string;
}

export class NotificationsService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Get user notifications
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    unreadOnly?: boolean;
  }): Promise<NotificationListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.unreadOnly) queryParams.append('unread_only', 'true');
      
      const queryString = queryParams.toString();
      const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
      
      const response = await withRetry(() =>
        this.request<NotificationListResponse>(endpoint)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'NotificationsService.getNotifications');
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<MarkNotificationReadResponse> {
    try {
      const response = await withRetry(() =>
        this.request<MarkNotificationReadResponse>(`/notifications/${notificationId}/read`, {
          method: 'PATCH',
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'NotificationsService.markAsRead');
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkNotificationReadResponse> {
    try {
      const response = await withRetry(() =>
        this.request<MarkNotificationReadResponse>('/notifications/read-all', {
          method: 'PATCH',
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'NotificationsService.markAllAsRead');
      throw error;
    }
  }

  /**
   * Get notification count
   */
  async getUnreadCount(): Promise<{ success: boolean; count: number }> {
    try {
      const response = await withRetry(() =>
        this.request<{ success: boolean; count: number }>('/notifications/count')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'NotificationsService.getUnreadCount');
      throw error;
    }
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();
