import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiClient, WalletAdjustmentDto } from '@/lib/api-client';
import { WalletService } from '@/lib/walletService';

interface AdminWalletAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  userName: string;
  currentBalance: number;
  onAdjustmentComplete: () => void;
}

const AdminWalletAdjustmentDialog: React.FC<AdminWalletAdjustmentDialogProps> = ({
  open,
  onOpenChange,
  walletId,
  userName,
  currentBalance,
  onAdjustmentComplete,
}) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'credit' | 'debit' | 'correction'>('credit');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !reason.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً مبلغ و دلیل را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    const adjustmentAmount = parseFloat(amount);
    if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
      toast({
        title: 'خطا',
        description: 'مبلغ باید عدد مثبت باشد',
        variant: 'destructive',
      });
      return;
    }

    // Check if debit would result in negative balance
    if (type === 'debit' && adjustmentAmount > currentBalance) {
      toast({
        title: 'خطا',
        description: 'موجودی کیف پول برای این عملیات کافی نیست',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const payload: WalletAdjustmentDto = {
        amount: adjustmentAmount,
        type,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      const result = await apiClient.adjustWalletBalance(walletId, payload);
      
      if (result.success) {
        toast({
          title: 'عملیات موفق',
          description: `موجودی کیف پول ${userName} با موفقیت تنظیم شد`,
        });
        
        // Reset form
        setAmount('');
        setType('credit');
        setReason('');
        setNotes('');
        onOpenChange(false);
        onAdjustmentComplete();
      } else {
        throw new Error('عملیات ناموفق بود');
      }
    } catch (error) {
      console.error('Error adjusting wallet balance:', error);
      toast({
        title: 'خطا در تنظیم موجودی',
        description: 'مشکلی در تنظیم موجودی کیف پول پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getNewBalance = () => {
    const adjustmentAmount = parseFloat(amount) || 0;
    switch (type) {
      case 'credit':
        return currentBalance + adjustmentAmount;
      case 'debit':
        return currentBalance - adjustmentAmount;
      case 'correction':
        return adjustmentAmount; // Correction replaces the balance
      default:
        return currentBalance;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تنظیم موجودی کیف پول</DialogTitle>
          <DialogDescription>
            تنظیم موجودی کیف پول کاربر: {userName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="current-balance">موجودی فعلی</Label>
            <Input
              id="current-balance"
              value={WalletService.formatAmount(currentBalance)}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="adjustment-type">نوع عملیات</Label>
            <Select value={type} onValueChange={(value: 'credit' | 'debit' | 'correction') => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">افزایش موجودی</SelectItem>
                <SelectItem value="debit">کاهش موجودی</SelectItem>
                <SelectItem value="correction">تصحیح موجودی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">مبلغ (تومان)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="مثال: 1000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1000"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">دلیل *</Label>
            <Input
              id="reason"
              placeholder="دلیل تنظیم موجودی"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">توضیحات (اختیاری)</Label>
            <Textarea
              id="notes"
              placeholder="توضیحات اضافی..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {amount && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">موجودی جدید:</div>
              <div className="text-lg font-bold text-primary">
                {WalletService.formatAmount(getNewBalance())}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'در حال پردازش...' : 'اعمال تغییرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWalletAdjustmentDialog;
