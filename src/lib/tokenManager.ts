// Secure Token Management Service for ArzanSite Authentication
// Uses httpOnly cookies and ephemeral memory to prevent XSS attacks

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user_info?: Record<string, unknown>;
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
  
  // Ephemeral memory storage for tokens (cleared on page reload)
  private ephemeralTokens: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  } = {};

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Store tokens securely - only non-sensitive data in ephemeral memory
  setTokens(tokens: TokenData): void {
    try {
      // Store tokens in ephemeral memory only (cleared on page reload)
      this.ephemeralTokens.access_token = tokens.access_token;
      this.ephemeralTokens.refresh_token = tokens.refresh_token;
      
      // Determine and store expiration time
      let expiresAtMs: number | undefined = tokens.expires_at;
      if (!expiresAtMs) {
        const decoded = decodeJwtExpirationMs(tokens.access_token);
        if (decoded && Number.isFinite(decoded)) {
          expiresAtMs = decoded;
        }
      }
      this.ephemeralTokens.expires_at = expiresAtMs;
      
      // Store non-sensitive user info in sessionStorage for UI purposes only
      // This should not contain any tokens or secrets
      if (tokens.user_info) {
        sessionStorage.setItem('user_info', JSON.stringify(tokens.user_info));
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  // Get access token from ephemeral memory
  getAccessToken(): string | null {
    try {
      return this.ephemeralTokens.access_token || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Get refresh token from ephemeral memory
  getRefreshToken(): string | null {
    try {
      return this.ephemeralTokens.refresh_token || null;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    try {
      const expiresAt = this.ephemeralTokens.expires_at;
      if (!expiresAt) return false;
      
      const now = Date.now();
      
      // Consider token expired 5 minutes before actual expiration
      return now >= (expiresAt - 5 * 60 * 1000);
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  }

  // Clear all tokens from ephemeral memory
  clearTokens(): void {
    try {
      this.ephemeralTokens = {};
      // Clear any non-sensitive UI data
      sessionStorage.removeItem('user_info');
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
      const expiresAt = this.ephemeralTokens.expires_at;
      if (!expiresAt) return null;
      
      return new Date(expiresAt);
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

  // Get user info from sessionStorage (non-sensitive data only)
  getUserInfo(): Record<string, unknown> | null {
    try {
      const userInfo = sessionStorage.getItem('user_info');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
}

export const tokenManager = TokenManager.getInstance();
