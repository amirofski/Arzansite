import { tokenManager } from '@/lib/tokenManager';

export type NotificationPayload = {
  topicId: string;
  message: string;
  data?: Record<string, unknown>;
};

export class NotificationsService {
  // Subscribe a user to a topic via backend (which uses Appwrite messaging)
  static async subscribeToTopic(topicId: string): Promise<boolean> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api'}/messaging/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ name: topicId, subscribe: [topicId.startsWith('user:') ? topicId : `user:${topicId}`] })
      });
      if (res.ok) return true;
      // Treat "already exists" as success to avoid repeated 500s on re-subscribe
      try {
        const data = await res.json();
        if (typeof data?.error === 'string' && data.error.includes('already exists')) {
          return true;
        }
      } catch (e) {
        // ignore parse errors
      }
      return false;
    } catch {
      return false;
    }
  }

  // Publish a message to a topic via backend
  static async publish(topicId: string, message: string, data?: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api'}/messaging/topics/${encodeURIComponent(topicId)}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ message, data })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}


