# Authentication System Documentation

## Overview

This document describes the complete authentication system implemented for the Arzan Site application. The system provides secure user registration, login, email verification, password reset, and role-based access control.

## Features

### 🔐 User Registration & Login
- **Secure Registration**: Email and password validation with secure hashing
- **Login System**: Email/password authentication with error handling
- **Session Management**: Automatic session handling with Supabase Auth
- **Input Validation**: Client-side and server-side validation

### 📧 Email Verification & Confirmation
- **Automatic Email Sending**: Verification emails sent upon registration
- **Verification Page**: `/verify-email` handles verification links
- **Resend Functionality**: Users can request new verification emails
- **Status Tracking**: Email verification status is tracked and managed

### 🔑 Forgot Password & Reset Flow
- **Password Reset Request**: `/forgot-password` page for requesting reset emails
- **Secure Reset Links**: Time-limited and securely verified reset links
- **Reset Page**: `/reset-password` handles password reset from email links
- **Password Validation**: Ensures strong passwords with confirmation

### 👥 User Role Management
- **Role Detection**: Automatic detection of admin vs regular users
- **Role-Based Redirects**: 
  - Admin users → `/admin` (Admin Dashboard)
  - Regular users → `/dashboard` (User Dashboard)
- **Protected Routes**: Role-based access control for different pages

## Pages & Routes

### Authentication Pages
- **`/auth`** - Main authentication page (login/register toggle)
- **`/forgot-password`** - Password reset request page
- **`/reset-password`** - Password reset form (accessed via email link)
- **`/verify-email`** - Email verification confirmation page

### Dashboard Pages
- **`/dashboard`** - User dashboard (protected, requires authentication)
- **`/admin`** - Admin dashboard (protected, requires admin role)

## Database Schema

### Tables
1. **`auth.users`** - Supabase Auth users table
2. **`public.profiles`** - User profile information
3. **`public.user_roles`** - User role assignments
4. **`public.orders`** - User orders

### Key Functions
- **`public.handle_new_user()`** - Creates profile and assigns default role on signup
- **`public.has_role()`** - Checks if user has specific role
- **`public.get_current_user_role()`** - Gets current user's role
- **`public.is_email_verified()`** - Checks email verification status

## Security Features

### Password Security
- Passwords are hashed using Supabase Auth (bcrypt)
- Minimum 6 character requirement
- Password confirmation validation
- Secure password reset flow

### Email Security
- Email verification required for account activation
- Secure token-based verification links
- Time-limited reset links
- Email validation and sanitization

### Role-Based Access Control
- Row Level Security (RLS) policies
- Role-based route protection
- Admin-only functionality protection
- Secure role management

## API Endpoints

### Authentication Endpoints (Supabase Auth)
- `POST /auth/v1/signup` - User registration
- `POST /auth/v1/signin` - User login
- `POST /auth/v1/signout` - User logout
- `POST /auth/v1/reset-password` - Password reset request
- `POST /auth/v1/verify-email` - Email verification

### Custom Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/role` - Get user role
- `PUT /api/user/role` - Update user role (admin only)

## Components

### Core Components
- **`Auth.tsx`** - Main authentication page
- **`ForgotPassword.tsx`** - Password reset request
- **`ResetPassword.tsx`** - Password reset form
- **`EmailVerification.tsx`** - Email verification
- **`Dashboard.tsx`** - User dashboard
- **`AdminDashboard.tsx`** - Admin dashboard
- **`ProtectedRoute.tsx`** - Route protection component

### Hooks
- **`useAuth.tsx`** - Authentication context and state management
- **`useToast.ts`** - Toast notifications

## User Flow

### Registration Flow
1. User visits `/auth` and clicks "ثبت‌نام"
2. User enters email and password
3. System validates input and creates account
4. Verification email is sent automatically
5. User receives email and clicks verification link
6. User is redirected to `/verify-email` for confirmation
7. Upon successful verification, user is redirected to appropriate dashboard

### Login Flow
1. User visits `/auth` and enters credentials
2. System validates credentials
3. Upon successful login, user role is checked
4. User is redirected based on role:
   - Admin → `/admin`
   - Regular user → `/dashboard`

### Password Reset Flow
1. User visits `/forgot-password`
2. User enters email address
3. System sends reset email with secure link
4. User clicks link in email
5. User is redirected to `/reset-password`
6. User enters new password and confirmation
7. Password is updated and user is redirected to login

## Configuration

### Supabase Configuration
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Email Templates
Email templates are configured in Supabase Dashboard:
- **Confirmation Email**: Sent for email verification
- **Reset Password Email**: Sent for password reset
- **Magic Link Email**: Sent for passwordless login (if enabled)

## Error Handling

### Common Error Messages
- **Invalid Credentials**: "ایمیل یا رمز عبور اشتباه است"
- **Email Already Registered**: "این ایمیل قبلاً ثبت‌نام شده است"
- **Password Mismatch**: "رمز عبور و تکرار آن یکسان نیستند"
- **Invalid Reset Link**: "لینک بازنشانی رمز عبور نامعتبر است"

### Error States
- Loading states for all async operations
- Form validation errors
- Network error handling
- Graceful fallbacks for failed operations

## Testing

### Manual Testing Checklist
- [ ] User registration with valid email
- [ ] User registration with invalid email
- [ ] User registration with weak password
- [ ] Email verification flow
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Password reset request
- [ ] Password reset completion
- [ ] Role-based redirects
- [ ] Protected route access
- [ ] Admin functionality access

### Automated Testing
```bash
# Run authentication tests
npm run test:auth

# Run integration tests
npm run test:integration
```

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Email templates set up in Supabase
- [ ] Domain verification completed
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] Email service configured
- [ ] Monitoring and logging enabled

### Security Checklist
- [ ] RLS policies enabled
- [ ] Email verification required
- [ ] Password requirements enforced
- [ ] Rate limiting configured
- [ ] CORS settings configured
- [ ] Security headers set

## Troubleshooting

### Common Issues

#### Email Not Received
1. Check spam folder
2. Verify email address is correct
3. Check Supabase email configuration
4. Verify domain settings

#### Login Issues
1. Check email verification status
2. Verify password is correct
3. Check account status
4. Clear browser cache

#### Role Issues
1. Check user_roles table
2. Verify role assignment
3. Check RLS policies
4. Refresh authentication state

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG_AUTH=true
```

## Future Enhancements

### Planned Features
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub)
- [ ] Passwordless login with magic links
- [ ] Account deletion
- [ ] Session management
- [ ] Audit logging
- [ ] Advanced role permissions

### Security Improvements
- [ ] Rate limiting for auth endpoints
- [ ] IP-based blocking
- [ ] Advanced password policies
- [ ] Security question backup
- [ ] Account lockout protection

## Support

For issues related to the authentication system:
1. Check this documentation
2. Review error logs
3. Test with different browsers
4. Contact development team

## License

This authentication system is part of the Arzan Site project and follows the same licensing terms. 