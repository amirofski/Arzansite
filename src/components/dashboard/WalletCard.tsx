import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet as WalletIcon, Plus, ArrowUpDown, History, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [depositDescription, setDepositDescription] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    amount: number;
    description: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    // Check if we're returning from a successful payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const tab = urlParams.get('tab');
    
    if (tab === 'wallet' && paymentSuccess === 'true') {
      // Clear the success parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment_success');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Refresh wallet data and show success message
      fetchWalletData(true);
    } else {
      fetchWalletData();
    }
    
    checkPendingPayment();
    // We intentionally don't include fetchWalletData to avoid re-creating the function each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const checkPendingPayment = () => {
    const storedPaymentInfo = sessionStorage.getItem('walletPaymentInfo');
    if (storedPaymentInfo) {
      try {
        const paymentInfo = JSON.parse(storedPaymentInfo);
        // Check if payment is older than 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (paymentInfo.timestamp > oneHourAgo) {
          setPendingPayment({
            orderId: paymentInfo.orderId,
            amount: paymentInfo.amount,
            description: paymentInfo.description,
            timestamp: paymentInfo.timestamp
          });
        } else {
          // Remove expired payment info
          sessionStorage.removeItem('walletPaymentInfo');
          toast({
            title: 'پرداخت منقضی شده',
            description: 'پرداخت قبلی منقضی شده است. لطفاً دوباره تلاش کنید',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error parsing stored payment info:', error);
        sessionStorage.removeItem('walletPaymentInfo');
      }
    }
  };

  const fetchWalletData = async (showSuccessMessage = false) => {
    setLoading(true);
    try {
      const [balanceData, transactionsData] = await Promise.all([
        WalletService.getWalletBalance(userId),
        WalletService.getTransactions(userId, 10)
      ]);
      
      const previousBalance = balance;
      setBalance(balanceData);
      console.log('Fetched transactions:', transactionsData);
      
      // Validate transaction data and ensure unique IDs
      const validatedTransactions = transactionsData.map((transaction, index) => {
        if (!transaction.id) {
          console.warn(`Transaction at index ${index} has no ID:`, transaction);
          return { ...transaction, id: `temp-${index}-${Date.now()}` };
        }
        return transaction;
      });
      
      console.log('Validated transactions:', validatedTransactions);
      setTransactions(validatedTransactions);
      
      // Show success message if balance increased
      if (showSuccessMessage && balanceData > previousBalance) {
        const increase = balanceData - previousBalance;
        toast({
          title: 'شارژ کیف پول موفق',
          description: `مبلغ ${WalletService.formatAmount(increase)} با موفقیت به کیف پول شما اضافه شد`,
        });
      }
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

  const resetDepositForm = () => {
    setDepositAmount('');
    setDepositDescription('');
    setDepositDialogOpen(false);
  };

  const validateDepositForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!depositAmount || parseFloat(depositAmount) < 100000) {
      errors.push('مبلغ باید حداقل ۱۰۰,۰۰۰ تومان (۱,۰۰۰,۰۰۰ ریال) باشد');
    }
    
    if (parseFloat(depositAmount) > 999999999) {
      errors.push('حداکثر مبلغ شارژ ۹۹۹,۹۹۹,۹۹۹ تومان است');
    }
    
    if (depositDescription && depositDescription.trim().length < 3) {
      errors.push('توضیحات باید حداقل ۳ کاراکتر باشد');
    }
    
    if (depositDescription && depositDescription.length > 255) {
      errors.push('توضیحات نمی‌تواند بیش از ۲۵۵ کاراکتر باشد');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleDeposit = async () => {
    const validation = validateDepositForm();
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({
          title: 'خطا در اعتبارسنجی',
          description: error,
          variant: 'destructive',
        });
      });
      return;
    }

    const amount = parseFloat(depositAmount);
    
    // Check for existing pending payment
    const existingPayment = sessionStorage.getItem('walletPaymentInfo');
    if (existingPayment) {
      toast({
        title: 'پرداخت در انتظار',
        description: 'شما یک پرداخت در انتظار دارید. لطفاً ابتدا آن را تکمیل کنید',
        variant: 'destructive',
      });
      return;
    }

    setDepositing(true);
    try {
      console.log('Requesting wallet deposit for amount:', amount);
      
      // Use the dedicated wallet deposit endpoint
      const { apiClient } = await import('@/lib/api-client');
      const depositPayload = {
        amount: Math.floor(amount * 10), // Convert Tomans to Rials (1 Toman = 10 Rials)
        description: depositDescription || `شارژ کیف پول - ${WalletService.formatAmount(amount)}`
      };
      
      console.log('Requesting wallet deposit with payload:', depositPayload);
      console.log('Amount in Tomans:', amount);
      console.log('Amount in Rials:', depositPayload.amount);
      
      const depositData = await apiClient.requestWalletDeposit(depositPayload);
      console.log('Wallet deposit response:', depositData);
      
      // Store payment information for callback handling
      const paymentInfo = {
        orderId: depositData.orderId,
        amount,
        type: 'wallet_deposit',
        userId,
        timestamp: Date.now(),
        description: depositDescription || `شارژ کیف پول - ${WalletService.formatAmount(amount)}`
      };
      
      // Store in session storage for callback handling
      sessionStorage.setItem('walletPaymentInfo', JSON.stringify(paymentInfo));
      
      if (depositData.paymentUrl) {
        console.log('Redirecting to payment URL:', depositData.paymentUrl);
        // Add callback URL parameter for wallet payment
        const callbackUrl = `${window.location.origin}/wallet-payment-callback`;
        const paymentUrlWithCallback = `${depositData.paymentUrl}&callback_url=${encodeURIComponent(callbackUrl)}`;
        window.location.href = paymentUrlWithCallback;
      } else {
        throw new Error('Failed to create deposit request - no payment URL received');
      }
    } catch (error) {
      console.error('Error depositing:', error);
      
      // Extract specific error message from backend
      let errorMessage = 'مشکلی در شارژ کیف پول پیش آمد';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        if (typeof errorObj.message === 'string') {
          errorMessage = errorObj.message;
        } else if (typeof errorObj.error === 'string') {
          errorMessage = errorObj.error;
        }
      }
      
      toast({
        title: 'خطا در شارژ',
        description: errorMessage,
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

            {/* Payment Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-lg font-bold text-green-700">
                  {transactions.filter(t => t.type === 'deposit' || t.type === 'credit').length}
                </div>
                <div className="text-xs text-green-600">شارژهای موفق</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-700">
                  {transactions.filter(t => t.type === 'withdrawal' || t.type === 'debit').length}
                </div>
                <div className="text-xs text-blue-600">برداشت‌ها</div>
              </div>
            </div>

            {/* Pending Payment Alert */}
            {pendingPayment && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">پرداخت در انتظار</span>
                </div>
                <p className="text-sm text-yellow-700 mb-2">
                  {pendingPayment.description} - {WalletService.formatAmount(pendingPayment.amount)}
                </p>
                <p className="text-xs text-yellow-600 mb-3">
                  تاریخ: {new Date(pendingPayment.timestamp).toLocaleDateString('fa-IR')}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        // Request wallet deposit for the pending payment
                        const { apiClient } = await import('@/lib/api-client');
                        const depositPayload = {
                          amount: Math.floor(pendingPayment.amount * 10), // Convert Tomans to Rials (1 Toman = 10 Rials)
                          description: pendingPayment.description
                        };
                        
                        const depositData = await apiClient.requestWalletDeposit(depositPayload);
                        
                        if (depositData.paymentUrl) {
                          const callbackUrl = `${window.location.origin}/wallet-payment-callback`;
                          const paymentUrlWithCallback = `${depositData.paymentUrl}&callback_url=${encodeURIComponent(callbackUrl)}`;
                          window.location.href = paymentUrlWithCallback;
                        } else {
                          throw new Error('Failed to create deposit request');
                        }
                      } catch (error) {
                        console.error('Error continuing payment:', error);
                        toast({
                          title: 'خطا در ادامه پرداخت',
                          description: error instanceof Error ? error.message : 'مشکلی در ادامه پرداخت پیش آمد',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    ادامه پرداخت
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      sessionStorage.removeItem('walletPaymentInfo');
                      setPendingPayment(null);
                    }}
                  >
                    لغو
                  </Button>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <h4 className="font-medium">آخرین تراکنش‌ها</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchWalletData()}
                  disabled={loading}
                  className="h-8 px-2"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  هیچ تراکنشی یافت نشد
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <div
                      key={transaction.id || `transaction-${index}`}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              شارژ کیف پول
            </DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر برای شارژ کیف پول را وارد کنید. حداقل مبلغ: ۱۰۰,۰۰۰ تومان
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount" className="text-sm font-medium">
                مبلغ (تومان) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="مثال: ۱۰۰,۰۰۰"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="100000"
                step="10000"
                className="mt-1"
                disabled={depositing}
              />
              <div className="text-xs text-muted-foreground mt-1">
                حداقل مبلغ: ۱۰۰,۰۰۰ تومان (۱,۰۰۰,۰۰۰ ریال)
              </div>
              {depositAmount && parseFloat(depositAmount) >= 100000 && (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  معادل: {WalletService.formatAmount(parseFloat(depositAmount))} تومان
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="deposit-description" className="text-sm font-medium">
                توضیحات (اختیاری)
              </Label>
              <textarea
                id="deposit-description"
                placeholder="توضیحات شارژ کیف پول (اختیاری)"
                value={depositDescription}
                onChange={(e) => setDepositDescription(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm resize-none"
                rows={3}
                maxLength={255}
                disabled={depositing}
              />
              <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>حداقل ۳ کاراکتر</span>
                <span className={depositDescription.length > 255 ? 'text-red-500' : ''}>
                  {depositDescription.length}/255 کاراکتر
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetDepositForm}
                disabled={depositing}
              >
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleDeposit}
                disabled={depositing || !depositAmount || parseFloat(depositAmount) < 100000}
                className="flex items-center gap-1"
              >
                {depositing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    شارژ کیف پول
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletCard; 