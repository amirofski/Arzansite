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
      
      // Normalize notifications
      if (Array.isArray((notificationsResponse as any))) {
        setNotifications((notificationsResponse as any) as Notification[]);
      } else if (notificationsResponse && typeof notificationsResponse === 'object') {
        const list = (notificationsResponse as any).notifications;
        setNotifications(Array.isArray(list) ? list : []);
      } else {
        setNotifications([]);
      }
      
      // Normalize count
      if (countResponse && typeof countResponse === 'object') {
        const c = (countResponse as any).count;
        setUnseenCount(typeof c === 'number' ? c : 0);
      } else if (typeof (countResponse as any) === 'number') {
        setUnseenCount(countResponse as unknown as number);
      } else {
        setUnseenCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری اعلان‌ها');
      setNotifications([]);
      setUnseenCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Safe getters to avoid runtime errors when shapes vary

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
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const messages = safeNotifications.map(n => ({
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


