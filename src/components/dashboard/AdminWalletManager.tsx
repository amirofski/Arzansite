import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet as WalletIcon, Plus, Minus, History, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletService } from '@/lib/walletService';
import { supabase } from '@/integrations/supabase/client';
import type { Wallet, Transaction } from '@/lib/walletService';

interface AdminWalletManagerProps {
  userId: string;
  userName: string;
}

const AdminWalletManager: React.FC<AdminWalletManagerProps> = ({ userId, userName }) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [debitDialogOpen, setDebitDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [userId]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [walletData, transactionsData] = await Promise.all([
        WalletService.getWallet(userId),
        WalletService.getTransactions(userId, 20)
      ]);
      
      setWallet(walletData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: 'خطا در بارگیری اطلاعات کیف پول',
        description: 'مشکلی در دریافت اطلاعات کیف پول پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCredit = async () => {
    const creditAmount = parseFloat(amount);
    if (!creditAmount || creditAmount <= 0) {
      toast({
        title: 'مبلغ نامعتبر',
        description: 'لطفاً مبلغ معتبری وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const transactionId = await WalletService.creditUser(
        userId,
        creditAmount,
        description || `اعتبار ادمین: ${description}`
      );

      if (transactionId) {
        toast({
          title: 'اعتبار موفق',
          description: `${WalletService.formatAmount(creditAmount)} با موفقیت به کیف پول کاربر اضافه شد`,
        });
        setCreditDialogOpen(false);
        setAmount('');
        setDescription('');
        fetchWalletData(); // Refresh data
      } else {
        throw new Error('Failed to process credit');
      }
    } catch (error) {
      console.error('Error crediting user:', error);
      toast({
        title: 'خطا در اعتبار',
        description: 'مشکلی در اعتبار کاربر پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDebit = async () => {
    const debitAmount = parseFloat(amount);
    if (!debitAmount || debitAmount <= 0) {
      toast({
        title: 'مبلغ نامعتبر',
        description: 'لطفاً مبلغ معتبری وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    if (wallet && debitAmount > wallet.balance) {
      toast({
        title: 'موجودی ناکافی',
        description: 'موجودی کیف پول کاربر کمتر از مبلغ درخواستی است',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const transactionId = await WalletService.debitUser(
        userId,
        debitAmount,
        description || `کسر ادمین: ${description}`
      );

      if (transactionId) {
        toast({
          title: 'کسر موفق',
          description: `${WalletService.formatAmount(debitAmount)} با موفقیت از کیف پول کاربر کسر شد`,
        });
        setDebitDialogOpen(false);
        setAmount('');
        setDescription('');
        fetchWalletData(); // Refresh data
      } else {
        throw new Error('Failed to process debit');
      }
    } catch (error) {
      console.error('Error debiting user:', error);
      toast({
        title: 'خطا در کسر',
        description: 'مشکلی در کسر از کیف پول کاربر پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            <CardTitle>مدیریت کیف پول</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              <CardTitle>مدیریت کیف پول - {userName}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreditDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                اعتبار
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDebitDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Minus className="w-4 h-4" />
                کسر
              </Button>
            </div>
          </div>
          <CardDescription>
            موجودی فعلی و تراکنش‌های کیف پول کاربر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Balance Display */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {wallet ? WalletService.formatAmount(wallet.balance) : '0 تومان'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                موجودی فعلی
              </div>
            </div>

            {/* Transactions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4" />
                <h4 className="font-medium">تراکنش‌ها</h4>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  هیچ تراکنشی یافت نشد
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-background border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {WalletService.getTransactionTypeText(transaction.type as any)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${WalletService.getTransactionStatusColor(transaction.status)}`}
                          >
                            {WalletService.getTransactionStatusText(transaction.status)}
                          </Badge>
                        </div>
                        {transaction.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {transaction.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                      <div className={`font-medium ${WalletService.getTransactionTypeColor(transaction.type as any)}`}>
                        {transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'credit' ? '+' : '-'}
                        {WalletService.formatAmount(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اعتبار به کیف پول</DialogTitle>
            <DialogDescription>
              مبلغ و توضیحات اعتبار به کیف پول کاربر را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="credit-amount">مبلغ (تومان)</Label>
              <Input
                id="credit-amount"
                type="number"
                placeholder="مثال: 100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <Label htmlFor="credit-description">توضیحات (اختیاری)</Label>
              <Input
                id="credit-description"
                placeholder="دلیل اعتبار"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreditDialogOpen(false)}
                disabled={processing}
              >
                انصراف
              </Button>
              <Button
                onClick={handleCredit}
                disabled={processing || !amount}
                className="flex items-center gap-1"
              >
                {processing ? 'در حال پردازش...' : 'اعتبار'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debit Dialog */}
      <Dialog open={debitDialogOpen} onOpenChange={setDebitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>کسر از کیف پول</DialogTitle>
            <DialogDescription>
              مبلغ و توضیحات کسر از کیف پول کاربر را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="debit-amount">مبلغ (تومان)</Label>
              <Input
                id="debit-amount"
                type="number"
                placeholder="مثال: 100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <Label htmlFor="debit-description">توضیحات (اختیاری)</Label>
              <Input
                id="debit-description"
                placeholder="دلیل کسر"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDebitDialogOpen(false)}
                disabled={processing}
              >
                انصراف
              </Button>
              <Button
                onClick={handleDebit}
                disabled={processing || !amount}
                className="flex items-center gap-1"
              >
                {processing ? 'در حال پردازش...' : 'کسر'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminWalletManager; 