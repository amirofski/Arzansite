# Login Redirect Implementation

## Overview
This document describes the implementation of automatic user redirection to the dashboard after successful login in the Arzan Site application.

## Implementation Details

### 1. Backend Response Structure
The backend authentication system returns a response with the following structure:
```typescript
interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: BackendUserProfile;
  redirect?: {
    url: string;
    message: string;
  };
}
```

### 2. Frontend Authentication Flow
The main authentication is handled by the unified `Auth.tsx` page, which includes:

#### Login Process
- User submits login credentials
- Backend validates credentials and returns tokens + user data
- Frontend stores tokens securely using `tokenManager`
- User profile is loaded
- Success message is displayed
- Automatic redirect to dashboard occurs after 1.5 seconds

#### Redirect Logic
```typescript
const authLogin = async () => {
  try {
    const response = await signIn(email, password);
    
    // Check if user's email is verified
    if (response?.user && !response.user.email_confirmed_at) {
      // Show verification prompt
      setPendingVerificationEmail(email);
      setShowVerificationPrompt(true);
    } else {
      // Handle automatic redirect if provided by backend
      if (response?.redirect) {
        toast({ 
          title: "ورود موفقیت‌آمیز", 
          description: response.redirect.message || "به حساب کاربری خود خوش آمدید" 
        });
        
        // Automatic redirect to dashboard
        setTimeout(() => {
          navigate(response.redirect.url);
        }, 1500); // Small delay to show the success message
      } else {
        toast({ title: "ورود موفقیت‌آمیز", description: "به حساب کاربری خود خوش آمدید" });
      }
    }
  } catch (err: any) {
    // Error handling
  }
};
```

### 3. Route Protection
The dashboard route is protected using the `ProtectedRoute` component:
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 4. Authentication State Management
- Uses `useAuth` hook for centralized authentication state
- Automatically redirects authenticated users to appropriate dashboard based on role
- Handles token refresh and session management

### 5. User Experience Features
- Success toast notification with Persian text
- 1.5-second delay before redirect to show success message
- Automatic role-based routing (admin → /admin, user → /dashboard)
- Email verification status checking
- Graceful error handling with user-friendly messages

## Files Modified/Created

### Updated Files
- `src/pages/Auth.tsx` - Main authentication page with redirect logic
- `src/hooks/useAuth.tsx` - Authentication context and hooks
- `src/lib/api-client.ts` - API client for backend communication

### Removed Files (Unused)
- `src/pages/auth/Login.tsx` - Replaced by unified Auth.tsx
- `src/pages/auth/Signup.tsx` - Replaced by unified Auth.tsx

### Existing Files (No Changes Needed)
- `src/components/ProtectedRoute.tsx` - Route protection
- `src/App.tsx` - Routing configuration
- `src/pages/auth/VerifyEmail.tsx` - Email verification

## How It Works

1. **User Login**: User enters credentials on the Auth page
2. **Backend Validation**: Credentials are sent to NestJS backend
3. **Response Processing**: Backend returns tokens, user data, and redirect info
4. **Token Storage**: Tokens are securely stored using tokenManager
5. **User Loading**: User profile and role are loaded
6. **Success Display**: Success message is shown via toast notification
7. **Automatic Redirect**: After 1.5 seconds, user is redirected to dashboard
8. **Route Protection**: Dashboard is protected and only accessible to authenticated users

## Security Features

- JWT token-based authentication
- Secure token storage
- Route protection for authenticated routes
- Automatic token refresh
- Session management
- Role-based access control

## Testing

To test the login redirect functionality:

1. Navigate to `/auth` page
2. Enter valid credentials
3. Verify success message appears
4. Confirm automatic redirect to dashboard after 1.5 seconds
5. Verify dashboard is accessible and user data is loaded

## Future Enhancements

- Add loading states during redirect
- Implement remember me functionality
- Add multi-factor authentication support
- Enhance error handling for network issues
- Add login attempt rate limiting

