import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, FileIcon, Trash2, Download } from 'lucide-react';
import { sessionApiService } from "@/lib/sessionApiService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  description?: string;
  created_at: string;
}

interface FileUploadManagerProps {
  data: any;
  updateData: (data: any) => void;
}

const FileUploadManager = ({ data, updateData }: FileUploadManagerProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [fileDescription, setFileDescription] = useState('');

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
      const response = await sessionApiService.getUploads();
      
      if (response.success && response.data) {
        setUploadedFiles(response.data);
      } else {
        console.error('Failed to load files:', response.error);
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('خطا در بارگذاری فایل‌ها');
      setUploadedFiles([]);
    }
  };

  useEffect(() => {
    loadUploadedFiles();
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    console.log('FileUploadManager: Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      category: selectedCategory,
      description: fileDescription
    });

    setUploading(true);

    try {
      // Upload via backend endpoint
      const form = new FormData();
      form.append('file', file);
      form.append('category', selectedCategory);
      if (fileDescription) form.append('description', fileDescription);

      console.log('FileUploadManager: FormData contents:', {
        file: file.name,
        category: selectedCategory,
        description: fileDescription,
        formDataEntries: Array.from(form.entries())
      });

      console.log('FileUploadManager: About to make API request...');
      
      const response = await sessionApiService.uploadFile(file, selectedCategory, fileDescription);
      console.log('FileUploadManager: Upload response:', response);

      if (response.success) {
        toast.success('فایل با موفقیت آپلود شد');
        setFileDescription('');
        await loadUploadedFiles();
        event.target.value = '';
      } else {
        throw new Error(response.error || 'خطا در آپلود فایل');
      }
    } catch (error) {
      console.error('FileUploadManager: Error uploading file:', error);
      console.error('FileUploadManager: Error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      toast.error('خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, _filePath: string) => {
    try {
      const response = await sessionApiService.deleteFile(fileId);

      if (response.success) {
        toast.success('فایل حذف شد');
        await loadUploadedFiles();
      } else {
        throw new Error(response.error || 'خطا در حذف فایل');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('خطا در حذف فایل');
    }
  };

  // Get specific file by ID
  const getFileById = async (fileId: string) => {
    try {
      const response = await sessionApiService.getUploads();
      if (response.success && response.data) {
        const file = response.data.find((f: any) => f.id === fileId);
        return file || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching file:', error);
      toast.error('خطا در دریافت اطلاعات فایل');
      return null;
    }
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
    const form = new FormData();
    
    // Add all files to form data
    fileArray.forEach((file, index) => {
      form.append('files', file);
    });
    
    form.append('category', selectedCategory);
    if (fileDescription) form.append('description', fileDescription);

    console.log('FileUploadManager: Bulk FormData contents:', {
      fileCount: fileArray.length,
      category: selectedCategory,
      description: fileDescription,
      formDataEntries: Array.from(form.entries())
    });

    try {
      console.log('FileUploadManager: About to make bulk API request...');
      
      const response = await sessionApiService.uploadBulkFiles(fileArray, selectedCategory);
      console.log('FileUploadManager: Bulk upload response:', response);

      if (response.success) {
        toast.success(`${files.length} فایل با موفقیت آپلود شد`);
        setFileDescription('');
        await loadUploadedFiles();
      } else {
        throw new Error(response.error || 'خطا در آپلود فایل‌ها');
      }
    } catch (error) {
      console.error('FileUploadManager: Error uploading files:', error);
      console.error('FileUploadManager: Bulk upload error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      toast.error('خطا در آپلود فایل‌ها');
    } finally {
      setUploading(false);
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

  const getSignedUrl = async (filePath: string) => {
    try {
      // Extract file ID from path or use a different approach
      // For now, we'll try to get the file by path
      const response = await sessionApiService.getUploads();
      
      if (response.success && response.data) {
        const file = response.data.find((f: any) => f.file_path === filePath);
        if (file) {
          const signedUrlResponse = await sessionApiService.getSignedUrl(file.id);
          if (signedUrlResponse.success && signedUrlResponse.data) {
            return signedUrlResponse.data;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error('خطا در دریافت لینک فایل');
      return null;
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const signedUrl = await getSignedUrl(filePath);
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

            {/* File Input */}
            <div className="text-center space-y-4">
              {/* Single File Upload */}
              <div>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.svg"
                />
                <Label htmlFor="file-upload">
                  <Button 
                    variant="outline" 
                    className="cursor-pointer" 
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? 'در حال آپلود...' : 'انتخاب فایل'}
                    </span>
                  </Button>
                </Label>
              </div>

              {/* Bulk File Upload */}
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
                          onClick={() => handleDownload(file.file_path, file.file_name)}
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
                          onClick={() => handleDeleteFile(file.id, file.file_path)}
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