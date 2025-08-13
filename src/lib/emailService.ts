// Handles email sending through the NestJS backend

import { apiClient } from '@/lib/api-client';

export type EmailTemplateType = 'welcome' | 'verification' | 'password-reset' | 'password-reset-confirmation' | 'login-notification' | 'role-notification' | 'deactivation';

export interface EmailSendOptions {
  to: string;
  template: EmailTemplateType;
  data?: Record<string, unknown>;
  subject?: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: string;
  created_at: string;
}

export class EmailService {
  /**
   * Send email using the backend API
   */
  static async sendEmail(options: EmailSendOptions): Promise<EmailResponse> {
    try {
      // No need to pre-render HTML on the client – the backend service builds
      // the final email body. Eliminating this call avoids unnecessary CPU
      // cycles on every send operation.
      
      // Send via backend
      const response = await apiClient.sendEmail({
        to: options.to,
        subject: options.subject || this.getDefaultSubject(options.template),
        template: options.template,
        data: options.data as Record<string, unknown> || {},
      });

      return {
        success: response.success,
        messageId: response.messageId,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed',
      };
    }
  }

  /**
   * Get default subject for template type
   */
  private static getDefaultSubject(template: EmailTemplateType): string {
    const subjects: Record<EmailTemplateType, string> = {
      'welcome': 'خوش آمدید به Arzan Site! 🎉',
      'verification': 'تایید ایمیل - Arzan Site',
      'password-reset': 'بازنشانی رمز عبور - Arzan Site',
      'password-reset-confirmation': 'رمز عبور با موفقیت تغییر یافت - Arzan Site',
      'login-notification': 'ورود جدید به حساب کاربری - Arzan Site',
      'role-notification': 'تغییر نقش حساب کاربری - Arzan Site',
      'deactivation': 'تغییر وضعیت حساب کاربری - Arzan Site'
    };
    return subjects[template];
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(userEmail: string, userName?: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: userEmail,
      template: 'welcome',
      data: {
        userName: userName || 'کاربر گرامی',
        actionUrl: `${window.location.origin}/auth`,
      },
    });
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(
    userEmail: string, 
    orderId: string, 
    orderTitle: string, 
    orderPrice: number
  ): Promise<EmailResponse> {
    return this.sendEmail({
      to: userEmail,
      template: 'welcome', // Using welcome template for now
      data: {
        userName: 'کاربر گرامی',
        actionUrl: `${window.location.origin}/dashboard`,
      },
      subject: `تایید سفارش ${orderId} - Arzan Site`,
    });
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(
    userEmail: string, 
    orderId: string, 
    orderTitle: string, 
    paymentAmount: number,
    refId?: string
  ): Promise<EmailResponse> {
    return this.sendEmail({
      to: userEmail,
      template: 'welcome', // Using welcome template for now
      data: {
        userName: 'کاربر گرامی',
        actionUrl: `${window.location.origin}/dashboard`,
      },
      subject: `تایید پرداخت ${orderId} - Arzan Site`,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    userEmail: string, 
    resetToken: string
  ): Promise<EmailResponse> {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: userEmail,
      template: 'password-reset',
      data: {
        userEmail,
        actionUrl: resetUrl,
        expirationTime: '24 ساعت',
      },
    });
  }

  /**
   * Send email verification email
   */
  static async sendEmailVerification(
    userEmail: string, 
    verificationToken: string
  ): Promise<EmailResponse> {
    const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}`;
    
    return this.sendEmail({
      to: userEmail,
      template: 'verification',
      data: {
        userEmail,
        actionUrl: verificationUrl,
        expirationTime: '24 ساعت',
      },
    });
  }

  /**
   * Get email logs
   */
  static async getEmailLogs(limit = 50, offset = 0): Promise<EmailLog[]> {
    try {
      return await apiClient.getEmailLogs(limit, offset);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }
  }

  /**
   * Test email service connectivity
   */
  static async testEmailService(): Promise<{ success: boolean; message: string }> {
    try {
      // Test backend connectivity
      await apiClient.healthCheck();
      
      // Try to send a test email
      const result = await this.sendEmail({
        to: 'test@example.com',
        template: 'welcome',
        data: {
          userName: 'Test User',
          actionUrl: 'https://arzansite.com/auth',
        },
      });

      return {
        success: result.success,
        message: result.success ? 'Email service is working correctly' : result.error || 'Email service test failed',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email service test failed',
      };
    }
  }

  /**
   * Format email address for display
   */
  static formatEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) return email;
    
    const maskedLocal = localPart.substring(0, 3) + '*'.repeat(localPart.length - 3);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export a singleton instance
export const emailService = new EmailService(); 