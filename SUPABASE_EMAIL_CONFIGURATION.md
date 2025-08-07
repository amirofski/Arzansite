# Supabase Email Configuration for Frontend Email Verification

This document explains how to configure your self-hosted Supabase instance to properly redirect email confirmation and magic link emails to your React frontend.

## Environment Variables to Configure

Add these environment variables to your Supabase configuration (in your `.env` file or Supabase dashboard):

### Email URL Configuration

```bash
# Base URL for your frontend application
MAILER_URLPATHS_CONFIRMATION=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_INVITE=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_RECOVERY=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_EMAIL_CHANGE=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_MAGIC_LINK=https://arzansite.com/auth/verify-email
```

### Alternative Configuration (if you want different URLs for different actions)

```bash
# Separate URLs for different email types (optional)
MAILER_URLPATHS_CONFIRMATION=https://arzansite.com/auth/verify-email?type=signup
MAILER_URLPATHS_INVITE=https://arzansite.com/auth/verify-email?type=invite
MAILER_URLPATHS_RECOVERY=https://arzansite.com/auth/verify-email?type=recovery
MAILER_URLPATHS_EMAIL_CHANGE=https://arzansite.com/auth/verify-email?type=email_change
MAILER_URLPATHS_MAGIC_LINK=https://arzansite.com/auth/verify-email?type=magiclink
```

## How It Works

1. **Email Generation**: When Supabase sends confirmation or magic link emails, it will now use your frontend URL instead of the default `confirmation.html` page.

2. **URL Structure**: The generated URLs will look like:
   ```
   https://arzansite.com/auth/verify-email?token=XYZ&type=signup&redirect_to=https://arzansite.com
   ```

3. **Frontend Handling**: Your React app will:
   - Extract the `token`, `type`, and `redirect_to` parameters
   - Call the appropriate Supabase `verifyOtp()` method
   - Show success/error messages
   - Redirect users appropriately

## Email Types Supported

The verification page handles these email types:

- **`signup`**: Email confirmation for new user registration
- **`magiclink`**: Magic link login emails
- **`recovery`**: Password recovery emails
- **`invite`**: User invitation emails
- **`email_change`**: Email change confirmation

## Testing the Configuration

1. **Signup Flow**: Register a new user and check the confirmation email
2. **Magic Link**: Use the magic link login feature
3. **Password Recovery**: Test the forgot password flow

## Troubleshooting

### Common Issues

1. **404 Errors**: Make sure the route `/auth/verify-email` is properly configured in your React Router
2. **Token Errors**: Verify that the `token` parameter is being passed correctly
3. **Redirect Issues**: Check that the `redirect_to` parameter is being handled properly

### Debug Steps

1. Check the email URL in your inbox
2. Verify the URL structure matches: `https://arzansite.com/auth/verify-email?token=...&type=...`
3. Test the route manually in your browser
4. Check browser console for any JavaScript errors

## Security Considerations

- The verification page handles sensitive authentication tokens
- All verification happens client-side using Supabase's secure methods
- Tokens are automatically invalidated after use
- Failed verification attempts are logged for security monitoring

## Additional Configuration

### Custom Email Templates

You can also customize the email templates in your Supabase dashboard:

1. Go to Authentication > Email Templates
2. Customize the templates for:
   - Confirm signup
   - Magic link
   - Change email address
   - Reset password

### SMTP Configuration

Make sure your SMTP settings are properly configured in Supabase:

```bash
# SMTP Configuration (if using custom SMTP)
SMTP_ADMIN_EMAIL=admin@arzansite.com
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SENDER_NAME=Arzan Site
```

## Implementation Notes

- The verification page is designed to work with both signup confirmation and magic link login
- It automatically detects the email type and handles verification accordingly
- Users are redirected to appropriate pages based on the verification type
- Error handling includes user-friendly messages and retry options
- The page is fully responsive and follows your app's design system
