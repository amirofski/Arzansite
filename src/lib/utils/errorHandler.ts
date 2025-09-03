// Error Handler Utility for ArzanSite
// Provides standardized error handling and retry logic for API calls

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  retryable?: boolean;
  supportRequired?: boolean;
}

export class ErrorHandler {
  /**
   * Handle and format API errors
   */
  static handle(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: any): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    
    // Check HTTP status codes
    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }

    // Check error messages for network-related issues
    const errorMessage = error.message?.toLowerCase() || '';
    const networkKeywords = ['network', 'timeout', 'connection', 'server', 'gateway'];
    
    return networkKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if an error requires support intervention
   */
  static requiresSupport(error: any): boolean {
    const supportStatuses = [400, 401, 403, 422];
    
    if (error.status && supportStatuses.includes(error.status)) {
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const supportKeywords = ['invalid', 'unauthorized', 'forbidden', 'validation'];
    
    return supportKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Create a standardized error object
   */
  static createError(error: any): ApiError {
    const message = this.handle(error);
    const retryable = this.isRetryable(error);
    const supportRequired = this.requiresSupport(error);

    return {
      message,
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status || error.response?.status,
      details: error.details || error,
      retryable,
      supportRequired,
    };
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context?: string): void {
    const errorObj = this.createError(error);
    
    console.error(`[${context || 'API Error'}]:`, {
      message: errorObj.message,
      code: errorObj.code,
      status: errorObj.status,
      retryable: errorObj.retryable,
      supportRequired: errorObj.supportRequired,
      details: errorObj.details,
    });
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    const errorObj = this.createError(error);
    
    // Map common error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Connection failed. Please check your internet connection and try again.',
      'TIMEOUT_ERROR': 'Request timed out. Please try again.',
      'UNAUTHORIZED': 'Please log in to continue.',
      'FORBIDDEN': 'You don\'t have permission to perform this action.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'NOT_FOUND': 'The requested resource was not found.',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
    };

    return errorMessages[errorObj.code || ''] || errorObj.message;
  }

  /**
   * Check if error is authentication-related
   */
  static isAuthError(error: any): boolean {
    const authStatuses = [401, 403];
    const authKeywords = ['unauthorized', 'forbidden', 'token', 'authentication'];
    
    if (error.status && authStatuses.includes(error.status)) {
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    return authKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if error is validation-related
   */
  static isValidationError(error: any): boolean {
    const validationStatuses = [400, 422];
    const validationKeywords = ['validation', 'invalid', 'required', 'format'];
    
    if (error.status && validationStatuses.includes(error.status)) {
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    return validationKeywords.some(keyword => errorMessage.includes(keyword));
  }
} 
