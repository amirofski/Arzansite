import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet as WalletIcon, Plus, ArrowUpDown, History, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletService } from '@/lib/walletService';
// Removed direct Supabase function calls; handled by backend via WalletService
import type { Transaction } from '@/lib/walletService';

interface WalletCardProps {
  userId: string;
}

const WalletCard: React.FC<WalletCardProps> = ({ userId }) => {
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    fetchWalletData();
    // We intentionally don't include fetchWalletData to avoid re-creating the function each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [balanceData, transactionsData] = await Promise.all([
        WalletService.getWalletBalance(userId),
        WalletService.getTransactions(userId, 10)
      ]);
      
      setBalance(balanceData);
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

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 1000) {
      toast({
        title: 'مبلغ نامعتبر',
        description: 'مبلغ باید حداقل 1,000 تومان باشد',
        variant: 'destructive',
      });
      return;
    }

    setDepositing(true);
    try {
      // Create deposit transaction first
      const transactionId = await WalletService.processTransaction(
        userId,
        'deposit',
        amount,
        'شارژ کیف پول',
        undefined,
        'deposit',
        { method: 'zarinpal' }
      );

      if (transactionId) {
        // Initiate payment via backend
        const { apiClient } = await import('@/lib/api-client');
        const payload: { amount: number; description: string; type: string; orderId?: string } = {
          amount: Math.floor(amount / 10),
          description: `شارژ کیف پول - ${WalletService.formatAmount(amount)}`,
          type: 'wallet_deposit',
          orderId: transactionId,
        };
        const paymentData = await apiClient.requestPayment(payload);
        if (paymentData.paymentUrl) {
          window.location.href = paymentData.paymentUrl;
        } else {
          throw new Error('Failed to create payment request');
        }
      } else {
        throw new Error('Failed to create deposit transaction');
      }
    } catch (error) {
      console.error('Error depositing:', error);
      toast({
        title: 'خطا در شارژ',
        description: 'مشکلی در شارژ کیف پول پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setDepositing(false);
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
            <CardTitle>کیف پول</CardTitle>
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
              <CardTitle>کیف پول</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => setDepositDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              شارژ
            </Button>
          </div>
          <CardDescription>
            موجودی فعلی و تراکنش‌های کیف پول شما
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Balance Display */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {WalletService.formatAmount(balance)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                موجودی فعلی
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4" />
                <h4 className="font-medium">آخرین تراکنش‌ها</h4>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  هیچ تراکنشی یافت نشد
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-background border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {WalletService.getTransactionTypeText(transaction.type as import('@/lib/walletService').TransactionType)}
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
                      <div className={`font-medium ${WalletService.getTransactionTypeColor(transaction.type as import('@/lib/walletService').TransactionType)}`}>
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

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>شارژ کیف پول</DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر برای شارژ کیف پول را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount">مبلغ (تومان)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="مثال: 100000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="1000"
                step="1000"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDepositDialogOpen(false)}
                disabled={depositing}
              >
                انصراف
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount}
                className="flex items-center gap-1"
              >
                {depositing ? 'در حال پردازش...' : 'شارژ کیف پول'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletCard; 