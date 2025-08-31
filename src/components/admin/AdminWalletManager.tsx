import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet as WalletIcon, Plus, Minus, History, Search, Settings, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletService } from '@/lib/walletService';
import { apiClient, AdminWalletSummary, WalletAdjustment } from '@/lib/api-client';
import AdminWalletAdjustmentDialog from './AdminWalletAdjustmentDialog';
import type { Wallet, Transaction } from '@/lib/walletService';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';

interface AdminWalletManagerProps {
  userId: string;
  userName: string;
}

const AdminWalletManager: React.FC<AdminWalletManagerProps> = ({ userId, userName }) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [adjustments, setAdjustments] = useState<WalletAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdjustments, setLoadingAdjustments] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adjustmentFilter, setAdjustmentFilter] = useState<string>('all');

  // Pagination for adjustments
  const {
    currentItems: currentAdjustments,
    totalPages: adjustmentsTotalPages,
    currentPage: adjustmentsCurrentPage,
    setCurrentPage: setAdjustmentsCurrentPage,
    totalItems: adjustmentsTotalItems
  } = usePagination({
    data: adjustments,
    itemsPerPage: 10,
    searchTerm: '',
    filterFunction: (adjustment: WalletAdjustment) => {
      if (adjustmentFilter === 'all') return true;
      return adjustment.type === adjustmentFilter;
    }
  });

  useEffect(() => {
    fetchWalletData();
    fetchAdjustmentHistory();
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

  const fetchAdjustmentHistory = async () => {
    setLoadingAdjustments(true);
    try {
      const result = await apiClient.getWalletAdjustmentHistory(userId, {
        page: 1,
        limit: 100,
        type: adjustmentFilter !== 'all' ? adjustmentFilter : undefined
      });
      setAdjustments(result.adjustments || []);
    } catch (error) {
      console.error('Error fetching adjustment history:', error);
      toast({
        title: 'خطا در بارگیری تاریخچه تنظیمات',
        description: 'مشکلی در دریافت تاریخچه تنظیمات پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoadingAdjustments(false);
    }
  };

  const handleAdjustmentComplete = () => {
    fetchWalletData();
    fetchAdjustmentHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getAdjustmentTypeText = (type: string) => {
    switch (type) {
      case 'credit': return 'افزایش موجودی';
      case 'debit': return 'کاهش موجودی';
      case 'correction': return 'تصحیح موجودی';
      default: return type;
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'text-green-600';
      case 'debit': return 'text-red-600';
      case 'correction': return 'text-blue-600';
      default: return 'text-gray-600';
    }
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

            {/* Adjustment History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <h4 className="font-medium">تاریخچه تنظیمات</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={adjustmentFilter} onValueChange={setAdjustmentFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="credit">افزایش</SelectItem>
                      <SelectItem value="debit">کاهش</SelectItem>
                      <SelectItem value="correction">تصحیح</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchAdjustmentHistory}
                    disabled={loadingAdjustments}
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAdjustments ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {loadingAdjustments ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  در حال بارگیری...
                </div>
              ) : currentAdjustments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  هیچ تنظیمی یافت نشد
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentAdjustments.map((adjustment) => (
                    <div
                      key={adjustment.id}
                      className="flex items-center justify-between p-3 bg-background border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${getAdjustmentTypeColor(adjustment.type)}`}>
                            {getAdjustmentTypeText(adjustment.type)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {adjustment.adminName}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {adjustment.reason}
                        </div>
                        {adjustment.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {adjustment.notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(adjustment.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getAdjustmentTypeColor(adjustment.type)}`}>
                          {adjustment.type === 'credit' ? '+' : adjustment.type === 'debit' ? '-' : '='}
                          {WalletService.formatAmount(adjustment.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {WalletService.formatAmount(adjustment.balanceBefore)} → {WalletService.formatAmount(adjustment.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <PaginationControls
                    currentPage={adjustmentsCurrentPage}
                    totalPages={adjustmentsTotalPages}
                    onPageChange={setAdjustmentsCurrentPage}
                    totalItems={adjustmentsTotalItems}
                    itemsPerPage={10}
                  />
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
