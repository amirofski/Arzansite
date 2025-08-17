import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { appwriteAuthService, UserProfile, AuthResponse, SignupResponse, OAuthResponse, OAuthUser } from '@/lib/appwriteAuth';
import { tokenManager } from '@/lib/tokenManager';

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
      const me: UserProfile | null = await appwriteAuthService.getCurrentUser();
      console.log('useAuth: loadUser - result:', me ? 'User found' : 'No user');
      
      if (me) {
        setUser(me);
        setUserRole({ role: me.role });
        setError(null);
      } else {
        setUser(null);
        setUserRole(null);
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
        console.log('useAuth: checkAuth - calling isAuthenticated...');
        const isAuth = await appwriteAuthService.isAuthenticated();
        console.log('useAuth: checkAuth - result:', isAuth);
        
        if (!isMounted) return; // Check if component is still mounted
        
        if (isAuth) {
          console.log('useAuth: checkAuth - user authenticated, loading user...');
          await loadUser();
        } else {
          console.log('useAuth: checkAuth - user not authenticated, clearing state...');
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
      console.log('useAuth: Calling appwriteAuthService.signIn...');
      const response = await appwriteAuthService.signIn(email, password);
      console.log('useAuth: Response from appwriteAuthService:', response);
      
      // Validate response structure
      if (!response) {
        throw new Error('No response received from authentication service');
      }
      
      console.log('useAuth: Access token check:', !!response.access_token);
      console.log('useAuth: User check:', !!response.user);
      console.log('useAuth: User ID check:', !!response.user?.id);
      
      if (!response.access_token) {
        throw new Error('No access token received from authentication service');
      }
      
      if (!response.user) {
        throw new Error('No user information received from authentication service');
      }
      
      if (!response.user.id) {
        throw new Error('Invalid user information received from authentication service');
      }
      
      tokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      });
      
      // Set user immediately to avoid race conditions
      setUser(response.user);
      setUserRole({ role: response.user.role });
      
      // Ensure profile exists by calling the profile endpoint
      // This will also update the user data if needed
      await ensureProfileExists(response.user);
      
      // No need to call loadUser() again since we already have the user data
      // and ensureProfileExists handles profile creation/verification
      
      return { 
        user: response.user,
        redirect: response.redirect
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
      const response = await appwriteAuthService.signUp(email, password, metadata);
      return {
        requiresFrontendVerification: response.requiresFrontendVerification
      };
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
      const result = await appwriteAuthService.checkEmailVerification(email);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check email verification status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await appwriteAuthService.signOut();
      setUser(null);
      setUserRole(null);
      // Clear any stored tokens
      tokenManager.clearTokens();
    } catch (err) {
      console.error('Sign out error:', err);
      // Even if sign out fails, clear local state
      setUser(null);
      setUserRole(null);
      tokenManager.clearTokens();
    }
  };

  const refreshToken = async () => {
    try {
      setError(null);
      await appwriteAuthService.refreshUserToken();
      // Reload user data after token refresh
      await loadUser();
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
      
      // Clear user data and tokens
      setUser(null);
      setUserRole(null);
      tokenManager.clearTokens();
      
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
      await appwriteAuthService.forgotPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    try {
      // For Appwrite, we need userId and secret from the reset link
      // This will need to be updated based on how the reset link is structured
      throw new Error('Password reset not yet implemented for Appwrite');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyEmail = async (token: string) => {
    setError(null);
    try {
      // For Appwrite, we need userId and secret from the verification link
      // This will need to be updated based on how the verification link is structured
      throw new Error('Email verification not yet implemented for Appwrite');
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
      const result = await appwriteAuthService.verifyEmail(token, userId);
      return result;
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
    try {
      const response = await appwriteAuthService.startOAuth(provider);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start OAuth flow';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleOAuthCallback = async (provider: string, code: string, state?: string) => {
    setError(null);
    try {
      const response = await appwriteAuthService.handleOAuthCallback(provider, code, state);
      
      if (!response.access_token) {
        throw new Error('No access token received from OAuth callback');
      }
      
      if (!response.user) {
        throw new Error('No user information received from OAuth callback');
      }
      
      tokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      });
      
      // Set user immediately
      setUser(response.user);
      setUserRole({ role: response.user.role });
      
      // Ensure profile exists
      await ensureProfileExists(response.user);
      
      // Load user data
      await loadUser();
      
      return { 
        user: response.user,
        redirect: response.redirect
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth callback failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getOAuthUser = async () => {
    try {
      return await appwriteAuthService.getOAuthUser();
    } catch (err) {
      console.error('Get OAuth user error:', err);
      return null;
    }
  };

  const logoutOAuth = async () => {
    setError(null);
    try {
      await appwriteAuthService.logoutOAuth();
    } catch (error) {
      console.error('OAuth logout error:', error);
    } finally {
      tokenManager.clearTokens();
      setUser(null);
      setUserRole(null);
    }
  };

  const checkOAuthSuccess = () => {
    return appwriteAuthService.checkOAuthSuccess();
  };

  const getOAuthCallbackParams = () => {
    return appwriteAuthService.getOAuthCallbackParams();
  };

  // Ensure user profile exists after login
  const ensureProfileExists = async (userData: UserProfile) => {
    try {
      // Try to get the profile first
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api'}/profiles/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // Profile doesn't exist, create it using the service method
        console.log('Profile not found, creating new profile...');
        await appwriteAuthService.createUserProfile(userData);
        console.log('Profile created successfully');
      } else if (!response.ok) {
        console.error('Error checking profile:', response.statusText);
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
    isAuthenticated: !!user,
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