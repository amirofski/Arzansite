import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, FileIcon, Trash2, Download } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
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

    const { data: files, error } = await supabase
      .from('user_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('خطا در بارگذاری فایل‌ها');
      return;
    }

    setUploadedFiles(files || []);
  };

  useEffect(() => {
    loadUploadedFiles();
  }, [user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از 10 مگابایت باشد');
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('user_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          category: selectedCategory,
          description: fileDescription || null,
        });

      if (dbError) {
        throw dbError;
      }

      toast.success('فایل با موفقیت آپلود شد');
      setFileDescription('');
      await loadUploadedFiles();

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      toast.success('فایل حذف شد');
      await loadUploadedFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('خطا در حذف فایل');
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
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      toast.error('خطا در دریافت لینک فایل');
      return null;
    }

    return data.signedUrl;
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
            <div className="text-center">
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
              <p className="text-xs text-muted-foreground mt-2">
                فرمت‌های مجاز: PDF, Word, تصاویر
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
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id, file.file_path)}
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