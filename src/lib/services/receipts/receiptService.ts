// Receipt Service for ArzanSite
// Handles all receipt-related API operations with proper error handling and field mapping
import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';

// Receipt interfaces
export interface Receipt {
  id: string;
  userId: string;
  invoiceId?: string;
  paymentId?: string;
  refId?: string;
  amount: number;
  service?: string;
  createdAt: string;
}

export interface ReceiptListRequest {
  // Support both legacy and unified
  limit?: number;
  offset?: number;
  page?: number;
  from?: string;
  to?: string;
  userId?: string;
}

export interface DownloadReceiptRequest {
  format: 'pdf' | 'html';
}

export class ReceiptService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Get a direct URL for downloading a receipt PDF
   * Endpoint: GET /receipts/:id/url
   * Returns: { url: string }
   */
  async getReceiptUrl(receiptId: string): Promise<{ url: string }> {
    const response = await this.request<{ url: string }>(`/receipts/${encodeURIComponent(receiptId)}/url`);
    // Normalize in case backend wraps response
    const mapped = FieldMapper.transformResponse(response) as any;
    if (mapped?.url && typeof mapped.url === 'string') return { url: mapped.url };
    if (mapped?.data?.url && typeof mapped.data.url === 'string') return { url: mapped.data.url };
    // As a fallback, construct the standard download URL shape
    return { url: `${this.baseUrl}/receipts/${encodeURIComponent(receiptId)}/download?format=pdf` };
  }

  /**
   * Get user receipts with optional filtering
   * Returns either an array or a wrapped { items, pagination } depending on backend.
   */
  async getReceipts(params?: ReceiptListRequest): Promise<Receipt[] | { items: Receipt[]; pagination?: { page: number; limit: number; total: number; pages: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.limit != null) queryParams.append('limit', params.limit.toString());
    if (params?.offset != null) queryParams.append('offset', params.offset.toString());
    if (params?.page != null) queryParams.append('page', params.page.toString());
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.userId) queryParams.append('user_id', params.userId);

    const endpoint = `/receipts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<any>(endpoint);

    if (Array.isArray(response)) return response as Receipt[];
    if (response?.items) return { items: FieldMapper.transformResponse(response.items), pagination: FieldMapper.transformResponse(response.pagination) };
    if (response?.receipts) return { items: FieldMapper.transformResponse(response.receipts), pagination: FieldMapper.transformResponse(response.pagination) };
    // Handle wrapped { success, data: { items, pagination } }
    if (response?.data?.items) return { items: FieldMapper.transformResponse(response.data.items), pagination: FieldMapper.transformResponse(response.data.pagination) };
    if (response?.data && Array.isArray(response.data)) return response.data as Receipt[];
    return [] as Receipt[];
  }

  /**
   * Download a receipt in specified format
   */
  async downloadReceipt(receiptId: string, format: 'pdf' | 'html'): Promise<Blob> {
    const endpoint = `/receipts/${receiptId}/download?format=${format}`;
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: format === 'pdf' ? 'application/pdf' : 'text/html',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download receipt');
    }
    
    return await response.blob();
  }

  /**
   * Get receipt details by ID
   */
  async getReceipt(receiptId: string): Promise<Receipt> {
    const response = await this.request<Receipt>(`/receipts/${receiptId}`);

    return response;
  }

  /**
   * Create a new receipt
   */
  async createReceipt(receiptData: Omit<Receipt, 'id' | 'createdAt'>): Promise<Receipt> {
    const response = await this.request<Receipt>('/receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });

    return response;
  }

  /**
   * Generate receipt for an invoice
   */
  async generateReceipt(invoiceId: string): Promise<Receipt> {
    const response = await this.request<Receipt>('/receipts/generate', {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    });

    return response;
  }

  /**
   * List user receipts with pagination
   */
  async listReceipts(params?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<{
    success: boolean;
    receipts: Receipt[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);

      const queryString = queryParams.toString();
      const endpoint = `/receipts${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.request<{
        success: boolean;
        receipts: Receipt[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(endpoint);

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'ReceiptService.listReceipts');
      throw error;
    }
  }

  /**
   * Get receipt details by ID
   */
  async getReceiptDetails(receiptId: string): Promise<{
    success: boolean;
    receipt: Receipt;
    order?: {
      id: string;
      title: string;
      status: string;
      totalAmount: number;
    };
    invoice?: {
      id: string;
      amount: number;
      dueDate: string;
      status: string;
    };
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        receipt: Receipt;
        order?: {
          id: string;
          title: string;
          status: string;
          totalAmount: number;
        };
        invoice?: {
          id: string;
          amount: number;
          dueDate: string;
          status: string;
        };
      }>(`/receipts/${encodeURIComponent(receiptId)}`);

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'ReceiptService.getReceiptDetails');
      throw error;
    }
  }

  /**
   * Admin: Get all receipts
   */
  async getAllReceipts(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    from?: string;
    to?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    receipts: Receipt[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.userId) queryParams.append('userId', params.userId);
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);
      if (params?.status) queryParams.append('status', params.status);

      const queryString = queryParams.toString();
      const endpoint = `/receipts/admin/all${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.request<{
        success: boolean;
        receipts: Receipt[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(endpoint);

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'ReceiptService.getAllReceipts');
      throw error;
    }
  }
}

export const receiptService = new ReceiptService();
