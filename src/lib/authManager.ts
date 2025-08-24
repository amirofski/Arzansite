// Authentication Manager for NestJS Backend Integration
// Based on the Frontend Authentication Guide

export interface AuthResponse {
  success: boolean;
  data: {
    userId?: string;
    sessionId?: string;
    message?: string;
    token?: string;
    expiresIn?: number;
    verified?: boolean;
    authenticated?: boolean;
    valid?: boolean;
    providers?: string[];
    authUrl?: string;
    createdAt?: string;
    lastActivity?: string;
  };
  timestamp: string;
}

export interface UserData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

export interface EmailVerificationData {
  token: string;
  userId: string;
}

class AuthManager {
  private apiBase: string;

  constructor() {
    this.apiBase = 'https://nest.arzansite.com/api';
    this.checkAuthStatus();
  }

  private getHeaders(token: string | null = null) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async register(userData: UserData): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    if (result.success && result.data.sessionId) {
      localStorage.setItem('pendingVerification', result.data.sessionId);
    }
    return result;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/signin`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials)
    });
    
    const result = await response.json();
    return result;
  }

  async exchangeJWT(sessionId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/exchange-jwt`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ sessionId })
    });
    
    const result = await response.json();
    if (result.success && result.data.token) {
      this.setJWT(result.data.token, result.data.expiresIn);
    }
    return result;
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/password-reset`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email })
    });
    
    return await response.json();
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, newPassword })
    });
    
    return await response.json();
  }

  async verifyEmail(token: string, userId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/verify-email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, userId })
    });
    
    const result = await response.json();
    if (result.success) {
      localStorage.removeItem('pendingVerification');
    }
    return result;
  }

  async requestEmailVerification(email: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/request-email-verification`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email })
    });
    
    return await response.json();
  }

  async checkEmailVerification(email: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/check-email-verification`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email })
    });
    
    return await response.json();
  }

  async createSession(userId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/create-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId })
    });
    
    return await response.json();
  }

  async authenticateSession(sessionId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/authenticate-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ sessionId })
    });
    
    return await response.json();
  }

  async getSessionInfo(sessionId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/session-info/${sessionId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  async validateSession(sessionId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/validate-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ sessionId })
    });
    
    return await response.json();
  }

  async logout(): Promise<void> {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      try {
        await fetch(`${this.apiBase}/auth/logout-session`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ sessionId })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.clearAuth();
    window.location.href = '/auth';
  }

  getJWT(): string | null {
    return localStorage.getItem('jwt');
  }

  getSessionId(): string | null {
    return localStorage.getItem('sessionId');
  }

  isAuthenticated(): boolean {
    return !!this.getJWT();
  }

  hasPendingVerification(): boolean {
    return !!localStorage.getItem('pendingVerification');
  }

  // Enhanced JWT management
  setJWT(token: string, expiresIn?: number): void {
    localStorage.setItem('jwt', token);
    if (expiresIn) {
      const expiresAt = Date.now() + (expiresIn * 1000);
      localStorage.setItem('jwtExpiresAt', expiresAt.toString());
    }
  }

  isJWTValid(): boolean {
    const token = this.getJWT();
    const expiresAt = localStorage.getItem('jwtExpiresAt');
    
    if (!token || !expiresAt) {
      return false;
    }
    
    // Check if token is expired
    if (Date.now() > parseInt(expiresAt)) {
      // Clear expired token
      this.clearJWT();
      return false;
    }
    
    return true;
  }

  clearJWT(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('jwtExpiresAt');
  }

  clearAuth(): void {
    this.clearJWT();
    localStorage.removeItem('sessionId');
    localStorage.removeItem('pendingVerification');
  }

  getValidJWT(): string | null {
    if (this.isJWTValid()) {
      return this.getJWT();
    }
    return null;
  }

  // Helper method to refresh JWT if needed
  async refreshJWTIfNeeded(): Promise<string | null> {
    const sessionId = this.getSessionId();
    if (sessionId && !this.getJWT()) {
      try {
        const result = await this.exchangeJWT(sessionId);
        if (result.success) {
          return result.data.token || null;
        }
      } catch (error) {
        console.error('Failed to refresh JWT:', error);
      }
    }
    return this.getJWT();
  }

  // Check authentication status on initialization
  private checkAuthStatus(): void {
    const jwt = this.getJWT();
    if (jwt) {
      // Validate JWT or check expiration
      const expiresAt = localStorage.getItem('jwtExpiresAt');
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        this.clearAuth();
      }
    }
  }

  // Enhanced request handling with automatic JWT validation
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<AuthResponse> {
    const jwt = this.getValidJWT();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    if (jwt) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${jwt}`
      };
    }
    
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(`${this.apiBase}${endpoint}`, config);
    const result = await response.json();
    
    if (response.status === 401) {
      // Token expired or invalid, clear auth and redirect
      this.clearAuth();
      window.location.href = '/auth';
      return result;
    }
    
    return result;
  }

  // OAuth Integration Methods
  async getOAuthProviders(): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/oauth/providers`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  async startOAuthFlow(provider: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/oauth/${provider}/start`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  async handleOAuthCallback(provider: string, code: string, state: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiBase}/auth/oauth/${provider}/callback?code=${code}&state=${state}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return await response.json();
  }
}

// Utility functions for input validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateInput = (data: { email?: string; password?: string; name?: string }) => {
  const errors: Record<string, string> = {};
  
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  
  if (data.password && !validatePassword(data.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number.';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const handleApiError = (error: any): string => {
  if (error.response) {
    const errorData = error.response.data;
    
    switch (error.response.status) {
      case 400:
        return `Invalid request: ${errorData.error}`;
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'Access denied. Insufficient permissions.';
      case 404:
        return 'Resource not found.';
      case 409:
        return `Conflict: ${errorData.error}`;
      case 500:
        return 'Server error. Please try again later.';
      default:
        return errorData.error || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    return 'Network error. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export const authManager = new AuthManager();
