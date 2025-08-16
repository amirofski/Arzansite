# Security Improvements - Token Storage

## Problem Fixed

The original implementation stored sensitive authentication tokens in `localStorage` and `sessionStorage`, which made them vulnerable to XSS (Cross-Site Scripting) attacks. Malicious scripts could access these tokens and use them to impersonate users.

## Security Improvements Implemented

### 1. Removed localStorage/sessionStorage Token Storage

**Before (Insecure):**
```typescript
// Tokens stored in localStorage - vulnerable to XSS
localStorage.setItem('access_token', tokens.access_token);
localStorage.setItem('refresh_token', tokens.refresh_token);
```

**After (Secure):**
```typescript
// Tokens stored in ephemeral memory only - cleared on page reload
this.ephemeralTokens.access_token = tokens.access_token;
this.ephemeralTokens.refresh_token = tokens.refresh_token;
```

### 2. Implemented Cookie-Based Authentication

**Secure API Client Pattern:**
```typescript
// Always include credentials for httpOnly cookie support
const config: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Always include cookies for httpOnly token storage
  ...options,
};
```

### 3. Ephemeral Memory Storage

- Tokens are stored only in memory (cleared on page reload)
- No persistent storage of sensitive tokens
- Automatic cleanup when browser tab is closed

### 4. Server-Side Token Management

The backend should set tokens as httpOnly cookies:

```typescript
// Server-side (NestJS example)
@Post('login')
async login(@Res({ passthrough: true }) response: Response) {
  const { access_token, refresh_token } = await this.authService.login(credentials);
  
  // Set httpOnly cookies
  response.cookie('access_token', access_token, {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  response.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  return { success: true, user: userData };
}
```

## Security Best Practices

### 1. Never Store Sensitive Tokens in localStorage

❌ **Insecure:**
```typescript
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', token);
```

✅ **Secure:**
```typescript
// Use httpOnly cookies set by server
// Or ephemeral memory for temporary storage
```

### 2. Use httpOnly Cookies for Token Storage

```typescript
// Server sets httpOnly cookies
response.cookie('access_token', token, {
  httpOnly: true,    // Not accessible via JavaScript
  secure: true,      // HTTPS only
  sameSite: 'strict' // CSRF protection
});
```

### 3. Include Credentials in API Requests

```typescript
// Always include credentials for cookie-based auth
fetch('/api/endpoint', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 4. Implement Proper Token Refresh

```typescript
// Server handles token refresh via httpOnly cookies
async refreshToken() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include' // Sends refresh token cookie
  });
  // Server sets new httpOnly cookies
}
```

### 5. Secure Logout

```typescript
// Server clears httpOnly cookies
async logout() {
  await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  // Server clears all auth cookies
}
```

## Payment Gateway Security

### 1. Never Store Merchant Keys Client-Side

❌ **Insecure:**
```typescript
// Never do this
const MERCHANT_KEY = 'your-secret-key';
localStorage.setItem('merchant_key', MERCHANT_KEY);
```

✅ **Secure:**
```typescript
// Server handles all payment gateway interactions
// Client only sends payment requests
await secureApiClient.requestWalletDeposit({
  amount: 1000000,
  description: 'Wallet topup'
});
```

### 2. Secure Payment Callbacks

```typescript
// Payment gateway callbacks handled server-side
POST /wallets/deposit/callback
POST /wallets/deposit/verify-with-gateway
POST /wallets/me/topup
```

## Migration Guide

### 1. Update Backend to Use httpOnly Cookies

```typescript
// Update your NestJS auth controller
@Post('login')
async login(@Res({ passthrough: true }) response: Response) {
  // ... authentication logic
  
  // Set httpOnly cookies instead of returning tokens
  response.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000
  });
  
  return { success: true, user: userData };
}
```

### 2. Update Frontend API Client

```typescript
// Use the new secure API client
import { secureApiClient } from './lib/secureApiClient';

// Login - no token storage needed
const auth = await secureApiClient.signIn(email, password);

// All requests automatically include cookies
const balance = await secureApiClient.getWalletBalance();
```

### 3. Remove localStorage Token References

```typescript
// Remove all localStorage.setItem/getItem calls for tokens
// Use the new tokenManager for ephemeral storage only
```

## Security Checklist

- [ ] Tokens not stored in localStorage/sessionStorage
- [ ] httpOnly cookies used for token storage
- [ ] Credentials included in all API requests
- [ ] No merchant keys stored client-side
- [ ] Secure logout clears all cookies
- [ ] CSRF protection enabled
- [ ] HTTPS enforced in production
- [ ] SameSite cookie attribute set to 'strict'

## Benefits

1. **XSS Protection**: Tokens not accessible to malicious scripts
2. **CSRF Protection**: httpOnly cookies with SameSite attribute
3. **Automatic Cleanup**: Tokens cleared when browser closes
4. **Simplified Client**: No manual token management needed
5. **Better Security**: Server controls token lifecycle

## Testing

Test the security improvements:

```typescript
// Verify tokens are not in localStorage
console.log('localStorage tokens:', localStorage.getItem('access_token')); // Should be null

// Verify cookies are set (httpOnly cookies not visible in JavaScript)
console.log('Cookies:', document.cookie); // Should not show auth tokens

// Test API requests work with cookie-based auth
const balance = await secureApiClient.getWalletBalance();
console.log('Wallet balance:', balance);
```
