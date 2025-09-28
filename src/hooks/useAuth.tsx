import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { authService, type UserProfile } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';
import { account } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';

type OAuthResponse = void;
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
    requiresFrontendVerification?: boolean; verificationEmailSent?: boolean; message?: string;
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
  startOAuth: (provider: string, nextPath?: string) => Promise<void>;
  handleOAuthCallback: (provider: string, code: string, state?: string) => Promise<{ user: UserProfile; redirect?: { url: string; message: string } }>;
  getOAuthUser: () => Promise<OAuthUser | null>;
  logoutOAuth: () => Promise<void>;
  checkOAuthSuccess: () => boolean;
  getOAuthCallbackParams: () => { code?: string; state?: string; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(raw?: unknown): UserRole {
  const v = String(raw || '').toLowerCase();
  if (v.includes('admin')) return 'admin';
  return 'user';
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = useMemo(() => user ? { role: normalizeRole(user.role) } : null, [user]);
  const isAuthenticated = useMemo(() => {
    // Consider authenticated if we have a user (cookie-based OAuth) or an access token
    return !!user || !!tokenManager.getAccessToken();
  }, [user]);

  const clearError = () => setError(null);

  const loadUser = async () => {
    setLoading(true);
    try {
      const hasToken = tokenManager.getAccessToken();
      if (!hasToken) {
        // Do not forcibly log out if we already have a user (e.g., just logged in via payload)
        // Simply skip server check; a later action can refresh the profile.
        return;
      }
      const me = await authService.getMe();
      setUser(me || null);
    } catch (e) {
      // Only clear user if the server explicitly rejects the session
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    setError(null);
    // Optional pre-check; do not block if endpoint fails
    try {
      const verify = await authService.checkEmailVerification(email);
      if (verify && verify.emailVerified === false) {
        throw new Error('برای ورود ابتدا باید ایمیل خود را تأیید کنید. لطفاً ایمیل خود را بررسی کنید یا لینک تأیید را دوباره ارسال کنید.');
      }
    } catch {
      // proceed to login
    }

    const res = await authService.signIn({ email, password });
    if (!res.success) throw new Error(res.message || 'Login failed');

    // Prefer user from login payload for immediate return
    const u = (res as AuthResponse).data?.user || {};
    const normalizedUser: UserProfile = {
      id: String(u.id || ''),
      email: String(u.email || ''),
      role: (String(u.role || 'user') as UserRole),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Trust login payload; avoid immediate /auth/me call to prevent race with initial loadUser
    setUser(normalizedUser);
    return { user: normalizedUser, redirect: (res as AuthResponse).data?.redirect };
  };

  const signUp: AuthContextType['signUp'] = async (email, password) => {
    setError(null);
    // Backend expects only email and password; do not send phone/metadata
    const res = await authService.signUp({ email, password });
    return {
      requiresFrontendVerification: res.requiresFrontendVerification,
      verificationEmailSent: res.verificationEmailSent,
      message: res.message,
    };
  };

  const requestVerification = async (email: string, password: string) => {
    await authService.requestVerification(email, password);
  };

  const checkEmailVerification: AuthContextType['checkEmailVerification'] = async (email) => {
    return authService.checkEmailVerification(email);
  };

  const signOut = async () => {
    try { await authService.signOut(); } finally {
      tokenManager.clearTokens();
      setUser(null);
    }
  };

  const refreshToken = async () => {
    const rt = tokenManager.getRefreshToken();
    if (!rt) throw new Error('No refresh token');
    const r = await authService.refreshAccessToken(rt);
    if (!r.success) throw new Error('Token refresh failed');
    // Refresh user info
    try {
      const me = await authService.getMe();
      setUser(me || null);
    } catch {
      setUser(null);
    }
  };

  const refreshUserRole = async () => {
    setRoleLoading(true);
    try { await loadUser(); } finally { setRoleLoading(false); }
  };

  const forgotPassword = async (email: string) => {
    await authService.sendPasswordReset({ email });
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await authService.resetPassword({ token, newPassword });
  };

  const verifyEmail = async (token: string) => {
    await authService.verifyEmail({ token });
  };

  const verifyEmailWithUserId = async (token: string, userId: string) => {
    await authService.verifyEmail({ token, userId });
    return { message: 'Email verified successfully' };
  };

  const getCurrentUser = async () => { await loadUser(); };

  const handleAuthError = (e: Error) => {
    if (/Unauthorized|Authentication failed|log in again/i.test(e.message)) {
      tokenManager.clearTokens();
      setUser(null);
      setError('Your session has expired. Please log in again.');
      return false;
    }
    setError(e.message);
    return true;
  };

  const startOAuth = async (provider: string, nextPath?: string) => {
    // Determine and persist intended redirect after login
    const urlParams = new URLSearchParams(window.location.search);
    const next = typeof nextPath === 'string'
      ? nextPath
      : (urlParams.get('next') || '/dashboard');
    try { sessionStorage.setItem('postLoginRedirect', next); } catch (e) {
      console.warn('Failed to set postLoginRedirect in sessionStorage', e);
    }

    // Build ABSOLUTE URLs and carry `next` forward to the callback
    const baseSuccess = `${window.location.origin}/auth/oauth/callback`;
    const baseFailure = `${window.location.origin}/auth?oauth=failed`;
    const successUrl = `${baseSuccess}?next=${encodeURIComponent(next)}`;
    const failureUrl = `${baseFailure}&next=${encodeURIComponent(next)}`;

    account.createOAuth2Session(provider as OAuthProvider, successUrl, failureUrl);
  };

  const handleOAuthCallback = async () => {
    // OAuth now uses backend session (httpOnly cookies). Just fetch the user and proceed.
    await loadUser();
    const current = await authService.getMe();
    if (!current) throw new Error('OAuth login failed');
    return { user: current, redirect: { url: '/dashboard', message: 'Login successful' } };
  };

  const getOAuthUser = async () => {
    // This function is deprecated with the new flow
    return null;
  };

  const logoutOAuth = async () => {
    // This function is deprecated with the new flow
  };

  const checkOAuthSuccess = () => new URLSearchParams(window.location.search).get('oauth_success') === 'true';
  const getOAuthCallbackParams = () => {
    const p = new URLSearchParams(window.location.search);
    return { code: p.get('code') || undefined, state: p.get('state') || undefined, error: p.get('error') || undefined };
  };

  const value: AuthContextType = {
    user,
    loading,
    userRole,
    roleLoading,
    isAuthenticated,
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

