// Email Management Service for ArzanSite
// Handles email management operations with proper error handling and field mapping
import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';

// Email interfaces
export interface EmailLog {
  id: string;
  toEmail: string;
  subject: string;
  success: boolean;
  errorMessage?: string;
  sentAt: string;
  serviceUsed: string;
  templateType?: string;
  userId?: string;
}

export interface EmailStats {
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  successRate: number;
  mostUsedService: string;
  emailsByTemplate: Record<string, number>;
}

export interface EmailTestRequest {
  testType: string;
  recipient: string;
  testOptions?: Record<string, unknown>;
}

export interface EmailTestResponse {
  success: boolean;
  data: unknown;
}

export interface EmailListRequest {
  limit?: number;
  offset?: number;
  userId?: string;
  success?: boolean;
  service?: string;
  templateType?: string;
  from?: string;
  to?: string;
}

export class EmailManagementService extends BaseApiService {
  constructor() {
    super('/emails');
  }

  /**
   * Get email logs with optional filtering
   */
  async getEmailLogs(params?: EmailListRequest): Promise<EmailLog[]> {
    const queryParams = params ? new URLSearchParams() : undefined;
    if (params?.limit) queryParams?.set('limit', params.limit.toString());
    if (params?.offset) queryParams?.set('offset', params.offset.toString());
    if (params?.userId) queryParams?.set('user_id', params.userId);
    if (params?.success !== undefined) queryParams?.set('success', params.success.toString());
    if (params?.service) queryParams?.set('service', params.service);
    if (params?.templateType) queryParams?.set('template_type', params.templateType);
    if (params?.from) queryParams?.set('from', params.from);
    if (params?.to) queryParams?.set('to', params.to);

    const endpoint = queryParams ? `?${queryParams.toString()}` : '';
    const response = await this.request<EmailLog[]>(endpoint);

    return response;
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<EmailStats> {
    const response = await this.request<EmailStats>('/stats');
    return response;
  }

  /**
   * Test email service
   */
  async testEmailService(request: EmailTestRequest): Promise<EmailTestResponse> {
    const response = await this.request<EmailTestResponse>('/test-service', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response;
  }

  /**
   * Send email
   */
  async sendEmail(payload: {
    to: string;
    subject: string;
    template: string;
    data?: Record<string, unknown>;
  }): Promise<{ success: boolean; messageId?: string }> {
    const response = await this.request<{ success: boolean; messageId?: string }>('/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response;
  }

  /**
   * Get email templates
   */
  async getEmailTemplates(): Promise<string[]> {
    const response = await this.request<string[]>('/templates');
    return response;
  }

  /**
   * Get email service status
   */
  async getEmailServiceStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    lastCheck: string;
    queueSize?: number;
    errorCount?: number;
  }> {
    const response = await this.request<{
      status: 'healthy' | 'warning' | 'critical';
      lastCheck: string;
      queueSize?: number;
      errorCount?: number;
    }>('/status');
    return response;
  }
}

export const emailManagementService = new EmailManagementService();
