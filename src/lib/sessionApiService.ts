// Session-Based API Service for ArzanSite
// Uses SessionAuthService for authenticated requests to NestJS backend

import { sessionAuthService } from './sessionAuthService';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class SessionApiService {
  private baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
    ? 'https://nest.arzansite.com/api'  // Production
    : 'http://localhost:3000/api');     // Development

  constructor() {
    console.log('SessionApiService initialized with baseURL:', this.baseURL);
  }

  // OAuth endpoints (session-based via backend)
  async oauthStart(provider: string, params: { successUrl: string; failureUrl: string }): Promise<ApiResponse<{ redirectUrl: string; state?: string }>> {
    try {
      const response = await fetch(`${this.baseURL}/auth/oauth/${encodeURIComponent(provider)}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'Failed to start OAuth' };
      }
      const data: unknown = await response.json();
      const payload = (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>))
        ? (data as { data: { redirectUrl: string; state?: string } }).data
        : (data as { redirectUrl: string; state?: string });
      return { success: true, data: { redirectUrl: payload.redirectUrl, state: payload.state } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to start OAuth' };
    }
  }

  async oauthMe(): Promise<ApiResponse<{ id: string; email: string; role?: string }>> {
    try {
      const response = await fetch(`${this.baseURL}/auth/oauth/me`, { credentials: 'include' });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'Not authenticated' };
      }
      const data: unknown = await response.json();
      const payload = (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>))
        ? (data as { data: { id: string; email: string; role?: string } }).data
        : (data as { id: string; email: string; role?: string });
      return { success: true, data: payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get OAuth user' };
    }
  }

  async oauthLogout(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await fetch(`${this.baseURL}/auth/oauth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      return { success: response.ok, data: { success: response.ok } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to logout' };
    }
  }

  // Generic authenticated request method
  private async authenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log('SessionApiService: Making authenticated request to:', url);
      
      const response = await sessionAuthService.makeAuthenticatedRequest(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SessionApiService: Request failed:', response.status, errorText);
        return {
          success: false,
          error: `Request failed: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      console.log('SessionApiService: Request successful:', data);
      
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('SessionApiService: Request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Authentication endpoints
  async createSession(_jwt: string): Promise<ApiResponse<{ user?: { id: string; email: string } }>> {
    return { success: false, error: 'createSession is deprecated. Use /auth/login and /auth/refresh with backend JWT.' };
  }

  async login(email: string, password: string): Promise<ApiResponse<unknown>> {
    try {
      console.log('SessionApiService: Login attempt for:', email);
      
      // Use standard login for email/password
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as unknown));
        throw new Error((errorData as { message?: string } | unknown as { message?: string })?.message || 'Login failed');
      }

      const data: unknown = await response.json();
      console.log('SessionApiService: Login successful');
      
      return {
        success: true,
        data: (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>))
          ? (data as { data: unknown }).data
          : data
      };
    } catch (error) {
      console.error('SessionApiService: Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // Authenticate using Appwrite sessionId or JWT (backend will tolerate either)
  async sessionAuthenticate(_params: { sessionId?: string; jwt?: string; email?: string }): Promise<ApiResponse<unknown>> {
    return { success: false, error: 'sessionAuthenticate is deprecated. Use /auth/login and /auth/refresh with backend JWT.' };
  }

  async signup(email: string, password: string, metadata?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
      console.log('SessionApiService: Signup attempt for:', email);
      
      const response = await fetch(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, metadata }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData as { message?: string }).message || 'Signup failed');
      }

      const data: unknown = await response.json();
      console.log('SessionApiService: Signup successful');
      
      return {
        success: true,
        data: (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>))
          ? (data as { data: unknown }).data
          : data
      };
    } catch (error) {
      console.error('SessionApiService: Signup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  // User profile endpoints
  async getProfile(): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest('/profiles/me');
  }

  async updateProfile(profileData: unknown): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  // Orders endpoints
  async getOrders(): Promise<ApiResponse<unknown[]>> {
    return this.authenticatedRequest('/orders');
  }

  async createOrder(orderData: unknown): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrder(orderId: string): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest(`/orders/${orderId}`);
  }

  async updateOrder(orderId: string, orderData: unknown): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData)
    });
  }

  async deleteOrder(orderId: string): Promise<ApiResponse<void>> {
    return this.authenticatedRequest(`/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  // Design endpoints
  async saveDesign(orderId: string, designData: unknown): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest(`/orders/${orderId}/design`, {
      method: 'POST',
      body: JSON.stringify(designData)
    });
  }

  async getDesign(orderId: string): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest(`/orders/${orderId}/design`);
  }

  // File storage endpoints (prefer low-level Appwrite wrappers via backend)
  async listStorageFiles(bucketId: string): Promise<ApiResponse<unknown[]>> {
    return this.authenticatedRequest(`/storage/${encodeURIComponent(bucketId)}`);
  }

  async uploadStorageFile(bucketId: string, file: File): Promise<ApiResponse<{ fileId: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.authenticatedRequest(`/storage/upload/${encodeURIComponent(bucketId)}`, {
      method: 'POST',
      body: formData
    });
  }

  async deleteStorageFile(bucketId: string, fileId: string): Promise<ApiResponse<void>> {
    return this.authenticatedRequest(`/storage/${encodeURIComponent(bucketId)}/${encodeURIComponent(fileId)}`, {
      method: 'DELETE'
    });
  }

  async getStorageFileUrl(bucketId: string, fileId: string): Promise<ApiResponse<{ url: string }>> {
    return this.authenticatedRequest(`/storage/${encodeURIComponent(bucketId)}/${encodeURIComponent(fileId)}/url`);
  }

  // Wallet endpoints
  async getWalletBalance(): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest('/wallets/me/balance');
  }

  async getWalletTransactions(): Promise<ApiResponse<unknown[]>> {
    return this.authenticatedRequest('/wallets/me/transactions');
  }

  async addWalletBalance(amount: number, paymentMethod: string): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest('/wallets/me/balance', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod })
    });
  }

  async createWalletTransaction(payload: { type: string; amount: number; description?: string; referenceId?: string; referenceType?: string; metadata?: Record<string, unknown> }): Promise<ApiResponse<{ id: string }>> {
    return this.authenticatedRequest('/wallets/me/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async refundOrder(orderId: string, amount?: number, reason?: string): Promise<ApiResponse<{ transactionId?: string }>> {
    return this.authenticatedRequest('/wallets/refund-order', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, reason })
    });
  }

  // Wallet deposit (ZarinPal) endpoints
  async requestWalletDeposit(payload: { amount: number; description?: string; callbackUrl?: string; user_id?: string; metadata?: string | Record<string, unknown> }): Promise<ApiResponse<{ paymentUrl: string; orderId: string }>> {
    const body: Record<string, unknown> = {
      amount: payload.amount,
      description: payload.description,
    };
    if (payload.callbackUrl) {
      body.callbackUrl = payload.callbackUrl;
    }
    if (payload.user_id) body.user_id = payload.user_id;
    if (payload.metadata) body.metadata = payload.metadata;

    return this.authenticatedRequest('/wallets/me/deposit', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async verifyWalletDeposit(payload: { orderId?: string; authority: string; amount?: number }): Promise<ApiResponse<{ success: boolean; newBalance?: number; refId?: string; orderId?: string; amount?: number; description?: string }>> {
    return this.authenticatedRequest('/wallets/me/deposit/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Payment endpoints
  async initiatePayment(paymentData: unknown): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest('/payments/request', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async verifyPayment(paymentId: string, verificationData: unknown): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest(`/payments/${paymentId}/verify`, {
      method: 'POST',
      body: JSON.stringify(verificationData)
    });
  }

  async getPayment(paymentId: string): Promise<ApiResponse<unknown>> {
    return this.authenticatedRequest(`/payments/${paymentId}`);
  }

  // Health check endpoint (no authentication required)
  async healthCheck(): Promise<ApiResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data: unknown = await response.json();
      
      return {
        success: response.ok,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // Session validation
  async validateSession(): Promise<boolean> {
    return sessionAuthService.validateSession();
  }

  // Get current user
  getCurrentUser() {
    return sessionAuthService.getCurrentUser();
  }

  // Check authentication status
  isAuthenticated(): boolean {
    return sessionAuthService.isAuthenticated();
  }

  // Logout
  async logout(): Promise<boolean> {
    try {
      // Logout from backend first
      const backendLogout = await sessionAuthService.logoutFromBackend();
      
      // Clear local data regardless of backend response
      sessionAuthService.clearAuthData();
      
      return backendLogout;
    } catch (error) {
      console.error('SessionApiService: Logout error:', error);
      // Still clear local data even if backend logout fails
      sessionAuthService.clearAuthData();
      return false;
    }
  }
}

// Export singleton instance
export const sessionApiService = new SessionApiService();
