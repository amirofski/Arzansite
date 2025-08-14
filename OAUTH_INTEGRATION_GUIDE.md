# OAuth Integration Guide

This guide explains how to use the OAuth authentication system that has been integrated into your Arzan Site frontend.

## Overview

The OAuth integration provides a seamless way for users to authenticate using third-party providers like GitHub, Google, and Facebook. The system is built on top of your existing Appwrite authentication service and integrates with your backend API.

## Features

- **Multiple OAuth Providers**: Support for GitHub, Google, and Facebook
- **Seamless Integration**: Works alongside your existing email/password authentication
- **Automatic Redirects**: Handles OAuth callbacks and redirects users appropriately
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Session Management**: Proper session handling and logout functionality

## Components

### 1. OAuthButton Component

A reusable button component for OAuth login:

```tsx
import OAuthButton from '@/components/ui/OAuthButton';

// Basic usage
<OAuthButton provider="github" />

// With custom handlers
<OAuthButton 
  provider="github"
  onSuccess={() => console.log('OAuth started')}
  onError={(error) => console.error('OAuth error:', error)}
>
  Custom Button Text
</OAuthButton>
```

**Props:**
- `provider`: OAuth provider ('github', 'google', 'facebook')
- `className`: Optional CSS classes
- `children`: Optional custom button text
- `onSuccess`: Callback when OAuth flow starts successfully
- `onError`: Callback when OAuth flow fails

### 2. OAuthCallback Component

Handles OAuth callback processing:

```tsx
import OAuthCallback from '@/components/OAuthCallback';

// Used in routing
<Route path="/auth/oauth/callback" element={<OAuthCallback provider="github" />} />
```

This component automatically:
- Extracts OAuth parameters from URL
- Processes the callback with your backend
- Shows loading/success/error states
- Redirects users to appropriate pages

## Authentication Hook Integration

The `useAuth` hook has been extended with OAuth methods:

```tsx
import { useAuth } from '@/hooks/useAuth';

const { 
  startOAuth, 
  handleOAuthCallback, 
  getOAuthUser, 
  logoutOAuth,
  checkOAuthSuccess,
  getOAuthCallbackParams 
} = useAuth();

// Start OAuth flow
const response = await startOAuth('github');
window.location.href = response.redirectUrl;

// Handle callback
const result = await handleOAuthCallback('github', code, state);

// Check OAuth success
const isSuccess = checkOAuthSuccess();

// Get callback parameters
const params = getOAuthCallbackParams();
```

## Utility Functions

The `oauthUtils.ts` file provides additional helper functions:

```tsx
import { 
  startOAuth,
  checkOAuthSuccess,
  getCurrentUser,
  logout,
  startOAuthWithService,
  handleOAuthCallbackWithService
} from '@/lib/oauthUtils';

// Direct API calls (legacy style)
await startOAuth('github');

// Service-based calls (recommended)
await startOAuthWithService('github');
```

## Backend API Endpoints

The OAuth integration expects these backend endpoints:

### 1. Start OAuth Flow
```
POST /api/auth/oauth/{provider}/start
Content-Type: application/json

{
  "successUrl": "https://yourdomain.com/auth/oauth/callback",
  "failureUrl": "https://yourdomain.com/auth/login?error=oauth_failed"
}
```

**Response:**
```json
{
  "redirectUrl": "https://github.com/login/oauth/authorize?...",
  "state": "optional-state-parameter"
}
```

### 2. Handle OAuth Callback
```
POST /api/auth/oauth/{provider}/callback
Content-Type: application/json

{
  "code": "authorization-code-from-provider",
  "state": "optional-state-parameter"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "user",
      "first_name": "John",
      "last_name": "Doe"
    },
    "redirect": {
      "url": "/dashboard",
      "message": "Login successful!"
    }
  }
}
```

### 3. Get OAuth User Info
```
GET /api/auth/oauth/me
Authorization: Bearer {access-token}
```

### 4. Logout
```
POST /api/auth/logout
```

## Usage Examples

### 1. Adding OAuth to Login Page

The OAuth button has already been added to your Auth page:

```tsx
// In src/pages/Auth.tsx
<OAuthButton 
  provider="github"
  onSuccess={() => {
    toast({
      title: "OAuth شروع شد",
      description: "در حال انتقال به GitHub...",
    });
  }}
  onError={(error) => {
    toast({
      title: "خطا در OAuth",
      description: error,
      variant: "destructive",
    });
  }}
/>
```

### 2. Custom OAuth Implementation

```tsx
import { useAuth } from '@/hooks/useAuth';

const MyOAuthComponent = () => {
  const { startOAuth } = useAuth();

  const handleGitHubLogin = async () => {
    try {
      const response = await startOAuth('github');
      // User will be redirected to GitHub
    } catch (error) {
      console.error('OAuth failed:', error);
    }
  };

  return (
    <button onClick={handleGitHubLogin}>
      Login with GitHub
    </button>
  );
};
```

### 3. Checking OAuth Success

```tsx
import { useAuth } from '@/hooks/useAuth';

const MyComponent = () => {
  const { checkOAuthSuccess } = useAuth();

  useEffect(() => {
    if (checkOAuthSuccess()) {
      console.log('OAuth login was successful!');
      // Handle success
    }
  }, []);
};
```

## Error Handling

The OAuth system includes comprehensive error handling:

1. **Network Errors**: Connection issues with OAuth providers
2. **Authorization Errors**: User denies access or invalid credentials
3. **Callback Errors**: Missing or invalid authorization codes
4. **Session Errors**: Invalid or expired sessions

All errors are caught and displayed to users with appropriate messages.

## Security Considerations

1. **State Parameter**: The system supports state parameters for CSRF protection
2. **HTTPS Only**: OAuth should only be used over HTTPS in production
3. **Token Storage**: Access tokens are stored securely in localStorage
4. **Session Management**: Proper session cleanup on logout

## Testing

### Development Testing

1. Set up OAuth applications in your OAuth providers (GitHub, Google, etc.)
2. Configure callback URLs to point to your development server
3. Test the complete OAuth flow from start to finish

### Production Deployment

1. Update OAuth application settings with production callback URLs
2. Ensure HTTPS is enabled
3. Test OAuth flow in production environment

## Troubleshooting

### Common Issues

1. **"No authorization code received"**: Check callback URL configuration
2. **"OAuth callback failed"**: Verify backend endpoint implementation
3. **"Failed to start OAuth flow"**: Check OAuth provider configuration

### Debug Mode

Enable debug logging by checking browser console for detailed error messages.

## Future Enhancements

- Add support for more OAuth providers (Twitter, LinkedIn, etc.)
- Implement OAuth account linking
- Add OAuth profile picture support
- Implement OAuth refresh token rotation

## Support

For issues or questions about the OAuth integration, refer to:
- Backend API documentation
- OAuth provider documentation
- Browser console for error messages
