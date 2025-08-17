// Comprehensive REST client for the NestJS backend
// Base URL: https://nest.arzansite.com/api
// 
// SECURITY: This client uses ephemeral memory storage for tokens to prevent XSS attacks.
// For maximum security, the backend should set tokens as httpOnly cookies.
// See SECURITY_IMPROVEMENTS.md for details.

import { tokenManager, TokenData } from './tokenManager';

export interface BackendUserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  full_name?: string;
  phone?: string;
  address?: string;
  company?: string;
  bio?: string;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: BackendUserProfile;
  redirect?: {
    url: string;
    message: string;
  };
}

export interface SignupResponse {
  message: string;
  user: BackendUserProfile;
  verificationToken?: string;
  verificationEmailSent?: boolean;
  requiresFrontendVerification?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
}

export interface Order {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_status?: string;
  comments?: string;
  total_pages?: number;
  total_sections?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DesignData {
  layout?: string;
  colors?: Record<string, string>;
  components?: Array<{
    type: string;
    content?: string;
    image?: string;
  }>;
  settings?: Record<string, unknown>;
  pages?: Array<{
    id: string;
    name: string;
    sections: Array<{
      id: string;
      sectionType: string;
      layoutId: string;
      order: number;
      customData?: Record<string, unknown>;
    }>;
    canvasDimensions: {
      width: number;
      height: number;
    };
  }>;
  currentPageId?: string;
}

export interface DesignOptions {
  theme?: string;
  font?: string;
  spacing?: string;
  custom_css?: string;
  siteType?: string;
  modules?: unknown[];
  branding?: unknown;
  userInfo?: unknown;
  pricing?: unknown;
}

export interface WalletBalanceResponse {
  balance: number;
}

export interface WalletTransaction {
  id: string;
  wallet_id?: string;
  user_id?: string;
  type: string;
  status: string;
  amount: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  order_id?: string;
  amount: number;
  currency?: string;
  description: string;
  payment_method?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  authority?: string;
  refId?: string;
  error?: string;
}

// Invoices and receipts
export interface Invoice {
  id: string;
  user_id: string;
  order_id?: string;
  amount: number;
  due_date?: string;
  status: 'pending' | 'paid' | 'due' | 'overdue' | 'cancelled';
  service_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  invoice_id?: string;
  payment_id?: string;
  ref_id?: string;
  amount: number;
  service?: string;
  created_at: string;
}

// Admin dashboard statistics
export interface AdminDashboardStats {
  totalUsers: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalTransactions: number;
}

// Wallet adjustment for admin
export interface WalletAdjustmentDto {
  amount: number;
  type: 'credit' | 'debit' | 'correction';
  reason: string;
  notes?: string;
}

// Create invoice DTO
export interface CreateInvoiceDto {
  orderId: string;
  amount: number;
  dueDate: string;
  description: string;
}

// Pay invoice DTO
export interface PayInvoiceDto {
  refId?: string;
  paymentMethod: 'wallet' | 'gateway';
}

export interface AdminWalletSummary {
  user_id: string;
  email?: string;
  balance: number;
  updated_at: string;
}

export interface SiteConfig {
  id: string;
  mode: 'normal' | 'temporarily_unavailable' | 'update_mode' | 'development_mode';
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: string;
  created_at: string;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing = false;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api';
  }

  setToken(token: string) {
    tokenManager.setTokens({ access_token: token });
  }

  getToken(): string | null {
    return tokenManager.getAccessToken();
  }

  clearToken() {
    tokenManager.clearTokens();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryOn401 = true): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    let token = this.getToken();

    // If no token in memory, try to restore from localStorage
    if (!token) {
      console.log('API Client: No token in memory, attempting to restore from localStorage...');
      tokenManager.forceRefreshFromStorage();
      token = this.getToken();
    }

    console.log('API Client Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      baseURL: this.baseURL,
      endpoint
    });

          // Prepare headers - don't set Content-Type for FormData
      const headers: Record<string, string> = {};
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Only set Content-Type for non-FormData requests
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const config: RequestInit = {
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
        credentials: 'include', // Always include cookies for httpOnly token storage
        ...options,
      };

    try {
      console.log('Making fetch request to:', url);
      const response = await fetch(url, config);
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      let body;
      if (isJson) {
        try {
          body = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          body = null;
        }
      } else {
        body = await response.text().catch(() => '');
      }

      if (!response.ok) {
        // Attempt a single refresh on 401 and retry the original request
        if (response.status === 401 && retryOn401) {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken && !this.isRefreshing) {
            this.isRefreshing = true;
            try {
              console.log('Attempting token refresh...');
              const refreshed = await this.refreshToken(refreshToken);
              tokenManager.setTokens({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
              });
              console.log('Token refresh successful, retrying request...');
              // Retry original request once with new token
              return this.request<T>(endpoint, options, false);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              this.clearToken();
              // Don't redirect immediately, let the calling component handle it
              throw new Error('Authentication failed - please log in again');
            } finally {
              this.isRefreshing = false;
            }
          } else {
            console.log('No refresh token or already refreshing, clearing tokens');
            this.clearToken();
          }

          // Don't redirect immediately, throw error instead
          throw new Error('Unauthorized - please log in again');
        }

        const message = typeof body === 'string' ? body : body?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      // Log response details for debugging
      if (body === null) {
        console.warn('API response body is null for endpoint:', endpoint);
      }
      
      return (isJson ? (body as T) : (body as unknown as T));
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request details:', {
        url,
        method: options.method || 'GET',
        headers: config.headers,
        credentials: config.credentials
      });
      throw error;
    }
  }

  // Authentication endpoints
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store tokens in ephemeral memory only (not localStorage)
    // Server should set httpOnly cookies for secure token storage
    tokenManager.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    });
    
    return response;
  }

  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<SignupResponse> {
    const response = await this.request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, metadata }),
    });

    // If backend returns a verification token, send the email
    if (response.verificationToken) {
      try {
        await this.sendEmail({
          to: email,
          subject: 'تایید ایمیل - Arzan Site',
          template: 'verification',
          data: {
            userEmail: email,
            actionUrl: `${window.location.origin}/verify-email?token=${response.verificationToken}`,
            expirationTime: '24 ساعت',
          },
        });
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
    }

    return response;
  }

  async requestVerification(email: string, password: string): Promise<{ message: string; verificationEmailSent: boolean }> {
    return this.request('/auth/request-verification', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async checkEmailVerification(email: string): Promise<{ 
    email: string; 
    emailVerified: boolean; 
    userId: string; 
    message: string; 
  }> {
    return this.request(`/auth/check-verification/${encodeURIComponent(email)}`);
  }

  async getProfile(): Promise<BackendUserProfile> {
    return this.request('/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  // Profile endpoints
  async getMyProfile(): Promise<BackendUserProfile> {
    const result = await this.request<{data: BackendUserProfile, success: boolean, timestamp: string} | BackendUserProfile>('/profiles/me');
    
    // Handle nested response structure
    if (result && typeof result === 'object' && 'data' in result && result.data) {
      return result.data;
    } else if (result && typeof result === 'object' && 'id' in result) {
      // Fallback for direct object response
      return result as BackendUserProfile;
    } else {
      console.warn('getMyProfile returned unexpected result structure:', result);
      throw new Error('Invalid profile data received');
    }
  }

  async updateProfile(profileData: Partial<BackendUserProfile>): Promise<BackendUserProfile> {
    return this.request('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async getAllProfiles(): Promise<BackendUserProfile[]> {
    return this.request('/profiles');
  }

  // Orders endpoints
  async getOrders(params?: { mine?: boolean; admin?: boolean }): Promise<Order[]> {
    const qs = new URLSearchParams();
    if (params?.mine) qs.append('mine', 'true');
    if (params?.admin) qs.append('admin', 'true');
    const queryString = qs.toString();
    const result = await this.request<{data: Order[], success: boolean, timestamp: string}>(`/orders${queryString ? `?${queryString}` : ''}`);
    
    // Handle nested response structure
    if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      // Fallback for direct array response
      return result;
    } else {
      console.warn('getOrders returned unexpected result structure:', result);
      return [];
    }
  }

  async createOrder(orderData: {
    title: string;
    description: string;
    price: number;
    comments?: string;
    total_pages?: number;
    total_sections?: number;
  }): Promise<Order> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.request(`/orders/${orderId}`);
  }

  async updateOrder(orderId: string, orderData: Partial<Order>): Promise<Order> {
    return this.request(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(orderId: string): Promise<void> {
    return this.request(`/orders/${orderId}`, { method: 'DELETE' });
  }

  // Design endpoints
  async saveDesign(orderId: string, design: DesignData, options?: DesignOptions): Promise<void> {
    return this.request(`/orders/${orderId}/design`, {
      method: 'POST',
      body: JSON.stringify({ design, options }),
    });
  }

  async getDesign(orderId: string): Promise<{ design: DesignData; options?: DesignOptions }> {
    return this.request(`/orders/${orderId}/design`);
  }

  async getDesignOptions(orderId: string): Promise<DesignOptions> {
    return this.request(`/orders/${orderId}/design/options`);
  }

  async updateDesignOptions(orderId: string, options: DesignOptions): Promise<void> {
    return this.request(`/orders/${orderId}/design/options`, {
      method: 'PATCH',
      body: JSON.stringify({ options }),
    });
  }

  async updatePreviewUrl(orderId: string, previewUrl: string): Promise<void> {
    return this.request(`/orders/${orderId}/design/preview-url`, {
      method: 'PATCH',
      body: JSON.stringify({ preview_url: previewUrl }),
    });
  }

  // Wallet endpoints
  async getWalletBalance(): Promise<WalletBalanceResponse> {
    const result = await this.request<{data: WalletBalanceResponse, success: boolean, timestamp: string} | WalletBalanceResponse>('/wallets/me/balance');
    
    // Handle nested response structure
    if (result && typeof result === 'object' && 'data' in result && result.data) {
      return result.data;
    } else if (result && typeof result === 'object' && 'balance' in result) {
      // Fallback for direct object response
      return result as WalletBalanceResponse;
    } else {
      console.warn('getWalletBalance returned unexpected result structure:', result);
      throw new Error('Invalid wallet balance data received');
    }
  }

  async getWalletTransactions(limit = 20, offset = 0): Promise<WalletTransaction[]> {
    const qs = `?limit=${limit}&offset=${offset}`;
    const result = await this.request<{data: WalletTransaction[], success: boolean, timestamp: string} | WalletTransaction[]>(`/wallets/me/transactions${qs}`);
    
    // Handle nested response structure
    if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      // Fallback for direct array response
      return result;
    } else {
      console.warn('getWalletTransactions returned unexpected result structure:', result);
      return [];
    }
  }

  async createWalletTransaction(payload: {
    type: string;
    amount: number;
    description?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const result = await this.request('/wallets/me/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    // Handle the actual API response structure
    if (result && typeof result === 'object') {
      if ('data' in result && result.data && typeof result.data === 'object' && 'transactionId' in result.data) {
        return { id: result.data.transactionId as string };
      }
      if ('id' in result) {
        return { id: result.id as string };
      }
      if ('transactionId' in result) {
        return { id: result.transactionId as string };
      }
    }
    
    throw new Error('Invalid response structure from createWalletTransaction');
  }

  async addWalletBalance(amount: number, paymentMethod = 'zarinpal'): Promise<{ paymentUrl: string }> {
    return this.request('/wallets/me/balance', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod }),
    });
  }

  async refundOrder(orderId: string): Promise<{ transactionId?: string }> {
    return this.request('/wallets/refund-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  // Payment endpoints
  async createPayment(payload: PaymentRequest): Promise<PaymentResponse> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    return this.request(`/payments/${paymentId}`);
  }

  async requestPayment(payload: { amount: number; description: string; orderId?: string }): Promise<{ paymentUrl: string }> {
    console.log('Requesting payment with payload:', payload);
    const result = await this.request<{ paymentUrl: string }>('/payments/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('Payment request response:', result);
    return result;
  }

  async verifyPayment(payload: { authority: string; orderId?: string }): Promise<{ success: boolean; refId?: string; error?: string }> {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Helpers
  private extractList<TItem>(result: unknown): TItem[] {
    if (Array.isArray(result)) {
      return result as TItem[];
    }
    if (typeof result === 'object' && result !== null) {
      const maybe = result as { data?: unknown };
      if (Array.isArray(maybe.data)) {
        return maybe.data as TItem[];
      }
    }
    return [];
  }

  // Invoice endpoints (user)
  async getInvoices(params?: { status?: string; from?: string; to?: string }): Promise<Invoice[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.from) qs.append('from', params.from);
    if (params?.to) qs.append('to', params.to);
    const queryString = qs.toString();
    const result = await this.request<unknown>(`/invoices${queryString ? `?${queryString}` : ''}`);
    return this.extractList<Invoice>(result);
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.request(`/invoices/${invoiceId}`);
  }

  async payInvoice(invoiceId: string): Promise<{ success: boolean; refId?: string } > {
    return this.request(`/invoices/${invoiceId}/pay`, { method: 'POST' });
  }

  // Receipts (user)
  async getReceipts(params?: { from?: string; to?: string; service?: string }): Promise<Receipt[]> {
    const qs = new URLSearchParams();
    if (params?.from) qs.append('from', params.from);
    if (params?.to) qs.append('to', params.to);
    if (params?.service) qs.append('service', params.service);
    const queryString = qs.toString();
    const result = await this.request<unknown>(`/receipts${queryString ? `?${queryString}` : ''}`);
    return this.extractList<Receipt>(result);
  }

  async downloadReceipt(receiptId: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    const endpoint = `/receipts/${receiptId}/download?format=${format}`;
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to download receipt');
    return await response.blob();
  }

  // Admin finance
  async getAdminWallets(): Promise<AdminWalletSummary[]> {
    return this.request('/admin/wallets');
  }

  async adjustAdminWallet(walletUserId: string, payload: { amount: number; type: 'credit' | 'debit'; reason: string; notes?: string }): Promise<{ success: boolean }>{
    return this.request(`/admin/wallets/${walletUserId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminInvoices(params?: { status?: string; user?: string; from?: string; to?: string }): Promise<Invoice[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.user) qs.append('user', params.user);
    if (params?.from) qs.append('from', params.from);
    if (params?.to) qs.append('to', params.to);
    const queryString = qs.toString();
    return this.request(`/admin/invoices${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminPayments(params?: { status?: string; user?: string }): Promise<Array<{ id: string; user_id: string; status: string; ref_id?: string; amount: number; created_at: string }>> {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.user) qs.append('user', params.user);
    const queryString = qs.toString();
    return this.request(`/admin/payments${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminReceipts(params?: { user?: string; service?: string; from?: string; to?: string }): Promise<Receipt[]> {
    const qs = new URLSearchParams();
    if (params?.user) qs.append('user', params.user);
    if (params?.service) qs.append('service', params.service);
    if (params?.from) qs.append('from', params.from);
    if (params?.to) qs.append('to', params.to);
    const queryString = qs.toString();
    const result = await this.request<unknown>(`/admin/receipts${queryString ? `?${queryString}` : ''}`);
    return this.extractList<Receipt>(result);
  }

  // Admin dashboard statistics
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    return this.request('/admin/dashboard/stats');
  }

  // Create invoice
  async createInvoice(payload: CreateInvoiceDto): Promise<Invoice> {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Update invoice (admin only)
  async updateInvoice(invoiceId: string, payload: Partial<Invoice>): Promise<Invoice> {
    return this.request(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Wallet deposit with payment gateway
  async requestWalletDeposit(payload: { 
    amount: number; // Amount in Rials (normalized)
    description?: string; 
    user_id?: string; 
    metadata?: string | Record<string, unknown> 
  }): Promise<{ paymentUrl: string; orderId: string }> {
    // Validate amount (minimum 1,000,000 Rials as per ZarinPal docs)
    if (payload.amount < 1000000) {
      throw new Error('Amount must be at least 1,000,000 Rials (100,000 Tomans)');
    }

    console.log('=== API CLIENT: WALLET DEPOSIT REQUEST ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const result = await this.request<{ paymentUrl: string; orderId: string }>('/wallets/me/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    console.log('=== API CLIENT: WALLET DEPOSIT RESPONSE ===');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('==========================================');
    
    return result;
  }

  // Verify wallet deposit with enhanced error handling
  async verifyWalletDeposit(payload: { 
    orderId?: string; 
    authority: string 
  }): Promise<{
    success: boolean;
    newBalance?: number;
    refId?: string;
    orderId?: string;
    amount?: number;
    description?: string;
    error?: string;
    errorCode?: string;
    errorDetails?: string;
    retryable?: boolean;
    supportRequired?: boolean;
  }> {
    console.log('=== API CLIENT: WALLET VERIFICATION REQUEST ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const result = await this.request<{
      success: boolean;
      newBalance?: number;
      refId?: string;
      orderId?: string;
      amount?: number;
      description?: string;
      error?: string;
      errorCode?: string;
      errorDetails?: string;
      retryable?: boolean;
      supportRequired?: boolean;
    }>('/wallets/me/deposit/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    console.log('=== API CLIENT: WALLET VERIFICATION RESPONSE ===');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('===============================================');
    
    return result;
  }

  // Top up wallet with RefId
  async topUpWallet(payload: { amount: number; refId: string }): Promise<{ success: boolean; transactionId: string; newBalance: number }> {
    return this.request('/wallets/me/topup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Admin wallet adjustment
  async adjustWalletBalance(walletId: string, payload: WalletAdjustmentDto): Promise<{ success: boolean; balanceBefore: number; balanceAfter: number }> {
    return this.request(`/admin/wallets/${walletId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Get all user wallets (admin)
  async getAllUserWallets(params?: { page?: number; limit?: number; search?: string }): Promise<{ wallets: AdminWalletSummary[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.search) qs.append('search', params.search);
    const queryString = qs.toString();
    return this.request(`/admin/wallets${queryString ? `?${queryString}` : ''}`);
  }

  // Site configuration endpoints
  async getSiteConfig(): Promise<SiteConfig> {
    return this.request('/site-config/current');
  }

  async updateSiteConfig(mode: SiteConfig['mode']): Promise<SiteConfig> {
    return this.request('/site-config', {
      method: 'PATCH',
      body: JSON.stringify({ mode }),
    });
  }

  async getSiteConfigHistory(): Promise<SiteConfig[]> {
    return this.request('/site-config/history');
  }

  // Email endpoints
  async getEmailLogs(limit = 50, offset = 0): Promise<EmailLog[]> {
    const qs = `?limit=${limit}&offset=${offset}`;
    return this.request(`/emails/logs${qs}`);
  }

  async sendEmail(payload: {
    to: string;
    subject: string;
    template: string;
    data?: Record<string, unknown>;
  }): Promise<{ success: boolean; messageId?: string }> {
    return this.request('/emails/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();


