/**
 * Frontend Integration Examples for Notifications and Receipts
 * 
 * This file demonstrates how to use the notification and receipt services
 * with proper token handling and error management.
 */

import React from 'react';
import { notificationsService } from '@/lib/services/notifications/notificationsService';
import { receiptService } from '@/lib/services/receipts/receiptService';
import { tokenManager } from '@/lib/tokenManager';

// ============================================================================
// NOTIFICATION INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example 1: Get notification history with pagination
 */
export async function getNotificationHistory(page: number = 1, limit: number = 20) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.getNotifications({
      page,
      limit,
      unreadOnly: false
    });

    console.log('Notification history:', response);
    return response;
  } catch (error) {
    console.error('Error fetching notification history:', error);
    throw error;
  }
}

/**
 * Example 2: Get unread notification count
 */
export async function getUnreadCount() {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.getUnreadCount();
    console.log('Unread count:', response.count);
    return response.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
}

/**
 * Example 3: Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.markAsRead(notificationId);
    console.log('Marked as read:', response);
    return response;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Example 4: Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.markAllAsRead();
    console.log('All marked as read:', response);
    return response;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Example 5: Send test notification
 */
export async function sendTestNotification() {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.sendTestNotification({
      title: 'تست اعلان',
      message: 'این یک اعلان تستی است',
      type: 'test'
    });

    console.log('Test notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

/**
 * Example 6: Send order status notification
 */
export async function sendOrderStatusNotification(orderId: string, status: string) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.sendOrderStatusNotification({
      orderId,
      status,
      message: `وضعیت سفارش ${orderId} به ${status} تغییر کرد`,
      notificationType: 'order_updated'
    });

    console.log('Order status notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending order status notification:', error);
    throw error;
  }
}

/**
 * Example 7: Get notification preferences
 */
export async function getNotificationPreferences() {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.getPreferences();
    console.log('Notification preferences:', response);
    return response;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
}

/**
 * Example 8: Update notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
  paymentReminders?: {
    monthly?: { days?: number[]; enabled?: boolean };
    annual?: { days?: number[]; enabled?: boolean };
  };
}) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.updatePreferences(preferences);
    console.log('Preferences updated:', response);
    return response;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Example 9: Get channel status
 */
export async function getChannelStatus() {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await notificationsService.getChannelStatus();
    console.log('Channel status:', response);
    return response;
  } catch (error) {
    console.error('Error fetching channel status:', error);
    throw error;
  }
}

// ============================================================================
// RECEIPT INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example 10: Get receipt download URL
 */
export async function getReceiptDownloadUrl(receiptId: string) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await receiptService.getReceiptUrl(receiptId);
    console.log('Receipt URL:', response.url);
    return response.url;
  } catch (error) {
    console.error('Error fetching receipt URL:', error);
    throw error;
  }
}

/**
 * Example 11: List user receipts
 */
export async function listUserReceipts(page: number = 1, limit: number = 20) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await receiptService.listReceipts({
      page,
      limit
    });

    console.log('User receipts:', response);
    return response;
  } catch (error) {
    console.error('Error listing user receipts:', error);
    throw error;
  }
}

/**
 * Example 12: Get receipt details
 */
export async function getReceiptDetails(receiptId: string) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await receiptService.getReceiptDetails(receiptId);
    console.log('Receipt details:', response);
    return response;
  } catch (error) {
    console.error('Error fetching receipt details:', error);
    throw error;
  }
}

/**
 * Example 13: Download receipt PDF
 */
export async function downloadReceiptPDF(receiptId: string) {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    // First get the download URL
    const urlResponse = await receiptService.getReceiptUrl(receiptId);
    
    // Then download the PDF
    const blob = await receiptService.downloadReceipt(receiptId, 'pdf');
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${receiptId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('Receipt PDF downloaded');
    return true;
  } catch (error) {
    console.error('Error downloading receipt PDF:', error);
    throw error;
  }
}

// ============================================================================
// DIRECT API CALL EXAMPLES (Alternative approach)
// ============================================================================

/**
 * Example 14: Direct API call for notifications (alternative to service)
 */
export async function directNotificationAPI() {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api';

    // Get notification history
    const notificationsResponse = await fetch(`${API_BASE}/notifications/history?page=1&limit=20`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    const notifications = await notificationsResponse.json();

    // Get unread count
    const unreadResponse = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    const unreadCount = await unreadResponse.json();

    // Mark as read
    const markReadResponse = await fetch(`${API_BASE}/notifications/123/read`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    const markReadResult = await markReadResponse.json();

    console.log('Direct API results:', { notifications, unreadCount, markReadResult });
    return { notifications, unreadCount, markReadResult };
  } catch (error) {
    console.error('Error with direct API calls:', error);
    throw error;
  }
}

/**
 * Example 15: Direct API call for receipts (alternative to service)
 */
export async function directReceiptAPI() {
  try {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api';

    // Get receipt download URL
    const receiptUrlResponse = await fetch(`${API_BASE}/receipts/123/url`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    const receiptUrl = await receiptUrlResponse.json();

    console.log('Receipt URL:', receiptUrl.url);
    return receiptUrl.url;
  } catch (error) {
    console.error('Error with direct receipt API:', error);
    throw error;
  }
}

// ============================================================================
// USAGE EXAMPLES IN REACT COMPONENTS
// ============================================================================

/**
 * Example 16: React hook for notifications
 */
export function useNotificationIntegration() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const sendTestNotification = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendTestNotification();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setLoading(true);
    setError(null);
    try {
      await markNotificationAsRead(notificationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sendTestNotification,
    markAsRead,
  };
}

/**
 * Example 17: React hook for receipts
 */
export function useReceiptIntegration() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const downloadReceipt = async (receiptId: string) => {
    setLoading(true);
    setError(null);
    try {
      await downloadReceiptPDF(receiptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  const getReceiptList = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const receipts = await listUserReceipts(page, 20);
      return receipts;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    downloadReceipt,
    getReceiptList,
  };
}
