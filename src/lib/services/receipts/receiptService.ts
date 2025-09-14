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
}

export const receiptService = new ReceiptService();
