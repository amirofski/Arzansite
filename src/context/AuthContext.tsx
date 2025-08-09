import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/api';
import { getTokens as loadTokens, setTokens as saveTokens, clearTokens as clearStoredTokens } from '@/lib/auth';

type User = { id: string; email: string; role?: string };
type Tokens = { access_token: string; refresh_token: string };

type Ctx = {
  user: User | null;
  isAuthenticated: boolean;
  tokens: Tokens | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(loadTokens());
  const isAuthenticated = !!tokens?.access_token;

  const bootstrap = useCallback(async () => {
    if (!tokens?.access_token) {
      setUser(null);
      return;
    }
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, [tokens?.access_token]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const t: Tokens = { access_token: res.access_token, refresh_token: res.refresh_token };
    saveTokens(t);
    setTokens(t);
    const u = await authApi.me();
    setUser(u);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokens?.refresh_token) throw new Error('No refresh token');
    const res = await authApi.refresh({ refresh_token: tokens.refresh_token });
    const t: Tokens = { access_token: res.access_token, refresh_token: res.refresh_token };
    saveTokens(t);
    setTokens(t);
  }, [tokens?.refresh_token]);

  const logout = useCallback(() => {
    clearStoredTokens();
    setTokens(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated, tokens, login, logout, refresh }),
    [user, isAuthenticated, tokens, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


