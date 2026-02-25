/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

export const environment = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },

  // Appwrite Configuration
  appwrite: {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://app.arzansite.com/v1',
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '6898b35e003067cd7b43',
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'main',
    collections: {
      notifications: import.meta.env.VITE_APPWRITE_COLLECTION_NOTIFICATIONS || 'notifications',
      orders: import.meta.env.VITE_APPWRITE_COLLECTION_ORDERS || 'orders',
      receipts: import.meta.env.VITE_APPWRITE_COLLECTION_RECEIPTS || 'receipts',
      invoices: import.meta.env.VITE_APPWRITE_COLLECTION_INVOICES || 'invoices',
      notificationPreferences: import.meta.env.VITE_APPWRITE_COLLECTION_NOTIFICATION_PREFERENCES || 'notification_preferences',
      pushTokens: import.meta.env.VITE_APPWRITE_COLLECTION_PUSH_TOKENS || 'push_tokens',
    },
  },

  // Payment Configuration
  payment: {
    zarinpal: {
      merchantId: import.meta.env.VITE_ZARINPAL_MERCHANT_ID || '',
      sandbox: import.meta.env.VITE_ZARINPAL_SANDBOX === 'true',
      callbackUrl: import.meta.env.VITE_ZARINPAL_CALLBACK_URL || '',
    },
  },

  // Feature Flags
  features: {
    enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    enablePaymentReminders: import.meta.env.VITE_ENABLE_PAYMENT_REMINDERS !== 'false',
    enableDebugLogging: import.meta.env.VITE_DEBUG_LOGGING === 'true',
  },

  // Development Configuration
  development: {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    enableConsoleLogs: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
  },
};

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required API configuration
  if (!environment.api.baseUrl) {
    errors.push('VITE_API_URL is required');
  }

  // Check required Appwrite configuration
  if (!environment.appwrite.endpoint) {
    errors.push('VITE_APPWRITE_ENDPOINT is required');
  }

  if (!environment.appwrite.projectId) {
    errors.push('VITE_APPWRITE_PROJECT_ID is required');
  }

  if (!environment.appwrite.databaseId) {
    errors.push('VITE_APPWRITE_DATABASE_ID is required');
  }

  // Check payment configuration if enabled
  if (environment.payment.zarinpal.merchantId && !environment.payment.zarinpal.merchantId) {
    errors.push('VITE_ZARINPAL_MERCHANT_ID is required for payment processing');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('Environment validation failed:', validation.errors);
    throw new Error(`Environment configuration is invalid: ${validation.errors.join(', ')}`);
  }

  return environment;
}

/**
 * Debug logging utility
 */
export function debugLog(message: string, data?: any) {
  if (environment.features.enableDebugLogging || environment.development.isDev) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

/**
 * Error logging utility
 */
export function errorLog(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error);
}

/**
 * Warning logging utility
 */
export function warnLog(message: string, data?: any) {
  console.warn(`[WARN] ${message}`, data);
}

/**
 * Info logging utility
 */
export function infoLog(message: string, data?: any) {
  if (environment.features.enableDebugLogging || environment.development.isDev) {
    console.info(`[INFO] ${message}`, data);
  }
}

// Export default configuration
export default environment;
