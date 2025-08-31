import { apiClient } from './api-client';

/**
 * Enhanced API Client for Order Registration and Wallet Management
 * This client provides comprehensive endpoints for the complete order workflow
 */

export interface EnhancedOrderData {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_method?: 'wallet' | 'zarinpal';
  transaction_id?: string;
  zarinpal_authority?: string;
  zarinpal_ref_id?: string;
  user_id: string;
  wizard_data: {
    siteType: 'personal' | 'business';
    websiteFramework: any;
    branding: any;
    additionalServices: any;
    domains: any;
    pricing: any;
  };
  created_at: string;
  updated_at: string;
}

export interface WalletTransactionData {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  reference_id?: string;
  reference_type?: 'order' | 'wallet_deposit' | 'refund';
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  refId?: string;
  orderId?: string;
  amount?: number;
  description?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  retryable?: boolean;
  supportRequired?: boolean;
}

export interface OrderSummaryData {
  orderId: string;
  totalAmount: number;
  itemsCount: number;
  status: string;
  paymentStatus: string;
  estimatedDelivery: string;
  progress: {
    currentStep: string;
    completedSteps: string[];
    remainingSteps: string[];
  };
}

export class EnhancedApiClient {
  private baseClient = apiClient;

  // ========================================
  // ORDER MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Create a new order with wizard data
   * Endpoint: POST /api/v1/orders
   */
  async createEnhancedOrder(payload: {
    title: string;
    description: string;
    price: number;
    siteType: 'personal' | 'business';
    wizardData: {
      websiteFramework: any;
      branding: any;
      additionalServices: any;
      domains: any;
      pricing: any;
    };
    paymentCycle: 'monthly' | 'annual';
    autoRenewal: boolean;
    userInfo: {
      domain: string;
      name?: string;
      email?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
  }): Promise<EnhancedOrderData> {
    const orderData = {
      title: payload.title,
      description: payload.description,
      price: payload.price,
      wizard_data: {
        siteType: payload.siteType,
        websiteFramework: payload.wizardData.websiteFramework,
        branding: payload.wizardData.branding,
        additionalServices: payload.wizardData.additionalServices,
        domains: payload.wizardData.domains,
        pricing: payload.wizardData.pricing,
        paymentCycle: payload.paymentCycle,
        autoRenewal: payload.autoRenewal,
        userInfo: payload.userInfo
      },
      status: 'pending',
      payment_status: 'pending'
    };

    return this.baseClient.createOrder(orderData);
  }

  /**
   * Update order payment status and method
   * Endpoint: PATCH /api/v1/orders/{orderId}
   */
  async updateOrderPaymentStatus(
    orderId: string,
    paymentData: {
      payment_status: 'succeeded' | 'failed' | 'refunded';
      payment_method?: 'wallet' | 'zarinpal';
      transaction_id?: string;
      zarinpal_authority?: string;
      zarinpal_ref_id?: string;
      status?: 'in_progress' | 'completed' | 'cancelled';
    }
  ): Promise<EnhancedOrderData> {
    return this.baseClient.updateOrder(orderId, paymentData);
  }

  /**
   * Get comprehensive order details
   * Endpoint: GET /api/v1/orders/{orderId}/enhanced
   */
  async getEnhancedOrder(orderId: string): Promise<EnhancedOrderData & {
    progress: {
      currentStep: string;
      completedSteps: string[];
      remainingSteps: string[];
      estimatedDelivery: string;
    };
    walletBalance?: number;
    canPayWithWallet?: boolean;
  }> {
    const response = await this.baseClient.request(`/orders/${orderId}/enhanced`);
    return response;
  }

  /**
   * Get user's order history with pagination
   * Endpoint: GET /api/v1/users/me/orders
   */
  async getUserOrders(params?: {
    status?: string;
    payment_status?: string;
    page?: number;
    limit?: number;
    from_date?: string;
    to_date?: string;
  }): Promise<{
    orders: EnhancedOrderData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const response = await this.baseClient.request(`/users/me/orders?${queryParams.toString()}`);
    return response;
  }

  // ========================================
  // WALLET MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Get enhanced wallet balance with transaction summary
   * Endpoint: GET /api/v1/wallets/me/enhanced-balance
   */
  async getEnhancedWalletBalance(): Promise<{
    balance: number;
    currency: string;
    lastUpdated: string;
    recentTransactions: WalletTransactionData[];
    statistics: {
      totalDeposits: number;
      totalWithdrawals: number;
      totalPayments: number;
      totalRefunds: number;
    };
  }> {
    const response = await this.baseClient.request('/wallets/me/enhanced-balance');
    return response;
  }

  /**
   * Get detailed wallet transactions with filtering
   * Endpoint: GET /api/v1/wallets/me/transactions/enhanced
   */
  async getEnhancedWalletTransactions(params?: {
    type?: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'credit' | 'debit';
    status?: 'pending' | 'completed' | 'failed';
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
    reference_type?: string;
    reference_id?: string;
  }): Promise<{
    transactions: WalletTransactionData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    summary: {
      totalAmount: number;
      transactionCount: number;
      averageAmount: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.reference_type) queryParams.append('reference_type', params.reference_type);
    if (params?.reference_id) queryParams.append('reference_id', params.reference_id);

    const response = await this.baseClient.request(`/wallets/me/transactions/enhanced?${queryParams.toString()}`);
    return response;
  }

  /**
   * Process wallet payment for order
   * Endpoint: POST /api/v1/wallets/me/pay-order
   */
  async processWalletPayment(payload: {
    orderId: string;
    amount: number;
    description: string;
    referenceData?: {
      order_title: string;
      site_type: string;
      domain: string;
    };
  }): Promise<{
    success: boolean;
    transactionId: string;
    newBalance: number;
    paymentDetails: {
      amount: number;
      description: string;
      timestamp: string;
      referenceId: string;
    };
  }> {
    const response = await this.baseClient.request('/wallets/me/pay-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  /**
   * Request wallet deposit with enhanced options
   * Endpoint: POST /api/v1/wallets/me/deposit/enhanced
   */
  async requestEnhancedWalletDeposit(payload: {
    amount: number;
    description?: string;
    callbackUrl: string;
    metadata?: {
      source?: 'dashboard' | 'order_flow' | 'wallet_page';
      user_agent?: string;
      ip_address?: string;
      referrer?: string;
    };
    preferredPaymentMethod?: 'zarinpal' | 'other';
  }): Promise<{
    paymentUrl: string;
    orderId: string;
    depositId: string;
    expiresAt: string;
    qrCode?: string;
  }> {
    const response = await this.baseClient.request('/wallets/me/deposit/enhanced', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  // ========================================
  // PAYMENT PROCESSING ENDPOINTS
  // ========================================

  /**
   * Request ZarinPal payment with enhanced data
   * Endpoint: POST /api/v1/payments/zarinpal/request
   */
  async requestEnhancedZarinPalPayment(payload: {
    orderId: string;
    amount: number;
    description: string;
    callbackUrl: string;
    userData: {
      email: string;
      mobile?: string;
      name?: string;
    };
    metadata?: {
      source: 'wizard' | 'dashboard' | 'wallet_topup';
      order_type?: string;
      site_type?: string;
    };
  }): Promise<{
    paymentUrl: string;
    authority: string;
    orderId: string;
    expiresAt: string;
    qrCode?: string;
  }> {
    const response = await this.baseClient.request('/payments/zarinpal/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  /**
   * Verify ZarinPal payment with comprehensive validation
   * Endpoint: POST /api/v1/payments/zarinpal/verify
   */
  async verifyEnhancedZarinPalPayment(payload: {
    authority: string;
    orderId: string;
    amount: number;
    userIp?: string;
    userAgent?: string;
  }): Promise<PaymentVerificationResult> {
    const response = await this.baseClient.request('/payments/zarinpal/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  /**
   * Verify wallet deposit payment
   * Endpoint: POST /api/v1/wallets/me/deposit/verify
   */
  async verifyEnhancedWalletDeposit(payload: {
    orderId: string;
    authority: string;
    userIp?: string;
    userAgent?: string;
  }): Promise<PaymentVerificationResult> {
    const response = await this.baseClient.request('/wallets/me/deposit/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  // ========================================
  // ORDER PROGRESS TRACKING ENDPOINTS
  // ========================================

  /**
   * Get order progress and status updates
   * Endpoint: GET /api/v1/orders/{orderId}/progress
   */
  async getOrderProgress(orderId: string): Promise<{
    orderId: string;
    currentStep: string;
    completedSteps: string[];
    remainingSteps: string[];
    progressPercentage: number;
    estimatedDelivery: string;
    lastUpdate: string;
    nextMilestone: string;
    timeline: Array<{
      step: string;
      status: 'completed' | 'in_progress' | 'pending';
      completedAt?: string;
      estimatedDuration: string;
      description: string;
    }>;
  }> {
    const response = await this.baseClient.request(`/orders/${orderId}/progress`);
    return response;
  }

  /**
   * Update order progress step
   * Endpoint: PATCH /api/v1/orders/{orderId}/progress
   */
  async updateOrderProgress(orderId: string, payload: {
    step: string;
    status: 'completed' | 'in_progress' | 'pending';
    notes?: string;
    attachments?: Array<{
      filename: string;
      url: string;
      type: string;
    }>;
  }): Promise<{
    success: boolean;
    updatedStep: string;
    progressPercentage: number;
    nextStep?: string;
  }> {
    const response = await this.baseClient.request(`/orders/${orderId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response;
  }

  // ========================================
  // NOTIFICATION & COMMUNICATION ENDPOINTS
  // ========================================

  /**
   * Send order status notification
   * Endpoint: POST /api/v1/notifications/order-status
   */
  async sendOrderStatusNotification(payload: {
    orderId: string;
    userId: string;
    notificationType: 'order_created' | 'payment_success' | 'payment_failed' | 'progress_update' | 'order_completed';
    message: string;
    priority: 'low' | 'medium' | 'high';
    channels: Array<'email' | 'sms' | 'push' | 'dashboard'>;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    notificationId: string;
    sentChannels: string[];
    failedChannels?: string[];
  }> {
    const response = await this.baseClient.request('/notifications/order-status', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  /**
   * Get user notification preferences
   * Endpoint: GET /api/v1/users/me/notification-preferences
   */
  async getNotificationPreferences(): Promise<{
    email: {
      order_updates: boolean;
      payment_notifications: boolean;
      progress_updates: boolean;
      marketing: boolean;
    };
    sms: {
      order_updates: boolean;
      payment_notifications: boolean;
      progress_updates: boolean;
    };
    push: {
      order_updates: boolean;
      payment_notifications: boolean;
      progress_updates: boolean;
    };
    dashboard: {
      show_notifications: boolean;
      auto_refresh: boolean;
    };
  }> {
    const response = await this.baseClient.request('/users/me/notification-preferences');
    return response;
  }

  // ========================================
  // ANALYTICS & REPORTING ENDPOINTS
  // ========================================

  /**
   * Get user order analytics
   * Endpoint: GET /api/v1/users/me/analytics/orders
   */
  async getUserOrderAnalytics(params?: {
    period: '7d' | '30d' | '90d' | '1y' | 'all';
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    orderStatusDistribution: Record<string, number>;
    paymentMethodDistribution: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      orders: number;
      revenue: number;
    }>;
    topServices: Array<{
      service: string;
      count: number;
      revenue: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('period', params?.period || '30d');
    if (params?.groupBy) queryParams.append('groupBy', params.groupBy);

    const response = await this.baseClient.request(`/users/me/analytics/orders?${queryParams.toString()}`);
    return response;
  }

  /**
   * Get wallet transaction analytics
   * Endpoint: GET /api/v1/wallets/me/analytics/transactions
   */
  async getWalletTransactionAnalytics(params?: {
    period: '7d' | '30d' | '90d' | '1y' | 'all';
    type?: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  }): Promise<{
    totalTransactions: number;
    totalVolume: number;
    averageTransactionValue: number;
    transactionTypeDistribution: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      transactions: number;
      volume: number;
    }>;
    topTransactionSources: Array<{
      source: string;
      count: number;
      volume: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('period', params?.period || '30d');
    if (params?.type) queryParams.append('type', params.type);

    const response = await this.baseClient.request(`/wallets/me/analytics/transactions?${queryParams.toString()}`);
    return response;
  }

  // ========================================
  // ERROR HANDLING & SUPPORT ENDPOINTS
  // ========================================

  /**
   * Report payment or order issue
   * Endpoint: POST /api/v1/support/report-issue
   */
  async reportIssue(payload: {
    type: 'payment_failed' | 'order_problem' | 'wallet_issue' | 'technical_problem' | 'other';
    orderId?: string;
    transactionId?: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    attachments?: Array<{
      filename: string;
      url: string;
      type: string;
    }>;
    contactPreference: 'email' | 'phone' | 'dashboard';
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{
    success: boolean;
    ticketId: string;
    estimatedResponseTime: string;
    supportEmail: string;
    supportPhone: string;
  }> {
    const response = await this.baseClient.request('/support/report-issue', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  /**
   * Get support ticket status
   * Endpoint: GET /api/v1/support/tickets/{ticketId}
   */
  async getSupportTicketStatus(ticketId: string): Promise<{
    ticketId: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    subject: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    estimatedResolution?: string;
    assignedTo?: string;
    messages: Array<{
      id: string;
      sender: 'user' | 'support';
      message: string;
      timestamp: string;
      attachments?: Array<{
        filename: string;
        url: string;
        type: string;
      }>;
    }>;
  }> {
    const response = await this.baseClient.request(`/support/tickets/${ticketId}`);
    return response;
  }
}

// Export singleton instance
export const enhancedApiClient = new EnhancedApiClient();











