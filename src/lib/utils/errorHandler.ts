// Error Handler Utility for ArzanSite
// Provides standardized error handling and retry logic for API calls

import { extractErrorMessage, translateErrorMessage } from './errorMessages';

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
    const extractedMessage = extractErrorMessage(error);
    return extractedMessage;
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
   * Get user-friendly error message in Persian
   */
  static getUserFriendlyMessage(error: any): string {
    const errorObj = this.createError(error);
    return translateErrorMessage(errorObj.message);
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
