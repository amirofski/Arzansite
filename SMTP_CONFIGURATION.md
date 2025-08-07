# SMTP Configuration Guide for Arzan Site

This guide explains how to configure Supabase to use custom SMTP settings for email sending instead of third-party services.

## Overview

The Arzan Site project has been configured to use custom SMTP settings through Supabase's built-in email capabilities. This eliminates the need for third-party email services like Resend or SendGrid.

## Important Note: Supabase SMTP Limitations

**Supabase Edge Functions cannot directly send custom emails through SMTP.** The SMTP configuration in Supabase is primarily used for:
- Authentication emails (signup, password reset, email verification)
- System-generated emails

For custom email templates and business logic emails, you have these options:

1. **Use Supabase Auth Email Templates** (Recommended)
2. **Use a third-party email service** (Resend, SendGrid, etc.)
3. **Configure SMTP for auth emails only**

## SMTP Configuration Details

The following SMTP settings have been configured:

```toml
[auth.email.smtp]
host = "37-58-50-28.cprapid.com"
port = 465
user = "info@arzansite.com"
pass = "Cya6enCC5rPcs5G"
admin_email = "info@arzansite.com"
sender_name = "info"
security = "ssl"
```

## Configuration Steps

### 1. Local Development (supabase/config.toml)

The SMTP settings are already configured in your `supabase/config.toml` file. This configuration will be used when running Supabase locally.

### 2. Production Environment

To configure SMTP in your production Supabase project:

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Auth

2. **Configure SMTP Settings**
   - Find the "SMTP Settings" section
   - Enter the following values:
     - **Host**: `37-58-50-28.cprapid.com`
     - **Port**: `465`
     - **Username**: `info@arzansite.com`
     - **Password**: `Cya6enCC5rPcs5G`
     - **Sender Name**: `info`
     - **Security**: `SSL`

3. **Email Settings**
   - **Enable Email Signup**: `true`
   - **Enable Email Confirmations**: `true`
   - **Enable Auto-confirm**: `false`
   - **Admin Email**: `info@arzansite.com`

### 3. Environment Variables

Make sure your environment variables are set correctly:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# SMTP Configuration (for reference)
SMTP_HOST=37-58-50-28.cprapid.com
SMTP_PORT=465
SMTP_USER=info@arzansite.com
SMTP_PASS=Cya6enCC5rPcs5G
SMTP_ADMIN_EMAIL=info@arzansite.com
SMTP_SENDER_NAME=info
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_ANONYMOUS_USERS=false
```

## Email Templates

The project includes comprehensive email templates for:

- **Welcome Email**: Sent after successful registration
- **Email Verification**: Confirmation emails with verification links
- **Password Reset**: Reset request and confirmation emails
- **Login Notification**: New device/location login alerts
- **Role Notification**: Account role change notifications
- **Account Deactivation**: Account status change notifications

## Testing SMTP Configuration

### 1. Test Email Function

You can test the SMTP configuration using the admin dashboard:

1. Navigate to `/admin` in your application
2. Go to the "مدیریت ایمیل" (Email Management) tab
3. Use the template preview to send test emails

### 2. Test Authentication Emails

Test the authentication flow:

1. Try registering a new user
2. Check if verification emails are sent
3. Test password reset functionality
4. Verify login notifications

### 3. Check Email Logs

Monitor email sending activity:

1. Check the email logs table in your database
2. Review the admin dashboard email statistics
3. Monitor for any SMTP errors

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Verify SMTP credentials
   - Check if the SMTP server allows connections from Supabase
   - Ensure port 465 is open and SSL is enabled

2. **Emails Not Sending**
   - Check Supabase logs for SMTP errors
   - Verify email templates are properly formatted
   - Ensure the Edge Function is deployed correctly

3. **Authentication Emails Not Working**
   - Verify SMTP settings in Supabase dashboard
   - Check if email confirmations are enabled
   - Ensure admin email is set correctly

### Debug Steps

1. **Check Supabase Logs**
   ```bash
   supabase logs --follow
   ```

2. **Test SMTP Connection**
   - Use the email test function in the admin dashboard
   - Check email logs table for detailed error messages

3. **Verify Configuration**
   - Confirm SMTP settings in Supabase dashboard
   - Check environment variables
   - Verify Edge Function deployment

## Security Considerations

1. **SMTP Credentials**
   - Store SMTP credentials securely in Supabase dashboard
   - Never commit credentials to version control
   - Use environment variables for local development

2. **Email Content**
   - All email templates include proper authentication
   - Links are time-limited and secure
   - Personal information is handled according to privacy policies

3. **Rate Limiting**
   - Supabase includes built-in rate limiting for email sending
   - Monitor email sending patterns to prevent abuse

## Migration from Third-Party Services

If you were previously using Resend or SendGrid:

1. **Remove Third-Party Dependencies**
   - No need for Resend or SendGrid API keys
   - Simplified email service configuration
   - Reduced external dependencies

2. **Update Environment Variables**
   - Remove `RESEND_API_KEY` and `SENDGRID_API_KEY`
   - Keep only Supabase-related environment variables

3. **Deploy Updated Edge Function**
   - The `send-email` Edge Function now uses Supabase SMTP
   - Deploy the updated function to production

## Benefits of Custom SMTP

1. **Cost Effective**: No additional email service costs
2. **Simplified Setup**: Single configuration in Supabase
3. **Better Control**: Direct control over email delivery
4. **Reduced Dependencies**: Fewer external services to manage
5. **Unified Logging**: All email activity in one place

## Support

For issues with SMTP configuration:

1. Check Supabase documentation on SMTP setup
2. Review email logs in the admin dashboard
3. Test with the provided email testing tools
4. Contact your SMTP provider for connection issues 