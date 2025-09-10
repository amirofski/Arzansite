// Support Service for ArzanSite
// Handles support tickets and customer service

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface CreateTicketRequest {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report';
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
}

export interface UpdateTicketRequest {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  notes?: string;
}

export interface AddMessageRequest {
  message: string;
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
}

// Response interfaces
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report';
  assignedTo?: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'support';
    message: string;
    attachments?: Array<{
      filename: string;
      url: string;
      type: string;
    }>;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketListResponse {
  success: boolean;
  tickets: SupportTicket[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateTicketResponse {
  success: boolean;
  ticket: SupportTicket;
  message: string;
}

export interface UpdateTicketResponse {
  success: boolean;
  ticket: SupportTicket;
  message: string;
}

export interface AddMessageResponse {
  success: boolean;
  message: {
    id: string;
    sender: 'user' | 'support';
    message: string;
    attachments?: Array<{
      filename: string;
      url: string;
      type: string;
    }>;
    createdAt: string;
  };
}

export class SupportService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Get user support tickets
   */
  async getTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<TicketListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.category) queryParams.append('category', params.category);
      
      const queryString = queryParams.toString();
      try {
        const primary = await withRetry(() =>
          this.request<TicketListResponse>(`/support/tickets${queryString ? `?${queryString}` : ''}`)
        );
        return FieldMapper.transformResponse(primary);
      } catch (e) {
        // Fallback: older naming is the same; keep as-is
        const fallback = await withRetry(() =>
          this.request<TicketListResponse>(`/support/tickets${queryString ? `?${queryString}` : ''}`)
        );
        return FieldMapper.transformResponse(fallback);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'SupportService.getTickets');
      throw error;
    }
  }

  /**
   * Get specific ticket
   */
  async getTicket(ticketId: string): Promise<{ success: boolean; ticket: SupportTicket }> {
    try {
      // Primary per integration guide: singular path
      try {
        const primary = await withRetry(() =>
          this.request<{ success: boolean; ticket: SupportTicket }>(`/support/ticket/${ticketId}`)
        );
        return FieldMapper.transformResponse(primary);
      } catch (_) {
        const fallback = await withRetry(() =>
          this.request<{ success: boolean; ticket: SupportTicket }>(`/support/tickets/${ticketId}`)
        );
        return FieldMapper.transformResponse(fallback);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'SupportService.getTicket');
      throw error;
    }
  }

  /**
   * Create new support ticket
   */
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);

      // Primary per integration guide: /support/report-issue
      try {
        const primary = await withRetry(() =>
          this.request<CreateTicketResponse>('/support/report-issue', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(primary);
      } catch (_) {
        const fallback = await withRetry(() =>
          this.request<CreateTicketResponse>('/support/tickets', {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(fallback);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'SupportService.createTicket');
      throw error;
    }
  }

  /**
   * Update support ticket
   */
  async updateTicket(ticketId: string, request: UpdateTicketRequest): Promise<UpdateTicketResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);
      
      const response = await withRetry(() =>
        this.request<UpdateTicketResponse>(`/support/tickets/${ticketId}`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'SupportService.updateTicket');
      throw error;
    }
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, request: AddMessageRequest): Promise<AddMessageResponse> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(request);

      // Primary per integration guide: singular message endpoint
      try {
        const primary = await withRetry(() =>
          this.request<AddMessageResponse>(`/support/ticket/${ticketId}/message`, {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(primary);
      } catch (_) {
        const fallback = await withRetry(() =>
          this.request<AddMessageResponse>(`/support/tickets/${ticketId}/messages`, {
            method: 'POST',
            body: JSON.stringify(snakeCaseRequest),
          })
        );
        return FieldMapper.transformResponse(fallback);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'SupportService.addMessage');
      throw error;
    }
  }

  /**
   * Close support ticket
   */
  async closeTicket(ticketId: string): Promise<UpdateTicketResponse> {
    try {
      const response = await withRetry(() =>
        this.request<UpdateTicketResponse>(`/support/tickets/${ticketId}/close`, {
          method: 'PATCH',
        })
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'SupportService.closeTicket');
      throw error;
    }
  }
}

// Export singleton instance
export const supportService = new SupportService();
