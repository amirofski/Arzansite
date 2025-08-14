// Appwrite authentication service that integrates with your backend API
// This service handles the frontend authentication flow and communicates with your backend

export interface AppwriteUser {
  $id: string;
  email: string;
  emailVerification: boolean;
  name?: string;
  phone?: string;
  status: number;
  registration: number;
  passwordUpdate: number;
  lastActivity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
  redirect: {
    url: string;
    message: string;
  };
}

export interface SignupResponse {
  requiresFrontendVerification: boolean;
  verificationEmailSent: boolean;
  message: string;
}

class AppwriteAuthService {
  private baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://nest.arzansite.com/api'  // Production
    : 'http://localhost:3000/api';     // Development
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  // Set tokens after successful authentication
  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    // Store in localStorage for persistence
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  // Clear tokens on logout
  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Get stored tokens on initialization
  private loadStoredTokens() {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedAccessToken && storedRefreshToken) {
      this.accessToken = storedAccessToken;
      this.refreshToken = storedRefreshToken;
    }
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      // Try to refresh token
      try {
        await this.refreshAccessToken();
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Refresh access token
  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.setTokens(data.access_token, this.refreshToken);
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Debug logging to identify response structure
      console.log('Full response:', response);
      console.log('Response data:', data);
      console.log('Data structure keys:', Object.keys(data));
      console.log('User object:', data?.user);
      console.log('Data.data:', data?.data);
      
      // Set tokens - handle both possible token locations
      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken;
      
      if (!accessToken) {
        throw new Error('No access token received from server');
      }
      
      this.setTokens(accessToken, refreshToken);
      
      // Create user profile from response - handle multiple possible structures
      let userProfile: UserProfile;
      
      if (data.user && data.user.id) {
        // Direct user object structure: { user: { id, email, ... } }
        console.log('Using direct user structure');
        userProfile = {
          id: data.user.id,
          email: data.user.email || email,
          role: data.user.role || 'user',
          created_at: data.user.created_at || new Date().toISOString(),
          updated_at: data.user.updated_at || new Date().toISOString(),
        };
      } else if (data.data && data.data.user && data.data.user.id) {
        // Nested data structure: { data: { user: { id, email, ... } } }
        console.log('Using nested data structure');
        userProfile = {
          id: data.data.user.id,
          email: data.data.user.email || email,
          role: data.data.user.role || 'user',
          created_at: data.data.user.created_at || new Date().toISOString(),
          updated_at: data.data.user.updated_at || new Date().toISOString(),
        };
      } else if (data.id) {
        // Flat structure: { id, email, ... }
        console.log('Using flat structure');
        userProfile = {
          id: data.id,
          email: data.email || email,
          role: data.role || 'user',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      } else {
        // Fallback: create a minimal user profile
        console.log('Using fallback structure');
        userProfile = {
          id: 'unknown',
          email: email,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.warn('Could not extract user ID from response, using fallback');
      }

      // Determine redirect URL based on user role
      const redirectUrl = '/dashboard';
      const redirectMessage = 'Login successful! Redirecting to dashboard...';

      const result: AuthResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: userProfile,
        redirect: {
          url: redirectUrl,
          message: redirectMessage
        }
      };

      console.log('Final auth response:', result);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(error instanceof Error ? error.message : 'Sign in failed');
    }
  }

  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<SignupResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          metadata: metadata || {}
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      const data = await response.json();

      return {
        requiresFrontendVerification: data.requiresFrontendVerification || false,
        verificationEmailSent: data.verificationEmailSent || false,
        message: data.message || 'Account created successfully! Please check your email for verification.'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(error instanceof Error ? error.message : 'Sign up failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.makeRequest('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const response = await this.makeRequest('/auth/me');
      
      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      
      // Create user profile from response
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email || '',
        role: data.role || 'user',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      return userProfile;
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearTokens();
      return null;
    }
  }

  async refreshUserToken(): Promise<void> {
    try {
      await this.refreshAccessToken();
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearTokens();
      throw new Error('Failed to refresh token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send password reset email');
    }
  }

  async resetPassword(userId: string, secret: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, secret, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  }

  async checkEmailVerification(email: string): Promise<{ email: string; emailVerified: boolean; userId: string; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/check-verification/${email}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check email verification');
      }

      const data = await response.json();
      return {
        email: data.email,
        emailVerified: data.emailVerified,
        userId: data.userId,
        message: data.message
      };
    } catch (error) {
      console.error('Check email verification error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to check email verification');
    }
  }

  async requestVerification(email: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request verification email');
      }
    } catch (error) {
      console.error('Request verification error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to request verification email');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Initialize the service (load stored tokens)
  initialize() {
    this.loadStoredTokens();
  }
}

export const appwriteAuthService = new AppwriteAuthService();

// Initialize the service when the module is loaded
appwriteAuthService.initialize();
