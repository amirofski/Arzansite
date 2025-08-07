// Rate limiting hook for authentication security
// Prevents brute force attacks and account enumeration

import { useState, useEffect, useCallback } from 'react';

export interface RateLimitConfig {
  maxAttempts: number;
  lockoutMinutes: number;
  resetAfterMinutes: number;
}

export interface RateLimitState {
  attempts: number;
  lockoutUntil: Date | null;
  lastAttempt: Date | null;
}

export const useRateLimit = (config: RateLimitConfig = {
  maxAttempts: 5,
  lockoutMinutes: 15,
  resetAfterMinutes: 60
}) => {
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    lockoutUntil: null,
    lastAttempt: null
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('rateLimitState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Convert string dates back to Date objects
        parsed.lockoutUntil = parsed.lockoutUntil ? new Date(parsed.lockoutUntil) : null;
        parsed.lastAttempt = parsed.lastAttempt ? new Date(parsed.lastAttempt) : null;
        setState(parsed);
      } catch (error) {
        console.error('Failed to parse rate limit state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('rateLimitState', JSON.stringify(state));
  }, [state]);

  // Check if account is currently locked out
  const isLockedOut = useCallback(() => {
    if (!state.lockoutUntil) return false;
    return new Date() < state.lockoutUntil;
  }, [state.lockoutUntil]);

  // Get remaining lockout time in minutes
  const getRemainingLockoutTime = useCallback(() => {
    if (!state.lockoutUntil) return 0;
    const remaining = state.lockoutUntil.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(remaining / (1000 * 60)));
  }, [state.lockoutUntil]);

  // Record a failed attempt
  const recordFailedAttempt = useCallback(() => {
    const now = new Date();
    const newAttempts = state.attempts + 1;
    
    let newLockoutUntil = state.lockoutUntil;
    
    // If max attempts reached, set lockout
    if (newAttempts >= config.maxAttempts) {
      newLockoutUntil = new Date(now.getTime() + config.lockoutMinutes * 60 * 1000);
    }
    
    setState({
      attempts: newAttempts,
      lockoutUntil: newLockoutUntil,
      lastAttempt: now
    });
  }, [state, config.maxAttempts, config.lockoutMinutes]);

  // Record a successful attempt (reset counter)
  const recordSuccessfulAttempt = useCallback(() => {
    setState({
      attempts: 0,
      lockoutUntil: null,
      lastAttempt: new Date()
    });
  }, []);

  // Reset rate limit state
  const reset = useCallback(() => {
    setState({
      attempts: 0,
      lockoutUntil: null,
      lastAttempt: null
    });
  }, []);

  // Auto-reset after specified time
  useEffect(() => {
    if (!state.lastAttempt) return;

    const timeSinceLastAttempt = new Date().getTime() - state.lastAttempt.getTime();
    const resetTime = config.resetAfterMinutes * 60 * 1000;

    if (timeSinceLastAttempt > resetTime) {
      reset();
    }
  }, [state.lastAttempt, config.resetAfterMinutes, reset]);

  return {
    isLockedOut,
    getRemainingLockoutTime,
    recordFailedAttempt,
    recordSuccessfulAttempt,
    reset,
    attempts: state.attempts,
    maxAttempts: config.maxAttempts,
    remainingAttempts: Math.max(0, config.maxAttempts - state.attempts)
  };
};

// Email-specific rate limiting
export const useEmailRateLimit = () => {
  return useRateLimit({
    maxAttempts: 3,
    lockoutMinutes: 30,
    resetAfterMinutes: 120
  });
};

// Login-specific rate limiting
export const useLoginRateLimit = () => {
  return useRateLimit({
    maxAttempts: 5,
    lockoutMinutes: 15,
    resetAfterMinutes: 60
  });
}; 