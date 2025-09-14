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
  // New unified filters
  page?: number;
  limit?: number;
  from?: string; // ISO string
  to?: string;   // ISO string
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
    super();
  }

  /**
   * Get user invoices with optional filtering (unified pagination)
   * Returns a normalized array for compatibility with existing UI.
   */
  async getInvoices(params?: InvoiceListRequest): Promise<Invoice[] | { items: Invoice[]; pagination?: { page: number; limit: number; total: number; pages: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page != null) queryParams.append('page', String(params.page));
    if (params?.limit != null) queryParams.append('limit', String(params.limit));
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const endpoint = `/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<any>(endpoint);

    // Normalize possible shapes
    if (Array.isArray(response)) return response as Invoice[];
    if (response?.items) return { items: FieldMapper.transformResponse(response.items), pagination: FieldMapper.transformResponse(response.pagination) };
    if (response?.invoices) return { items: FieldMapper.transformResponse(response.invoices), pagination: FieldMapper.transformResponse(response.pagination) };
    if (response?.data && Array.isArray(response.data)) return response.data as Invoice[];
    return [] as Invoice[];
  }

  /**
   * Pay an invoice using wallet or payment gateway
   */
  async payInvoice(invoiceId: string, paymentData: PayInvoiceRequest): Promise<PayInvoiceResponse> {
    const response = await this.request<PayInvoiceResponse>(`/invoices/${invoiceId}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });

    return response;
  }

  /**
   * Get invoice details by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.request<Invoice>(`/invoices/${invoiceId}`);

    return response;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const response = await this.request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });

    return response;
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<Invoice> {
    const response = await this.request<Invoice>(`/invoices/${invoiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    return response;
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.request<Invoice>(`/invoices/${invoiceId}/cancel`, {
      method: 'PATCH',
    });

    return response;
  }
}

export const invoiceService = new InvoiceService();
