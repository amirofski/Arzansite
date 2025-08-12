// Authentication Email Integration
// This file provides integration examples for using the email system with authentication events

// Supabase client usage removed for auth flows per security policy
import { emailService } from './emailService';
import { useAuth } from '@/hooks/useAuth';

/**
 * Send welcome email after successful registration
 */
export const sendWelcomeEmailOnSignUp = async (user: any) => {
  try {
    // Optionally fetch profile via backend if needed
    const profile: any = { full_name: user.user_metadata?.full_name };

    await emailService.sendWelcomeEmail(
      user.email,
      profile?.full_name || user.user_metadata?.full_name
    );

    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to avoid breaking the signup flow
  }
};

/**
 * Send email verification reminder
 */
export const sendVerificationReminder = async (userEmail: string, userName?: string) => {
  try {
    const verificationUrl = `${window.location.origin}/verify-email`;
    
    await emailService.sendVerificationEmail(
      userEmail,
      userName,
      verificationUrl
    );

    console.log('Verification reminder sent successfully');
  } catch (error) {
    console.error('Error sending verification reminder:', error);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (userEmail: string, userName?: string) => {
  try {
    const resetUrl = `${window.location.origin}/reset-password`;
    
    await emailService.sendPasswordResetEmail(
      userEmail,
      userName,
      resetUrl
    );

    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

/**
 * Send password reset confirmation email
 */
export const sendPasswordResetConfirmation = async (userEmail: string, userName?: string) => {
  try {
    await emailService.sendPasswordResetConfirmationEmail(
      userEmail,
      userName
    );

    console.log('Password reset confirmation sent successfully');
  } catch (error) {
    console.error('Error sending password reset confirmation:', error);
  }
};

/**
 * Send login notification email (optional security feature)
 */
export const sendLoginNotification = async (userEmail: string, userName?: string) => {
  try {
    const loginTime = new Date().toLocaleString('fa-IR');
    const locationInfo = await emailService.getUserLocationInfo();
    
    await emailService.sendLoginNotificationEmail(
      userEmail,
      userName,
      loginTime,
      locationInfo.location,
      locationInfo.browser
    );

    console.log('Login notification sent successfully');
  } catch (error) {
    console.error('Error sending login notification:', error);
  }
};

/**
 * Send role change notification
 */
export const sendRoleChangeNotification = async (
  userEmail: string, 
  userName: string, 
  newRole: string
) => {
  try {
    await emailService.sendRoleNotificationEmail(
      userEmail,
      userName,
      newRole
    );

    console.log('Role change notification sent successfully');
  } catch (error) {
    console.error('Error sending role change notification:', error);
  }
};

/**
 * Send account deactivation email
 */
export const sendAccountDeactivationEmail = async (
  userEmail: string,
  userName: string,
  deactivationReason: string
) => {
  try {
    await emailService.sendDeactivationEmail(
      userEmail,
      userName,
      deactivationReason
    );

    console.log('Account deactivation email sent successfully');
  } catch (error) {
    console.error('Error sending account deactivation email:', error);
  }
};

/**
 * Enhanced authentication hook with email integration
 */
export const useAuthWithEmail = () => {
  const auth = useAuth();

  const signUpWithWelcomeEmail = async (email: string, password: string, metadata?: any) => {
    // Use backend signup instead of direct Supabase
    await auth.signUp(email, password, metadata);
    return { data: null, error: null } as any;
  };

  const signInWithNotification = async (email: string, password: string, sendNotification: boolean = false) => {
    await auth.signIn(email, password);
    if (sendNotification) {
      await sendLoginNotification(email);
    }
    return { data: null, error: null } as any;
  };

  const resetPasswordWithEmail = async (email: string) => {
    const auth = useAuth();
    await auth.forgotPassword(email);
    await sendPasswordResetEmail(email);
    return { data: null, error: null } as any;
  };

  const updatePasswordWithConfirmation = async (newPassword: string) => {
    // This flow now goes through backend reset endpoint from ResetPassword page
    return { data: null, error: null } as any;
  };

  return {
    ...auth,
    signUpWithWelcomeEmail,
    signInWithNotification,
    resetPasswordWithEmail,
    updatePasswordWithConfirmation
  };
};

/**
 * Email integration for admin actions
 */
export const adminEmailActions = {
  /**
   * Send role change notification when admin changes user role
   */
  notifyRoleChange: async (userId: string, newRole: string) => {
    try {
      // Fetch via backend if needed in future
    } catch (error) {
      console.error('Error notifying role change:', error);
    }
  },

  /**
   * Send account deactivation email
   */
  notifyAccountDeactivation: async (userId: string, reason: string) => {
    try {
      // Fetch via backend if needed in future
    } catch (error) {
      console.error('Error notifying account deactivation:', error);
    }
  }
};

/**
 * Email preferences management
 */
export const emailPreferences = {
  /**
   * Check if user has enabled login notifications
   */
  isLoginNotificationEnabled: (userId: string): boolean => {
    // This could be stored in user preferences or settings
    // For now, return false (disabled by default)
    return false;
  },

  /**
   * Update email preferences
   */
  updatePreferences: async (userId: string, preferences: {
    loginNotifications?: boolean;
    marketingEmails?: boolean;
    securityAlerts?: boolean;
  }) => {
    // Implement via backend when available. No-op for now to avoid direct Supabase usage in frontend.
    return { error: null as any };
  }
};

/**
 * Email template testing utilities
 */
export const emailTesting = {
  /**
   * Test all email templates
   */
  testAllTemplates: async (testEmail: string) => {
    const testData = {
      userName: 'کاربر تست',
      userEmail: testEmail,
      actionUrl: 'https://arzansite.com/test',
      expirationTime: '24 ساعت',
      loginTime: '۱۴۰۲/۰۵/۱۵ ساعت ۱۴:۳۰',
      loginLocation: 'تهران، ایران',
      browserInfo: 'Google Chrome',
      newRole: 'admin',
      deactivationReason: 'تست سیستم'
    };

    const templates = [
      'welcome',
      'verification',
      'password-reset',
      'password-reset-confirmation',
      'login-notification',
      'role-notification',
      'deactivation'
    ] as const;

    const results = [];

    for (const template of templates) {
      try {
        const result = await emailService.sendTemplateEmail({
          to: testEmail,
          subject: `تست قالب ${template}`,
          templateType: template,
          templateData: testData
        });

        results.push({
          template,
          success: result.success,
          message: result.message
        });
      } catch (error) {
        results.push({
          template,
          success: false,
          message: error.message
        });
      }
    }

    return results;
  },

  /**
   * Test email service connectivity
   */
  testServiceConnection: async () => {
    return await emailService.testConnection();
  }
};

// Export all functions for easy access
export {
  sendWelcomeEmailOnSignUp,
  sendVerificationReminder,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendLoginNotification,
  sendRoleChangeNotification,
  sendAccountDeactivationEmail
}; 