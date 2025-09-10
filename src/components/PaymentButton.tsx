import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { paymentService, walletService, useApi } from '@/lib/services';
import { CreditCard, Loader2, Wallet } from 'lucide-react';

type PaymentContext = 'order' | 'wallet';

interface PaymentButtonProps {
  context: PaymentContext;
  amount: number; // Tomans
  description: string;
  orderId?: string; // required for order payments
  callbackUrl?: string; // optional override; defaults to unified /payment-callback
  onSuccess?: (refId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  context,
  amount,
  description,
  orderId,
  callbackUrl,
  onSuccess,
  onError,
  className,
  variant = 'default',
  size = 'default',
  disabled = false
}) => {
  const { toast } = useToast();

  const { execute: requestPayment, loading: isLoading } = useApi(
    paymentService.requestPayment.bind(paymentService),
    {
      onSuccess: (response) => {
        if (response.success && response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          const errorMessage = response.error || 'خطا در ایجاد درخواست پرداخت';
          toast({ title: 'خطا', description: errorMessage, variant: 'destructive' });
          onError?.(errorMessage);
        }
      },
      onError: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'خطا در پرداخت';
        toast({ title: 'خطا', description: errorMessage, variant: 'destructive' });
        onError?.(errorMessage);
      }
    }
  );

  const { execute: requestWalletDeposit, loading: isWalletLoading } = useApi(
    walletService.requestDeposit.bind(walletService),
    {
      onSuccess: (response) => {
        if (response.success && response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          const errorMessage = 'خطا در ایجاد درخواست شارژ کیف پول';
          toast({ title: 'خطا', description: errorMessage, variant: 'destructive' });
          onError?.(errorMessage);
        }
      },
      onError: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'خطا در شارژ کیف پول';
        toast({ title: 'خطا', description: errorMessage, variant: 'destructive' });
        onError?.(errorMessage);
      }
    }
  );

  const handlePayment = async () => {
    const cb = callbackUrl || `${window.location.origin}/payment-callback`;
    if (context === 'wallet') {
      await requestWalletDeposit({
        amount,
        description,
        callbackUrl: cb,
      });
      return;
    }
    await requestPayment({
      amount,
      description,
      orderId,
      callbackUrl: cb,
    });
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading || isWalletLoading}
      className={className}
      variant={variant}
      size={size}
    >
      {(isLoading || isWalletLoading) ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        context === 'wallet' ? <Wallet className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />
      )}
      {(isLoading || isWalletLoading) ? 'در حال پردازش...' : (context === 'wallet' ? 'شارژ کیف پول' : 'پرداخت با زرین‌پال')}
    </Button>
  );
};
