// Comprehensive REST client for the NestJS backend
// Base URL: https://nest.arzansite.com/api
// 
// SECURITY: This client uses ephemeral memory storage for tokens to prevent XSS attacks.
// For maximum security, the backend should set tokens as httpOnly cookies.
// See SECURITY_IMPROVEMENTS.md for details.

import { tokenManager, TokenData } from '@/lib/tokenManager';

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

export interface DomainExtension {
  id: string;
  extension: string;
  price: number;
  available: boolean;
  description: string;
  isDefault: boolean;
  category: 'country' | 'generic' | 'specialized';
  createdAt: string;
  updatedAt: string;
}

export interface SystemMetrics {
  system: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    activeConnections: number;
    loadAverage: number[];
  };
  database: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    activeQueries: number;
    connectionPool: {
      active: number;
      idle: number;
      max: number;
    };
    slowQueries: number;
  };
  services: {
    email: ServiceStatus;
    payment: ServiceStatus;
    storage: ServiceStatus;
    appwrite: ServiceStatus;
  };
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    lastUpdated: string;
  };
  security: {
    failedLoginAttempts: number;
    blockedIPs: number;
    lastSecurityScan: string;
  };
}

export interface ServiceStatus {
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: string;
  queueSize?: number;
  gatewayStatus?: string;
  usedSpace?: string;
  totalSpace?: string;
  errorCount?: number;
}

export interface WalletAdjustment {
  id: string;
  walletId: string;
  adminId: string;
  adminName: string;
  type: 'credit' | 'debit' | 'correction';
  amount: number;
  reason: string;
  notes?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  metadata?: {
    orderId?: string;
    invoiceId?: string;
    refundReason?: string;
  };
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
        // Log detailed error body for easier debugging of server-side issues
        try {
          console.error('API error response body:', body);
        } catch (e) {
          // no-op
        }
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

  // OAuth endpoints
  async oauthStart(provider: string, params: { successUrl: string; failureUrl: string }): Promise<{ redirectUrl: string; state?: string }> {
    const res = await this.request<unknown>(`/auth/oauth/${encodeURIComponent(provider)}/start`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (res && typeof res === 'object') {
      const obj = res as Record<string, unknown>;
      if ('data' in obj && obj.data && typeof obj.data === 'object') {
        const data = obj.data as Record<string, unknown>;
        if (typeof data.redirectUrl === 'string') {
          return { redirectUrl: data.redirectUrl, state: typeof data.state === 'string' ? data.state : undefined };
        }
      }
      if (typeof obj.redirectUrl === 'string') {
        return { redirectUrl: obj.redirectUrl as string, state: typeof obj.state === 'string' ? (obj.state as string) : undefined };
      }
    }
    throw new Error('Failed to start OAuth');
  }

  async oauthMe(): Promise<{ id: string; email: string; role?: string }> {
    const res = await this.request<unknown>('/auth/oauth/me');
    if (res && typeof res === 'object') {
      const obj = res as Record<string, unknown>;
      if ('data' in obj && obj.data && typeof obj.data === 'object') {
        return obj.data as { id: string; email: string; role?: string };
      }
      return obj as { id: string; email: string; role?: string };
    }
    throw new Error('Not authenticated');
  }

  async oauthLogout(): Promise<{ success: boolean }> {
    const res = await this.request<{ success?: boolean } | Record<string, unknown> | string>(
      '/auth/oauth/logout',
      { method: 'POST' }
    );
    if (res && typeof res === 'object' && 'success' in (res as Record<string, unknown>)) {
      return { success: Boolean((res as Record<string, unknown>).success) };
    }
    return { success: true };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
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
    const result = await this.request<unknown>('/profiles');
    return this.extractList<BackendUserProfile>(result);
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
    // Extended fields supported by backend
    siteType?: string;
    sessionId?: string;
    wizardData?: unknown;
    payment_status?: string;
  }, options?: { noRetry?: boolean }): Promise<Order> {
    // Whitelist only backend-accepted fields to avoid Appwrite schema rejections
    const basePayload: Record<string, unknown> = {
      payment_status: orderData.payment_status || 'pending',
      status: 'pending',
      title: orderData.title,
      description: orderData.description,
      price: orderData.price,
      ...(typeof orderData.comments === 'string' ? { comments: orderData.comments } : {}),
      ...(typeof orderData.total_pages === 'number' ? { total_pages: orderData.total_pages } : {}),
      ...(typeof orderData.total_sections === 'number' ? { total_sections: orderData.total_sections } : {}),
      // Include enhanced wizard fields when present
      ...(typeof orderData.siteType === 'string' && orderData.siteType
        ? { siteType: orderData.siteType }
        : {}),
      ...(typeof orderData.sessionId === 'string' && orderData.sessionId
        ? { sessionId: orderData.sessionId }
        : {}),
      ...(orderData.wizardData && typeof orderData.wizardData === 'object'
        ? { wizardData: orderData.wizardData }
        : {}),
    };

    // Attempt enhanced payload; optionally skip internal retry to avoid duplicate requests
    let result: unknown;
    if (options?.noRetry) {
      result = await this.request<unknown>('/orders', {
        method: 'POST',
        body: JSON.stringify(basePayload),
      });
    } else {
      try {
        result = await this.request<unknown>('/orders', {
          method: 'POST',
          body: JSON.stringify(basePayload),
        });
      } catch (e) {
        const minimalPayload = {
          payment_status: 'pending',
          status: 'pending',
          title: orderData.title,
          description: orderData.description,
          price: orderData.price,
        };
        result = await this.request<unknown>('/orders', {
          method: 'POST',
          body: JSON.stringify(minimalPayload),
        });
      }
    }
    // Handle possible wrapped response
    if (result && typeof result === 'object') {
      const maybe = result as { data?: unknown };
      if (maybe.data && typeof maybe.data === 'object') {
        const data = maybe.data as Record<string, unknown>;
        if ('id' in data) {
          return data as unknown as Order;
        }
        if ('$id' in data) {
          const d = data as Record<string, unknown>;
          const mapped: Order = {
            id: String(d['$id'] as string | number),
            title: orderData.title,
            description: orderData.description,
            price: orderData.price,
            status: 'pending',
            user_id: typeof d['user_id'] === 'string' ? (d['user_id'] as string) : '',
            comments: orderData.comments,
            total_pages: orderData.total_pages,
            total_sections: orderData.total_sections,
            created_at: typeof d['created_at'] === 'string' ? (d['created_at'] as string) : new Date().toISOString(),
            updated_at: typeof d['updated_at'] === 'string' ? (d['updated_at'] as string) : new Date().toISOString(),
          };
          return mapped;
        }
      }
      const obj = result as Record<string, unknown>;
      if ('id' in obj) {
        return obj as unknown as Order;
      }
      if ('$id' in obj) {
        const o = obj as Record<string, unknown>;
        const mapped: Order = {
          id: String(o['$id'] as string | number),
          title: orderData.title,
          description: orderData.description,
          price: orderData.price,
          status: 'pending',
          user_id: typeof o['user_id'] === 'string' ? (o['user_id'] as string) : '',
          comments: orderData.comments,
          total_pages: orderData.total_pages,
          total_sections: orderData.total_sections,
          created_at: typeof o['created_at'] === 'string' ? (o['created_at'] as string) : new Date().toISOString(),
          updated_at: typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : new Date().toISOString(),
        };
        return mapped;
      }
    }
    throw new Error('Invalid order response from server');
  }

  // Wizard: complete order in one call (new DTO: order + designSnapshot)
  async completeWizardOrder(payload: {
    sessionId: string;
    userId: string;
    order: {
      title: string;
      description: string;
      priceTomans: number;
      comments?: string;
      siteType?: 'personal' | 'business' | string;
    };
    designSnapshot: Record<string, unknown>;
  }): Promise<{
    id: string;
    status?: string;
    payment_status?: string;
    preview_url?: string;
    invoice_id?: string;
    amount?: number;
    title?: string;
    description?: string;
    created_at?: string;
  }> {
    const result = await this.request<unknown>('/wizard/complete-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result && typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      if ('data' in obj && obj.data && typeof obj.data === 'object') {
        const data = obj.data as Record<string, unknown>;
        if (typeof data.id === 'string') {
          return data as unknown as {
            id: string;
            status?: string;
            payment_status?: string;
            preview_url?: string;
            invoice_id?: string;
            amount?: number;
            title?: string;
            description?: string;
            created_at?: string;
          };
        }
      }
    }
    throw new Error('Invalid response from /wizard/complete-order');
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

  // Wizard progress fallback (save pending order)
  async wizardSaveProgress(payload: Record<string, unknown>): Promise<{ id?: string; orderId?: string }> {
    const res = await this.request<unknown>('/wizard/save-progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res && typeof res === 'object') {
      const obj = res as Record<string, unknown>;
      if ('data' in obj && obj.data && typeof obj.data === 'object') {
        const data = obj.data as Record<string, unknown>;
        return { id: (data.id as string) || (data.orderId as string) };
      }
      return { id: (obj.id as string) || (obj.orderId as string) };
    }
    return {};
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

  async requestPayment(payload: { amount: number; description: string; orderId?: string; callbackUrl?: string }): Promise<{ paymentUrl: string; authority?: string }> {
    console.log('Requesting payment with payload:', payload);
    const result = await this.request<unknown>('/payments/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('Payment request response:', result);
    if (result && typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      // Prefer wrapped structure { success, data: { paymentUrl, authority }, ... }
      if ('data' in obj && obj.data && typeof obj.data === 'object') {
        const data = obj.data as Record<string, unknown>;
        const wrappedUrl = (data.paymentUrl as string)
          || (data.redirectUrl as string)
          || (data.url as string)
          || (data.payment_url as string);
        if (typeof wrappedUrl === 'string') {
          return { paymentUrl: wrappedUrl, authority: typeof data.authority === 'string' ? data.authority : undefined };
        }
      }
      // Fallback to flat structure
      const flatUrl = (obj.paymentUrl as string)
        || (obj.redirectUrl as string)
        || (obj.url as string)
        || (obj.payment_url as string);
      if (typeof flatUrl === 'string') {
        return { paymentUrl: flatUrl, authority: typeof obj.authority === 'string' ? (obj.authority as string) : undefined };
      }
    }
    throw new Error('Failed to create payment request');
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

  async payInvoice(
    invoiceId: string,
    payload?: { method?: 'wallet' | 'gateway'; useWallet?: boolean; amount?: number }
  ): Promise<{ success: boolean; refId?: string } > {
    return this.request(`/invoices/${invoiceId}/pay`, {
      method: 'POST',
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
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
    callbackUrl?: string;
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
    return this.request<SiteConfig[]>('/site-config/history');
  }

  // New Admin Endpoints

  // User Management
  async deleteUser(userId: string): Promise<{ success: boolean; message: string; data?: unknown }> {
    return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  // Domain Management
  async getDomainPrices(): Promise<DomainExtension[]> {
    const result = await this.request<unknown>('/admin/domains/prices');
    return this.extractList<DomainExtension>(result);
  }

  async updateDomainPrice(extensionId: string, data: { price: number; available?: boolean; description?: string }): Promise<DomainExtension> {
    return this.request(`/admin/domains/prices/${extensionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async createDomainExtension(data: { extension: string; price: number; description: string; available: boolean; category: string }): Promise<DomainExtension> {
    return this.request('/admin/domains/extensions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async checkDomainAvailability(data: { domain: string; extension: string }): Promise<{ domain: string; available: boolean; price: number; checkedAt: string }> {
    return this.request('/admin/domains/check-availability', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // System Health Metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    const result = await this.request<unknown>('/admin/system/metrics');
    if (result && typeof result === 'object') {
      const maybe = result as { data?: unknown };
      if (maybe.data && typeof maybe.data === 'object') {
        return maybe.data as SystemMetrics;
      }
      if ('system' in (result as Record<string, unknown>)) {
        return result as SystemMetrics;
      }
    }
    throw new Error('Invalid system metrics response');
  }

  // Wallet Adjustment History
  async getWalletAdjustmentHistory(
    walletId: string,
    params?: { page?: number; limit?: number; type?: string; from?: string; to?: string }
  ): Promise<{ adjustments: WalletAdjustment[]; pagination: { page: number; limit: number; total: number; pages: number }; summary: Record<string, unknown> } > {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.type) qs.append('type', params.type);
    if (params?.from) qs.append('from', params.from);
    if (params?.to) qs.append('to', params.to);
    
    const queryString = qs.toString();
    return this.request(`/admin/wallets/${walletId}/adjustments${queryString ? `?${queryString}` : ''}`);
  }

  // Enhanced Email Service Test
  async testEmailService(data: { testType: string; recipient: string; testOptions?: Record<string, unknown> }): Promise<{ success: boolean; data: unknown }> {
    return this.request('/admin/emails/test-service', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // NOTE: Duplicate block removed (was repeated below). The canonical implementations are above.

  async getEmailLogs(limit = 50, offset = 0): Promise<EmailLog[]> {
    const qs = `?limit=${limit}&offset=${offset}`;
    const result = await this.request<unknown>(`/emails/logs${qs}`);
    return this.extractList<EmailLog>(result);
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

  // Storage endpoints
  async uploadStorageFile(
    bucketId: string,
    file: File,
    meta?: { category?: string; description?: string; orderId?: string }
  ): Promise<{ fileId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (meta?.category) formData.append('category', meta.category);
    if (meta?.description) formData.append('description', meta.description);
    if (meta?.orderId) formData.append('orderId', meta.orderId);

    const result = await this.request<unknown>(`/storage/upload/${encodeURIComponent(bucketId)}`, {
      method: 'POST',
      body: formData,
    });

    if (result && typeof result === 'object') {
      const obj = result as { fileId?: unknown; data?: unknown };
      let fileId: string | undefined;
      if (typeof obj.fileId === 'string') {
        fileId = obj.fileId;
      } else if (
        obj.data &&
        typeof obj.data === 'object' &&
        (obj.data as { fileId?: unknown }) !== null &&
        'fileId' in (obj.data as { fileId?: unknown }) &&
        typeof (obj.data as { fileId?: unknown }).fileId === 'string'
      ) {
        fileId = (obj.data as { fileId?: unknown }).fileId as string;
      }
      if (fileId) return { fileId };
    }
    throw new Error('Invalid upload response');
  }

  async getStorageFileUrl(bucketId: string, fileId: string): Promise<{ url: string; fileId: string }> {
    return this.request(`/storage/${encodeURIComponent(bucketId)}/${encodeURIComponent(fileId)}/url`);
  }

  async listStorageFiles(bucketId: string, queries?: string[]): Promise<{ files: unknown[]; total?: number }> {
    const qs = new URLSearchParams();
    if (queries && Array.isArray(queries)) {
      for (const q of queries) {
        qs.append('queries[]', q);
      }
    }
    const path = `/storage/${encodeURIComponent(bucketId)}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return this.request(path);
  }

  async deleteStorageFile(bucketId: string, fileId: string): Promise<{ success: boolean }> {
    return this.request(`/storage/${encodeURIComponent(bucketId)}/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
    });
  }

  // Unified uploads endpoints
  async listUploads(params?: { userId?: string; orderId?: string; bucketType?: string }): Promise<unknown> {
    const qs = new URLSearchParams();
    if (params?.userId) qs.append('userId', params.userId);
    if (params?.orderId) qs.append('orderId', params.orderId);
    if (params?.bucketType) qs.append('bucketType', params.bucketType);
    const path = `/uploads${qs.toString() ? `?${qs.toString()}` : ''}`;
    return this.request(path);
  }

  async getUploadById(id: string, params?: { bucketType?: string }): Promise<unknown> {
    const qs = new URLSearchParams();
    if (params?.bucketType) qs.append('bucketType', params.bucketType);
    const path = `/uploads/${encodeURIComponent(id)}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return this.request(path);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();


