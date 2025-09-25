import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  RefreshCw, 
  X, 
  Eye, 
  DollarSign, 
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { paymentService, adminService } from '@/lib/services';
import { formatAmount } from '@/lib/currencyUtils';
import { useToast } from '@/hooks/use-toast';
import { AnimatedLoader } from '@/components/ui/AnimatedLoader';

interface AdminPaymentManagerProps {
  orderId: string;
  orderTitle: string;
  orderPrice: number;
  paymentStatus: string;
  zarinpalAuthority?: string;
  zarinpalRefId?: string;
  onStatusUpdate: () => void;
}

const AdminPaymentManager = ({
  orderId,
  orderTitle,
  orderPrice,
  paymentStatus,
  zarinpalAuthority,
  zarinpalRefId,
  onStatusUpdate
}: AdminPaymentManagerProps) => {
  type PaymentTransaction = {
    id: string;
    transaction_type: 'payment_request' | 'payment_verification' | 'refund' | 'cancellation' | string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | string;
    created_at: string;
    amount: number;
    zarinpal_authority?: string;
    zarinpal_ref_id?: string;
    metadata?: Record<string, unknown>;
  };
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(orderPrice);
  const [refundReason, setRefundReason] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (dialogOpen) {
      loadTransactions();
    }
  }, [dialogOpen, orderId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // Prefer new per-order payments endpoint with pagination
      const resp = await paymentService.getPaymentsForOrder(orderId, { page: 1, limit: 20 });
      const items = Array.isArray((resp as any)?.items) ? (resp as any).items : [];
      const tx = items.map((p: any) => ({
        id: p.id || p.$id || `${p.order_id}-${p.created_at || p.createdAt}`,
        transaction_type: p.status === 'pending' ? 'payment_request' : (p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid') ? 'payment_verification' : 'payment_verification',
        status: p.status || 'pending',
        created_at: p.created_at || p.createdAt || new Date().toISOString(),
        amount: p.amount || 0,
        zarinpal_authority: p.authority,
        zarinpal_ref_id: p.ref_id,
        metadata: {},
      })) as PaymentTransaction[];
      setTransactions(tx);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: 'خطا در بارگیری تراکنش‌ها',
        description: 'مشکلی در دریافت اطلاعات تراکنش‌ها پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundAmount || refundAmount <= 0) {
      toast({
        title: 'خطا',
        description: 'مبلغ بازپرداخت باید بیشتر از صفر باشد',
        variant: 'destructive',
      });
      return;
    }

    setProcessingAction('refund');
    try {
      // Find a completed payment for this order to refund
      const history = await paymentService.getPaymentHistory({ limit: 50 });
      const orderPayments = (history.payments || []).filter(p => (p as any).orderId === orderId);
      const completed = orderPayments.find(p => (p as any).status === 'completed' || (p as any).status === 'succeeded');
      if (!completed) throw new Error('هیچ پرداخت تکمیل‌شده‌ای برای این سفارش یافت نشد');

      const result = await paymentService.refundPayment(completed.id, refundAmount);
      
      if (result.success) {
        toast({
          title: 'بازپرداخت موفق',
          description: `${formatAmount(refundAmount, 'RIAL')} با موفقیت بازپرداخت شد`,
        });
        onStatusUpdate();
        setDialogOpen(false);
      } else {
        throw new Error('بازپرداخت ناموفق بود');
      }
    } catch (error: any) {
      toast({
        title: 'خطا در بازپرداخت',
        description: error.message || 'مشکلی در بازپرداخت پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCancel = async () => {
    setProcessingAction('cancel');
    try {
      // Cancel the order via admin service
      await adminService.updateOrder(orderId, { status: 'cancelled' });
      toast({
        title: 'لغو موفق',
        description: 'سفارش با موفقیت لغو شد',
      });
      onStatusUpdate();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'خطا در لغو',
        description: error.message || 'مشکلی در لغو سفارش پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment_request':
        return <CreditCard className="w-4 h-4" />;
      case 'payment_verification':
        return <CheckCircle className="w-4 h-4" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4" />;
      case 'cancellation':
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'payment_request':
        return 'درخواست پرداخت';
      case 'payment_verification':
        return 'تأیید پرداخت';
      case 'refund':
        return 'بازپرداخت';
      case 'cancellation':
        return 'لغو';
      default:
        return type;
    }
  };

  const renderTransactionDetails = (transaction: PaymentTransaction) => (
    <Card key={transaction.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTransactionIcon(transaction.transaction_type)}
            <div>
              <h4 className="font-medium">{getTransactionTypeText(transaction.transaction_type)}</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(transaction.created_at).toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getTransactionStatusColor(transaction.status)}>
              {transaction.status === 'completed' ? 'موفق' : 
               transaction.status === 'pending' ? 'در انتظار' :
               transaction.status === 'failed' ? 'ناموفق' : 'لغو شده'}
            </Badge>
            <p className="text-sm font-medium mt-1">
              {formatAmount(transaction.amount, 'RIAL')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {transaction.zarinpal_authority && (
            <div>
              <Label className="text-muted-foreground">Authority:</Label>
              <p className="font-mono text-xs">{transaction.zarinpal_authority}</p>
            </div>
          )}
          {transaction.zarinpal_ref_id && (
            <div>
              <Label className="text-muted-foreground">Ref ID:</Label>
              <p className="font-mono text-xs">{transaction.zarinpal_ref_id}</p>
            </div>
          )}
        </div>
        {transaction.metadata && (
          <div className="mt-3 p-2 bg-muted rounded text-xs">
            <Label className="text-muted-foreground">متادیتا:</Label>
            <pre className="mt-1 overflow-x-auto">
              {JSON.stringify(transaction.metadata, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        مدیریت پرداخت
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              مدیریت پرداخت - {orderTitle}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">نمای کلی</TabsTrigger>
              <TabsTrigger value="transactions">تراکنش‌ها</TabsTrigger>
              <TabsTrigger value="actions">عملیات</TabsTrigger>
            </TabsList>

            <div className="mt-4 h-[calc(90vh-200px)]">
              <TabsContent value="overview" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          اطلاعات پرداخت
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">وضعیت پرداخت</Label>
                            <div className="mt-1">
                              <Badge className={paymentStatus === 'paid' || paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                                {paymentStatus === 'paid' || paymentStatus === 'completed' ? 'پرداخت شده' : paymentStatus === 'pending' ? 'در انتظار پرداخت' : paymentStatus === 'failed' ? 'ناموفق' : 'لغو شده'}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">مبلغ سفارش</Label>
                            <p className="mt-1 font-medium">{formatAmount(orderPrice, 'RIAL')}</p>
                          </div>
                        </div>
                        
                        {zarinpalAuthority && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Authority</Label>
                            <p className="mt-1 font-mono text-sm">{zarinpalAuthority}</p>
                          </div>
                        )}
                        
                        {zarinpalRefId && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Ref ID</Label>
                            <p className="mt-1 font-mono text-sm">{zarinpalRefId}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="transactions" className="h-full">
                <ScrollArea className="h-full">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">هیچ تراکنشی یافت نشد</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map(renderTransactionDetails)}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="actions" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {paymentStatus === 'paid' && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5" />
                            بازپرداخت
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="refundAmount">مبلغ بازپرداخت (ریال)</Label>
                            <Input
                              id="refundAmount"
                              type="number"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(Number(e.target.value))}
                              max={orderPrice}
                              min={0}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              حداکثر: {formatAmount(orderPrice, 'RIAL')}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="refundReason">دلیل بازپرداخت (اختیاری)</Label>
                            <Input
                              id="refundReason"
                              value={refundReason}
                              onChange={(e) => setRefundReason(e.target.value)}
                              placeholder="دلیل بازپرداخت..."
                            />
                          </div>
                          <Button
                            onClick={handleRefund}
                            disabled={processingAction === 'refund'}
                            className="w-full"
                          >
                            {processingAction === 'refund' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            بازپرداخت
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {paymentStatus === 'pending' && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <X className="w-5 h-5" />
                            لغو سفارش
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                              <p className="text-sm text-yellow-800">
                                با لغو این سفارش، وضعیت پرداخت به "لغو شده" تغییر خواهد کرد.
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={processingAction === 'cancel'}
                            className="w-full"
                          >
                            {processingAction === 'cancel' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            لغو سفارش
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {paymentStatus !== 'paid' && paymentStatus !== 'pending' && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-8">
                            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              هیچ عملیاتی برای این وضعیت پرداخت در دسترس نیست
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPaymentManager; 