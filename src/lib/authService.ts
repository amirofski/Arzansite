// Authentication Service for ArzanSite
// Handles all authentication operations with proper error handling

import { apiClient, BackendUserProfile, AuthResponse, SignupResponse } from './api-client';
import { tokenManager, TokenData } from './tokenManager';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {
    // Set up automatic token refresh
    tokenManager.setupAutoRefresh(async () => {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiClient.refreshToken(refreshToken);
      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
    });
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Validate email format
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  private validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // User registration
  async signup(data: SignupData): Promise<SignupResponse> {
    try {
      // Validate input
      if (!this.validateEmail(data.email)) {
        throw new Error('Invalid email format');
      }

      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Call API
      const response = await apiClient.signUp(data.email, data.password, data.metadata);
      
      return response;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // User login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validate input
      if (!this.validateEmail(credentials.email)) {
        throw new Error('Invalid email format');
      }

      if (!credentials.password) {
        throw new Error('Password is required');
      }

      // Call API
      const response = await apiClient.signIn(credentials.email, credentials.password);
      
      return response;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Email verification
  async verifyEmail(token: string): Promise<void> {
    try {
      if (!token) {
        throw new Error('Verification token is required');
      }

      await apiClient.verifyEmail(token);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Token refresh
  async refreshToken(): Promise<TokenData> {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.refreshToken(refreshToken);
      const tokenData: TokenData = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };

      tokenManager.setTokens(tokenData);
      return tokenData;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // User logout
  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearTokens();
    }
  }

  // Get current user
  async getCurrentUser(): Promise<BackendUserProfile> {
    try {
      if (!tokenManager.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      return await apiClient.getProfile();
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      await apiClient.forgotPassword(email);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      if (!token) {
        throw new Error('Reset token is required');
      }

      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      await apiClient.resetPassword(token, newPassword);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  // Get token expiration
  getTokenExpiration(): Date | null {
    return tokenManager.getTokenExpiration();
  }

  // Handle authentication errors
  private handleAuthError(error: unknown): void {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        tokenManager.clearTokens();
        // Redirect to login if not already there
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }
  }

  // Clear authentication error
  clearError(): void {
    // This can be used to clear any stored error state
  }
}

export const authService = AuthService.getInstance();
