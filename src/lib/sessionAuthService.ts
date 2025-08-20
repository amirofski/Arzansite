// Session-Based Authentication Service for ArzanSite
// Implements hybrid approach: Appwrite sessions + Backend JWT for API access

export interface SessionAuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
    first_name?: string;
    last_name?: string;
    phone?: string;
    created_at: string;
    updated_at: string;
  };
  sessionId: string;
}

export interface SessionValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

import { tokenManager } from './tokenManager';

export class SessionAuthService {
  private baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
    ? 'https://nest.arzansite.com/api'  // Production
    : 'http://localhost:3000/api');     // Development
  
  private currentSessionId: string | null = null;
  private backendAccessToken: string | null = null;
  private backendRefreshToken: string | null = null;

  constructor() {
    console.log('SessionAuthService initialized with baseURL:', this.baseURL);
    this.loadStoredAuthData();
  }

  // Load stored authentication data on initialization
  private loadStoredAuthData() {
    this.currentSessionId = localStorage.getItem('appwrite_session_id');
    this.backendAccessToken = localStorage.getItem('backend_access_token');
    this.backendRefreshToken = localStorage.getItem('backend_refresh_token');
    
    console.log('SessionAuthService: Loaded stored auth data:', {
      hasSessionId: !!this.currentSessionId,
      hasAccessToken: !!this.backendAccessToken,
      hasRefreshToken: !!this.backendRefreshToken
    });
  }

  // DEPRECATED: Session bootstrap is not supported in frontend anymore
  async authenticateWithBackend(_sessionId: string, _email: string): Promise<SessionAuthResponse> {
    throw new Error('authenticateWithBackend is deprecated. Use standard login with backend JWT.');
  }

  // Validate session with backend
  async validateSession(): Promise<boolean> {
    try {
      // Prefer validating via backend JWT if present
      const token = this.backendAccessToken || this.getStoredAccessToken();
      if (token) {
        try {
          const response = await this.makeAuthenticatedRequest(`${this.baseURL}/auth/me`, { method: 'GET' });
          if (response.ok) {
            return true;
          }
        } catch (e) {
          console.warn('SessionAuthService: Token-based validation failed:', e);
        }
      }

      // No legacy fallback. Frontend must use backend JWT only.
      console.log('SessionAuthService: No valid JWT; session invalid');
      return false;
    } catch (error) {
      console.error('SessionAuthService: Session validation error:', error);
      return false;
    }
  }

  // Refresh backend access token
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        console.log('SessionAuthService: No refresh token available');
        return null;
      }

      console.log('SessionAuthService: Refreshing access token');
      
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const newAccessToken = result.data?.access_token || result.access_token;
        
        if (newAccessToken) {
          this.backendAccessToken = newAccessToken;
          localStorage.setItem('backend_access_token', newAccessToken);
          // Sync with api client token storage
          tokenManager.setTokens({
            access_token: newAccessToken,
            refresh_token: this.getStoredRefreshToken() || undefined,
          });
          localStorage.setItem('access_token', newAccessToken);
          console.log('SessionAuthService: Token refreshed successfully');
          return newAccessToken;
        }
      }
      
      console.log('SessionAuthService: Token refresh failed:', response.status);
      return null;
    } catch (error) {
      console.error('SessionAuthService: Token refresh error:', error);
      return null;
    }
  }

  // Make authenticated request to backend (supports cookie-only or Bearer)
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let accessToken = this.backendAccessToken || this.getStoredAccessToken();

    // Attempt to refresh if token exists and is expired
    if (accessToken && this.isTokenExpired(accessToken)) {
      console.log('SessionAuthService: Token expired, refreshing...');
      accessToken = await this.refreshToken();
    }

    const headers: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string> | undefined),
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (response.status === 401) {
      console.log('SessionAuthService: 401 received, attempting token refresh');
      
      // Try to refresh token and retry once
      const newToken = await this.refreshToken();
      if (newToken) {
        console.log('SessionAuthService: Retrying request with new token');
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          },
          credentials: 'include'
        });
      }
      // If no refresh token path, return the 401 response to caller
      return response;
    }

    return response;
  }

  // Store backend tokens without a sessionId (cookie-only flows)
  setBackendTokens(authData: { access_token?: string | null; refresh_token?: string | null; user?: unknown }) {
    if (authData.access_token) {
      this.backendAccessToken = authData.access_token;
      localStorage.setItem('backend_access_token', authData.access_token);
      // Keep api client token manager in sync
      tokenManager.setTokens({ access_token: authData.access_token, refresh_token: authData.refresh_token || undefined });
      // Backward compatibility for api clients reading generic keys
      localStorage.setItem('access_token', authData.access_token);
    }
    if (authData.refresh_token) {
      this.backendRefreshToken = authData.refresh_token;
      localStorage.setItem('backend_refresh_token', authData.refresh_token);
      localStorage.setItem('refresh_token', authData.refresh_token);
    }
    if (authData.user) {
      localStorage.setItem('user_info', JSON.stringify(authData.user));
    }
  }

  // Store authentication data
  storeAuthData(sessionId: string, authData: SessionAuthResponse) {
    this.currentSessionId = sessionId;
    this.backendAccessToken = authData.access_token;
    this.backendRefreshToken = authData.refresh_token;
    
    localStorage.setItem('appwrite_session_id', sessionId);
    localStorage.setItem('backend_access_token', authData.access_token);
    localStorage.setItem('backend_refresh_token', authData.refresh_token);
    localStorage.setItem('user_info', JSON.stringify(authData.user));
    // Sync tokens for api client
    tokenManager.setTokens({ access_token: authData.access_token, refresh_token: authData.refresh_token });
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    
    console.log('SessionAuthService: Auth data stored successfully');
  }

  // Force refresh tokens from storage
  forceRefreshFromStorage(): void {
    try {
      this.currentSessionId = this.getStoredSessionId();
      this.backendAccessToken = this.getStoredAccessToken();
      this.backendRefreshToken = this.getStoredRefreshToken();
      
      console.log('SessionAuthService: Tokens refreshed from storage');
    } catch (error) {
      console.error('SessionAuthService: Error refreshing tokens from storage:', error);
    }
  }

  // Validate that tokens are properly available
  validateTokensAvailable(): boolean {
    const hasAccessToken = !!(this.backendAccessToken || this.getStoredAccessToken());
    const hasSessionId = !!(this.currentSessionId || this.getStoredSessionId());
    console.log('SessionAuthService: Token validation - Access Token:', hasAccessToken, 'Session ID:', hasSessionId);
    // Consider valid if either cookie-backed session or bearer token is present
    return hasAccessToken || hasSessionId;
  }

  // Clear authentication data
  clearAuthData() {
    this.currentSessionId = null;
    this.backendAccessToken = null;
    this.backendRefreshToken = null;
    
    localStorage.removeItem('appwrite_session_id');
    localStorage.removeItem('backend_access_token');
    localStorage.removeItem('backend_refresh_token');
    localStorage.removeItem('user_info');
    
    console.log('SessionAuthService: Auth data cleared');
  }

  // Logout from backend using JWT
  async logoutFromBackend(): Promise<boolean> {
    try {
      console.log('SessionAuthService: Logging out using JWT');
      const response = await this.makeAuthenticatedRequest(`${this.baseURL}/auth/logout`, {
        method: 'POST'
      });
      const ok = response.ok;
      if (!ok) {
        console.log('SessionAuthService: Logout request failed with status:', response.status);
      }
      return ok;
    } catch (error) {
      console.error('SessionAuthService: Logout error:', error);
      return false;
    }
  }

  // Get current user info
  getCurrentUser() {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const hasToken = !!(this.backendAccessToken || this.getStoredAccessToken());
    const hasSession = !!(this.currentSessionId || this.getStoredSessionId());
    return hasToken || hasSession;
  }

  // Get stored session ID
  private getStoredSessionId(): string | null {
    return localStorage.getItem('appwrite_session_id');
  }

  // Get stored access token
  private getStoredAccessToken(): string | null {
    return localStorage.getItem('backend_access_token');
  }

  // Get stored refresh token
  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('backend_refresh_token');
  }

  // Check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime >= expiryTime;
      
      if (isExpired) {
        console.log('SessionAuthService: Token expired at:', new Date(expiryTime));
      }
      
      return isExpired;
    } catch (error) {
      console.error('SessionAuthService: Error parsing token:', error);
      return true; // Assume expired if we can't parse
    }
  }

  // Get session info
  getSessionInfo() {
    return {
      sessionId: this.currentSessionId,
      hasAccessToken: !!this.backendAccessToken,
      hasRefreshToken: !!this.backendRefreshToken,
      isAuthenticated: this.isAuthenticated()
    };
  }
}

// Export singleton instance
export const sessionAuthService = new SessionAuthService();
