import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  amount: number;
  description: string;
  orderId?: string;
  onSuccess?: (refId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  description,
  orderId,
  onSuccess,
  onError,
  className,
  variant = 'default',
  size = 'default',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiClient.requestPayment({
        amount,
        description,
        orderId
      });

      if (response.success && response.paymentUrl) {
        // Redirect to Zarinpal payment gateway
        window.location.href = response.paymentUrl;
      } else {
        const errorMessage = response.error || 'خطا در ایجاد درخواست پرداخت';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'destructive',
        });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در پرداخت';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      {isLoading ? 'در حال پردازش...' : 'پرداخت با زرین‌پال'}
    </Button>
  );
};
