// Retry Utility for ArzanSite
// Provides exponential backoff retry logic for failed API requests

import { ErrorHandler } from './errorHandler';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delay: number): number {
  const jitter = Math.random() * 0.1 * delay; // 10% jitter
  return delay + jitter;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  delay = Math.min(delay, config.maxDelay);
  
  if (config.jitter) {
    delay = addJitter(delay);
  }
  
  return delay;
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt > finalConfig.maxRetries || !ErrorHandler.isRetryable(error)) {
        throw error;
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, finalConfig);
      
      console.log(`Retry attempt ${attempt}/${finalConfig.maxRetries} after ${delay}ms delay`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry with custom retry condition
 */
export async function withRetryCondition<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt or custom condition says not to retry
      if (attempt > finalConfig.maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, finalConfig);
      
      console.log(`Retry attempt ${attempt}/${finalConfig.maxRetries} after ${delay}ms delay`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry with timeout
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });

  return Promise.race([
    withRetry(fn, config),
    timeoutPromise,
  ]);
}

/**
 * Retry specific HTTP status codes
 */
export async function withRetryStatusCodes<T>(
  fn: () => Promise<T>,
  retryStatusCodes: number[],
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return withRetryCondition(
    fn,
    (error) => {
      const status = error.status || error.response?.status;
      return status && retryStatusCodes.includes(status);
    },
    config
  );
}

/**
 * Retry network errors only
 */
export async function withRetryNetworkErrors<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return withRetryCondition(
    fn,
    (error) => {
      const errorMessage = error.message?.toLowerCase() || '';
      return errorMessage.includes('network') || 
             errorMessage.includes('timeout') || 
             errorMessage.includes('connection');
    },
    config
  );
} 
