export interface WizardError {
  code: string;
  message: string;
  details?: any;
  context?: string;
  timestamp: string;
}

export class WizardErrorHandler {
  private static instance: WizardErrorHandler;
  private notificationCallback?: (message: string, type: 'success' | 'warning' | 'error') => void;

  private constructor() {}

  static getInstance(): WizardErrorHandler {
    if (!WizardErrorHandler.instance) {
      WizardErrorHandler.instance = new WizardErrorHandler();
    }
    return WizardErrorHandler.instance;
  }

  setNotificationCallback(callback: (message: string, type: 'success' | 'warning' | 'error') => void) {
    this.notificationCallback = callback;
  }

  static handle(error: any, context: string): WizardError {
    const errorHandler = WizardErrorHandler.getInstance();
    return errorHandler.handleError(error, context);
  }

  private handleError(error: any, context: string): WizardError {
    console.error(`Wizard Error in ${context}:`, error);
    
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'خطای نامشخص رخ داده است';
    let errorDetails = error;

    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          errorCode = 'BAD_REQUEST';
          errorMessage = 'درخواست نامعتبر است';
          break;
        case 401:
          errorCode = 'UNAUTHORIZED';
          errorMessage = 'احراز هویت ناموفق است';
          this.handleAuthError();
          break;
        case 403:
          errorCode = 'FORBIDDEN';
          errorMessage = 'دسترسی غیرمجاز است';
          this.handlePermissionError();
          break;
        case 404:
          errorCode = 'NOT_FOUND';
          errorMessage = 'منبع مورد نظر یافت نشد';
          this.handleNotFoundError();
          break;
        case 409:
          errorCode = 'CONFLICT';
          errorMessage = 'تعارض در داده‌ها وجود دارد';
          break;
        case 422:
          errorCode = 'VALIDATION_ERROR';
          errorMessage = 'خطا در اعتبارسنجی داده‌ها';
          break;
        case 429:
          errorCode = 'RATE_LIMIT';
          errorMessage = 'تعداد درخواست‌ها بیش از حد مجاز است';
          break;
        case 500:
          errorCode = 'INTERNAL_SERVER_ERROR';
          errorMessage = 'خطای داخلی سرور';
          this.handleServerError();
          break;
        case 502:
          errorCode = 'BAD_GATEWAY';
          errorMessage = 'خطا در ارتباط با سرور';
          break;
        case 503:
          errorCode = 'SERVICE_UNAVAILABLE';
          errorMessage = 'سرویس در دسترس نیست';
          break;
        default:
          if (error.response.status >= 500) {
            errorCode = 'SERVER_ERROR';
            errorMessage = 'خطای سرور رخ داده است';
            this.handleServerError();
          }
      }
    } else if (error.name === 'NetworkError' || error.message?.includes('network')) {
      errorCode = 'NETWORK_ERROR';
      errorMessage = 'خطا در ارتباط با سرور';
      this.handleNetworkError();
    } else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      errorCode = 'TIMEOUT_ERROR';
      errorMessage = 'درخواست با مشکل مواجه شد';
      this.handleTimeoutError();
    } else if (error.message) {
      errorMessage = error.message;
    }

    const wizardError: WizardError = {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      context,
      timestamp: new Date().toISOString()
    };

    this.showNotification(errorMessage, this.getErrorType(errorCode));
    return wizardError;
  }

  private getErrorType(errorCode: string): 'success' | 'warning' | 'error' {
    if (errorCode === 'VALIDATION_ERROR' || errorCode === 'RATE_LIMIT') {
      return 'warning';
    }
    return 'error';
  }

  private handleAuthError() {
    // Clear authentication data and redirect to login
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('wizard_session_id');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private handlePermissionError() {
    this.showNotification('دسترسی غیرمجاز. لطفاً مجوزهای خود را بررسی کنید.', 'error');
  }

  private handleNotFoundError() {
    this.showNotification('منبع مورد نظر یافت نشد.', 'warning');
  }

  private handleServerError() {
    this.showNotification('خطای سرور. لطفاً بعداً تلاش کنید.', 'error');
  }

  private handleNetworkError() {
    this.showNotification('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.', 'error');
  }

  private handleTimeoutError() {
    this.showNotification('درخواست با مشکل مواجه شد. لطفاً دوباره تلاش کنید.', 'warning');
  }

  private showNotification(message: string, type: 'success' | 'warning' | 'error') {
    if (this.notificationCallback) {
      this.notificationCallback(message, type);
    } else {
      // Fallback to console
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Utility methods for specific error types
  static isNetworkError(error: any): boolean {
    return error.name === 'NetworkError' || 
           error.message?.includes('network') || 
           error.message?.includes('fetch');
  }

  static isAuthError(error: any): boolean {
    return error.response?.status === 401 || 
           error.response?.status === 403;
  }

  static isServerError(error: any): boolean {
    return error.response?.status >= 500;
  }

  static isValidationError(error: any): boolean {
    return error.response?.status === 422 || 
           error.response?.status === 400;
  }

  // Retry mechanism for network errors
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !WizardErrorHandler.isNetworkError(error)) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError;
  }
}

// Export singleton instance
export const wizardErrorHandler = WizardErrorHandler.getInstance();
