import { apiClient } from '@/lib/api-client';

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
          ...(apiClient.getToken() ? { Authorization: `Bearer ${apiClient.getToken()}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ name: topicId, subscribe: ['me'] })
      });
      return res.ok;
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
          ...(apiClient.getToken() ? { Authorization: `Bearer ${apiClient.getToken()}` } : {})
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


