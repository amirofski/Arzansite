// Base API Service for ArzanSite
// Provides foundation for all API calls with proper error handling and authentication

import { tokenManager, TokenData } from '@/lib/tokenManager';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class BaseApiService {
  protected baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private isRefreshing = false;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'https://nest.arzansite.com/api';
    this.defaultHeaders = {
'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOn401 = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let token = this.getAuthToken();

    // If no token in memory, try to restore from localStorage
    if (!token) {
      console.log('BaseApiService: No token in memory, attempting to restore from localStorage...');
      tokenManager.forceRefreshFromStorage();
      token = this.getAuthToken();
    }

    console.log('BaseApiService Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      baseURL: this.baseUrl,
      endpoint
    });

    // Prepare headers - don't set Content-Type for FormData
    const headers: Record<string, string> = {};
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }

    const config: RequestInit = {
      headers: {
        ...this.defaultHeaders,
        ...headers,
        ...(options.headers || {}),
      },
      credentials: 'include', // Always include cookies for httpOnly token storage
      ...options,
    };

    try {
      console.log('Making fetch request to:', url);
      const response = await fetch(url, config);
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      let body;
      if (isJson) {
        try {
          body = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          body = null;
        }
      } else {
        body = await response.text().catch(() => '');
      }

      if (!response.ok) {
        // Log detailed error body for easier debugging of server-side issues
        try {
          console.error('API error response body:', body);
        } catch (e) {
          // no-op
        }
        
        // Attempt a single refresh on 401 and retry the original request
        if (response.status === 401 && retryOn401) {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken && !this.isRefreshing) {
            this.isRefreshing = true;
            try {
              console.log('Attempting token refresh...');
              const refreshed = await this.refreshToken(refreshToken);
              tokenManager.setTokens({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
              });
              console.log('Token refresh successful, retrying request...');
              // Retry original request once with new token
              return this.request<T>(endpoint, options, false);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              this.clearToken();
              // Don't redirect immediately, let the calling component handle it
              throw new Error('Authentication failed - please log in again');
            } finally {
              this.isRefreshing = false;
            }
          } else {
            console.log('No refresh token or already refreshing, clearing tokens');
            this.clearToken();
          }

          // Don't redirect immediately, throw error instead
          throw new Error('Unauthorized - please log in again');
        }

        const message = typeof body === 'string' ? body : body?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      // Log response details for debugging
      if (body === null) {
        console.warn('API response body is null for endpoint:', endpoint);
      }

      // If server returned HTML while we requested JSON, treat as error to avoid passing HTML to callers
      if (!isJson) {
        const looksLikeHtml = typeof body === 'string' && body.trim().startsWith('<!DOCTYPE');
        const isHtmlContentType = contentType.includes('text/html');
        if (looksLikeHtml || isHtmlContentType) {
          throw new Error('Unexpected HTML response from API');
        }
      }
      
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request details:', {
        url,
        method: options.method || 'GET',
        headers: config.headers,
        credentials: config.credentials
      });
      throw error;
    }
  }

  protected getAuthToken(): string | null {
    return tokenManager.getAccessToken();
  }

  private clearToken() {
    tokenManager.clearTokens();
  }

  private async refreshToken(refreshToken: string): Promise<TokenData> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  // Helper method for handling common error patterns
  protected handleApiError(error: any): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        code: 'STRING_ERROR',
      };
    }

    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }
} 
