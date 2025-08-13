# Authentication Flowcharts

This document contains comprehensive flowcharts for the authentication processes in the Arzan Site application.

## 1. Login Flowchart

```mermaid
flowchart TD
    A[Start] --> B[User navigates to /auth page]
    B --> C[User enters email and password]
    C --> D[User clicks Login button]
    D --> E[Frontend validates form inputs]
    E --> F{Form validation passed?}
    
    F -->|No| G[Show validation errors]
    G --> C
    
    F -->|Yes| H[Set loading state]
    H --> I[Send credentials to NestJS backend]
    I --> J{Backend validation successful?}
    
    J -->|No| K[Backend returns error]
    K --> L[Display error message in toast]
    L --> M[Reset loading state]
    M --> C
    
    J -->|Yes| N[Backend returns tokens + user data + redirect info]
    N --> O[Store tokens securely using tokenManager]
    O --> P[Set API client token]
    P --> Q[Load user profile and role]
    Q --> R{Email verified?}
    
    R -->|No| S[Show email verification prompt]
    S --> T[User must verify email first]
    T --> U[End - Stay on auth page]
    
    R -->|Yes| V[Check if redirect info provided]
    V --> W{Has redirect info?}
    
    W -->|Yes| X[Show success toast with redirect message]
    X --> Y[Wait 1.5 seconds]
    Y --> Z[Redirect to specified URL]
    
    W -->|No| AA[Show default success toast]
    AA --> BB[Wait 1.5 seconds]
    BB --> CC[Redirect to dashboard]
    
    Z --> DD[User arrives at dashboard]
    CC --> DD
    DD --> EE[ProtectedRoute validates authentication]
    EE --> FF{User authenticated?}
    
    FF -->|No| GG[Redirect to /auth]
    GG --> C
    
    FF -->|Yes| HH[Load dashboard content]
    HH --> II[End - User logged in successfully]
```

## 2. Signup Flowchart

```mermaid
flowchart TD
    A[Start] --> B[User navigates to /auth page]
    B --> C[User switches to Signup mode]
    C --> D[User enters email, password, confirm password, name]
    D --> E[User clicks Create Account button]
    E --> F[Frontend validates form inputs]
    F --> G{Form validation passed?}
    
    G -->|No| H[Show validation errors]
    H --> D
    
    G -->|Yes| I[Check password confirmation match]
    I --> J{Passwords match?}
    
    J -->|No| K[Show password mismatch error]
    K --> D
    
    J -->|Yes| L[Set loading state]
    L --> M[Send registration data to NestJS backend]
    M --> N{Backend validation successful?}
    
    N -->|No| O[Backend returns error]
    O --> P[Display error message in toast]
    P --> Q[Reset loading state]
    Q --> D
    
    N -->|Yes| R[Backend creates user account]
    R --> S{Verification email sent successfully?}
    
    S -->|Yes| T[Show success toast: Check email for verification]
    T --> U[Switch to Login mode]
    U --> V[User must verify email before login]
    V --> W[End - Stay on auth page]
    
    S -->|No| X[Show fallback message: Login to send verification]
    X --> U
    
    R --> Y[Backend returns user data]
    Y --> Z[Show success message]
    Z --> U
```

## 3. Reset Password Flowchart

```mermaid
flowchart TD
    A[Start] --> B[User navigates to /forgot-password page]
    B --> C[User enters email address]
    C --> D[User clicks Reset Password button]
    D --> E[Frontend validates email format]
    E --> F{Email format valid?}
    
    F -->|No| G[Show email format error]
    G --> C
    
    F -->|Yes| H[Set loading state]
    H --> I[Send reset request to NestJS backend]
    I --> J{Email registered in system?}
    
    J -->|No| K[Backend returns error]
    K --> L[Display error message]
    L --> M[Reset loading state]
    M --> C
    
    J -->|Yes| N[Backend generates reset token]
    N --> O[Backend sends reset email with token]
    O --> P{Email sent successfully?}
    
    P -->|No| Q[Show error: Failed to send email]
    Q --> R[Reset loading state]
    R --> C
    
    P -->|Yes| S[Show success message: Check email for reset link]
    S --> T[User checks email]
    T --> U[User clicks reset link in email]
    U --> V[User navigates to reset password page]
    V --> W[User enters new password and confirmation]
    W --> X[User clicks Update Password button]
    X --> Y[Frontend validates new password]
    Y --> Z{Password validation passed?}
    
    Z -->|No| AA[Show password validation errors]
    AA --> W
    
    Z -->|Yes| BB[Send new password + token to backend]
    BB --> CC{Password update successful?}
    
    CC -->|No| DD[Show error message]
    DD --> W
    
    CC -->|Yes| EE[Show success message: Password updated]
    EE --> FF[Wait 3 seconds]
    FF --> GG[Redirect to login page]
    GG --> HH[User can login with new password]
    HH --> II[End - Password reset complete]
```

## 4. Email Verification Flowchart

```mermaid
flowchart TD
    A[Start] --> B[User receives verification email]
    B --> C[User clicks verification link]
    C --> D[User navigates to /auth/verify-email]
    D --> E[Frontend extracts token from URL]
    E --> F{Token present in URL?}
    
    F -->|No| G[Show error: Missing verification token]
    G --> H[User must request new verification]
    H --> I[End - Verification failed]
    
    F -->|Yes| J[Send token to backend for verification]
    J --> K{Backend verification successful?}
    
    K -->|No| L[Show error: Verification failed]
    L --> M[User must request new verification]
    M --> I
    
    K -->|Yes| N[Backend marks email as verified]
    N --> O[Show success message: Email verified successfully]
    O --> P[User can now login normally]
    P --> Q[End - Email verification complete]
```

## 5. Authentication State Management Flowchart

```mermaid
flowchart TD
    A[App Initialization] --> B[Check for existing tokens]
    B --> C{Tokens found in storage?}
    
    C -->|No| D[Set loading to false]
    D --> E[Show public routes]
    E --> F[End - User not authenticated]
    
    C -->|Yes| G[Set loading to true]
    G --> H[Attempt to load user profile]
    H --> I{Profile load successful?}
    
    I -->|No| J[Clear invalid tokens]
    J --> K[Set loading to false]
    K --> E
    
    I -->|Yes| L[Set user state]
    L --> M[Load user role]
    M --> N{Role load successful?}
    
    N -->|No| O[Set default role as 'user']
    O --> P[Set loading to false]
    P --> Q[Redirect based on role]
    
    N -->|Yes| P
    Q --> R{User role is admin?}
    
    R -->|Yes| S[Redirect to /admin dashboard]
    R -->|No| T[Redirect to /dashboard]
    
    S --> U[End - Admin authenticated]
    T --> V[End - User authenticated]
```

## Key Features of the Authentication System

### Security Features
- **JWT Token Management**: Secure storage and automatic refresh
- **Route Protection**: Protected routes using ProtectedRoute component
- **Email Verification**: Required before allowing login
- **Password Validation**: Strong password requirements
- **Session Management**: Automatic token refresh and cleanup

### User Experience Features
- **Persian Language Support**: Localized messages and UI
- **Toast Notifications**: Success and error feedback
- **Loading States**: Visual feedback during operations
- **Automatic Redirects**: Seamless navigation after actions
- **Form Validation**: Real-time input validation

### Technical Features
- **NestJS Backend Integration**: RESTful API communication
- **React Router**: Client-side routing with protection
- **Context API**: Centralized authentication state
- **TypeScript**: Type-safe implementation
- **Responsive Design**: Mobile-friendly interface

## Testing Scenarios

### Login Testing
1. Valid credentials → Success redirect
2. Invalid credentials → Error message
3. Unverified email → Verification prompt
4. Admin user → Admin dashboard redirect
5. Regular user → User dashboard redirect

### Signup Testing
1. Valid data → Account creation + verification email
2. Duplicate email → Error message
3. Weak password → Validation error
4. Password mismatch → Confirmation error

### Password Reset Testing
1. Valid email → Reset email sent
2. Invalid email → Error message
3. Valid token → Password update
4. Expired token → Error message

### Email Verification Testing
1. Valid token → Email verified
2. Invalid token → Error message
3. Missing token → Error message
