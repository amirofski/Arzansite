/**
 * Comprehensive Error Handler for API calls and frontend operations
 */

export interface ApiError {
  status?: number;
  message: string;
  code?: string;
  details?: any;
}

export class ErrorHandler {
  /**
   * Handle API errors with proper Persian messages
   */
  static handleApiError(error: any): string {
    console.error('API Error:', error);

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'خطای نامشخص';
      
      switch (status) {
        case 400:
          return `خطا در درخواست: ${message}`;
        case 401:
          return 'لطفاً دوباره وارد شوید';
        case 403:
          return 'دسترسی غیرمجاز';
        case 404:
          return 'منبع مورد نظر یافت نشد';
        case 409:
          return 'تضاد در داده‌ها: ' + message;
        case 422:
          return 'داده‌های نامعتبر: ' + message;
        case 429:
          return 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید';
        case 500:
          return 'خطای سرور. لطفاً بعداً تلاش کنید';
        case 502:
          return 'خطا در ارتباط با سرور';
        case 503:
          return 'سرویس موقتاً در دسترس نیست';
        default:
          return message || `خطای HTTP ${status}`;
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      return 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید';
    } else if (error.code === 'NETWORK_ERROR') {
      return 'خطا در شبکه. لطفاً اتصال اینترنت خود را بررسی کنید';
    } else if (error.code === 'TIMEOUT') {
      return 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید';
    } else if (error.message) {
      // Other error with message
      return error.message;
    } else {
      // Unknown error
      return 'خطای ناشناخته رخ داده است';
    }
  }

  /**
   * Handle WebSocket/Realtime errors
   */
  static handleRealtimeError(error: any): string {
    console.error('Realtime error:', error);

    if (error.type === 'error') {
      return 'خطا در اتصال به سیستم اعلان‌ها';
    } else if (error.type === 'connection_error') {
      return 'خطا در اتصال به سرور اعلان‌ها';
    } else if (error.message) {
      return `خطا در اعلان‌ها: ${error.message}`;
    } else {
      return 'خطا در سیستم اعلان‌ها';
    }
  }

  /**
   * Handle order creation errors specifically
   */
  static handleOrderError(error: any): string {
    console.error('Order creation error:', error);

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'خطا در ایجاد سفارش';
      
      switch (status) {
        case 400:
          if (message.includes('validation') || message.includes('invalid')) {
            return 'اطلاعات سفارش نامعتبر است';
          }
          return `خطا در درخواست سفارش: ${message}`;
        case 401:
          return 'لطفاً ابتدا وارد شوید';
        case 403:
          return 'شما مجاز به ایجاد سفارش نیستید';
        case 409:
          return 'سفارش مشابهی قبلاً ایجاد شده است';
        case 422:
          return 'اطلاعات سفارش ناقص است';
        case 500:
          return 'خطا در ایجاد سفارش. لطفاً دوباره تلاش کنید';
        default:
          return message;
      }
    } else if (error.request) {
      return 'خطا در اتصال به سرور. لطفاً دوباره تلاش کنید';
    } else {
      return error.message || 'خطا در ایجاد سفارش';
    }
  }

  /**
   * Handle payment errors
   */
  static handlePaymentError(error: any): string {
    console.error('Payment error:', error);

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'خطا در پرداخت';
      
      switch (status) {
        case 400:
          return 'اطلاعات پرداخت نامعتبر است';
        case 402:
          return 'پرداخت ناموفق بود';
        case 403:
          return 'دسترسی به درگاه پرداخت مجاز نیست';
        case 404:
          return 'درگاه پرداخت یافت نشد';
        case 409:
          return 'پرداخت قبلاً انجام شده است';
        case 500:
          return 'خطا در درگاه پرداخت. لطفاً دوباره تلاش کنید';
        default:
          return message;
      }
    } else if (error.request) {
      return 'خطا در اتصال به درگاه پرداخت';
    } else {
      return error.message || 'خطا در پردازش پرداخت';
    }
  }

  /**
   * Handle notification errors
   */
  static handleNotificationError(error: any): string {
    console.error('Notification error:', error);

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'خطا در اعلان‌ها';
      
      switch (status) {
        case 400:
          return 'درخواست اعلان نامعتبر است';
        case 401:
          return 'لطفاً ابتدا وارد شوید';
        case 403:
          return 'دسترسی به اعلان‌ها مجاز نیست';
        case 404:
          return 'اعلان یافت نشد';
        case 500:
          return 'خطا در سیستم اعلان‌ها';
        default:
          return message;
      }
    } else if (error.request) {
      return 'خطا در اتصال به سیستم اعلان‌ها';
    } else {
      return error.message || 'خطا در اعلان‌ها';
    }
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context: string): void {
    console.group(`🚨 Error in ${context}`);
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.request) {
      console.error('Request details:', error.request);
    }
    console.groupEnd();
  }

  /**
   * Create a user-friendly error message
   */
  static createUserMessage(error: any, context: string): string {
    const baseMessage = this.handleApiError(error);
    return `${context}: ${baseMessage}`;
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    if (error.response) {
      const status = error.response.status;
      // Retry on server errors and timeouts
      return status >= 500 || status === 408 || status === 429;
    }
    // Retry on network errors
    return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT';
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: any, attempt: number): number {
    if (error.response?.status === 429) {
      // Rate limiting - exponential backoff
      return Math.min(1000 * Math.pow(2, attempt), 30000);
    }
    // Default exponential backoff
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }
}

/**
 * Utility function for handling errors in async operations
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    ErrorHandler.logError(error, context);
    const message = ErrorHandler.handleApiError(error);
    console.error(`${context}: ${message}`);
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw new Error(message);
  }
}

/**
 * Utility function for handling errors with retry logic
 */
export async function handleAsyncErrorWithRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !ErrorHandler.isRetryableError(error)) {
        break;
      }
      
      const delay = ErrorHandler.getRetryDelay(error, attempt);
      console.log(`Retrying ${context} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  ErrorHandler.logError(lastError, context);
  throw new Error(ErrorHandler.handleApiError(lastError));
}