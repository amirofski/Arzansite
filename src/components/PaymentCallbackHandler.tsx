import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentService, walletService, ordersService } from '@/lib/services';
import { SafeTransactionDescription } from './SafeTransactionDescription';

export interface PaymentCallbackData {
  authority: string;
  status: string;
  orderId?: string;
  amount?: number;
  description?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  refId?: string;
  orderId?: string;
  amount?: number;
  description?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  retryable: boolean;
  supportRequired: boolean;
  context?: 'order' | 'wallet';
}

export interface PaymentError {
  code: string;
  message: string;
  description: string;
  retryable: boolean;
  supportRequired: boolean;
  action?: string;
}

export interface PaymentCallbackHandlerProps {
  onPaymentSuccess?: (result: PaymentVerificationResult) => void;
  onPaymentFailure?: (result: PaymentVerificationResult) => void;
}

// Payment error definitions
const PAYMENT_ERRORS: Record<string, PaymentError> = {
  'PAYMENT_CANCELED': {
    code: 'PAYMENT_CANCELED',
    message: 'پرداخت لغو شد',
    description: 'شما پرداخت را لغو کردید یا از درگاه خارج شدید.',
    retryable: true,
    supportRequired: false,
    action: 'می‌توانید دوباره تلاش کنید'
  },
  'PAYMENT_FAILED': {
    code: 'PAYMENT_FAILED',
    message: 'پرداخت ناموفق بود',
    description: 'پرداخت در درگاه پرداخت با خطا مواجه شد.',
    retryable: true,
    supportRequired: false,
    action: 'لطفاً دوباره تلاش کنید'
  },
  'VERIFICATION_FAILED': {
    code: 'VERIFICATION_FAILED',
    message: 'تأیید پرداخت ناموفق بود',
    description: 'پرداخت انجام شده اما تأیید آن با مشکل مواجه شد.',
    retryable: true,
    supportRequired: true,
    action: 'در صورت کسر مبلغ، با پشتیبانی تماس بگیرید'
  },
  'INVALID_AUTHORITY': {
    code: 'INVALID_AUTHORITY',
    message: 'کد پرداخت نامعتبر است',
    description: 'کد پرداخت ارسالی معتبر نیست یا منقضی شده است.',
    retryable: false,
    supportRequired: true,
    action: 'لطفاً با پشتیبانی تماس بگیرید'
  },
  'DUPLICATE_PAYMENT': {
    code: 'DUPLICATE_PAYMENT',
    message: 'پرداخت تکراری',
    description: 'این پرداخت قبلاً انجام شده است.',
    retryable: false,
    supportRequired: false,
    action: 'پرداخت شما قبلاً ثبت شده است'
  },
  'INSUFFICIENT_FUNDS': {
    code: 'INSUFFICIENT_FUNDS',
    message: 'موجودی کافی نیست',
    description: 'موجودی حساب شما برای این پرداخت کافی نیست.',
    retryable: true,
    supportRequired: false,
    action: 'لطفاً موجودی حساب خود را بررسی کنید'
  },
  'GATEWAY_ERROR': {
    code: 'GATEWAY_ERROR',
    message: 'خطای درگاه پرداخت',
    description: 'خطایی در درگاه پرداخت رخ داده است.',
    retryable: true,
    supportRequired: true,
    action: 'لطفاً بعداً تلاش کنید'
  },
  'NETWORK_ERROR': {
    code: 'NETWORK_ERROR',
    message: 'خطای شبکه',
    description: 'خطایی در ارتباط با سرور رخ داده است.',
    retryable: true,
    supportRequired: false,
    action: 'لطفاً اتصال اینترنت خود را بررسی کنید'
  },
  'TIMEOUT_ERROR': {
    code: 'TIMEOUT_ERROR',
    message: 'خطای زمان انتظار',
    description: 'عملیات پرداخت به دلیل طولانی شدن زمان انتظار متوقف شد.',
    retryable: true,
    supportRequired: false,
    action: 'لطفاً دوباره تلاش کنید'
  },
  'UNKNOWN_ERROR': {
    code: 'UNKNOWN_ERROR',
    message: 'خطای نامشخص',
    description: 'خطای غیرمنتظره‌ای رخ داده است.',
    retryable: false,
    supportRequired: true,
    action: 'لطفاً با پشتیبانی تماس بگیرید'
  }
};

export const PaymentCallbackHandler: React.FC<PaymentCallbackHandlerProps> = ({ 
  onPaymentSuccess, 
  onPaymentFailure 
}) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [verificationResult, setVerificationResult] = useState<PaymentVerificationResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [callbackData, setCallbackData] = useState<PaymentCallbackData | null>(null);
  const [errorDetails, setErrorDetails] = useState<PaymentError | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Parse callback parameters
  const parseCallbackParams = useCallback((): PaymentCallbackData => {
    const params = new URLSearchParams(location.search);
    const authority = params.get('Authority') ?? params.get('authority') ?? '';
    const statusParam = params.get('Status') ?? '';
    const orderIdParam = params.get('orderId') ?? params.get('order_id') ?? '';
    const amountParam = params.get('amount');
    const descriptionParam = params.get('description') ?? '';

    // Try to recover payment context from sessionStorage if query params are missing
    let stored: { orderId?: string; amount?: number; description?: string } | null = null;
    try {
      const raw = sessionStorage.getItem('orderPaymentInfo');
      if (raw) stored = JSON.parse(raw);
    } catch {}

    const orderId = orderIdParam || stored?.orderId || '';
    const amount = amountParam ? parseInt(amountParam) : stored?.amount || undefined;
    const description = descriptionParam || stored?.description || '';

    return {
      authority,
      status: statusParam,
      orderId,
      amount,
      description
    };
  }, [location.search]);

  // Get error details based on error code
  const getErrorDetails = useCallback((errorCode: string, errorMessage?: string): PaymentError => {
    const error = PAYMENT_ERRORS[errorCode] || PAYMENT_ERRORS['UNKNOWN_ERROR'];
    
    return {
      ...error,
      description: errorMessage || error.description
    };
  }, []);

  // Verify payment with retry mechanism
  const verifyPayment = useCallback(async (data: PaymentCallbackData, isRetry = false): Promise<PaymentVerificationResult> => {
    try {
      // Check if payment was canceled by user
      if (data.status !== 'OK') {
        return {
          success: false,
          error: 'Payment was canceled or failed on gateway',
          errorCode: 'PAYMENT_CANCELED',
          retryable: true,
          supportRequired: false
        };
      }

      // Decide context: wallet deposit (no orderId) vs order payment (has orderId)
      let hasOrderContext = false;
      try { hasOrderContext = !!sessionStorage.getItem('orderPaymentInfo'); } catch {}
      const isWallet = !hasOrderContext && !data.orderId;

      if (isWallet) {
        // Verify wallet deposit
        const response = await walletService.verifyDeposit({
          orderId: data.orderId || undefined,
          authority: data.authority,
        });

        if (response.success) {
          return {
            success: true,
            refId: response.refId,
            orderId: undefined,
            amount: response.amount,
            description: response.description,
            retryable: false,
            supportRequired: false,
            context: 'wallet',
          };
        } else {
          return {
            success: false,
            error: response.error || 'Wallet deposit verification failed',
            errorCode: response.errorCode || 'VERIFICATION_FAILED',
            errorDetails: response.errorDetails,
            retryable: response.retryable !== false,
            supportRequired: response.supportRequired === true,
          };
        }
      }

      // Order payment verification
      const response = await paymentService.verifyPayment({
        authority: data.authority,
        amount: data.amount,
        orderId: data.orderId,
      });

      if (response.success) {
        return {
          success: true,
          refId: response.refId,
          orderId: response.orderId || data.orderId,
          amount: response.amount,
          description: response.description,
          retryable: false,
          supportRequired: false,
          context: 'order',
        };
      } else {
        return {
          success: false,
          error: response.error || 'Payment verification failed',
          errorCode: response.errorCode || 'VERIFICATION_FAILED',
          errorDetails: response.errorDetails,
          retryable: response.retryable !== false,
          supportRequired: response.supportRequired === true,
        };
      }
    } catch (error: unknown) {
      console.error('Payment verification error:', error);
      
      // Determine error type based on error details
      let errorCode = 'UNKNOWN_ERROR';
      let retryable = false;
      const err = error as { name?: string; message?: string; status?: number };

      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
        retryable = true;
      } else if (err.message?.includes('timeout')) {
        errorCode = 'TIMEOUT_ERROR';
        retryable = true;
      } else if (err.status === 400) {
        errorCode = 'INVALID_AUTHORITY';
        retryable = false;
      } else if (err.status === 409) {
        errorCode = 'DUPLICATE_PAYMENT';
        retryable = false;
      } else if (typeof err.status === 'number' && err.status >= 500) {
        errorCode = 'GATEWAY_ERROR';
        retryable = true;
      }

      return {
        success: false,
        error: err.message || 'Network error during verification',
        errorCode,
        retryable,
        supportRequired: errorCode === 'UNKNOWN_ERROR' || errorCode === 'GATEWAY_ERROR'
      };
    }
  }, []);

  // Handle payment verification
  const handleVerification = useCallback(async (isRetry = false) => {
    try {
      const data = parseCallbackParams();
      setCallbackData(data);

      if (isRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
      }

      const result = await verifyPayment(data, isRetry);
      setVerificationResult(result);

      if (result.success) {
        setStatus('success');
        onPaymentSuccess?.(result);
        // Best-effort client-side update in case backend didn't set order status
        if (result.orderId) {
          try {
            await ordersService.updateOrderStatus(result.orderId, { paymentStatus: 'succeeded' });
          } catch (e) {
            console.warn('Order status update fallback failed:', e);
          }
        }
      } else {
        setStatus('failed');
        const errorDetails = getErrorDetails(result.errorCode!, result.error);
        setErrorDetails(errorDetails);
        onPaymentFailure?.(result);
      }
    } catch (error: unknown) {
      console.error('Verification handler error:', error);
      setStatus('failed');
      const err = error as { message?: string };
      const errorDetails = getErrorDetails('UNKNOWN_ERROR', err.message);
      setErrorDetails(errorDetails);
    } finally {
      setIsRetrying(false);
    }
  }, [parseCallbackParams, verifyPayment, getErrorDetails, onPaymentSuccess, onPaymentFailure]);

  // Retry verification
  const handleRetry = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      setErrorDetails(prev => prev ? {
        ...prev,
        retryable: false,
        action: 'حداکثر تعداد تلاش‌ها انجام شده. لطفاً با پشتیبانی تماس بگیرید.'
      } : null);
      return;
    }

    await handleVerification(true);
  }, [retryCount, handleVerification]);

  // Navigate to wallet
  const handleGoToWallet = useCallback(() => {
    navigate('/dashboard/wallet');
  }, [navigate]);

  // Contact support
  const handleContactSupport = useCallback(() => {
    // You can implement this based on your support system
    const supportData = {
      errorCode: errorDetails?.code,
      authority: callbackData?.authority,
      orderId: callbackData?.orderId,
      amount: callbackData?.amount,
      description: callbackData?.description,
      retryCount,
      timestamp: new Date().toISOString()
    };

    console.log('Support data:', supportData);
    
    // Example: Open support chat or redirect to support page
    window.open('/support', '_blank');
  }, [errorDetails, callbackData, retryCount]);

  // Initialize verification on component mount
  useEffect(() => {
    handleVerification();
  }, [handleVerification]);

  // Auto-redirect on success after 5 seconds (wallet -> wallet tab)
  useEffect(() => {
    if (status === 'success' && verificationResult) {
      const isWallet = !verificationResult.orderId;
      const target = isWallet ? '/dashboard?tab=wallet&payment_success=true' : '/dashboard';
      const timer = setTimeout(() => navigate(target), 5000);
      return () => clearTimeout(timer);
    }
  }, [status, verificationResult, navigate]);

  // Loading state
  if (status === 'loading') {
    return (
      <motion.div 
        className="payment-callback-loading"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>در حال تأیید پرداخت...</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>لطفاً صبر کنید، در حال بررسی وضعیت پرداخت شما هستیم.</motion.p>
      </motion.div>
    );
  }

  // Success state
  if (status === 'success' && verificationResult) {
    return (
      <motion.div 
        className="payment-callback-success"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div 
          className="success-icon"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          ✅
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>پرداخت موفقیت‌آمیز بود</motion.h2>
        
        <motion.div className="payment-details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="detail-item">
            <span className="label">شماره پیگیری:</span>
            <span className="value">{verificationResult.refId}</span>
          </div>
          {verificationResult.orderId && (
            <div className="detail-item">
              <span className="label">شماره سفارش:</span>
              <span className="value">{verificationResult.orderId}</span>
            </div>
          )}
          {verificationResult.amount && (
            <div className="detail-item">
              <span className="label">مبلغ:</span>
              <span className="value">{verificationResult.amount.toLocaleString()} ریال</span>
            </div>
          )}
          {verificationResult.description && (
            <div className="detail-item">
              <span className="label">توضیحات:</span>
              <SafeTransactionDescription
                description={verificationResult.description}
                allowHtml={false}
                maxLength={100}
              />
            </div>
          )}
        </motion.div>

        <motion.div className="success-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {(verificationResult.context === 'wallet') ? (
            <>
              <p>پرداخت شما با موفقیت انجام شد و مبلغ به کیف پول شما اضافه شد.</p>
              <p>تا چند لحظه دیگر به داشبورد (بخش کیف پول) هدایت می‌شوید...</p>
            </>
          ) : (
            <>
              <p>پرداخت سفارش شما با موفقیت ثبت شد. وضعیت سفارش از طریق داشبورد قابل پیگیری است.</p>
              <p>تا چند لحظه دیگر به داشبورد هدایت می‌شوید...</p>
            </>
          )}
          <p>شماره پیگیری را برای مراجعات بعدی یادداشت کنید.</p>
        </motion.div>

        <motion.div className="action-buttons" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {!verificationResult.orderId && (
            <button 
              onClick={handleGoToWallet}
              className="primary-button"
            >
              مشاهده کیف پول
            </button>
          )}
          <button 
            onClick={() => navigate('/dashboard')}
            className="secondary-button"
          >
            بازگشت به داشبورد
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Failed state
  if (status === 'failed' && errorDetails) {
    return (
      <motion.div 
        className="payment-callback-failed"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div 
          className="error-icon"
          initial={{ scale: 0, rotate: 10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          ❌
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>{errorDetails.message}</motion.h2>
        
        <div className="error-details">
          <p className="error-description">{errorDetails.description}</p>
          
          {verificationResult?.errorDetails && (
            <div className="technical-details">
              <details>
                <summary>جزئیات فنی</summary>
                <pre>{verificationResult.errorDetails}</pre>
              </details>
            </div>
          )}

          {callbackData && (
            <div className="callback-data">
              <details>
                <summary>اطلاعات پرداخت</summary>
                <div className="data-grid">
                  <div className="data-item">
                    <span className="label">کد پرداخت:</span>
                    <span className="value">{callbackData.authority}</span>
                  </div>
                  {callbackData.orderId && (
                    <div className="data-item">
                      <span className="label">شماره سفارش:</span>
                      <span className="value">{callbackData.orderId}</span>
                    </div>
                  )}
                  {callbackData.amount && (
                    <div className="data-item">
                      <span className="label">مبلغ:</span>
                      <span className="value">{callbackData.amount.toLocaleString()} ریال</span>
                    </div>
                  )}
                  <div className="data-item">
                    <span className="label">وضعیت درگاه:</span>
                    <span className="value">{callbackData.status}</span>
                  </div>
                  <div className="data-item">
                    <span className="label">تعداد تلاش:</span>
                    <span className="value">{retryCount + 1}</span>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="error-action">
          <p className="action-text">{errorDetails.action}</p>
        </div>

        <div className="action-buttons">
          {errorDetails.retryable && retryCount < MAX_RETRY_ATTEMPTS && (
            <button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="retry-button"
            >
              {isRetrying ? 'در حال تلاش مجدد...' : 'تلاش مجدد'}
            </button>
          )}
          
          {errorDetails.supportRequired && (
            <button 
              onClick={handleContactSupport}
              className="support-button"
            >
              تماس با پشتیبانی
            </button>
          )}
          
          <button 
            onClick={() => navigate('/dashboard/wallet')}
            className="wallet-button"
          >
            بازگشت به کیف پول
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="dashboard-button"
          >
            بازگشت به داشبورد
          </button>
        </div>

        {retryCount >= MAX_RETRY_ATTEMPTS && (
          <div className="max-retries-warning">
            <p>⚠️ حداکثر تعداد تلاش‌ها انجام شده است.</p>
            <p>در صورت کسر مبلغ از حساب شما، لطفاً با پشتیبانی تماس بگیرید.</p>
          </div>
        )}
      </motion.div>
    );
  }

  // Fallback error state
  return (
    <div className="payment-callback-error">
      <div className="error-icon">⚠️</div>
      <h2>خطای غیرمنتظره</h2>
      <p>خطایی در پردازش درخواست شما رخ داده است.</p>
      
      <div className="action-buttons">
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          بارگذاری مجدد
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="dashboard-button"
        >
          بازگشت به داشبورد
        </button>
      </div>
    </div>
  );
};

// Hook for payment callback handling
export const usePaymentCallback = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PaymentVerificationResult | null>(null);

  const processCallback = useCallback(async (callbackData: PaymentCallbackData) => {
    setIsProcessing(true);
    try {
      const response = await paymentService.verifyPayment({
        authority: callbackData.authority,
        amount: callbackData.amount
      });
      
      // Transform response to match PaymentVerificationResult interface
      const result: PaymentVerificationResult = {
        success: response.success,
        refId: response.refId,
        orderId: response.orderId,
        amount: response.amount,
        description: response.description,
        retryable: response.retryable || false,
        supportRequired: response.supportRequired || false
      };
      
      setResult(result);
      return result;
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorResult: PaymentVerificationResult = {
        success: false,
        error: err.message || 'Verification failed',
        errorCode: 'UNKNOWN_ERROR',
        retryable: false,
        supportRequired: true
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    result,
    processCallback
  };
};