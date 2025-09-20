import { Client, Storage, ID } from 'appwrite';
import { fileManagementService } from './fileManagementService';

export interface UploadOptions {
  bucketId?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface UploadResult {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: Date;
}

export class SimpleUploadService {
  private storage: Storage;

  constructor() {
    // Initialize Appwrite client (reuse existing configuration)
    const client = new Client();
    
    // Use environment variables for configuration
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    
    client.setEndpoint(endpoint).setProject(projectId);
    
    this.storage = new Storage(client);
  }

  /**
   * Upload multiple files using Appwrite 14.1.0 API
   */
  async uploadFiles(
    files: File[], 
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const { bucketId = 'project-files', onProgress, onError } = options;
    const results: UploadResult[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        this.validateFile(file);
        
        // Update progress
        const progressPercent = (i / files.length) * 100;
        onProgress?.(progressPercent);
        
        // Upload using new Appwrite v14 API
        const uploadResult = await this.storage.createFile(
          bucketId,
          ID.unique(),
          file
        );
        
        // Get file URL if possible
        let fileUrl: string | undefined;
        try {
          const urlResult = await fileManagementService.getStorageFileUrl(bucketId, uploadResult.$id);
          fileUrl = (urlResult as any)?.url;
        } catch (error) {
          console.warn('Could not get file URL:', error);
        }
        
        results.push({
          id: uploadResult.$id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          uploadedAt: new Date()
        });
      }
      
      // Final progress update
      onProgress?.(100);
      return results;
      
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      onError?.(uploadError);
      throw uploadError;
    }
  }

  /**
   * Upload a single file
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const results = await this.uploadFiles([file], options);
    return results[0];
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp'
    ];

    if (file.size > maxSize) {
      throw new Error(`حجم فایل ${file.name} نباید بیشتر از 10 مگابایت باشد`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`فرمت فایل ${file.name} پشتیبانی نمی‌شود`);
    }
  }

  /**
   * Delete an uploaded file
   */
  async deleteFile(fileId: string, bucketId: string = 'project-files'): Promise<void> {
    try {
      await this.storage.deleteFile(bucketId, fileId);
    } catch (error) {
      throw new Error(`خطا در حذف فایل: ${error instanceof Error ? error.message : 'نامشخص'}`);
    }
  }

  /**
   * Get file preview URL
   */
  async getFilePreview(fileId: string, bucketId: string = 'project-files'): Promise<string> {
    try {
      const result = await this.storage.getFilePreview(bucketId, fileId);
      return result.toString();
    } catch (error) {
      throw new Error(`خطا در دریافت پیش‌نمایش فایل: ${error instanceof Error ? error.message : 'نامشخص'}`);
    }
  }
}

// Export singleton instance
export const simpleUploadService = new SimpleUploadService();