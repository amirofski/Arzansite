import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { clearImageCache, clearCategoryCache } from '@/lib/imageLoader';
import { useToast } from '@/hooks/use-toast';

interface CacheClearButtonProps {
  category?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const CacheClearButton: React.FC<CacheClearButtonProps> = ({
  category,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      if (category) {
        clearCategoryCache(category);
        toast({
          title: 'کش پاک شد',
          description: `کش بخش ${category} با موفقیت پاک شد`,
          variant: 'default',
        });
      } else {
        clearImageCache();
        toast({
          title: 'تمام کش‌ها پاک شدند',
          description: 'تمام کش‌های تصاویر با موفقیت پاک شدند',
          variant: 'default',
        });
      }
      
      // Reload the page to refresh the image discovery
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: 'خطا در پاک کردن کش',
        description: 'مشکلی در پاک کردن کش پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      onClick={handleClearCache}
      disabled={isClearing}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      title={category ? `پاک کردن کش ${category}` : 'پاک کردن تمام کش‌ها'}
    >
      {isClearing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      {category ? `پاک کردن کش ${category}` : 'پاک کردن تمام کش‌ها'}
    </Button>
  );
};

export default CacheClearButton;
