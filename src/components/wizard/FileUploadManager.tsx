import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, FileIcon, Trash2, Download } from 'lucide-react';
import { fileManagementService, type UploadedFile } from "@/lib/services";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";



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
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [fileDescription, setFileDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categories = [
    { value: 'general', label: 'عمومی', icon: FileIcon },
    { value: 'documents', label: 'اسناد', icon: FileText },
    { value: 'images', label: 'تصاویر', icon: Image },
    { value: 'logos', label: 'لوگو و برند', icon: Image },
    { value: 'content', label: 'محتوا و متن', icon: FileText },
  ];

  const loadUploadedFiles = async () => {
    if (!user) return;
    try {
      const orderId = typeof (data as Record<string, unknown> | null)?.orderId === 'string'
        ? ((data as Record<string, unknown>)?.orderId as string)
        : undefined;

      let list: unknown;
      let rawFiles: Array<Record<string, unknown>> = [];

      // Prefer new unified uploads endpoint, fallback to legacy storage listing
      try {
        list = await fileManagementService.listUploads({ orderId, bucketType: 'uploads' });
      } catch (e) {
        list = await fileManagementService.listStorageFiles('uploads');
      }

      if (list && typeof list === 'object' && 'files' in (list as Record<string, unknown>)) {
        const maybeFiles = (list as { files?: unknown }).files;
        if (Array.isArray(maybeFiles)) rawFiles = maybeFiles as Array<Record<string, unknown>>;
      } else if (Array.isArray(list)) {
        rawFiles = list as Array<Record<string, unknown>>;
      }

      const mapped: UploadedFile[] = rawFiles.map((f) => {
        const rf = f as StorageFile;
        const id = typeof rf.id === 'string'
          ? rf.id
          : (typeof (rf as Record<string, unknown>)['fileId'] === 'string'
            ? ((rf as Record<string, unknown>)['fileId'] as string)
            : (typeof rf.$id === 'string' ? rf.$id : ''));
        const file_name = (typeof rf.name === 'string' && rf.name)
          || (typeof rf.file_name === 'string' && rf.file_name)
          || (typeof rf.filename === 'string' && rf.filename)
          || id
          || 'file';
        const file_type = (typeof rf.mimeType === 'string' && rf.mimeType)
          || (typeof (rf as Record<string, unknown>)['mime'] === 'string' && ((rf as Record<string, unknown>)['mime'] as string))
          || (typeof rf.file_type === 'string' && rf.file_type)
          || '';
        const file_size = (typeof (rf as Record<string, unknown>)['size'] === 'number' && ((rf as Record<string, unknown>)['size'] as number))
          || (typeof rf.sizeOriginal === 'number' && rf.sizeOriginal)
          || (typeof rf.file_size === 'number' && rf.file_size)
          || 0;
        const description = (typeof rf.description === 'string' ? rf.description : undefined);
        const category = (typeof rf.category === 'string' ? rf.category : 'general');
        const file_path = `api://uploads/${id}`;
        const created_at = (typeof rf.created_at === 'string'
          ? rf.created_at
          : (typeof (rf as Record<string, unknown>)['createdAt'] === 'string'
            ? ((rf as Record<string, unknown>)['createdAt'] as string)
            : ''));
        return { id, file_name, file_path, file_type, file_size, category, description, created_at };
      });

      setUploadedFiles(mapped);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('خطا در بارگذاری فایل‌ها');
      setUploadedFiles([]);
    }
  };

  useEffect(() => {
    loadUploadedFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) {
      return 'حجم فایل نباید بیشتر از 10 مگابایت باشد';
    }
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/svg+xml'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'فرمت فایل پشتیبانی نمی‌شود';
    }
    
    return null;
  };

  // Single file upload is disabled; use bulk upload below

  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileManagementService.deleteStorageFile('uploads', fileId);
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
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        return;
      }
    }

    console.log('FileUploadManager: Starting bulk upload:', {
      fileCount: files.length,
      files: fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })),
      category: selectedCategory,
      description: fileDescription
    });

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    // Sequentially upload via storage wrapper

    console.log('FileUploadManager: Prepared files:', fileArray.map(f => f.name));

    try {
      console.log('FileUploadManager: Uploading via /storage/upload/...');
      const total = fileArray.length;
      let uploaded = 0;
      const orderId = typeof (data as Record<string, unknown> | null)?.orderId === 'string'
        ? ((data as Record<string, unknown>)?.orderId as string)
        : undefined;
      for (const f of fileArray) {
        await fileManagementService.uploadProjectFile(f, {
          category: selectedCategory,
          description: fileDescription || undefined,
          orderId,
        });
        uploaded += 1;
        setUploadProgress(Math.round((uploaded * 100) / total));
      }
      if (fileDescription) setFileDescription('');
      toast.success(`${files.length} فایل با موفقیت آپلود شد`);
      await loadUploadedFiles();
    } catch (error) {
      console.error('FileUploadManager: Error uploading files:', error);
      console.error('FileUploadManager: Bulk upload error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
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
      const res = (await fileManagementService.getProjectFile(fileId)) as unknown as { url?: string; fileId?: string };
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

            <div className="grid md:grid-cols-2 gap-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.svg"
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
                فرمت‌های مجاز: PDF, Word, تصاویر (حداکثر 10MB برای هر فایل)
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
              const category = categories.find(c => c.value === file.category);

              return (
                <Card key={file.id} className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileIconComponent className="w-8 h-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{file.file_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {category?.label}
                            </Badge>
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