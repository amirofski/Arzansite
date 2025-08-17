// Secure Token Management Service for ArzanSite Authentication
// Uses localStorage persistence with ephemeral memory for security and performance

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
  
  // Ephemeral memory storage for tokens (for performance)
  private ephemeralTokens: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  } = {};

  private constructor() {
    // Initialize tokens from localStorage on construction
    this.initializeFromStorage();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Initialize tokens from localStorage on startup
  private initializeFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const expiresAt = localStorage.getItem('token_expires_at');
        
        if (accessToken && refreshToken) {
          this.ephemeralTokens.access_token = accessToken;
          this.ephemeralTokens.refresh_token = refreshToken;
          
          if (expiresAt) {
            this.ephemeralTokens.expires_at = parseInt(expiresAt, 10);
          } else {
            // Try to decode expiration from stored token
            const decoded = decodeJwtExpirationMs(accessToken);
            if (decoded) {
              this.ephemeralTokens.expires_at = decoded;
              localStorage.setItem('token_expires_at', decoded.toString());
            }
          }
          
          console.log('TokenManager: Tokens restored from localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to initialize tokens from storage:', error);
      this.clearTokens();
    }
  }

  // Store tokens securely - both ephemeral memory and localStorage
  setTokens(tokens: TokenData): void {
    try {
      // Store tokens in ephemeral memory for immediate access
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
      
      // Persist tokens in localStorage for page reloads
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokens.access_token);
        if (tokens.refresh_token) {
          localStorage.setItem('refresh_token', tokens.refresh_token);
        }
        if (expiresAtMs) {
          localStorage.setItem('token_expires_at', expiresAtMs.toString());
        }
      }
      
      // Store non-sensitive user info in sessionStorage for UI purposes only
      if (tokens.user_info) {
        sessionStorage.setItem('user_info', JSON.stringify(tokens.user_info));
      }
      
      console.log('TokenManager: Tokens stored successfully');
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  // Get access token from ephemeral memory or localStorage
  getAccessToken(): string | null {
    try {
      let token = this.ephemeralTokens.access_token;
      
      // If not in ephemeral memory, try localStorage
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('access_token');
        if (token) {
          // Restore token to ephemeral memory
          this.ephemeralTokens.access_token = token;
          console.log('TokenManager: Access token restored from localStorage');
        }
      }
      
      // Check if token is expired
      if (token && this.isTokenExpired()) {
        console.log('TokenManager: Token expired, clearing tokens');
        this.clearTokens();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Get refresh token from ephemeral memory or localStorage
  getRefreshToken(): string | null {
    try {
      let token = this.ephemeralTokens.refresh_token;
      
      // If not in ephemeral memory, try localStorage
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('refresh_token');
        if (token) {
          // Restore token to ephemeral memory
          this.ephemeralTokens.refresh_token = token;
          console.log('TokenManager: Refresh token restored from localStorage');
        }
      }
      
      return token;
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

  // Clear all tokens from both ephemeral memory and localStorage
  clearTokens(): void {
    try {
      this.ephemeralTokens = {};
      
      // Clear localStorage tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires_at');
      }
      
      // Clear any non-sensitive UI data
      sessionStorage.removeItem('user_info');
      
      console.log('TokenManager: All tokens cleared');
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

  // Force refresh from localStorage (useful for debugging)
  forceRefreshFromStorage(): void {
    console.log('TokenManager: Force refreshing tokens from storage');
    this.initializeFromStorage();
  }
}

export const tokenManager = TokenManager.getInstance();
