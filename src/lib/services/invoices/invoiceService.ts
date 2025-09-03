// Invoice Service for ArzanSite
// Handles all invoice-related API operations with proper error handling and field mapping
import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';

// Invoice interfaces
export interface Invoice {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  dueDate?: string;
  status: 'pending' | 'paid' | 'due' | 'overdue' | 'cancelled';
  serviceName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListRequest {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface PayInvoiceRequest {
  method: 'wallet' | 'gateway';
  useWallet?: boolean;
}

export interface PayInvoiceResponse {
  success: boolean;
  message?: string;
  paymentUrl?: string;
  refId?: string;
}

export class InvoiceService extends BaseApiService {
  constructor() {
    super('/invoices');
  }

  /**
   * Get user invoices with optional filtering
   */
  async getInvoices(params?: InvoiceListRequest): Promise<Invoice[]> {
    const queryParams = params ? new URLSearchParams() : undefined;
    if (params?.status) queryParams?.set('status', params.status);
    if (params?.limit) queryParams?.set('limit', params.limit.toString());
    if (params?.offset) queryParams?.set('offset', params.offset.toString());

    const endpoint = queryParams ? `?${queryParams.toString()}` : '';
    const response = await this.request<Invoice[]>(endpoint);

    return response;
  }

  /**
   * Pay an invoice using wallet or payment gateway
   */
  async payInvoice(invoiceId: string, paymentData: PayInvoiceRequest): Promise<PayInvoiceResponse> {
    const response = await this.request<PayInvoiceResponse>(`/${invoiceId}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });

    return response;
  }

  /**
   * Get invoice details by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.request<Invoice>(`/${invoiceId}`);

    return response;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const response = await this.request<Invoice>('', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });

    return response;
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<Invoice> {
    const response = await this.request<Invoice>(`/${invoiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    return response;
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.request<Invoice>(`/${invoiceId}/cancel`, {
      method: 'PATCH',
    });

    return response;
  }
}

export const invoiceService = new InvoiceService();
