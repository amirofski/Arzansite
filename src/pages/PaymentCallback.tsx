import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { CheckCircle, XCircle, Loader2, RefreshCw, Home, CreditCard } from 'lucide-react';
import Layout from "@/components/ui/Layout";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [refId, setRefId] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      const authority = searchParams.get('Authority');
      const statusParam = searchParams.get('Status');
      let orderId = searchParams.get('order_id');

      // If we have authority but no orderId, try to create order from pending payload
      if (authority && !orderId) {
        try {
          const raw = localStorage.getItem('pending_order_payload');
          if (raw) {
            const payload = JSON.parse(raw);
            const created = await apiClient.createOrder(payload);
            orderId = created?.id;
            // Clear stored payload now that order exists
            localStorage.removeItem('pending_order_payload');
          }
        } catch (e) {
          // ignore and proceed to verify without orderId
        }
      }

      if (!authority) {
        setStatus('failed');
        toast({ title: "خطا", description: "Authority نامعتبر است", variant: "destructive" });
        return;
      }

      if (statusParam === 'NOK') {
        setStatus('failed');
        toast({
          title: "پرداخت لغو شد",
          description: "پرداخت توسط کاربر لغو شد",
          variant: "destructive",
        });
        return;
      }

      try {
        const data = await apiClient.verifyPayment({ authority, orderId: orderId || undefined });
        if (data?.success) {
          setStatus('success');
          setRefId(data.refId);
          toast({
            title: "✅ پرداخت موفق",
            description: `پرداخت با موفقیت انجام شد. کد پیگیری: ${data.refId}`,
          });
        } else {
          setStatus('failed');
          toast({
            title: "خطا در پرداخت",
            description: data?.error || "پرداخت موفقیت‌آمیز نبود",
            variant: "destructive",
          });
        }
              } catch (error: unknown) {
          console.error('Payment verification error:', error);
          setStatus('failed');
          const errorMessage = error instanceof Error ? error.message : "مشکلی در تأیید پرداخت پیش آمد";
          toast({
            title: "خطا در تأیید پرداخت",
            description: errorMessage,
            variant: "destructive",
          });
      }
    };

    verifyPayment();
  }, [searchParams, toast]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleRetryPayment = () => {
    // Get the order ID from URL params and redirect to payment
    const orderId = searchParams.get('order_id');
    if (orderId) {
      navigate(`/wizard?step=payment&orderId=${orderId}`);
    } else {
      navigate('/wizard');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-16 h-16 text-success" />
              )}
              {status === 'failed' && (
                <XCircle className="w-16 h-16 text-destructive" />
              )}
            </div>
            <CardTitle className="text-xl">
              {status === 'loading' && 'در حال بررسی پرداخت...'}
              {status === 'success' && 'پرداخت موفق'}
              {status === 'failed' && 'پرداخت ناموفق'}
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
                <p className="text-success mb-4">
                  سفارش شما با موفقیت ثبت و پرداخت شد
                </p>
                {refId && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                    <p className="text-sm">
                      <strong>کد پیگیری:</strong> {refId}
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  به زودی از طریق ایمیل با شما تماس گرفته می‌شود
                </p>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <p className="text-destructive mb-4">
                  متأسفانه پرداخت شما انجام نشد. می‌توانید دوباره تلاش کنید
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-destructive">
                    <strong>نکات مهم:</strong>
                  </p>
                  <ul className="text-sm text-destructive mt-2 space-y-1">
                    <li>• اطمینان حاصل کنید که اطلاعات کارت بانکی صحیح است</li>
                    <li>• موجودی حساب کافی باشد</li>
                    <li>• در صورت مشکل، با پشتیبانی تماس بگیرید</li>
                  </ul>
                </div>
              </>
            )}
            
            <div className="flex flex-col gap-2">
              {status === 'success' && (
                <>
                  <Button 
                    onClick={handleBackToDashboard}
                    className="w-full"
                  >
                    بازگشت به داشبورد
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleBackToHome}
                    className="w-full"
                  >
                    بازگشت به صفحه اصلی
                  </Button>
                </>
              )}
              
              {status === 'failed' && (
                <>
                  <Button 
                    onClick={handleRetryPayment}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تلاش مجدد
                  </Button>
                  <Button 
                    onClick={handleBackToDashboard}
                    variant="outline"
                    className="w-full"
                  >
                    بازگشت به داشبورد
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

export default PaymentCallback;