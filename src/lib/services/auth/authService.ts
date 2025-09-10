// Authentication Service for ArzanSite
// Handles all authentication operations with proper error handling and field mapping

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';
import { tokenManager } from '@/lib/tokenManager';

// Request interfaces
export interface SignUpRequest {
  email: string;
  password: string;
  metadata?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    address?: string;
  };
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
  userId?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  email?: string;
  newPassword: string;
}

// Response interfaces
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      role?: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      phone?: string;
      address?: string;
      company?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    tokens?: {
      accessToken: string;
      refreshToken: string;
      expiresAt?: number;
    };
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  verificationToken?: string;
  verificationEmailSent?: boolean;
  requiresFrontendVerification?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  company?: string;
  bio?: string;
  userMetadata?: Record<string, unknown>;
  emailConfirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class AuthService extends BaseApiService {
  /**
   * User registration
   */
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    try {
      // Only send required fields per guide: email, password
      const payload = FieldMapper.transformRequest({
        email: request.email,
        password: request.password,
      });

      const resp = await withRetry(() =>
        this.request<SignUpResponse>('/auth/signup', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
      return FieldMapper.transformResponse(resp);
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.signUp');
      throw error;
    }
  }

  /**
   * User login
   */
  async signIn(request: SignInRequest): Promise<AuthResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const raw = await withRetry(() =>
        this.request<any>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      // Normalize response shape (unwrap data if present, camelCase keys)
      const response = FieldMapper.transformResponse<any>(raw);
      const payload = 'data' in response ? response.data : response;

      // Store tokens from either wrapped or flat payload
      const accessToken = payload?.accessToken || payload?.access_token;
      const refreshToken = payload?.refreshToken || payload?.refresh_token;
      const expiresAt = payload?.expiresAt || payload?.expires_at;
      if (accessToken && refreshToken) {
        tokenManager.setTokens({ access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt });
      }
      
      // Return unified AuthResponse-like object (preserve original wrapper if present)
      return response as AuthResponse;
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.signIn');
      throw error;
    }
  }

  /**
   * User logout
   */
  async signOut(): Promise<{ success: boolean }> {
    try {
      const response = await withRetry(() =>
        this.request<{ success: boolean }>('/auth/logout', {
          method: 'POST',
        })
      );

      // Clear tokens regardless of response
      tokenManager.clearTokens();
      
      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.signOut');
      // Clear tokens even if logout fails
      tokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await withRetry(() =>
        this.request<AuthResponse>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      );

      const transformedResponse = FieldMapper.transformResponse(response) as AuthResponse;
      
      // Update tokens in token manager
      if (transformedResponse.data?.tokens) {
        tokenManager.setTokens({
          access_token: transformedResponse.data.tokens.accessToken,
          refresh_token: transformedResponse.data.tokens.refreshToken,
          expires_at: transformedResponse.data.tokens.expiresAt,
        });
      }
      
      return transformedResponse;
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.refreshAccessToken');
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getMe(): Promise<UserProfile> {
    try {
      // Backend wraps payload: { success, data: { id, role, ... } }
      const response = await withRetry(() =>
        this.request<{ success: boolean; data: Partial<UserProfile> }>('/auth/me')
      );

      const user = FieldMapper.transformWrappedResponse<Partial<UserProfile>>(response);
      // Ensure minimal shape
      return {
        id: user.id as string,
        email: (user.email as string) || '',
        role: (user.role as any) || 'user',
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        company: user.company,
        bio: user.bio,
        userMetadata: user.userMetadata,
        emailConfirmedAt: user.emailConfirmedAt ?? null,
        createdAt: (user.createdAt as string) || new Date().toISOString(),
        updatedAt: (user.updatedAt as string) || new Date().toISOString(),
      };
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.getMe');
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.verifyEmail');
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async sendPasswordReset(request: PasswordResetRequest): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      // Primary per integration guide: request reset link
      try {
        const primary = await withRetry(() =>
          this.request<{ success: boolean }>('/auth/password-reset', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return primary;
      } catch (e) {
        // Fallback to alternate route
        const fallback = await withRetry(() =>
          this.request<{ success: boolean }>('/auth/request-password-reset', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return fallback;
      }
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.sendPasswordReset');
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(request: PasswordResetConfirmRequest): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.resetPassword');
      throw error;
    }
  }

  /**
   * Request email verification
   */
  async requestVerification(email: string, password: string): Promise<{ message: string; verificationEmailSent: boolean }> {
    try {
      const response = await withRetry(() =>
        this.request<{ message: string; verificationEmailSent: boolean }>('/auth/request-verification', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.requestVerification');
      throw error;
    }
  }

  /**
   * Request email verification by userId (alternative backend flow)
   */
  async requestVerificationByUserId(userId: string): Promise<{ message: string; verificationEmailSent: boolean }> {
    try {
      const response = await withRetry(() =>
        this.request<{ message: string; verificationEmailSent: boolean }>('/auth/request-verification', {
          method: 'POST',
          body: JSON.stringify({ user_id: userId }),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.requestVerificationByUserId');
      throw error;
    }
  }

  /**
   * Check email verification status
   */
  async checkEmailVerification(email: string): Promise<{ 
    email: string; 
    emailVerified: boolean; 
    userId: string; 
    message: string; 
  }> {
    try {
      const raw = await withRetry(() =>
        this.request<any>(`/auth/check-verification/${encodeURIComponent(email)}`)
      );

      // Unwrap { success, data: {...} } and camelCase
      const data = FieldMapper.transformWrappedResponse<any>(raw) as {
        email: string;
        emailVerified?: boolean;
        emailVerification?: boolean;
        userId?: string;
        user_id?: string;
        message: string;
      };

      const emailVerified = typeof data.emailVerified === 'boolean'
        ? data.emailVerified
        : (typeof data.emailVerification === 'boolean' ? data.emailVerification : false);

      return {
        email: String(data.email || email),
        emailVerified,
        userId: String((data.userId || data.user_id) || ''),
        message: String(data.message || ''),
      };
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.checkEmailVerification');
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(profileData);
      
      const response = await withRetry(() =>
        this.request<{ success: boolean; data: UserProfile; message: string }>('/profiles/me', {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformWrappedResponse<UserProfile>(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.updateProfile');
      throw error;
    }
  }

  /**
   * Get all user profiles (admin only)
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const response = await withRetry(() =>
        this.request<UserProfile[]>('/profiles')
      );

      return FieldMapper.transformListResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.getAllProfiles');
      throw error;
    }
  }

  // OAuth methods (placeholder implementations)
  async oauthStart(provider: string, params: { successUrl: string; failureUrl: string }): Promise<{ redirectUrl: string; state?: string }> {
    try {
      const response = await withRetry(() =>
        this.request<{ redirectUrl: string; state?: string }>('/auth/oauth/start', {
          method: 'POST',
          body: JSON.stringify({ provider, ...params }),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.oauthStart');
      throw error;
    }
  }

  async oauthMe(): Promise<{ id: string; email: string; role?: string }> {
    try {
      const response = await withRetry(() =>
        this.request<{ id: string; email: string; role?: string }>('/auth/oauth/me')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.oauthMe');
      throw error;
    }
  }

  async oauthLogout(): Promise<{ success: boolean }> {
    try {
      const response = await withRetry(() =>
        this.request<{ success: boolean }>('/auth/oauth/logout', {
          method: 'POST',
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.oauthLogout');
      throw error;
    }
  }

  async getProfile(): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      const response = await withRetry(() =>
        this.request<{ success: boolean; data?: UserProfile; error?: string }>('/profiles/me')
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'AuthService.getProfile');
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get profile' };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();