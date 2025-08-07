// Email Service for Arzan Site
// Handles email sending through Supabase and integrates with email templates

import { supabase } from '@/integrations/supabase/client';
import { 
  getEmailTemplate, 
  prepareEmailData, 
  EmailTemplateData 
} from './emailTemplates';

export interface EmailSendOptions {
  to: string;
  subject: string;
  templateType: 'welcome' | 'verification' | 'password-reset' | 'password-reset-confirmation' | 'login-notification' | 'role-notification' | 'deactivation';
  templateData: Partial<EmailTemplateData>;
  from?: string;
  replyTo?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  error?: any;
}

// Email subjects in Persian
const EMAIL_SUBJECTS = {
  welcome: 'خوش آمدید به Arzan Site! 🎉',
  verification: 'تایید ایمیل - Arzan Site',
  'password-reset': 'بازنشانی رمز عبور - Arzan Site',
  'password-reset-confirmation': 'رمز عبور با موفقیت تغییر یافت - Arzan Site',
  'login-notification': 'ورود جدید به حساب کاربری - Arzan Site',
  'role-notification': 'تغییر نقش حساب کاربری - Arzan Site',
  deactivation: 'تغییر وضعیت حساب کاربری - Arzan Site'
};

class EmailService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Send email using Supabase Edge Functions with SMTP
   */
  private async sendEmailViaSupabase(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: options.to,
          subject: options.subject,
          html: options.templateData.html || '',
          from: options.from || 'info@arzansite.com',
          replyTo: options.replyTo || 'support@arzansite.com',
          templateType: options.templateType
        }
      });

      if (error) {
        console.error('Email sending error:', error);
        return {
          success: false,
          message: 'خطا در ارسال ایمیل',
          error
        };
      }

      return {
        success: true,
        message: 'ایمیل با موفقیت ارسال شد',
        data
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        message: 'خطا در سرویس ایمیل',
        error
      };
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      // Prepare email data with defaults
      const emailData = prepareEmailData(options.templateData);
      
      // Generate HTML content from template
      const htmlContent = getEmailTemplate(options.templateType, emailData);
      
      // Get subject from predefined subjects
      const subject = options.subject || EMAIL_SUBJECTS[options.templateType];
      
      // Send email
      return await this.sendEmailViaSupabase({
        ...options,
        subject,
        templateData: {
          ...emailData,
          html: htmlContent
        }
      });
    } catch (error) {
      console.error('Template email error:', error);
      return {
        success: false,
        message: 'خطا در ایجاد قالب ایمیل',
        error
      };
    }
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(userEmail: string, userName?: string): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to: userEmail,
      subject: EMAIL_SUBJECTS.welcome,
      templateType: 'welcome',
      templateData: {
        userName,
        userEmail,
        actionUrl: `${window.location.origin}/dashboard`
      }
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(userEmail: string, userName?: string, verificationUrl?: string): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to: userEmail,
      subject: EMAIL_SUBJECTS.verification,
      templateType: 'verification',
      templateData: {
        userName,
        userEmail,
        actionUrl: verificationUrl,
        expirationTime: '24 ساعت'
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, userName?: string, resetUrl?: string): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to: userEmail,
      subject: EMAIL_SUBJECTS['password-reset'],
      templateType: 'password-reset',
      templateData: {
        userName,
        userEmail,
        actionUrl: resetUrl,
        expirationTime: '1 ساعت'
      }
    });
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmationEmail(userEmail: string, userName?: string): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to: userEmail,
      subject: EMAIL_SUBJECTS['password-reset-confirmation'],
      templateType: 'password-reset-confirmation',
      templateData: {
        userName,
        userEmail,
        actionUrl: `${window.location.origin}/auth`
      }
    });
  }

  /**
   * Send login notification email
   */
  async sendLoginNotificationEmail(
    userEmail: string, 
    userName?: string, 
    loginTime?: string, 
    loginLocation?: string, 
    browserInfo?: string
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to: userEmail,
      subject: EMAIL_SUBJECTS['login-notification'],
      templateType: 'login-notification',
      templateData: {
        userName,
        userEmail,
        loginTime,
        loginLocation,
        browserInfo,
        actionUrl: `${window.location.origin}/dashboard`
      }
    });
  }

  /**
   * Send role change notification email
   */
  async sendRoleNotificationEmail(
    userEmail: string, 
    userName?: string, 
    newRole?: string
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to: userEmail,
      subject: EMAIL_SUBJECTS['role-notification'],
      templateType: 'role-notification',
      templateData: {
        userName,
        userEmail,
        newRole,
        actionUrl: `${window.location.origin}/dashboard`
      }
    });
  }

  /**
   * Send account deactivation/suspension email
   */
  async sendDeactivationEmail(
    userEmail: string, 
    userName?: string, 
    deactivationReason?: string
  ): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to: userEmail,
      subject: EMAIL_SUBJECTS.deactivation,
      templateType: 'deactivation',
      templateData: {
        userName,
        userEmail,
        deactivationReason
      }
    });
  }

  /**
   * Get user's browser and location information
   */
  async getUserLocationInfo(): Promise<{
    location: string;
    browser: string;
    ip?: string;
  }> {
    try {
      // This would typically be done server-side, but for demo purposes
      // we'll use a simple approach
      const userAgent = navigator.userAgent;
      const browser = this.getBrowserInfo(userAgent);
      
      // For location, you might want to use a geolocation service
      // For now, we'll return a generic location
      return {
        location: 'تهران، ایران',
        browser,
        ip: '127.0.0.1' // This would be the actual IP from server
      };
    } catch (error) {
      console.error('Error getting location info:', error);
      return {
        location: 'نامشخص',
        browser: 'نامشخص'
      };
    }
  }

  /**
   * Extract browser information from user agent
   */
  private getBrowserInfo(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'مرورگر نامشخص';
  }

  /**
   * Format date for email display
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test email service connectivity
   */
  async testConnection(): Promise<EmailResponse> {
    try {
      // Test Supabase connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        return {
          success: false,
          message: 'خطا در اتصال به پایگاه داده',
          error
        };
      }

      return {
        success: true,
        message: 'اتصال به سرویس ایمیل برقرار است'
      };
    } catch (error) {
      return {
        success: false,
        message: 'خطا در تست اتصال',
        error
      };
    }
  }
}

// Create singleton instance
export const emailService = new EmailService();

// Export individual functions for easier use
export const {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendLoginNotificationEmail,
  sendRoleNotificationEmail,
  sendDeactivationEmail,
  testConnection
} = emailService; 