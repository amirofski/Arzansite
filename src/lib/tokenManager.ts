// Token Management Service for ArzanSite Authentication
// Handles secure token storage and automatic refresh

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

// Decode JWT and return exp in ms if available
function decodeJwtExpirationMs(jwtToken: string): number | null {
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<TokenData> | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Store tokens securely
  setTokens(tokens: TokenData): void {
    try {
      // Store access token in both sessionStorage and localStorage for consistency
      sessionStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('access_token', tokens.access_token);
      
      // Store refresh token in localStorage for persistence
      if (tokens.refresh_token) {
        localStorage.setItem('refresh_token', tokens.refresh_token);
      }
      
      // Determine and store expiration time
      let expiresAtMs: number | undefined = tokens.expires_at;
      if (!expiresAtMs) {
        const decoded = decodeJwtExpirationMs(tokens.access_token);
        if (decoded && Number.isFinite(decoded)) {
          expiresAtMs = decoded;
        }
      }
      if (expiresAtMs) {
        localStorage.setItem('token_expires_at', String(expiresAtMs));
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  // Get access token
  getAccessToken(): string | null {
    try {
      // Check sessionStorage first, then localStorage for consistency
      let token = sessionStorage.getItem('access_token');
      if (!token) {
        token = localStorage.getItem('access_token');
        // If found in localStorage, also store in sessionStorage
        if (token) {
          sessionStorage.setItem('access_token', token);
        }
      }
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Get refresh token
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    try {
      const expiresAt = localStorage.getItem('token_expires_at');
      if (!expiresAt) return false;
      
      const expirationTime = parseInt(expiresAt, 10);
      const now = Date.now();
      
      // Consider token expired 5 minutes before actual expiration
      return now >= (expirationTime - 5 * 60 * 1000);
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  }

  // Clear all tokens
  clearTokens(): void {
    try {
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken && !this.isTokenExpired();
  }

  // Get token expiration time
  getTokenExpiration(): Date | null {
    try {
      const expiresAt = localStorage.getItem('token_expires_at');
      if (!expiresAt) return null;
      
      return new Date(parseInt(expiresAt, 10));
    } catch (error) {
      console.error('Failed to get token expiration:', error);
      return null;
    }
  }

  // Set up automatic token refresh
  setupAutoRefresh(refreshCallback: () => Promise<TokenData>): void {
    const checkAndRefresh = async () => {
      if (this.isTokenExpired() && this.getRefreshToken()) {
        try {
          const newTokens = await refreshCallback();
          this.setTokens(newTokens);
        } catch (error) {
          console.error('Auto refresh failed:', error);
          this.clearTokens();
        }
      }
    };

    // Check every minute
    setInterval(checkAndRefresh, 60 * 1000);
    
    // Also check immediately
    checkAndRefresh();
  }

  // Prevent multiple concurrent refresh requests
  async refreshTokenSafely(refreshCallback: () => Promise<TokenData>): Promise<TokenData> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = refreshCallback().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }
}

export const tokenManager = TokenManager.getInstance();
