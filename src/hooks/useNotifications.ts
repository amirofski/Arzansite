import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationsService } from '@/lib/notificationsService';

export function useNotifications() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const [messages, setMessages] = useState<Array<{ id: string; title: string; body?: string; date: string }>>([]);

  useEffect(() => {
    let active = true;
    async function subscribe() {
      if (!user?.id) return;
      setError(null);
      // Prevent repeated subscription calls (e.g., React strict mode) and after success
      const flagKey = `notif_sub_${user.id}`;
      if (localStorage.getItem(flagKey) === '1') {
        if (!active) return;
        setSubscribed(true);
        return;
      }
      const ok = await NotificationsService.subscribeToTopic(`user:${user.id}`);
      if (!active) return;
      setSubscribed(ok);
      if (!ok) {
        setError('خطا در اتصال به اعلان‌ها');
      } else {
        try { localStorage.setItem(flagKey, '1'); } catch (e) { /* ignore quota errors */ }
      }
    }
    subscribe();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const pushMock = (title?: string, body?: string) => {
    const msg = { id: `local_${Date.now()}`, title: title || 'اعلان جدید', body, date: new Date().toISOString() };
    setMessages((list) => [msg, ...list].slice(0, 50));
    setUnseenCount((c) => c + 1);
  };

  const markAllRead = () => setUnseenCount(0);
  const addMessage = (title: string, body?: string) => pushMock(title, body);

  return { subscribed, error, unseenCount, messages, markAllRead, addMessage, pushMock };
}


