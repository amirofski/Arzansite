import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Wallet, 
  CreditCard, 
  FileText, 
  Download, 
  ArrowRight,
  Home,
  User
} from 'lucide-react';
import { WalletService } from '@/lib/walletService';
import { formatPriceWithUnit } from '@/lib/pricingUtils';

interface OrderSuccessStepProps {
  orderData: {
    id: string;
    title: string;
    price: number;
    paymentMethod: 'wallet' | 'zarinpal';
    transactionId?: string;
    refId?: string;
    status: string;
    paymentStatus: string;
  };
  walletBalance?: number;
  previousWalletBalance?: number;
  onViewOrder?: () => void;
  onDownloadInvoice?: () => void;
}

const OrderSuccessStep: React.FC<OrderSuccessStepProps> = ({
  orderData,
  walletBalance = 0,
  previousWalletBalance = 0,
  onViewOrder,
  onDownloadInvoice
}) => {
  const navigate = useNavigate();
  const walletUsed = orderData.paymentMethod === 'wallet';
  const balanceChange = walletBalance - previousWalletBalance;

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">
          سفارش شما با موفقیت ثبت شد!
        </h1>
        <p className="text-muted-foreground text-lg">
          سفارش شما در حال پردازش است و به زودی کار بر روی آن آغاز خواهد شد.
        </p>
      </div>

      {/* Order Details Card */}
      <Card className="border-2 border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <FileText className="w-5 h-5" />
            جزئیات سفارش
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">شماره سفارش:</span>
                <span className="font-mono font-medium">{orderData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">عنوان:</span>
                <span className="font-medium">{orderData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">مبلغ:</span>
                <span className="font-bold text-lg text-primary">
                  {formatPriceWithUnit(orderData.price)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">وضعیت:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {orderData.status === 'in_progress' ? 'در حال پردازش' : orderData.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">وضعیت پرداخت:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {orderData.paymentStatus === 'succeeded' ? 'موفق' : orderData.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">روش پرداخت:</span>
                <div className="flex items-center gap-2">
                  {walletUsed ? (
                    <Wallet className="w-4 h-4 text-green-600" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm">
                    {walletUsed ? 'کیف پول' : 'آنلاین'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {(orderData.transactionId || orderData.refId) && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">اطلاعات تراکنش</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {orderData.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">شناسه تراکنش:</span>
                    <span className="font-mono">{orderData.transactionId}</span>
                  </div>
                )}
                {orderData.refId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">کد پیگیری:</span>
                    <span className="font-mono">{orderData.refId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Balance Update */}
      {walletUsed && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Wallet className="w-5 h-5" />
              بروزرسانی کیف پول
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">موجودی قبلی</div>
                <div className="text-lg font-bold text-blue-600">
                  {WalletService.formatAmount(previousWalletBalance)}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">مبلغ پرداختی</div>
                <div className="text-lg font-bold text-red-600">
                  -{formatPriceWithUnit(orderData.price)}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">موجودی فعلی</div>
                <div className="text-lg font-bold text-green-600">
                  {WalletService.formatAmount(walletBalance)}
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              موجودی کیف پول شما پس از پرداخت سفارش بروزرسانی شد.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            مراحل بعدی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium">تأیید سفارش</h4>
                <p className="text-sm text-muted-foreground">
                  سفارش شما توسط تیم پشتیبانی بررسی و تأیید خواهد شد.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium">شروع طراحی</h4>
                <p className="text-sm text-muted-foreground">
                  تیم طراحی شروع به کار بر روی پروژه شما خواهد کرد.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium">تحویل اولیه</h4>
                <p className="text-sm text-muted-foreground">
                  نسخه اولیه وب‌سایت برای بررسی شما ارسال خواهد شد.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onViewOrder && (
          <Button
            onClick={onViewOrder}
            size="lg"
            className="btn-gradient"
          >
            <FileText className="w-4 h-4 mr-2" />
            مشاهده سفارش
          </Button>
        )}
        
        {onDownloadInvoice && (
          <Button
            onClick={onDownloadInvoice}
            variant="outline"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            دانلود فاکتور
          </Button>
        )}
        
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          size="lg"
        >
          <User className="w-4 h-4 mr-2" />
          داشبورد
        </Button>
        
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="lg"
        >
          <Home className="w-4 h-4 mr-2" />
          صفحه اصلی
        </Button>
      </div>

      {/* Additional Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center text-sm text-blue-800">
            <p className="font-medium mb-2">نیاز به کمک دارید؟</p>
            <p>
              تیم پشتیبانی ما آماده پاسخگویی به سؤالات شما است. 
              می‌توانید از طریق داشبورد یا تماس مستقیم با ما در ارتباط باشید.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccessStep;











