# Email System Documentation

## Overview

The Arzan Site email system provides a comprehensive solution for sending transactional emails related to user authentication and account management. The system includes:

- **7 Email Templates**: Welcome, verification, password reset, login notifications, role changes, and account deactivation
- **Responsive Design**: All templates are mobile-friendly with RTL support for Persian language
- **Modular Architecture**: Easy to customize and extend
- **Email Service Integration**: Support for Resend and SendGrid
- **Admin Dashboard**: Complete email management interface
- **Logging & Analytics**: Track email delivery and performance

## Features

### Email Templates

1. **Welcome Email** (`welcome`)
   - Sent after successful registration
   - Includes onboarding information and platform features
   - Call-to-action to start using the platform

2. **Email Verification** (`verification`)
   - Sent to confirm user's email address
   - Includes verification link with expiration notice
   - Security warnings and instructions

3. **Password Reset Request** (`password-reset`)
   - Sent when user requests password reset
   - Secure reset link with expiration time
   - Security warnings for unauthorized requests

4. **Password Reset Confirmation** (`password-reset-confirmation`)
   - Sent after successful password reset
   - Security recommendations
   - Login instructions

5. **Login Notification** (`login-notification`)
   - Optional security feature
   - Includes login time, location, and browser details
   - Security warnings for unrecognized logins

6. **Role Change Notification** (`role-notification`)
   - Sent when user's role changes
   - Details about new permissions and features
   - Access instructions

7. **Account Deactivation** (`deactivation`)
   - Sent when account is suspended or deactivated
   - Reason for deactivation and resolution steps
   - Support contact information

### Technical Features

- **Responsive Design**: Works on all devices and screen sizes
- **RTL Support**: Full Persian language support with right-to-left layout
- **Accessibility**: WCAG compliant with proper contrast and screen reader support
- **Template Customization**: Easy to modify colors, fonts, and layout
- **Dynamic Content**: Support for user-specific data and URLs
- **Email Service Agnostic**: Works with any SMTP or email service provider

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Service Configuration
EMAIL_SERVICE=resend  # or 'sendgrid'
RESEND_API_KEY=your_resend_api_key
SENDGRID_API_KEY=your_sendgrid_api_key

# Email Settings
DEFAULT_FROM_EMAIL=noreply@arzansite.com
SUPPORT_EMAIL=support@arzansite.com

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Migration

Run the email system migration to create the required tables:

```bash
supabase db push
```

This will create:
- `email_logs` table for tracking email delivery
- Email statistics functions
- RLS policies for security

### 3. Deploy Edge Function

Deploy the email sending edge function:

```bash
supabase functions deploy send-email
```

### 4. Email Service Setup

#### Option A: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your domain for sending emails
4. Set `EMAIL_SERVICE=resend` and `RESEND_API_KEY=your_key`

#### Option B: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key with mail send permissions
3. Verify your sender domain
4. Set `EMAIL_SERVICE=sendgrid` and `SENDGRID_API_KEY=your_key`

## Usage Examples

### Basic Email Sending

```typescript
import { emailService } from '@/lib/emailService';

// Send welcome email
await emailService.sendWelcomeEmail('user@example.com', 'احمد محمدی');

// Send verification email
await emailService.sendVerificationEmail(
  'user@example.com', 
  'احمد محمدی', 
  'https://arzansite.com/verify?token=abc123'
);

// Send password reset email
await emailService.sendPasswordResetEmail(
  'user@example.com', 
  'احمد محمدی', 
  'https://arzansite.com/reset?token=xyz789'
);
```

### Custom Email Template

```typescript
import { getEmailTemplate, prepareEmailData } from '@/lib/emailTemplates';

const emailData = prepareEmailData({
  userName: 'احمد محمدی',
  userEmail: 'ahmad@example.com',
  actionUrl: 'https://arzansite.com/action',
  companyName: 'Arzan Site',
  supportEmail: 'support@arzansite.com'
});

const htmlContent = getEmailTemplate('welcome', emailData);
```

### Integration with Authentication

```typescript
// In your auth component
const handleSignUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (data.user) {
    // Send welcome email
    await emailService.sendWelcomeEmail(email, data.user.user_metadata?.full_name);
  }
};

const handlePasswordReset = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (data) {
    // Send password reset email
    await emailService.sendPasswordResetEmail(email, null, data.user?.email);
  }
};
```

## Admin Dashboard

The email management dashboard provides:

### Overview Tab
- Email delivery statistics
- Success/failure rates
- Service usage metrics
- Template usage breakdown

### Logs Tab
- Complete email delivery logs
- Search and filtering capabilities
- Export to CSV functionality
- Error tracking and debugging

### Templates Tab
- Live template preview
- Test email sending
- Template customization
- HTML export functionality

### Settings Tab
- Email service configuration
- Security settings
- Rate limiting options
- Bounce handling

## Template Customization

### Modifying Templates

All templates are defined in `src/lib/emailTemplates.ts`. Each template function returns HTML content:

```typescript
export const getWelcomeEmailTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">سلام ${data.userName || 'کاربر عزیز'}! 👋</div>
    <div class="message">
      به <strong>${data.companyName || 'Arzan Site'}</strong> خوش آمدید!
    </div>
    <!-- Add your custom content here -->
  `;
  
  return getBaseTemplate(content, data);
};
```

### Styling Customization

The base template includes comprehensive CSS styling. Modify the styles in the `getBaseTemplate` function:

```css
.email-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  text-align: center;
  color: white;
}
```

### Adding New Templates

1. Create a new template function in `emailTemplates.ts`:

```typescript
export const getCustomTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">عنوان ایمیل</div>
    <div class="message">محتوای ایمیل</div>
  `;
  
  return getBaseTemplate(content, data);
};
```

2. Add the template type to the interface:

```typescript
export const getEmailTemplate = (
  templateType: 'welcome' | 'verification' | 'custom', // Add your template
  data: EmailTemplateData
): string => {
  switch (templateType) {
    case 'custom':
      return getCustomTemplate(data);
    // ... other cases
  }
};
```

3. Add email service method:

```typescript
async sendCustomEmail(userEmail: string, userName?: string): Promise<EmailResponse> {
  return this.sendTemplateEmail({
    to: userEmail,
    subject: 'موضوع ایمیل سفارشی',
    templateType: 'custom',
    templateData: {
      userName,
      userEmail
    }
  });
}
```

## Security Considerations

### Email Security

1. **Rate Limiting**: Implement rate limiting to prevent abuse
2. **Input Validation**: Validate all email addresses and content
3. **Token Expiration**: Set appropriate expiration times for verification links
4. **HTTPS Only**: Ensure all links use HTTPS
5. **SPF/DKIM**: Configure proper email authentication

### Data Protection

1. **Personal Data**: Minimize personal data in email logs
2. **Retention Policy**: Implement log retention policies
3. **Access Control**: Use RLS policies to control access to email logs
4. **Encryption**: Ensure sensitive data is encrypted

## Monitoring and Analytics

### Email Delivery Tracking

The system automatically logs all email sending attempts:

```sql
-- View email delivery statistics
SELECT 
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE success = true) as successful_emails,
  COUNT(*) FILTER (WHERE success = false) as failed_emails,
  ROUND((COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as success_rate
FROM email_logs
WHERE sent_at >= NOW() - INTERVAL '30 days';
```

### Performance Monitoring

Monitor email delivery performance:

- Success rates by template type
- Delivery times by email service
- Error patterns and common issues
- User engagement metrics

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check API key configuration
   - Verify email service settings
   - Check edge function logs

2. **Templates not rendering**
   - Validate HTML syntax
   - Check CSS compatibility
   - Test with different email clients

3. **High bounce rates**
   - Verify sender domain
   - Check recipient email validity
   - Monitor spam complaints

### Debug Mode

Enable debug logging:

```typescript
// In emailService.ts
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Email request:', options);
  console.log('Email response:', result);
}
```

## Best Practices

### Email Content

1. **Clear Subject Lines**: Use descriptive, non-spammy subject lines
2. **Personalization**: Include user names and relevant information
3. **Call-to-Action**: Include clear next steps
4. **Mobile Optimization**: Ensure templates work on mobile devices
5. **Accessibility**: Use proper contrast and alt text

### Technical Implementation

1. **Error Handling**: Implement proper error handling and retry logic
2. **Queue Management**: Use queues for high-volume email sending
3. **Template Versioning**: Version control your email templates
4. **A/B Testing**: Test different subject lines and content
5. **Monitoring**: Set up alerts for delivery failures

### Compliance

1. **GDPR Compliance**: Include unsubscribe links and data processing information
2. **CAN-SPAM**: Follow CAN-SPAM requirements for commercial emails
3. **Local Laws**: Comply with local email marketing laws
4. **Privacy Policy**: Include privacy policy links in emails

## API Reference

### EmailService Methods

```typescript
class EmailService {
  // Send welcome email
  sendWelcomeEmail(userEmail: string, userName?: string): Promise<EmailResponse>
  
  // Send verification email
  sendVerificationEmail(userEmail: string, userName?: string, verificationUrl?: string): Promise<EmailResponse>
  
  // Send password reset email
  sendPasswordResetEmail(userEmail: string, userName?: string, resetUrl?: string): Promise<EmailResponse>
  
  // Send password reset confirmation
  sendPasswordResetConfirmationEmail(userEmail: string, userName?: string): Promise<EmailResponse>
  
  // Send login notification
  sendLoginNotificationEmail(userEmail: string, userName?: string, loginTime?: string, loginLocation?: string, browserInfo?: string): Promise<EmailResponse>
  
  // Send role change notification
  sendRoleNotificationEmail(userEmail: string, userName?: string, newRole?: string): Promise<EmailResponse>
  
  // Send account deactivation email
  sendDeactivationEmail(userEmail: string, userName?: string, deactivationReason?: string): Promise<EmailResponse>
  
  // Send custom template email
  sendTemplateEmail(options: EmailSendOptions): Promise<EmailResponse>
  
  // Test email service
  testConnection(): Promise<EmailResponse>
}
```

### EmailTemplateData Interface

```typescript
interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  actionUrl?: string;
  expirationTime?: string;
  loginTime?: string;
  loginLocation?: string;
  browserInfo?: string;
  newRole?: string;
  deactivationReason?: string;
  supportEmail?: string;
  companyName?: string;
  companyAddress?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}
```

## Support

For technical support and questions:

- **Documentation**: Check this documentation first
- **Issues**: Report bugs and issues through the project repository
- **Email**: Contact support@arzansite.com
- **Community**: Join our developer community for discussions

## Changelog

### Version 1.0.0
- Initial release with 7 email templates
- Resend and SendGrid integration
- Admin dashboard with email management
- Comprehensive logging and analytics
- RTL support and responsive design 