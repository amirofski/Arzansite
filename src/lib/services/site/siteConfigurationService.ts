// Site Configuration Service for ArzanSite
// Handles site configuration operations with proper error handling and field mapping
import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';

// Site configuration interfaces
export interface SiteConfig {
  id: string;
  mode: 'normal' | 'temporarily_unavailable' | 'update_mode' | 'development_mode';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSiteConfigRequest {
  mode: SiteConfig['mode'];
}

export interface SiteConfigHistory {
  configs: SiteConfig[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class SiteConfigurationService extends BaseApiService {
  constructor() {
    super('/site-config');
  }

  /**
   * Get current site configuration
   */
  async getCurrentConfig(): Promise<SiteConfig> {
    const response = await this.request<SiteConfig>('/current');
    return response;
  }

  /**
   * Update site configuration
   */
  async updateConfig(request: UpdateSiteConfigRequest): Promise<SiteConfig> {
    const response = await this.request<SiteConfig>('', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });

    return response;
  }

  /**
   * Get site configuration history
   */
  async getConfigHistory(params?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<SiteConfigHistory> {
    const queryParams = params ? new URLSearchParams() : undefined;
    if (params?.page) queryParams?.set('page', params.page.toString());
    if (params?.limit) queryParams?.set('limit', params.limit.toString());
    if (params?.from) queryParams?.set('from', params.from);
    if (params?.to) queryParams?.set('to', params.to);

    const endpoint = queryParams ? `/history?${queryParams.toString()}` : '/history';
    const response = await this.request<SiteConfigHistory>(endpoint);

    return response;
  }

  /**
   * Get site health status
   */
  async getSiteHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastCheck: string;
    services: {
      database: 'healthy' | 'warning' | 'critical';
      email: 'healthy' | 'warning' | 'critical';
      payment: 'healthy' | 'warning' | 'critical';
      storage: 'healthy' | 'warning' | 'critical';
    };
  }> {
    const response = await this.request<{
      status: 'healthy' | 'warning' | 'critical';
      uptime: number;
      lastCheck: string;
      services: {
        database: 'healthy' | 'warning' | 'critical';
        email: 'healthy' | 'warning' | 'critical';
        payment: 'healthy' | 'warning' | 'critical';
        storage: 'healthy' | 'warning' | 'critical';
      };
    }>('/health');
    return response;
  }

  /**
   * Get maintenance schedule
   */
  async getMaintenanceSchedule(): Promise<{
    scheduled: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
    affectedServices?: string[];
  }> {
    const response = await this.request<{
      scheduled: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
      affectedServices?: string[];
    }>('/maintenance-schedule');
    return response;
  }
}

export const siteConfigurationService = new SiteConfigurationService();
