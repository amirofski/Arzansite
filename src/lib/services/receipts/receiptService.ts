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
  limit?: number;
  offset?: number;
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
   */
  async getReceipts(params?: ReceiptListRequest): Promise<Receipt[]> {
    const queryParams = params ? new URLSearchParams() : undefined;
    if (params?.limit) queryParams?.set('limit', params.limit.toString());
    if (params?.offset) queryParams?.set('offset', params.offset.toString());
    if (params?.userId) queryParams?.set('user_id', params.userId);

    const endpoint = `/receipts${queryParams ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<Receipt[]>(endpoint);

    return response;
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
