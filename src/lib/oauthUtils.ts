// OAuth Utility Functions
// These functions provide easy-to-use OAuth integration helpers

import { appwriteAuthService } from './appwriteAuth';

/**
 * Start OAuth flow for a specific provider
 * @param provider - OAuth provider (e.g., 'github', 'google', 'facebook')
 * @returns Promise with redirect URL and optional state
 */
export const startOAuth = async (provider: string) => {
  try {
    const response = await fetch('/api/auth/oauth/github/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        successUrl: `${window.location.origin}/auth/oauth/callback`,
        failureUrl: `${window.location.origin}/auth/login?error=oauth_failed`,
      }),
    });
    
    const data = await response.json();
    
    // Redirect to OAuth provider
    window.location.href = data.redirectUrl;
  } catch (error) {
    console.error('Failed to start OAuth flow:', error);
    throw error;
  }
};

/**
 * Check if OAuth login was successful
 * @returns boolean indicating if OAuth success parameter is present
 */
export const checkOAuthSuccess = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('oauth_success') === 'true';
};

/**
 * Get current user information from OAuth session
 * @returns Promise with user information or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth/oauth/me', {
      credentials: 'include', // Include cookies
    });
    
    if (response.ok) {
      const user = await response.json();
      return user;
    } else {
      throw new Error('Not authenticated');
    }
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

/**
 * Clear OAuth session and logout user
 */
export const logout = async () => {
  try {
    // Clear cookies by setting them to expire
    document.cookie = 'appwrite_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Optionally call backend logout endpoint
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    // Redirect to login page
    window.location.href = '/auth/login';
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

/**
 * Enhanced OAuth functions using the appwriteAuthService
 */

/**
 * Start OAuth flow using the appwriteAuthService
 * @param provider - OAuth provider
 * @returns Promise with OAuth response
 */
export const startOAuthWithService = async (provider: string) => {
  return await appwriteAuthService.startOAuth(provider);
};

/**
 * Handle OAuth callback using the appwriteAuthService
 * @param provider - OAuth provider
 * @param code - Authorization code from OAuth provider
 * @param state - Optional state parameter
 * @returns Promise with authentication response
 */
export const handleOAuthCallbackWithService = async (provider: string, code: string, state?: string) => {
  return await appwriteAuthService.handleOAuthCallback(provider, code, state);
};

/**
 * Get OAuth user information using the appwriteAuthService
 * @returns Promise with OAuth user information
 */
export const getOAuthUserWithService = async () => {
  return await appwriteAuthService.getOAuthUser();
};

/**
 * Logout OAuth session using the appwriteAuthService
 */
export const logoutOAuthWithService = async () => {
  return await appwriteAuthService.logoutOAuth();
};

/**
 * Check OAuth success using the appwriteAuthService
 * @returns boolean indicating OAuth success
 */
export const checkOAuthSuccessWithService = () => {
  return appwriteAuthService.checkOAuthSuccess();
};

/**
 * Get OAuth callback parameters using the appwriteAuthService
 * @returns Object with code, state, and error parameters
 */
export const getOAuthCallbackParamsWithService = () => {
  return appwriteAuthService.getOAuthCallbackParams();
};
