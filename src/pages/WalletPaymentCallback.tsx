import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { WalletService } from "@/lib/walletService";
import { CheckCircle, XCircle, Loader2, RefreshCw, Home, Wallet, Receipt, AlertCircle, CreditCard } from 'lucide-react';
import Layout from "@/components/ui/Layout";

// ZarinPal Payment Status Constants
const PAYMENT_STATUS = {
  OK: 'success',      // Payment successful
  NOK: 'failed',      // Payment failed/cancelled
  PENDING: 'pending'  // Payment in progress
} as const;

const getPaymentStatusMessage = (status: string) => {
  switch (status) {
    case 'OK':
      return 'پرداخت با موفقیت انجام شد';
    case 'NOK':
      return 'پرداخت ناموفق بود یا لغو شد';
    default:
      return 'وضعیت پرداخت نامشخص است';
  }
};

// Payment error handling utilities
const getPaymentErrorMessage = (error: string): string => {
  if (error.includes('amount')) return 'مبلغ پرداخت نامعتبر است';
  if (error.includes('authority')) return 'کد پرداخت نامعتبر است';
  if (error.includes('timeout')) return 'زمان پرداخت به پایان رسید';
  if (error.includes('network')) return 'خطا در ارتباط با درگاه پرداخت';
  return error || 'خطا در پردازش پرداخت';
};

// Payment recovery suggestions
const getPaymentRecoveryTips = (status: string): string[] => {
  if (status === 'failed') {
    return [
      'اطمینان حاصل کنید که اطلاعات کارت بانکی صحیح است',
      'موجودی حساب کافی باشد',
      'در صورت مشکل، با پشتیبانی تماس بگیرید',
      'می‌توانید دوباره تلاش کنید'
    ];
  }
  return [];
};

interface WalletPaymentInfo {
  orderId: string;
  amount: number;
  type: string;
  userId: string;
  timestamp: number;
  description: string;
}

const WalletPaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [refId, setRefId] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState<WalletPaymentInfo | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [verificationError, setVerificationError] = useState<string>('');

  useEffect(() => {
    const verifyWalletPayment = async () => {
      const authority = searchParams.get('Authority');
      const statusParam = searchParams.get('Status');
      const orderId = searchParams.get('order_id');

      // Get stored payment info
      const storedPaymentInfo = sessionStorage.getItem('walletPaymentInfo');
      if (storedPaymentInfo) {
        try {
          const parsedInfo = JSON.parse(storedPaymentInfo);
          setPaymentInfo(parsedInfo);
        } catch (error) {
          console.error('Error parsing stored payment info:', error);
        }
      }

      if (!authority || !orderId) {
        setStatus('failed');
        toast({
          title: "خطا",
          description: "اطلاعات پرداخت ناقص است",
          variant: "destructive",
        });
        return;
      }

      if (statusParam === 'NOK') {
        setStatus('failed');
        toast({
          title: "پرداخت لغو شد",
          description: getPaymentStatusMessage('NOK'),
          variant: "destructive",
        });
        return;
      }

             try {
         // Verify wallet deposit payment
         const verificationData = await apiClient.verifyWalletDeposit({ 
           orderId: orderId || undefined,
           authority: authority
         });

         if (verificationData?.success) {
           setStatus('success');
           setRefId(verificationData.refId || '');
           setNewBalance(verificationData.newBalance || null);
           
           toast({
             title: "✅ شارژ کیف پول موفق",
             description: `مبلغ ${WalletService.formatAmount(paymentInfo?.amount || 0)} با موفقیت به کیف پول شما اضافه شد`,
           });
         } else {
           setStatus('failed');
           const errorMsg = verificationData?.error || "پرداخت موفقیت‌آمیز نبود";
           setVerificationError(errorMsg);
           toast({
             title: "خطا در پرداخت",
             description: errorMsg,
             variant: "destructive",
           });
         }
      } catch (error: unknown) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        const errorMessage = error instanceof Error ? error.message : "مشکلی در تأیید پرداخت پیش آمد";
        setVerificationError(errorMessage);
        toast({
          title: "خطا در تأیید پرداخت",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    verifyWalletPayment();
  }, [searchParams, toast]);

  const handleBackToDashboard = () => {
    sessionStorage.removeItem('walletPaymentInfo');
    navigate('/dashboard?tab=wallet&payment_success=true');
  };

  const handleBackToHome = () => {
    sessionStorage.removeItem('walletPaymentInfo');
    navigate('/');
  };

  const handleRetryPayment = async () => {
    if (!paymentInfo) {
      toast({
        title: "خطا",
        description: "اطلاعات پرداخت در دسترس نیست",
        variant: "destructive",
      });
      return;
    }

    setIsRetrying(true);
    try {
      // Request new wallet deposit for retry
             const depositPayload = {
         amount: Math.floor(paymentInfo.amount * 10), // Convert Tomans to Rials (1 Toman = 10 Rials)
         description: paymentInfo.description
       };
      
      console.log('Requesting retry wallet deposit with payload:', depositPayload);
      const depositData = await apiClient.requestWalletDeposit(depositPayload);
      console.log('Retry wallet deposit response:', depositData);
      
      // Update stored payment info
      const updatedPaymentInfo = {
        ...paymentInfo,
        orderId: depositData.orderId,
        timestamp: Date.now()
      };
      sessionStorage.setItem('walletPaymentInfo', JSON.stringify(updatedPaymentInfo));
      setPaymentInfo(updatedPaymentInfo);

      if (depositData.paymentUrl) {
        window.location.href = depositData.paymentUrl;
      } else {
        throw new Error('Failed to create deposit request');
      }
    } catch (error) {
      console.error('Retry payment error:', error);
      toast({
        title: "خطا در تلاش مجدد",
        description: error instanceof Error ? error.message : "مشکلی در ایجاد درخواست پرداخت پیش آمد",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-16 h-16 text-green-600" />
              )}
              {status === 'failed' && (
                <XCircle className="w-16 h-16 text-red-600" />
              )}
            </div>
            <CardTitle className="text-xl">
              {status === 'loading' && 'در حال بررسی شارژ کیف پول...'}
              {status === 'success' && 'شارژ کیف پول موفق'}
              {status === 'failed' && 'شارژ کیف پول ناموفق'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'loading' && (
              <p className="text-muted-foreground">
                لطفاً صبر کنید، در حال تأیید پرداخت شما هستیم...
              </p>
            )}
            
            {status === 'success' && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Wallet className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">شارژ کیف پول موفق</span>
                  </div>
                  {paymentInfo && (
                    <p className="text-green-700 mb-2">
                      مبلغ {formatAmount(paymentInfo.amount)} با موفقیت به کیف پول شما اضافه شد
                    </p>
                  )}
                  {newBalance !== null && (
                    <p className="text-green-700">
                      موجودی جدید: {formatAmount(newBalance)}
                    </p>
                  )}
                </div>
                
                {refId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <Receipt className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">رسید پرداخت</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      <strong>کد پیگیری:</strong> {refId}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  رسید پرداخت در بخش رسیدها ذخیره شده است
                </p>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">شارژ کیف پول ناموفق</span>
                  </div>
                  {paymentInfo && (
                    <p className="text-red-700 mb-2">
                      مبلغ {formatAmount(paymentInfo.amount)} شارژ نشد
                    </p>
                  )}
                  {verificationError && (
                    <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                      <p className="text-xs text-red-800 font-medium">جزئیات خطا:</p>
                      <p className="text-xs text-red-700">{getPaymentErrorMessage(verificationError)}</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>راهنمای رفع مشکل:</strong>
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {getPaymentRecoveryTips('failed').map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
                
                {paymentInfo && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>مبلغ درخواستی:</strong> {formatAmount(paymentInfo.amount)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>تاریخ درخواست:</strong> {new Date(paymentInfo.timestamp).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                )}
              </>
            )}
            
            <div className="flex flex-col gap-2">
              {status === 'success' && (
                <>
                  <Button 
                    onClick={handleBackToDashboard}
                    className="w-full"
                  >
                    <Wallet className="w-4 h-4 ml-2" />
                    بازگشت به کیف پول
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleBackToHome}
                    className="w-full"
                  >
                    <Home className="w-4 h-4 ml-2" />
                    بازگشت به صفحه اصلی
                  </Button>
                </>
              )}
              
              {status === 'failed' && (
                <>
                  <Button 
                    onClick={handleRetryPayment}
                    disabled={isRetrying}
                    className="w-full"
                  >
                    {isRetrying ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 ml-2" />
                    )}
                    {isRetrying ? 'در حال پردازش...' : 'تلاش مجدد'}
                  </Button>
                  <Button 
                    onClick={handleBackToDashboard}
                    variant="outline"
                    className="w-full"
                  >
                    <Wallet className="w-4 h-4 ml-2" />
                    بازگشت به کیف پول
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleBackToHome}
                    className="w-full"
                  >
                    <Home className="w-4 h-4 ml-2" />
                    بازگشت به صفحه اصلی
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WalletPaymentCallback;
