import React, { useState, useEffect } from 'react';
import { 
  validateRedirectUrl, 
  constructSafePaymentUrl, 
  validatePaymentAuthority,
  PaymentUrlWhitelist 
} from '../lib/secureRedirect';

interface SecurePaymentRedirectProps {
  orderId: string;
  authority: string;
  amount: number;
  description: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const SecurePaymentRedirect: React.FC<SecurePaymentRedirectProps> = ({
  orderId,
  authority,
  amount,
  description,
  onSuccess,
  onError,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Validate authority on component mount
    const authorityValidation = validatePaymentAuthority(authority);
    if (!authorityValidation.isValid) {
      setError(`Invalid authority: ${authorityValidation.error}`);
      onError?.(authorityValidation.error!);
      return;
    }

    // Construct safe payment URL
    const safeUrl = constructSafePaymentUrl(authority, orderId);
    setRedirectUrl(safeUrl);
  }, [authority, orderId, onError]);

  const handleSecureRedirect = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Validate the constructed URL
      const urlValidation = validateRedirectUrl(redirectUrl);
      if (!urlValidation.isValid) {
        throw new Error(`Payment URL validation failed: ${urlValidation.error}`);
      }

      // Check if URL is in whitelist
      if (!PaymentUrlWhitelist.isTrusted(redirectUrl)) {
        throw new Error('Payment URL is not in trusted whitelist');
      }

      // Log the redirect attempt
      console.log('=== SECURE PAYMENT REDIRECT ===');
      console.log('Order ID:', orderId);
      console.log('Authority:', authority);
      console.log('Amount:', amount);
      console.log('Description:', description);
      console.log('Redirect URL:', redirectUrl);
      console.log('Timestamp:', new Date().toISOString());
      console.log('================================');

      // Use server-side redirect endpoint for maximum security
      const serverRedirectUrl = `/api/payment/redirect?orderId=${encodeURIComponent(orderId)}&authority=${encodeURIComponent(authority)}`;
      
      // Redirect to server endpoint
      window.location.href = serverRedirectUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redirect failed';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Secure payment redirect failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`secure-payment-error ${className}`}>
        <div className="error-message">
          <h3>خطا در پرداخت</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`secure-payment-redirect ${className}`}>
      <div className="payment-summary">
        <h3>تأیید پرداخت</h3>
        <div className="payment-details">
          <p><strong>شماره سفارش:</strong> {orderId}</p>
          <p><strong>مبلغ:</strong> {amount.toLocaleString()} ریال</p>
          <p><strong>توضیحات:</strong> {description}</p>
        </div>
      </div>

      <div className="redirect-actions">
        <button
          onClick={handleSecureRedirect}
          disabled={isLoading || !redirectUrl}
          className="secure-redirect-button"
        >
          {isLoading ? 'در حال انتقال...' : 'انتقال به درگاه پرداخت'}
        </button>
        
        <div className="security-info">
          <small>
            🔒 این انتقال به صورت امن انجام می‌شود و فقط به درگاه‌های معتبر هدایت می‌شود.
          </small>
        </div>
      </div>
    </div>
  );
};

// Server-side redirect endpoint component
interface ServerRedirectProps {
  orderId: string;
  authority: string;
  onRedirect?: (url: string) => void;
}

export const ServerRedirect: React.FC<ServerRedirectProps> = ({
  orderId,
  authority,
  onRedirect
}) => {
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    const validateAndRedirect = async () => {
      try {
        // Validate authority
        const authorityValidation = validatePaymentAuthority(authority);
        if (!authorityValidation.isValid) {
          throw new Error(`Invalid authority: ${authorityValidation.error}`);
        }

        // Validate order ID
        if (!orderId || orderId.length > 100) {
          throw new Error('Invalid order ID');
        }

        // Construct safe payment URL
        const safeUrl = constructSafePaymentUrl(authority, orderId);
        
        // Validate the constructed URL
        const urlValidation = validateRedirectUrl(safeUrl);
        if (!urlValidation.isValid) {
          throw new Error(`Payment URL validation failed: ${urlValidation.error}`);
        }

        // Check whitelist
        if (!PaymentUrlWhitelist.isTrusted(safeUrl)) {
          throw new Error('Payment URL is not in trusted whitelist');
        }

        // Log the redirect
        console.log('=== SERVER REDIRECT ===');
        console.log('Order ID:', orderId);
        console.log('Authority:', authority);
        console.log('Safe URL:', safeUrl);
        console.log('Timestamp:', new Date().toISOString());
        console.log('======================');

        // Call redirect callback
        onRedirect?.(safeUrl);

        // Perform the redirect
        window.location.href = safeUrl;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Validation failed';
        setValidationError(errorMessage);
        console.error('Server redirect validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validateAndRedirect();
  }, [orderId, authority, onRedirect]);

  if (isValidating) {
    return (
      <div className="server-redirect-loading">
        <div className="loading-spinner"></div>
        <p>در حال تأیید اطلاعات پرداخت...</p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="server-redirect-error">
        <h3>خطا در تأیید پرداخت</h3>
        <p>{validationError}</p>
        <button onClick={() => window.history.back()}>
          بازگشت
        </button>
      </div>
    );
  }

  return null;
};

// Payment redirect hook
export const useSecurePaymentRedirect = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string>('');

  const redirectToPayment = async (
    orderId: string, 
    authority: string, 
    amount: number, 
    description: string
  ) => {
    setIsRedirecting(true);
    setRedirectError('');

    try {
      // Validate inputs
      const authorityValidation = validatePaymentAuthority(authority);
      if (!authorityValidation.isValid) {
        throw new Error(`Invalid authority: ${authorityValidation.error}`);
      }

      // Construct safe URL
      const safeUrl = constructSafePaymentUrl(authority, orderId);
      
      // Validate URL
      const urlValidation = validateRedirectUrl(safeUrl);
      if (!urlValidation.isValid) {
        throw new Error(`Payment URL validation failed: ${urlValidation.error}`);
      }

      // Check whitelist
      if (!PaymentUrlWhitelist.isTrusted(safeUrl)) {
        throw new Error('Payment URL is not in trusted whitelist');
      }

      // Log redirect
      console.log('=== HOOK PAYMENT REDIRECT ===');
      console.log('Order ID:', orderId);
      console.log('Authority:', authority);
      console.log('Amount:', amount);
      console.log('Description:', description);
      console.log('Safe URL:', safeUrl);
      console.log('============================');

      // Perform redirect
      window.location.href = safeUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redirect failed';
      setRedirectError(errorMessage);
      console.error('Payment redirect failed:', error);
    } finally {
      setIsRedirecting(false);
    }
  };

  return {
    redirectToPayment,
    isRedirecting,
    redirectError,
    clearError: () => setRedirectError('')
  };
};
