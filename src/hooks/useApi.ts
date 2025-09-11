// useApi Hook for ArzanSite
// Provides loading states, error handling, and retry logic for API calls

import { useState, useCallback, useRef } from 'react';
import { withRetry } from '@/lib/utils/retry';
import { ErrorHandler } from '@/lib/utils/errorHandler';

export interface UseApiOptions {
  retryConfig?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    jitter?: boolean;
  };
  requireAuth?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onFinally?: () => void;
}

export interface UseApiReturn<T, P extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: P) => Promise<T>;
  reset: () => void;
  retry: () => Promise<T | null>;
  lastArgs: P | null;
}

export function useApi<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastArgsRef = useRef<P | null>(null);
  const lastPromiseRef = useRef<Promise<T> | null>(null);

  const execute = useCallback(async (...args: P): Promise<T> => {
    setLoading(true);
    setError(null);
    lastArgsRef.current = args;

    try {
      // Optionally ensure token presence before protected calls
      if (options.requireAuth) {
        try {
          const { tokenManager } = await import('@/lib/tokenManager');
          let token = tokenManager.getAccessToken();
          if (!token) {
            tokenManager.forceRefreshFromStorage();
            token = tokenManager.getAccessToken();
            if (!token) {
              // wait once briefly for token propagation
              await new Promise(r => setTimeout(r, 250));
              token = tokenManager.getAccessToken();
            }
          }
          if (!token) throw new Error('Unauthorized - please log in again');
        } catch (e) {
          throw e;
        }
      }

      const result = await withRetry(
        () => apiFunction(...args),
        options.retryConfig
      );
      
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = ErrorHandler.getUserFriendlyMessage(err);
      setError(errorMessage);
      options.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
      options.onFinally?.();
    }
  }, [apiFunction, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    lastArgsRef.current = null;
    lastPromiseRef.current = null;
  }, []);

  const retry = useCallback(async (): Promise<T | null> => {
    if (!lastArgsRef.current) {
      return null;
    }

    try {
      const result = await execute(...lastArgsRef.current);
      return result;
    } catch (err) {
      return null;
    }
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
    lastArgs: lastArgsRef.current,
  };
}

// Specialized hooks for common API patterns

export function useApiWithCache<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  cacheKey: string,
  options: UseApiOptions = {}
): UseApiReturn<T, P> & { cached: boolean } {
  const [cached, setCached] = useState(false);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const execute = useCallback(async (...args: P): Promise<T> => {
    const key = `${cacheKey}:${JSON.stringify(args)}`;
    const cached = cacheRef.current.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCached(true);
      return cached.data;
    }

    setCached(false);
    const result = await apiFunction(...args);
    
    cacheRef.current.set(key, {
      data: result,
      timestamp: Date.now(),
    });
    
    return result;
  }, [apiFunction, cacheKey]);

  const apiReturn = useApi(execute, options);

  return {
    ...apiReturn,
    cached,
  };
}

export function useApiWithOptimisticUpdate<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  optimisticUpdate: (args: P) => T,
  options: UseApiOptions = {}
): UseApiReturn<T, P> & { optimisticData: T | null } {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [originalData, setOriginalData] = useState<T | null>(null);

  const execute = useCallback(async (...args: P): Promise<T> => {
    // Apply optimistic update
    const optimistic = optimisticUpdate(args);
    setOptimisticData(optimistic);
    setOriginalData(originalData);

    try {
      const result = await apiFunction(...args);
      setOptimisticData(null);
      setOriginalData(result);
      return result;
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticData(null);
      setOriginalData(originalData);
      throw err;
    }
  }, [apiFunction, optimisticUpdate, originalData]);

  const reset = useCallback(() => {
    setOptimisticData(null);
    setOriginalData(null);
  }, []);

  return {
    data: optimisticData || originalData,
    loading: false, // Optimistic updates don't show loading
    error: null,
    execute,
    reset,
    retry: async () => null,
    lastArgs: null,
    optimisticData,
  };
}

export function useApiWithPolling<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  pollingInterval: number = 5000,
  options: UseApiOptions = {}
): UseApiReturn<T, P> & { startPolling: () => void; stopPolling: () => void; isPolling: boolean } {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<P | null>(null);

  const startPolling = useCallback((...args: P) => {
    if (isPolling) return;
    
    setIsPolling(true);
    lastArgsRef.current = args;
    
    intervalRef.current = setInterval(async () => {
      if (lastArgsRef.current) {
        try {
          await apiFunction(...lastArgsRef.current);
        } catch (err) {
          console.error('Polling error:', err);
        }
      }
    }, pollingInterval);
  }, [apiFunction, pollingInterval, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const apiReturn = useApi(apiFunction, options);

  return {
    ...apiReturn,
    startPolling,
    stopPolling,
    isPolling,
  };
}

// Utility hook for form submissions
export function useApiSubmit<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T, P> & { 
  isSubmitting: boolean;
  submit: (...args: P) => Promise<T>;
} {
  const apiReturn = useApi(apiFunction, options);

  return {
    ...apiReturn,
    isSubmitting: apiReturn.loading,
    submit: apiReturn.execute,
  };
}
