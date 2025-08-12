import axios, { AxiosError } from 'axios';

export type Tokens = { access_token: string; refresh_token: string };

const api = axios.create({
  // Should point to your Nest base, e.g. https://nest.arzansite.com/api
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  // Prefer sessionStorage token set by tokenManager; fallback to legacy localStorage structure
  let accessToken: string | null = null;
  try {
    accessToken = sessionStorage.getItem('access_token');
  } catch {
    accessToken = null;
  }

  if (!accessToken) {
    const raw = localStorage.getItem('tokens');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<Tokens>;
        accessToken = parsed?.access_token || null;
      } catch {
        // ignore malformed tokens
      }
    }
  }

  if (accessToken) {
    if (!config.headers) config.headers = {} as any;
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export const authApi = {
  // With baseURL including /api, endpoints should not repeat /api prefix
  signUp: (payload: { email: string; password: string; metadata?: Record<string, any> }) =>
    api.post('/auth/signup', payload).then((r) => r.data),
  login: (payload: { email: string; password: string }) =>
    api.post('/auth/login', payload).then((r) => r.data),
  loginWithJWT: (payload: { jwt: string; email: string }) =>
    api.post('/auth/login-with-jwt', payload).then((r) => r.data),
  verifyEmail: (payload: { token: string; email?: string }) =>
    api.post('/auth/verify-email', payload).then((r) => r.data),
  refresh: (payload: { refresh_token: string }) =>
    api.post('/auth/refresh', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export { api };


