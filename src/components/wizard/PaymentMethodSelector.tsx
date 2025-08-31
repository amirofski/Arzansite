import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { WalletService } from '@/lib/walletService';
import { formatPriceWithUnit } from '@/lib/pricingUtils';

interface PaymentMethodSelectorProps {
  selectedMethod: 'wallet' | 'zarinpal';
  onMethodChange: (method: 'wallet' | 'zarinpal') => void;
  walletBalance: number;
  walletLoading: boolean;
  orderAmount: number;
  onWalletTopUp: () => void;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  walletBalance,
  walletLoading,
  orderAmount,
  onWalletTopUp,
  className = ''
}) => {
  const hasInsufficientFunds = walletBalance > 0 && walletBalance < orderAmount;
  const canPayWithWallet = walletBalance >= orderAmount;
  const balanceAfterPayment = walletBalance - orderAmount;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          انتخاب روش پرداخت
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Options */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">روش پرداخت</Label>
          <RadioGroup
            value={selectedMethod}
            onValueChange={(value: 'wallet' | 'zarinpal') => onMethodChange(value)}
            className="grid grid-cols-2 gap-4"
          >
            {/* Wallet Payment Option */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wallet" id="wallet" />
              <Label htmlFor="wallet" className="cursor-pointer w-full">
                <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">پرداخت از کیف پول</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      موجودی: {walletLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      ) : (
                        WalletService.formatAmount(walletBalance)
                      )}
                    </div>
                  </div>
                  {canPayWithWallet && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {hasInsufficientFunds && (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
              </Label>
            </div>

            {/* ZarinPal Payment Option */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="zarinpal" id="zarinpal" />
              <Label htmlFor="zarinpal" className="cursor-pointer w-full">
                <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">پرداخت آنلاین</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      از طریق درگاه زرین‌پال
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Wallet Payment Details */}
        {selectedMethod === 'wallet' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">اطلاعات پرداخت کیف پول</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>موجودی فعلی:</span>
                  <span className="font-medium">{WalletService.formatAmount(walletBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>مبلغ سفارش:</span>
                  <span className="font-medium">{formatPriceWithUnit(orderAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>موجودی پس از پرداخت:</span>
                  <span className={`font-medium ${canPayWithWallet ? 'text-green-600' : 'text-red-600'}`}>
                    {WalletService.formatAmount(balanceAfterPayment)}
                  </span>
                </div>
              </div>

              {canPayWithWallet && (
                <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">قابل پرداخت از کیف پول</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    موجودی شما برای تکمیل این سفارش کافی است.
                  </p>
                </div>
              )}

              {hasInsufficientFunds && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">موجودی ناکافی</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    برای تکمیل این سفارش نیاز به شارژ کیف پول دارید.
                  </p>
                  <div className="mt-2 text-xs text-yellow-600">
                    <span>نیاز: {formatPriceWithUnit(orderAmount)}</span>
                    <span className="mx-2">•</span>
                    <span>کمبود: {formatPriceWithUnit(orderAmount - walletBalance)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-xs"
                    onClick={onWalletTopUp}
                  >
                    شارژ کیف پول
                    <ArrowRight className="w-3 h-3 mr-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ZarinPal Payment Details */}
        {selectedMethod === 'zarinpal' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">اطلاعات پرداخت آنلاین</span>
            </div>
            <div className="space-y-2 text-sm text-blue-700">
              <p>
                پرداخت شما از طریق درگاه امن زرین‌پال انجام می‌شود. 
                پس از تکمیل پرداخت، به این صفحه بازخواهید گشت.
              </p>
              <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="font-medium">{formatPriceWithUnit(orderAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Benefits */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">مزایای هر روش پرداخت</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="font-medium">کیف پول</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 mr-6">
                <li>• پرداخت فوری و بدون انتظار</li>
                <li>• بدون نیاز به وارد کردن اطلاعات کارت</li>
                <li>• مدیریت موجودی و تراکنش‌ها</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="font-medium">آنلاین</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 mr-6">
                <li>• پرداخت از هر کارت بانکی</li>
                <li>• امنیت بالا با SSL</li>
                <li>• تأیید فوری پرداخت</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;











