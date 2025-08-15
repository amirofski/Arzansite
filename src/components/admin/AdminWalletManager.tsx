import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet as WalletIcon, Plus, Minus, History, Search, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletService } from '@/lib/walletService';
import { apiClient, AdminWalletSummary } from '@/lib/api-client';
import AdminWalletAdjustmentDialog from './AdminWalletAdjustmentDialog';
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
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAdjustmentComplete = () => {
    fetchWalletData();
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
            <CardTitle>کیف پول {userName}</CardTitle>
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
              <CardTitle>کیف پول {userName}</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => setAdjustmentDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              تنظیم موجودی
            </Button>
          </div>
          <CardDescription>
            مدیریت کیف پول و تراکنش‌های کاربر
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
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
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

      {/* Wallet Adjustment Dialog */}
      <AdminWalletAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        walletId={userId}
        userName={userName}
        currentBalance={wallet?.balance || 0}
        onAdjustmentComplete={handleAdjustmentComplete}
      />
    </>
  );
};

export default AdminWalletManager;
