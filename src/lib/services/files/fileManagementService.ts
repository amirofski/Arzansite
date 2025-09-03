// File Management Service for ArzanSite
// Handles all file-related API operations with proper field mapping and error handling

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Request interfaces
export interface ListUploadsRequest {
  orderId?: string;
  bucketType: string;
}

export interface UploadFileRequest {
  bucket: string;
  file: File;
  options?: {
    description?: string;
    category?: string;
    orderId?: string;
  };
}

export interface DeleteFileRequest {
  bucket: string;
  fileId: string;
}

export interface GetFileUrlRequest {
  bucket: string;
  fileId: string;
}

// Response interfaces
export interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  description?: string;
  created_at: string;
}

export interface FileListResponse {
  success: boolean;
  files: UploadedFile[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  filePath: string;
  message: string;
}

export interface FileUrlResponse {
  success: boolean;
  url: string;
  fileId: string;
}

export interface DeleteFileResponse {
  success: boolean;
  message: string;
}

export class FileManagementService extends BaseApiService {
  /**
   * List uploaded files
   */
  async listUploads(request: ListUploadsRequest): Promise<FileListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (request.orderId) queryParams.append('orderId', request.orderId);
      if (request.bucketType) queryParams.append('bucketType', request.bucketType);
      
      const queryString = queryParams.toString();
      const endpoint = `/files/uploads${queryString ? `?${queryString}` : ''}`;
      
      let response: FileListResponse;
      try {
        response = await withRetry(() => this.request<FileListResponse>(endpoint));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          // Fallback to legacy storage listing if unified endpoint not available
          const legacy = await withRetry(() => this.request<FileListResponse>(`/files/storage/${request.bucketType || 'uploads'}`));
          return FieldMapper.transformResponse(legacy);
        }
        throw err;
      }

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.listUploads');
      throw error;
    }
  }

  /**
   * List storage files (legacy endpoint)
   */
  async listStorageFiles(bucket: string): Promise<FileListResponse> {
    try {
      const response = await withRetry(() =>
        this.request<FileListResponse>(`/storage/${bucket}`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.listStorageFiles');
      throw error;
    }
  }

  /**
   * Upload a project file (current backend endpoint)
   */
  async uploadProjectFile(file: File, options?: {
    description?: string;
    category?: string;
    orderId?: string;
  }): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options?.description) formData.append('description', options.description);
      if (options?.category) formData.append('category', options.category);
      if (options?.orderId) formData.append('orderId', options.orderId);

      let response: FileUploadResponse;
      try {
        response = await withRetry(() =>
          this.request<FileUploadResponse>(`/storage/project-files`, {
            method: 'POST',
            body: formData,
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          // Fallback generic uploads endpoint
          response = await withRetry(() =>
            this.request<FileUploadResponse>(`/storage/uploads`, {
              method: 'POST',
              body: formData,
            })
          );
        } else {
          throw err;
        }
      }

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.uploadProjectFile');
      throw error;
    }
  }

  /**
   * Get a project file info or download URL
   */
  async getProjectFile(fileId: string): Promise<FileUrlResponse> {
    try {
      const response = await withRetry(() =>
        this.request<FileUrlResponse>(`/storage/project-files/${fileId}`)
      );
      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.getProjectFile');
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteStorageFile(bucket: string, fileId: string): Promise<DeleteFileResponse> {
    try {
      const response = await withRetry(() =>
        this.request<DeleteFileResponse>(`/storage/${bucket}/${fileId}`, {
          method: 'DELETE',
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.deleteStorageFile');
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  async getStorageFileUrl(bucket: string, fileId: string): Promise<FileUrlResponse> {
    try {
      const response = await withRetry(() =>
        this.request<FileUrlResponse>(`/storage/${bucket}/${fileId}/url`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.getStorageFileUrl');
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(bucket: string, fileId: string, metadata: {
    description?: string;
    category?: string;
  }): Promise<{ success: boolean }> {
    try {
      const snakeCaseRequest = FieldMapper.transformRequest(metadata);
      
      const response = await withRetry(() =>
        this.request<{ success: boolean }>(`/storage/${bucket}/${fileId}/metadata`, {
          method: 'PATCH',
          body: JSON.stringify(snakeCaseRequest),
        })
      );

      return response;
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.updateFileMetadata');
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(bucket: string): Promise<{
    totalFiles: number;
    totalSize: number;
    categories: Record<string, number>;
  }> {
    try {
      const response = await withRetry(() =>
        this.request<{
          totalFiles: number;
          totalSize: number;
          categories: Record<string, number>;
        }>(`/files/storage/${bucket}/stats`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.getFileStats');
      throw error;
    }
  }
}

// Export singleton instance
export const fileManagementService = new FileManagementService();
