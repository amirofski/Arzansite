import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { authService, useApi, UserProfile } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({ open, onOpenChange, profile, onProfileUpdated }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: ''
  });

  // New API hook for updating profile
  const { execute: updateProfile, loading: updateLoading } = useApi(
    authService.updateProfile.bind(authService),
    { 
      onSuccess: handleProfileUpdateSuccess,
      onError: handleProfileUpdateError
    }
  );

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  // Handle successful profile update
  function handleProfileUpdateSuccess() {
    toast({
      title: 'اطلاعات بروزرسانی شد',
      description: 'اطلاعات حساب شما با موفقیت بروزرسانی شد',
    });

    onProfileUpdated();
    onOpenChange(false);
  }

  // Handle profile update error
  function handleProfileUpdateError(error: Error) {
    console.error('Error updating profile:', error);
    toast({
      title: 'خطا در بروزرسانی',
      description: 'مشکلی در بروزرسانی اطلاعات پیش آمد',
      variant: 'destructive',
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
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
          <DialogTitle>ویرایش اطلاعات حساب</DialogTitle>
          <DialogDescription>
            اطلاعات شخصی خود را بروزرسانی کنید
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">نام کامل *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="نام کامل خود را وارد کنید"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              ایمیل قابل تغییر نیست
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">شماره تلفن</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="شماره تلفن خود را وارد کنید"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">آدرس</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="آدرس خود را وارد کنید"
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
              disabled={updateLoading || !formData.fullName}
              className="flex-1"
            >
              {updateLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              بروزرسانی
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;