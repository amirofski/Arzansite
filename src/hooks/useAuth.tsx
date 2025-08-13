import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiClient, BackendUserProfile } from '@/lib/api-client';
import { tokenManager } from '@/lib/tokenManager';

type UserRole = 'user' | 'admin';

interface AuthContextType {
  user: BackendUserProfile | null;
  loading: boolean;
  userRole: { role: UserRole } | null;
  roleLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ user: BackendUserProfile } | void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ requiresFrontendVerification?: boolean }>;
  requestVerification: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<BackendUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<{ role: UserRole } | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const loadUser = async () => {
    setLoading(true);
    try {
      const me: BackendUserProfile = await apiClient.getProfile();
      setUser(me);
      setUserRole({ role: me.role });
      setError(null);
    } catch (err) {
      setUser(null);
      setUserRole(null);
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const existingToken = apiClient.getToken();
    if (existingToken) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Ensure the access token is refreshed automatically while the application is
   * running. This prevents unexpected log-outs when the short-lived JWT
   * expires.
   */
  useEffect(() => {
    tokenManager.setupAutoRefresh(async () => {
      const stored = localStorage.getItem('refresh_token');
      if (!stored) {
        throw new Error('No refresh token');
      }

      const res = await apiClient.refreshToken(stored);
      return {
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      };
    });

    // Cleanup on unmount
    return () => tokenManager.stopAutoRefresh();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      // Use the new API client directly
      const response = await apiClient.signIn(email, password);
      
      if (response?.access_token) {
        // Persist tokens for apiClient
        tokenManager.setTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        });
        apiClient.setToken(response.access_token);
        if (response?.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
        await loadUser();
        return { user: response.user };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    setError(null);
    try {
      // Use the new API client directly
      const response = await apiClient.signUp(email, password, metadata);
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
      await apiClient.requestVerification(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request verification email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearToken();
      localStorage.removeItem('refresh_token');
      setUser(null);
      setUserRole(null);
    }
  };

  const refreshToken = async () => {
    const stored = localStorage.getItem('refresh_token');
    if (!stored) {
      await signOut();
      return;
    }
    
    try {
      const response = await apiClient.refreshToken(stored);
      if (response?.access_token) {
        apiClient.setToken(response.access_token);
        if (response?.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
      }
    } catch {
      await signOut();
    }
  };

  const refreshUserRole = async () => {
    if (!user) return;
    setRoleLoading(true);
    try {
      const me: BackendUserProfile = await apiClient.getProfile();
      const role = me.role;
      setUserRole({ role });
      setUser((prev) => (prev ? { ...prev, role } : prev));
    } catch {
      // ignore
    } finally {
      setRoleLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      await apiClient.forgotPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    try {
      await apiClient.resetPassword(token, newPassword);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyEmail = async (token: string) => {
    setError(null);
    try {
      await apiClient.verifyEmail(token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getCurrentUser = async () => {
    await loadUser();
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
    signOut,
    refreshToken,
    refreshUserRole,
    forgotPassword,
    resetPassword,
    verifyEmail,
    getCurrentUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};