import type { Tokens } from './api';

const STORAGE_KEY = 'tokens';

export function getTokens(): Tokens | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setTokens(tokens: Tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}


