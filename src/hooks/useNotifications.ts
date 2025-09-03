import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationsService, type Notification } from '@/lib/services';

export function useNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [notificationsResponse, countResponse] = await Promise.all([
        notificationsService.getNotifications({ limit: 20, unreadOnly: false }),
        notificationsService.getUnreadCount()
      ]);
      
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.notifications);
      }
      
      if (countResponse.success) {
        setUnseenCount(countResponse.count);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری اعلان‌ها');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark all notifications as read
  const markAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setUnseenCount(0);
      // Update local notifications to mark them as read
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در علامت‌گذاری اعلان‌ها');
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setUnseenCount(prev => Math.max(0, prev - 1));
      // Update local notification to mark it as read
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در علامت‌گذاری اعلان');
    }
  };

  // Load notifications on mount and when user changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Convert notifications to the format expected by NotificationsBell
  const messages = notifications.map(n => ({
    id: n.id,
    title: n.title,
    body: n.message,
    date: n.createdAt,
    isRead: n.isRead
  }));

  return { 
    loading, 
    error, 
    unseenCount, 
    messages, 
    notifications,
    markAllRead, 
    markAsRead,
    refresh: loadNotifications
  };
}


