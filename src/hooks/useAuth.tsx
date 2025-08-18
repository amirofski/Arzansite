import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { sessionApiService } from '@/lib/sessionApiService';
import { sessionAuthService } from '@/lib/sessionAuthService';
type UserProfile = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
};
type OAuthResponse = { redirectUrl: string; state?: string };
type OAuthUser = { id: string; email: string; name?: string; avatar?: string; provider: string };

type UserRole = 'user' | 'admin';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  userRole: { role: UserRole } | null;
  roleLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ user: UserProfile; redirect?: { url: string; message: string } } | void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ 
    requiresFrontendVerification?: boolean; 
    verificationEmailSent?: boolean;
    message?: string;
  }>;
  requestVerification: (email: string, password: string) => Promise<void>;
  checkEmailVerification: (email: string) => Promise<{ email: string; emailVerified: boolean; userId: string; message: string }>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  verifyEmailWithUserId: (token: string, userId: string) => Promise<{ message: string }>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  handleAuthError: (error: Error) => boolean;
  // OAuth methods
  startOAuth: (provider: string) => Promise<OAuthResponse>;
  handleOAuthCallback: (provider: string, code: string, state?: string) => Promise<{ user: UserProfile; redirect?: { url: string; message: string } }>;
  getOAuthUser: () => Promise<OAuthUser | null>;
  logoutOAuth: () => Promise<void>;
  checkOAuthSuccess: () => boolean;
  getOAuthCallbackParams: () => { code?: string; state?: string; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<{ role: UserRole } | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);

  const clearError = () => setError(null);

  // Debounce authentication checks to prevent rapid successive calls
  const debouncedAuthCheck = (callback: () => void, delay: number = 1000) => {
    const now = Date.now();
    if (now - lastAuthCheck < delay) {
      return;
    }
    setLastAuthCheck(now);
    callback();
  };

  const loadUser = async () => {
    if (isCheckingAuth) {
      console.log('useAuth: loadUser called while already checking auth, skipping...');
      return; // Prevent multiple simultaneous auth checks
    }
    
    setIsCheckingAuth(true);
    setLoading(true);
    try {
      console.log('useAuth: loadUser - fetching current user...');
      
      // First check if we have a valid session
      const isSessionValid = await sessionAuthService.validateSession();
      
      if (isSessionValid) {
        const me: UserProfile | null = sessionAuthService.getCurrentUser();
        console.log('useAuth: loadUser - result:', me ? 'User found' : 'No user');
        
        if (me) {
          setUser(me);
          setUserRole({ role: me.role });
          setError(null);
        } else {
          setUser(null);
          setUserRole(null);
        }
      } else {
        console.log('useAuth: Session invalid, clearing user data');
        setUser(null);
        setUserRole(null);
        sessionAuthService.clearAuthData();
      }
    } catch (err) {
      console.error('Load user error:', err);
      setUser(null);
      setUserRole(null);
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log('useAuth: useEffect triggered - checking authentication...');
    
    const checkAuth = async () => {
      if (isCheckingAuth || !isMounted) {
        console.log('useAuth: checkAuth - already checking or not mounted, skipping...');
        return; // Prevent multiple simultaneous auth checks
      }
      
      try {
        setIsCheckingAuth(true);
        
        // First, check if we have a valid session
        const hasValidSession = sessionAuthService.isAuthenticated();
        console.log('useAuth: checkAuth - has valid session:', hasValidSession);
        
        if (!isMounted) return; // Check if component is still mounted
        
        if (hasValidSession) {
          console.log('useAuth: checkAuth - valid session found, loading user...');
          await loadUser();
        } else {
          console.log('useAuth: checkAuth - no valid session, clearing state...');
          // Clear user data if not authenticated
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      } catch (error) {
        if (!isMounted) return; // Check if component is still mounted
        
        console.error('Auth check error:', error);
        setUser(null);
        setUserRole(null);
        setLoading(false);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };
    
    // Use debounced auth check
    debouncedAuthCheck(checkAuth);
    
    // Cleanup function
    return () => {
      console.log('useAuth: useEffect cleanup - unmounting...');
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      console.log('useAuth: Calling sessionApiService.login...');
      const response = await sessionApiService.login(email, password);
      console.log('useAuth: Response from sessionApiService:', response);
      
      // Validate response structure
      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }
      
      const authData = response.data;
      console.log('useAuth: Auth data check:', !!authData);
      console.log('useAuth: User check:', !!authData?.user);
      console.log('useAuth: User ID check:', !!authData?.user?.id);
      
      if (!authData) {
        throw new Error('No authentication data received');
      }
      
      if (!authData.user) {
        throw new Error('No user information received from authentication service');
      }
      
      if (!authData.user.id) {
        throw new Error('Invalid user information received from authentication service');
      }
      
      // Persist backend tokens for authenticated requests (cookie or bearer)
      if (authData.access_token || authData.refresh_token || authData.user) {
        sessionAuthService.setBackendTokens({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          user: authData.user,
        });
      }

      // If sessionId is provided, persist it for legacy or hybrid flows
      if (authData.sessionId) {
        sessionAuthService.storeAuthData(authData.sessionId, {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          user: authData.user,
          sessionId: authData.sessionId
        });
      }

      // Force refresh tokens from storage to ensure they're immediately available
      sessionAuthService.forceRefreshFromStorage();
      
      // Validate that tokens are properly available
      if (!sessionAuthService.validateTokensAvailable()) {
        console.warn('useAuth: Tokens not properly available after storage');
      }
      
      // Set user immediately to avoid race conditions
      setUser(authData.user);
      setUserRole({ role: authData.user.role });
      
      // Ensure profile exists by calling the profile endpoint
      // This will also update the user data if needed
      await ensureProfileExists(authData.user);
      
      // No need to call loadUser() again since we already have the user data
      // and ensureProfileExists handles profile creation/verification
      
      return { 
        user: authData.user,
        redirect: authData.redirect
      };
    } catch (err) {
      console.error('useAuth: Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    setError(null);
    try {
      const response = await sessionApiService.signup(email, password, metadata);
      if (response.success) {
        return {
          requiresFrontendVerification: response.data?.requiresFrontendVerification || false
        };
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const requestVerification = async (email: string, password: string) => {
    setError(null);
    try {
      // Appwrite handles email verification automatically during signup
      // This function is kept for compatibility but doesn't need to do anything
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request verification email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const checkEmailVerification = async (email: string) => {
    setError(null);
    try {
      // For now, we'll use the session API service
      // This would need to be implemented in the backend
      throw new Error('Email verification check not yet implemented for session-based auth');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check email verification status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await sessionApiService.logout();
      setUser(null);
      setUserRole(null);
      // Clear any stored session data
      sessionAuthService.clearAuthData();
    } catch (err) {
      console.error('Sign out error:', err);
      // Even if sign out fails, clear local state
      setUser(null);
      setUserRole(null);
      sessionAuthService.clearAuthData();
    }
  };

  const refreshToken = async () => {
    try {
      setError(null);
      const newToken = await sessionAuthService.refreshToken();
      if (newToken) {
        // Reload user data after token refresh
        await loadUser();
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      // If refresh fails, sign out the user
      await signOut();
      throw err;
    }
  };

  const refreshUserRole = async () => {
    try {
      setRoleLoading(true);
      await loadUser(); // This will also refresh the user role
    } catch (err) {
      console.error('Role refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh user role');
    } finally {
      setRoleLoading(false);
    }
  };

  // Handle authentication errors gracefully
  const handleAuthError = (error: Error) => {
    console.error('Authentication error:', error);
    
    // Check if it's an authentication-related error
    if (error.message.includes('Unauthorized') || 
        error.message.includes('Authentication failed') ||
        error.message.includes('please log in again')) {
      
      // Clear user data and session data
      setUser(null);
      setUserRole(null);
      sessionAuthService.clearAuthData();
      
      // Set error message
      setError('Your session has expired. Please log in again.');
      
      // Don't redirect immediately, let the user see the error
      return false;
    }
    
    // For other errors, just set the error message
    setError(error.message);
    return true;
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      // For now, we'll use the session API service
      // This would need to be implemented in the backend
      throw new Error('Password reset not yet implemented for session-based auth');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    try {
      // For now, password reset is not implemented in session-based auth
      // This would need to be implemented in the backend
      throw new Error('Password reset not yet implemented for session-based auth');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyEmail = async (token: string) => {
    setError(null);
    try {
      // For now, email verification is not implemented in session-based auth
      // This would need to be implemented in the backend
      throw new Error('Email verification not yet implemented for session-based auth');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Verify email with token and userId
  const verifyEmailWithUserId = async (token: string, userId: string) => {
    setError(null);
    try {
      // For now, email verification is not implemented in session-based auth
      // This would need to be implemented in the backend
      throw new Error('Email verification not yet implemented for session-based auth');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getCurrentUser = async () => {
    await loadUser();
  };

  // OAuth Methods
  const startOAuth = async (provider: string) => {
    setError(null);
    const successUrl = `${window.location.origin}/auth/oauth/callback`;
    const failureUrl = `${window.location.origin}/auth?oauth=failed`;
    const res = await sessionApiService.oauthStart(provider, { successUrl, failureUrl });
    if (!res.success || !res.data?.redirectUrl) {
      const msg = res.error || 'Failed to start OAuth flow';
      setError(msg);
      throw new Error(msg);
    }
    return { redirectUrl: res.data.redirectUrl, state: res.data.state } as OAuthResponse;
  };

  const handleOAuthCallback = async (provider: string, code: string, state?: string) => {
    setError(null);
    // Backend handles the callback and sets cookies; just fetch current user
    const me = await sessionApiService.oauthMe();
    if (!me.success || !me.data) {
      const msg = me.error || 'OAuth callback failed';
      setError(msg);
      throw new Error(msg);
    }
    // Persist user into session store for UI
    sessionAuthService.setBackendTokens({ user: me.data });
    await loadUser();
    return { user: sessionAuthService.getCurrentUser() as UserProfile, redirect: { url: '/dashboard', message: 'Login successful' } };
  };

  const getOAuthUser = async () => {
    const res = await sessionApiService.oauthMe();
    return res.success ? ({ id: res.data!.id, email: res.data!.email, provider: 'oauth' } as OAuthUser) : null;
  };

  const logoutOAuth = async () => {
    setError(null);
    try {
      await sessionApiService.oauthLogout();
    } catch (error) {
      console.error('OAuth logout error:', error);
    } finally {
      sessionAuthService.clearAuthData();
      setUser(null);
      setUserRole(null);
    }
  };

  const checkOAuthSuccess = () => {
    const p = new URLSearchParams(window.location.search);
    return p.get('oauth_success') === 'true';
  };

  const getOAuthCallbackParams = () => {
    const p = new URLSearchParams(window.location.search);
    return { code: p.get('code') || undefined, state: p.get('state') || undefined, error: p.get('error') || undefined };
  };

  // Ensure user profile exists after login
  const ensureProfileExists = async (userData: UserProfile) => {
    try {
      // Try to get the profile first using session API service
      const response = await sessionApiService.getProfile();

      if (!response.success && response.error?.includes('404')) {
        // Profile doesn't exist, create it using the session API service
        console.log('Profile not found, creating new profile...');
        // For now, we'll skip profile creation as it's not implemented
        console.log('Profile creation not yet implemented for session-based auth');
      } else if (!response.success) {
        console.error('Error checking profile:', response.error);
        throw new Error('Failed to check user profile');
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      // Don't throw here, as this is not critical for login
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    userRole,
    roleLoading,
    isAuthenticated: sessionAuthService.isAuthenticated(),
    error,
    signIn,
    signUp,
    requestVerification,
    checkEmailVerification,
    signOut,
    refreshToken,
    refreshUserRole,
    forgotPassword,
    resetPassword,
    verifyEmail,
    verifyEmailWithUserId,
    getCurrentUser,
    clearError,
    handleAuthError,
    // OAuth methods
    startOAuth,
    handleOAuthCallback,
    getOAuthUser,
    logoutOAuth,
    checkOAuthSuccess,
    getOAuthCallbackParams,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};