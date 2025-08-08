import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiClient, BackendUserProfile } from '@/lib/api-client';

type UserRole = 'user' | 'admin';

interface AuthContextType {
  user: BackendUserProfile | null;
  loading: boolean;
  userRole: { role: UserRole } | null;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<BackendUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<{ role: UserRole } | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    try {
      const me: BackendUserProfile = await apiClient.getProfile();
      setUser(me);
      setUserRole({ role: me.role });
    } catch (err) {
      setUser(null);
      setUserRole(null);
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

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.signIn(email, password);
    if (response?.access_token) {
      apiClient.setToken(response.access_token);
      if (response?.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      await loadUser();
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const response = await apiClient.signUp(email, password, metadata);
    
    // The backend now handles sending verification email with proper token
    // If verificationToken is returned, the email is sent automatically
    
    return response;
  };

  const signOut = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearToken();
      setUser(null);
      setUserRole(null);
    }
  };

  const refreshToken = async () => {
    const stored = localStorage.getItem('refresh_token');
    if (!stored) return;
    try {
      const response = await apiClient.refreshToken(stored);
      if (response?.access_token) {
        apiClient.setToken(response.access_token);
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

  const value: AuthContextType = {
    user,
    loading,
    userRole,
    roleLoading,
    signIn,
    signUp,
    signOut,
    refreshToken,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};