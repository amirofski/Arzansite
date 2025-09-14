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
      const bucketParam = resolveBucket(request.bucket || request.bucketType || 'project-files');
      // If orderId is provided, prefer wizard-scoped listing
      if (request.orderId) {
        const res = await withRetry(() => this.request<any>(`/wizard/orders/${encodeURIComponent(request.orderId!)}/files`));
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : (Array.isArray(res?.files) ? res.files : []));
        const files: UploadedFile[] = (items as any[]).map((it) => {
          const id = it.file_id || it.id || it.$id || '';
          return {
            id: String(id),
            file_name: String(it.original_name || it.file_name || it.name || id || 'file'),
            file_path: String(it.file_path || ''),
            file_type: String(it.mime_type || it.file_type || ''),
            file_size: Number(it.file_size || it.size || 0),
            category: String(it.file_type || it.category || 'general'),
            description: typeof it.description === 'string' ? it.description : undefined,
            created_at: String(it.created_at || it.createdAt || ''),
          } as UploadedFile;
        });
        return { success: true, files };
      }
      // Otherwise, list files directly from storage bucket
      const res = await withRetry(() => this.request<any>(`/storage/${encodeURIComponent(bucketParam)}`));
      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      const files: UploadedFile[] = (items as any[]).map((it) => {
        const id = it.file_id || it.id || it.$id || '';
        return {
          id: String(id),
          file_name: String(it.original_name || it.file_name || it.name || id || 'file'),
          file_path: String(it.file_path || ''),
          file_type: String(it.mime_type || it.file_type || ''),
          file_size: Number(it.file_size || it.size || 0),
          category: String(it.file_type || it.category || 'general'),
          description: typeof it.description === 'string' ? it.description : undefined,
          created_at: String(it.created_at || it.createdAt || ''),
        } as UploadedFile;
      });
      return { success: true, files };
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
      const b = resolveBucket(bucket);
      const res = await withRetry(() => this.request<any>(`/storage/${encodeURIComponent(b)}`));
      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      const files: UploadedFile[] = (items as any[]).map((it) => {
        const id = it.file_id || it.id || it.$id || '';
        return {
          id: String(id),
          file_name: String(it.original_name || it.file_name || it.name || id || 'file'),
          file_path: String(it.file_path || ''),
          file_type: String(it.mime_type || it.file_type || ''),
          file_size: Number(it.file_size || it.size || 0),
          category: String(it.file_type || it.category || 'general'),
          description: typeof it.description === 'string' ? it.description : undefined,
          created_at: String(it.created_at || it.createdAt || ''),
        } as UploadedFile;
      });
      return { success: true, files };
    } catch (error) {
      ErrorHandler.logError(error, 'FileManagementService.listStorageFiles');
      throw error;
    }
  }

  /**
   * Upload a project file (use only /storage/uploads)
   */
  async uploadProjectFile(file: File, options?: {
    description?: string; // not used by storage endpoint; metadata is handled by wizard upload
    category?: string;    // not used by storage endpoint
    orderId?: string;
    bucket?: string; // uploads | design-assets | users_avatars | project-files
    fileType?: 'design' | 'avatar' | 'document'; // optional, if backend maps types
  }): Promise<FileUploadResponse> {
    try {
      const bucketParam = resolveBucket(options?.bucket || 'project-files');
      const endpoint = `/storage/upload/${encodeURIComponent(bucketParam)}`;

      const fd = new FormData();
      fd.append('file', file, file.name);
      if (options?.orderId) fd.append('order_id', options.orderId);

      const response = await withRetry(() =>
        this.request<FileUploadResponse>(endpoint, {
          method: 'POST',
          body: fd,
        })
      );
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
      // Default to project-files bucket
      const response = await withRetry(() =>
        this.request<FileUrlResponse>(`/storage/project-files/${encodeURIComponent(fileId)}/url`)
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
      const endpoint = `/storage/${encodeURIComponent(resolveBucket(bucket))}/${encodeURIComponent(fileId)}`;
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
      const b = resolveBucket(bucket);
      const response = await withRetry(() =>
        this.request<FileUrlResponse>(`/storage/${encodeURIComponent(b)}/${encodeURIComponent(fileId)}/url`)
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
