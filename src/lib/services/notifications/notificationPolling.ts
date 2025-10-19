/**
 * Notification Polling Service
 * Since Appwrite 1.6.1 doesn't support realtime in client SDK,
 * we'll use polling to check for new notifications
 */

import { notificationsService } from './notificationsService';
import { debugLog, warnLog } from '@/lib/config/environment';

export interface NotificationPollingOptions {
  interval?: number; // Polling interval in milliseconds (default: 30000 = 30 seconds)
  enabled?: boolean; // Whether polling is enabled (default: true)
  onNewNotification?: (notification: unknown) => void; // Callback for new notifications
  onError?: (error: Error) => void; // Callback for errors
}

export class NotificationPollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheckTime: Date = new Date();
  private lastNotificationIds: Set<string> = new Set();
  private options: Required<NotificationPollingOptions>;
  private isPolling = false;

  constructor(options: NotificationPollingOptions = {}) {
    this.options = {
      interval: options.interval || 30000, // 30 seconds default
      enabled: options.enabled !== false,
      onNewNotification: options.onNewNotification || (() => {}),
      onError: options.onError || ((error) => console.error('Notification polling error:', error)),
    };
  }

  /**
   * Start polling for notifications
   */
  start(): void {
    if (this.isPolling) {
      warnLog('Notification polling is already running');
      return;
    }

    if (!this.options.enabled) {
      debugLog('Notification polling is disabled');
      return;
    }

    debugLog('Starting notification polling', {
      interval: this.options.interval,
      lastCheckTime: this.lastCheckTime,
    });

    this.isPolling = true;
    this.intervalId = setInterval(() => {
      this.checkForNewNotifications();
    }, this.options.interval);

    // Initial check
    this.checkForNewNotifications();
  }

  /**
   * Stop polling for notifications
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
    debugLog('Notification polling stopped');
  }

  /**
   * Check for new notifications
   */
  private async checkForNewNotifications(): Promise<void> {
    try {
      debugLog('Checking for new notifications', {
        lastCheckTime: this.lastCheckTime,
        currentTime: new Date(),
      });

      const response = await notificationsService.getNotifications({
        limit: 50, // Get recent notifications
        unreadOnly: false,
      });

      const notifications = Array.isArray(response) 
        ? response 
        : (response as { notifications?: unknown[] })?.notifications || [];

      // Find new notifications
      const newNotifications = notifications.filter((notification: unknown) => {
        const notif = notification as { id?: string; $id?: string; createdAt?: string; $createdAt?: string };
        const notificationId = notif.id || notif.$id;
        const notificationTime = new Date(notif.createdAt || notif.$createdAt || '');
        
        return (
          notificationId && 
          !this.lastNotificationIds.has(notificationId) &&
          notificationTime > this.lastCheckTime
        );
      });

      if (newNotifications.length > 0) {
        debugLog('New notifications found', {
          count: newNotifications.length,
          notifications: newNotifications.map(n => ({
            id: n.id || n.$id,
            title: n.title,
            createdAt: n.createdAt || n.$createdAt,
          })),
        });

        // Update last notification IDs
        newNotifications.forEach((notification: unknown) => {
          const notif = notification as { id?: string; $id?: string };
          const notificationId = notif.id || notif.$id;
          if (notificationId) {
            this.lastNotificationIds.add(notificationId);
          }
        });

        // Call callback for each new notification
        newNotifications.forEach((notification: unknown) => {
          this.options.onNewNotification(notification);
        });
      }

      // Update last check time
      this.lastCheckTime = new Date();

    } catch (error) {
      this.options.onError(error as Error);
    }
  }

  /**
   * Update polling options
   */
  updateOptions(newOptions: Partial<NotificationPollingOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Restart polling if interval changed
    if (newOptions.interval && this.isPolling) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current polling status
   */
  getStatus(): {
    isPolling: boolean;
    interval: number;
    lastCheckTime: Date;
    enabled: boolean;
  } {
    return {
      isPolling: this.isPolling,
      interval: this.options.interval,
      lastCheckTime: this.lastCheckTime,
      enabled: this.options.enabled,
    };
  }

  /**
   * Reset polling state (useful when user logs out/in)
   */
  reset(): void {
    this.stop();
    this.lastCheckTime = new Date();
    this.lastNotificationIds.clear();
    debugLog('Notification polling reset');
  }
}

// Export singleton instance
export const notificationPolling = new NotificationPollingService();
