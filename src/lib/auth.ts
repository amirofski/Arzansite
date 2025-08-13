import type { Tokens } from './api';
import { tokenManager } from './tokenManager';

const STORAGE_KEY = 'tokens';

export function getTokens(): Tokens | null {
  // Delegate to tokenManager for consistency
  const access = tokenManager.getAccessToken();
  const refresh = tokenManager.getRefreshToken();
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

export function setTokens(tokens: Tokens) {
  tokenManager.setTokens({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
}

export function clearTokens() {
  tokenManager.clearTokens();
}


