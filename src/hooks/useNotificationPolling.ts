/**
 * Hook for managing notification polling
 * Provides a clean interface for starting/stopping polling and handling new notifications
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { notificationPolling } from '@/lib/services/notifications/notificationPolling';
import { debugLog, errorLog } from '@/lib/config/environment';

export interface UseNotificationPollingOptions {
  enabled?: boolean;
  interval?: number;
  onNewNotification?: (notification: any) => void;
  onError?: (error: Error) => void;
}

export function useNotificationPolling(options: UseNotificationPollingOptions = {}) {
  const { user } = useAuth();
  const isPollingRef = useRef(false);

  const startPolling = useCallback(() => {
    if (!user?.id) {
      debugLog('Cannot start polling: no user');
      return;
    }

    if (isPollingRef.current) {
      debugLog('Polling already active');
      return;
    }

    try {
      notificationPolling.updateOptions({
        enabled: options.enabled !== false,
        interval: options.interval || 30000,
        onNewNotification: options.onNewNotification,
        onError: options.onError || ((error) => {
          errorLog('Notification polling error', error);
        }),
      });

      notificationPolling.start();
      isPollingRef.current = true;
      debugLog('Notification polling started', {
        userId: user.id,
        interval: options.interval || 30000,
      });
    } catch (error) {
      errorLog('Failed to start notification polling', error);
    }
  }, [user?.id, options.enabled, options.interval, options.onNewNotification, options.onError]);

  const stopPolling = useCallback(() => {
    if (!isPollingRef.current) {
      debugLog('Polling not active');
      return;
    }

    try {
      notificationPolling.stop();
      isPollingRef.current = false;
      debugLog('Notification polling stopped');
    } catch (error) {
      errorLog('Failed to stop notification polling', error);
    }
  }, []);

  const resetPolling = useCallback(() => {
    try {
      notificationPolling.reset();
      isPollingRef.current = false;
      debugLog('Notification polling reset');
    } catch (error) {
      errorLog('Failed to reset notification polling', error);
    }
  }, []);

  const getStatus = useCallback(() => {
    return notificationPolling.getStatus();
  }, []);

  // Auto-start polling when user is available
  useEffect(() => {
    if (user?.id && options.enabled !== false) {
      startPolling();
    }

    return () => {
      if (isPollingRef.current) {
        stopPolling();
      }
    };
  }, [user?.id, options.enabled, startPolling, stopPolling]);

  // Reset polling when user changes
  useEffect(() => {
    if (user?.id) {
      resetPolling();
    }
  }, [user?.id, resetPolling]);

  return {
    startPolling,
    stopPolling,
    resetPolling,
    getStatus,
    isPolling: isPollingRef.current,
  };
}
