// Comprehensive REST client for the NestJS backend
// Base URL: https://nest.arzansite.com/api

import { tokenManager, TokenData } from './tokenManager';

export interface BackendUserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  first_name?: string;
  last_name?: string;
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
}

export interface SignupResponse {
  message: string;
  user: BackendUserProfile;
  verificationToken?: string;
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
  private token: string | null = null;

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/auth';
          throw new Error('Unauthorized');
        }
        const message = await response.text().catch(() => `HTTP ${response.status}`);
        throw new Error(message || `HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store tokens securely
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
    return this.request('/profiles/me');
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
    return this.request(`/orders${queryString ? `?${queryString}` : ''}`);
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
    return this.request('/wallets/me/balance');
  }

  async getWalletTransactions(limit = 20, offset = 0): Promise<WalletTransaction[]> {
    const qs = `?limit=${limit}&offset=${offset}`;
    return this.request(`/wallets/me/transactions${qs}`);
  }

  async createWalletTransaction(payload: {
    type: string;
    amount: number;
    description?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }> {
    return this.request('/wallets/me/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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

  async requestPayment(payload: { amount: number; description: string; orderId?: string; type?: string }): Promise<{ paymentUrl: string }> {
    return this.request('/payments/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyPayment(payload: { authority: string; orderId?: string }): Promise<{ success: boolean; refId?: string; error?: string }> {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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


