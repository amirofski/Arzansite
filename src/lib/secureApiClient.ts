// Secure API Client Example - Demonstrates proper authentication without localStorage
// This shows how to use httpOnly cookies and avoid storing sensitive tokens client-side

export interface SecureApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

export interface SecureAuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    // Non-sensitive user data only
  };
  // No tokens returned - they're set as httpOnly cookies by the server
}

class SecureApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api';
  }

  // Secure request method - uses cookies, no localStorage tokens
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include', // Always include cookies for httpOnly token storage
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Secure API request failed:', error);
      throw error;
    }
  }

  // Authentication methods - no token storage in localStorage
  async signIn(email: string, password: string): Promise<SecureAuthResponse> {
    const response = await this.request<SecureAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Server sets httpOnly cookies automatically
    // No need to store tokens in localStorage
    return response;
  }

  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<SecureAuthResponse> {
    return this.request<SecureAuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, metadata }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', { method: 'POST' });
    // Server clears httpOnly cookies automatically
  }

  // Check authentication status
  async checkAuth(): Promise<SecureAuthResponse> {
    return this.request('/auth/me');
  }

  // Wallet operations - secure without localStorage tokens
  async getWalletBalance(): Promise<{ balance: number }> {
    return this.request('/wallets/me/balance');
  }

  async requestWalletDeposit(payload: { 
    amount: number; // Amount in Rials (normalized)
    description?: string; 
  }): Promise<{ paymentUrl: string; orderId: string }> {
    return this.request('/wallets/me/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyWalletDeposit(payload: { 
    orderId: string; 
    authority: string 
  }): Promise<{ 
    success: boolean; 
    newBalance: number; 
    refId?: string; 
    error?: string 
  }> {
    return this.request('/wallets/me/deposit/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Payment gateway callbacks
  async handlePaymentCallback(payload: { 
    authority: string; 
    status: string; 
    refId?: string 
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/wallets/deposit/callback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Manual verification endpoint
  async verifyWithGateway(payload: { 
    orderId: string; 
    authority: string 
  }): Promise<{ success: boolean; refId?: string; error?: string }> {
    return this.request('/wallets/deposit/verify-with-gateway', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Enhanced topup with idempotency
  async topUpWallet(payload: { 
    amount: number; 
    refId: string; 
    idempotencyKey?: string 
  }): Promise<{ 
    success: boolean; 
    transactionId: string; 
    newBalance: number 
  }> {
    const headers: Record<string, string> = {};
    if (payload.idempotencyKey) {
      headers['Idempotency-Key'] = payload.idempotencyKey;
    }

    return this.request('/wallets/me/topup', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  // Orders
  async getOrders(): Promise<Array<{
    id: string;
    title: string;
    status: string;
    price: number;
    created_at: string;
  }>> {
    return this.request('/orders?mine=true');
  }

  async createOrder(orderData: {
    title: string;
    description: string;
    price: number;
  }): Promise<{ id: string; status: string }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const secureApiClient = new SecureApiClient();

// Example usage:
/*
// 1. Login - tokens stored in httpOnly cookies by server
const auth = await secureApiClient.signIn('user@example.com', 'password');

// 2. All subsequent requests automatically include cookies
const balance = await secureApiClient.getWalletBalance();

// 3. No need to manually manage tokens - server handles everything
const orders = await secureApiClient.getOrders();

// 4. Logout - server clears cookies
await secureApiClient.logout();
*/
