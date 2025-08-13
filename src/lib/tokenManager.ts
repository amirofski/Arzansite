// Token Management Service for ArzanSite Authentication
// Handles secure token storage and automatic refresh

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<TokenData> | null = null;
  private readonly ENCRYPTION_KEY = 'arzan_site_token_key_2024';

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Simple encryption for tokens (in production, use proper encryption)
  private encrypt(text: string): string {
    try {
      return btoa(encodeURIComponent(text));
    } catch {
      return text;
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      return decodeURIComponent(atob(encryptedText));
    } catch {
      return encryptedText;
    }
  }

  // Store tokens securely
  setTokens(tokens: TokenData): void {
    try {
      // Store access token in sessionStorage (cleared on page refresh/tab close)
      sessionStorage.setItem('access_token', this.encrypt(tokens.access_token));
      
      // Store refresh token in sessionStorage for better security
      if (tokens.refresh_token) {
        sessionStorage.setItem('refresh_token', this.encrypt(tokens.refresh_token));
      }
      
      // Store expiration time if provided
      if (tokens.expires_at) {
        sessionStorage.setItem('token_expires_at', tokens.expires_at.toString());
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  // Get access token
  getAccessToken(): string | null {
    try {
      const encrypted = sessionStorage.getItem('access_token');
      return encrypted ? this.decrypt(encrypted) : null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Get refresh token
  getRefreshToken(): string | null {
    try {
      const encrypted = sessionStorage.getItem('refresh_token');
      return encrypted ? this.decrypt(encrypted) : null;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    try {
      const expiresAt = sessionStorage.getItem('token_expires_at');
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
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('token_expires_at');
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
      const expiresAt = sessionStorage.getItem('token_expires_at');
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
