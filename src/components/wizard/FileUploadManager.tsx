import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Image, FileIcon, Trash2, Download } from 'lucide-react';
import { fileManagementService, type UploadedFile } from "@/lib/services";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLocation } from 'react-router-dom';



type StorageFile = {
  id?: string;
  $id?: string;
  name?: string;
  file_name?: string;
  filename?: string;
  mimeType?: string;
  file_type?: string;
  sizeOriginal?: number;
  file_size?: number;
  description?: string;
  category?: string;
  created_at?: string;
};

interface FileUploadManagerProps {
  data: Record<string, unknown> | null;
  updateData: (data: Record<string, unknown>) => void;
}

const FileUploadManager = ({ data, updateData }: FileUploadManagerProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileDescription, setFileDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);


  const loadUploadedFiles = async () => {
    if (!user) return;
    // Ensure token exists before calling protected endpoints
    try {
      const { tokenManager } = await import('@/lib/tokenManager');
      let token = tokenManager.getAccessToken();
      if (!token) {
        tokenManager.forceRefreshFromStorage();
        token = tokenManager.getAccessToken();
        if (!token) return;
      }
    } catch {}
    try {
      // Resolve orderId from wizard data or URL (edit mode)
      const orderId = (() => {
        const fromData = typeof (data as Record<string, unknown> | null)?.orderId === 'string'
          ? ((data as Record<string, unknown>)?.orderId as string)
          : undefined;
        if (fromData) return fromData;
        try {
          const p = new URLSearchParams(location.search);
          return (p.get('orderId') || p.get('order_id') || undefined) as string | undefined;
        } catch {
          return undefined;
        }
      })();

      const res = await fileManagementService.listUploads({ orderId, bucket: 'project-files' });
      const files = Array.isArray(res?.files) ? res.files : [];
      setUploadedFiles(files as unknown as UploadedFile[]);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('خطا در بارگذاری فایل‌ها');
      setUploadedFiles([]);
    }
  };

  useEffect(() => {
    loadUploadedFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.search, (data as any)?.orderId]);

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) {
      return 'حجم فایل نباید بیشتر از 10 مگابایت باشد';
    }
    
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'فرمت فایل پشتیبانی نمی‌شود';
    }
    
    return null;
  };

  // Single file upload is disabled; use bulk upload below

  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileManagementService.deleteStorageFile('project-files', fileId);
      toast.success('فایل حذف شد');
      await loadUploadedFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('خطا در حذف فایل');
    }
  };

  // Get specific file by ID (from in-memory list)
  const getFileById = async (fileId: string) => {
    return uploadedFiles.find(f => f.id === fileId) || null;
  };

  // Upload multiple files
  const handleBulkUpload = async (files: FileList) => {
    if (!user) return;

    // Validate all files first
    let fileArray = Array.from(files);
    // Enforce backend limit: up to 10 files per request
    if (fileArray.length > 10) {
      toast.warning(`حداکثر 10 فایل در هر بار آپلود مجاز است. ${fileArray.length - 10} فایل نادیده گرفته شد.`);
      fileArray = fileArray.slice(0, 10);
    }

    // Validate all files first
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Resolve orderId from wizard data or URL (edit mode). Optional for backend.
      const orderId = (() => {
        const fromData = typeof (data as Record<string, unknown> | null)?.orderId === 'string'
          ? ((data as Record<string, unknown>)?.orderId as string)
          : undefined;
        if (fromData) return fromData;
        try {
          const p = new URLSearchParams(location.search);
          return (p.get('orderId') || p.get('order_id') || undefined) as string | undefined;
        } catch {
          return undefined;
        }
      })();

      const res = await fileManagementService.uploadMany('project-files', fileArray, {
        orderId,
        description: fileDescription || undefined,
      });

      const successCount = Array.isArray(res.uploaded) ? res.uploaded.length : 0;
      const errorCount = Array.isArray(res.errors) ? res.errors.length : 0;

      if (successCount > 0) {
        toast.success(`${successCount} فایل با موفقیت آپلود شد`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} فایل با خطا مواجه شد`);
      }

      if (fileDescription) setFileDescription('');
      await loadUploadedFiles();
    } catch (error) {
      console.error('FileUploadManager: Error uploading files:', error);
      setUploadError(error instanceof Error ? error.message : 'خطا در آپلود فایل‌ها');
      toast.error('خطا در آپلود فایل‌ها');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('word') || fileType.includes('document')) return FileText;
    return FileIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSignedUrl = async (fileId: string) => {
    try {
      // Try to find direct file_path from current list first
      const f = uploadedFiles.find((x) => x.id === fileId);
      if (f && typeof f.file_path === 'string' && f.file_path) {
        return f.file_path;
      }
      const res = (await fileManagementService.getStorageFileUrl('project-files', fileId)) as unknown as { url?: string; fileId?: string };
      if (res && typeof res.url === 'string') return res.url;
      return null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error('خطا در دریافت لینک فایل');
      return null;
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    const signedUrl = await getSignedUrl(fileId);
    if (!signedUrl) return;

    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">برای آپلود فایل ابتدا وارد حساب کاربری خود شوید</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">آپلود فایل</h3>
              <p className="text-sm text-muted-foreground mb-4">
                فایل‌های خود را آپلود کنید (حداکثر 10MB)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>توضیحات (اختیاری)</Label>
              <Textarea
                placeholder="توضیحات فایل را وارد کنید..."
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* File Input (multiple only) */}
            <div className="text-center space-y-4">
              <div>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                  disabled={uploading}
                  className="hidden"
                  id="bulk-file-upload"
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                />
                <Label htmlFor="bulk-file-upload">
                  <Button 
                    variant="secondary"
                    className="cursor-pointer" 
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? 'در حال آپلود...' : 'انتخاب چندین فایل'}
                    </span>
                  </Button>
                </Label>
              </div>

              {uploading && (
                <div className="w-full max-w-md mx-auto">
                  <div className="w-full h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-2 bg-primary transition-[width]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{uploadProgress}%</div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 border border-destructive/30 bg-destructive/10 text-destructive rounded">
                  <div className="text-sm">{uploadError}</div>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => setUploadError(null)}>بستن</Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                فرمت‌های مجاز: PNG, JPEG, WEBP, PDF, TXT (حداکثر 10MB برای هر فایل)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">فایل‌های آپلود شده</h3>
          <div className="grid gap-4">
            {uploadedFiles.map((file) => {
              const FileIconComponent = getFileIcon(file.file_type);
              return (
                <Card key={file.id} className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileIconComponent className="w-8 h-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{file.file_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-xs">{file.file_type || '—'}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.file_size)}</span>
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.id, file.file_name)}
                          title="دانلود فایل"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => getFileById(file.id)}
                          title="مشاهده جزئیات"
                        >
                          <FileIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          title="حذف فایل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadManager;