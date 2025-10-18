import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationsService } from '@/lib/services';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  paymentReminders: {
    monthly: { days: number[]; enabled: boolean };
    annual: { days: number[]; enabled: boolean };
  };
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    inApp: true,
    paymentReminders: {
      monthly: { days: [5, 2, 1], enabled: true }, // 5 days, 2 days, 1 day before
      annual: { days: [30, 7, 1], enabled: true }, // 30 days, 7 days, 1 day before
    },
  });

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationsService.getPreferences();
      if (response.success && response.preferences) {
        setPreferences(response.preferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری تنظیمات اعلان‌ها');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationsService.updatePreferences(newPreferences);
      if (response.success) {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در به‌روزرسانی تنظیمات اعلان‌ها');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    loading,
    error,
    preferences,
    updatePreferences,
    refresh: loadPreferences,
  };
}
