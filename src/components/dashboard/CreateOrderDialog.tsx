import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ordersService, useApi } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

const CreateOrderDialog = ({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    comments: ''
  });

  // New API hook for creating orders
  const { execute: createOrder, loading: createLoading } = useApi(
    ordersService.createOrder.bind(ordersService),
    { 
      onSuccess: handleOrderCreated,
      onError: handleOrderError
    }
  );

  // Handle successful order creation
  function handleOrderCreated() {
    toast({
      title: 'سفارش ایجاد شد',
      description: 'سفارش شما با موفقیت ثبت شد',
    });

    setFormData({ title: '', description: '', price: '', comments: '' });
    onOrderCreated();
    onOpenChange(false);
  }

  // Handle order creation error
  function handleOrderError(error: Error) {
    console.error('Error creating order:', error);
    toast({
      title: 'خطا در ایجاد سفارش',
      description: 'مشکلی در ثبت سفارش پیش آمد',
      variant: 'destructive',
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createOrder({
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : 0,
        comments: formData.comments || undefined
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Error handling is done in the useApi hook's onError callback
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ایجاد سفارش جدید</DialogTitle>
          <DialogDescription>
            اطلاعات سفارش جدید خود را وارد کنید
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان سفارش *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="عنوان سفارش را وارد کنید"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="توضیحات سفارش را وارد کنید"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">قیمت (تومان)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="قیمت را وارد کنید"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">توضیحات اضافی</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              placeholder="توضیحات اضافی در صورت نیاز"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              لغو
            </Button>
            <Button
              type="submit"
              disabled={createLoading || !formData.title}
              className="flex-1"
            >
              {createLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              ایجاد سفارش
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;