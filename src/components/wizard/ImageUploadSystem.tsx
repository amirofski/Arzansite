import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  Eye, 
  Download,
  Shield,
  Cloud,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  ipfsHash?: string;
  thumbnail?: string;
  uploadedAt: Date;
  isSecure: boolean;
}

interface ImageUploadSystemProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  acceptedTypes?: string[];
}

const ImageUploadSystem = ({ 
  onFilesUploaded, 
  existingFiles = [], 
  maxFiles = 10,
  maxSizePerFile = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
}: ImageUploadSystemProps) => {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  // Simulate IPFS upload (replace with actual implementation)
  const simulateIPFSUpload = async (file: File): Promise<{ hash: string; url: string }> => {
    // This would be replaced with actual IPFS/Web3 storage integration
    return new Promise((resolve) => {
      setTimeout(() => {
        const hash = `QmX${Math.random().toString(36).substr(2, 40)}`;
        const url = `https://ipfs.io/ipfs/${hash}`;
        resolve({ hash, url });
      }, 2000);
    });
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set thumbnail size
          const maxSize = 200;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL());
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `فرمت فایل ${file.type} پشتیبانی نمی‌شود`;
    }
    
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `حجم فایل نباید از ${maxSizePerFile}MB بیشتر باشد`;
    }
    
    if (files.length >= maxFiles) {
      return `حداکثر ${maxFiles} فایل قابل آپلود است`;
    }
    
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const thumbnail = await generateThumbnail(file);
    const { hash, url } = await simulateIPFSUpload(file);
    
    return {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: url,
      ipfsHash: hash,
      thumbnail: thumbnail,
      uploadedAt: new Date(),
      isSecure: true
    };
  };

  const handleFiles = async (fileList: FileList) => {
    setError('');
    setUploading(true);
    setUploadProgress(0);

    const validFiles: File[] = [];
    
    // Validate all files first
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        setUploading(false);
        return;
      }
      
      validFiles.push(file);
    }

    try {
      const uploadedFiles: UploadedFile[] = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(((i + 1) / validFiles.length) * 100);
        
        const uploadedFile = await uploadFile(file);
        uploadedFiles.push(uploadedFile);
      }
      
      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      onFilesUploaded(newFiles);
      
    } catch (err) {
      setError('خطا در آپلود فایل‌ها');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (fileId: string) => {
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-all duration-300 ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}>
        <CardContent className="p-8">
          <div
            className="text-center"
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                <div>
                  <p className="text-lg font-medium mb-2">در حال آپلود...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {Math.round(uploadProgress)}% تکمیل شده
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">تصاویر خود را آپلود کنید</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    فایل‌ها را اینجا بکشید یا کلیک کنید
                  </p>
                  <input
                    type="file"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>انتخاب فایل‌ها</span>
                    </Button>
                  </label>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>فرمت‌های مجاز: JPG، PNG، WEBP، SVG</p>
                  <p>حداکثر حجم: {maxSizePerFile}MB برای هر فایل</p>
                  <p>حداکثر تعداد: {maxFiles} فایل</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Shield className="w-5 h-5" />
            ذخیره‌سازی امن و غیرمتمرکز
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-600">
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                ذخیره‌سازی روی شبکه IPFS
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                رمزنگاری امن فایل‌ها
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                دسترسی سریع از سراسر جهان
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                بک‌آپ خودکار و ایمن
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              فایل‌های آپلود شده ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div key={file.id} className="relative group">
                  <Card className="overflow-hidden">
                    <div className="aspect-square relative">
                      {file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Security Badge */}
                      {file.isSecure && (
                        <Badge className="absolute top-2 left-2 bg-green-600">
                          <Shield className="w-3 h-3 mr-1" />
                          امن
                        </Badge>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = file.url;
                            a.download = file.name;
                            a.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <p className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                        {file.ipfsHash && (
                          <Badge variant="outline" className="text-xs">
                            <Cloud className="w-3 h-3 mr-1" />
                            IPFS
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageUploadSystem;