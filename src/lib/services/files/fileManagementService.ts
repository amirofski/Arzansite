// File Management Service for ArzanSite
// Handles all file-related API operations with proper field mapping and error handling

import { BaseApiService } from '../api/baseApiService';
import { FieldMapper } from '@/lib/utils/fieldMapper';
import { ErrorHandler } from '@/lib/utils/errorHandler';
import { withRetry } from '@/lib/utils/retry';

// Normalize various bucket aliases to API-accepted query values
function resolveBucket(input?: string): string {
  const val = (input || 'uploads').toLowerCase();
  switch (val) {
    case 'uploads':
    case 'upload':
      return 'uploads';
    case 'design-assets':
    case 'design_assets':
    case 'design':
    case 'designs':
    case 'design-asset':
      return 'design-assets';
    case 'users_avatars':
    case 'user_avatars':
    case 'users-avatars':
    case 'avatars':
    case 'avatar':
      return 'users_avatars';
    case 'project_files':
    case 'project-files':
    case 'project':
    case 'projects':
    case 'projectfiles':
      return 'project-files';
    default:
      return val.replace(/\s+/g, '-');
  }
}

// Request interfaces
export interface ListUploadsRequest {
  orderId?: string;
  bucketType?: string; // legacy name
  bucket?: string;     // preferred name
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
      // Use only /storage/uploads with bucket query param
      const bucketParam = resolveBucket(request.bucket || request.bucketType || 'uploads');
      const queryParams = new URLSearchParams();
      queryParams.set('bucket', bucketParam);
      if (request.orderId) queryParams.set('order_id', request.orderId);
      const endpoint = `/storage/uploads?${queryParams.toString()}`;

      const response = await withRetry(() => this.request<FileListResponse>(endpoint));
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
      const query = new URLSearchParams({ bucket: resolveBucket(bucket) }).toString();
      const response = await withRetry(() =>
        this.request<FileListResponse>(`/storage/uploads?${query}`)
      );

      return FieldMapper.transformResponse(response);
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.listStorageFiles');
      throw error;
    }
  }

  /**
   * Upload a project file (use only /storage/uploads)
   */
  async uploadProjectFile(file: File, options?: {
    description?: string;
    category?: string;
    orderId?: string;
    bucket?: string; // uploads | design-assets | users_avatars | project-files
    fileType?: 'design' | 'avatar' | 'document'; // optional, if backend maps types
    fieldName?: 'file' | 'files'; // override form field name if backend expects 'files'
  }): Promise<FileUploadResponse> {
    try {
      const bucketParam = resolveBucket(options?.bucket || options?.category || 'uploads');
      const endpoint = `/storage/uploads?bucket=${encodeURIComponent(bucketParam)}`;

      const buildForm = (field: 'file' | 'files') => {
        const fd = new FormData();
        fd.append(field, file, file.name);
        if (options?.description) fd.append('description', options.description);
        if (options?.category) fd.append('category', options.category);
        if (options?.orderId) fd.append('order_id', options.orderId);
        return fd;
      };

      // Primary try with configured field name or 'file'
      const primaryField: 'file' | 'files' = (options?.fieldName || (import.meta as any).env?.VITE_UPLOAD_FIELD_NAME || 'file') as 'file' | 'files';
      try {
        const response = await withRetry(() =>
          this.request<FileUploadResponse>(endpoint, {
            method: 'POST',
            body: buildForm(primaryField),
          })
        );
        return FieldMapper.transformResponse(response);
      } catch (e: any) {
        // Always try alternate field name once on failure
        const altField: 'file' | 'files' = primaryField === 'file' ? 'files' : 'file';
        try {
          const response = await withRetry(() =>
            this.request<FileUploadResponse>(endpoint, {
              method: 'POST',
              body: buildForm(altField),
            })
          );
          return FieldMapper.transformResponse(response);
        } catch (e2) {
          throw e2;
        }
      }
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
      // Default to project-files bucket for backward compatibility
      const query = new URLSearchParams({ bucket: resolveBucket('project_files'), id: fileId }).toString();
      // Prefer unified signed-url endpoint
      const response = await withRetry(() =>
        this.request<FileUrlResponse>(`/storage/uploads/signed-url?${query}`)
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
      const endpoint = `/storage/uploads/${encodeURIComponent(fileId)}?bucket=${encodeURIComponent(resolveBucket(bucket))}`;
      const response = await withRetry(() =>
        this.request<DeleteFileResponse>(endpoint, {
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
      const query = new URLSearchParams({ bucket: resolveBucket(bucket), id: fileId }).toString();
      // Primary unified endpoint for signed URL
      try {
        const primary = await withRetry(() =>
          this.request<FileUrlResponse>(`/storage/uploads/signed-url?${query}`)
        );
        return FieldMapper.transformResponse(primary);
      } catch (_) {
        // Fallback to bucket-specific path if available
        const fallback = await withRetry(() =>
          this.request<FileUrlResponse>(`/storage/${resolveBucket(bucket)}/${fileId}/url`)
        );
        return FieldMapper.transformResponse(fallback);
      }
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
