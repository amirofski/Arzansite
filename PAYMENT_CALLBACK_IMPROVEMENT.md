# Payment Callback Improvement - Enhanced Error Handling and User Guidance

## Problem Fixed

The original payment callback handler had poor error handling with unclear user guidance and no retry mechanisms. When ZarinPal returned failures, users were left confused without clear next steps.

## Issues with Original Implementation

### Before (Poor Error Handling)
```typescript
// ❌ Basic error handling without specific guidance
if (statusParam !== 'OK') {
  setStatus('failed');
  setMessage('Payment was canceled or failed on gateway.');
  return;
}

// ❌ Generic error messages
setMessage(data.error || 'Payment verification failed. Please contact support.');

// ❌ Simple retry without context
{status === 'failed' && <button onClick={() => window.location.reload()}>Retry</button>}
```

**Problems:**
1. **Generic Error Messages**: No specific guidance for different error types
2. **No Retry Logic**: Simple page reload instead of intelligent retry
3. **Poor User Experience**: Users don't know what went wrong or how to fix it
4. **No Support Integration**: No clear path to contact support
5. **Missing Error Context**: No technical details for debugging
6. **No Error Classification**: All errors treated the same way

## Solution Implemented

### 1. **Comprehensive Error Classification** (`src/components/PaymentCallbackHandler.tsx`)

```typescript
const PAYMENT_ERRORS: Record<string, PaymentError> = {
  'PAYMENT_CANCELED': {
    code: 'PAYMENT_CANCELED',
    message: 'پرداخت لغو شد',
    description: 'شما پرداخت را لغو کردید یا از درگاه خارج شدید.',
    retryable: true,
    supportRequired: false,
    action: 'می‌توانید دوباره تلاش کنید'
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
  // ... 8 more error types
};
```

### 2. **Intelligent Error Detection**

```typescript
const verifyPayment = async (data: PaymentCallbackData): Promise<PaymentVerificationResult> => {
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

    // Verify payment with backend
    const response = await apiClient.verifyWalletDeposit({
      authority: data.authority,
      orderId: data.orderId
    });

    // Enhanced response handling
    if (response.success) {
      return {
        success: true,
        refId: response.refId,
        orderId: response.orderId,
        amount: response.amount,
        description: response.description
      };
    } else {
      return {
        success: false,
        error: response.error || 'Payment verification failed',
        errorCode: response.errorCode || 'VERIFICATION_FAILED',
        errorDetails: response.errorDetails,
        retryable: response.retryable !== false,
        supportRequired: response.supportRequired === true
      };
    }
  } catch (error: any) {
    // Intelligent error classification based on error type
    let errorCode = 'UNKNOWN_ERROR';
    let retryable = false;
    
    if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      errorCode = 'NETWORK_ERROR';
      retryable = true;
    } else if (error.status === 400) {
      errorCode = 'INVALID_AUTHORITY';
      retryable = false;
    } else if (error.status === 409) {
      errorCode = 'DUPLICATE_PAYMENT';
      retryable = false;
    }
    // ... more error classification logic
  }
};
```

### 3. **Smart Retry Mechanism**

```typescript
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

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
```

### 4. **Enhanced User Interface**

```typescript
// Success State with Complete Information
if (status === 'success' && verificationResult) {
  return (
    <div className="payment-callback-success">
      <div className="success-icon">✅</div>
      <h2>پرداخت موفقیت‌آمیز بود</h2>
      
      <div className="payment-details">
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
      </div>

      <div className="action-buttons">
        <button onClick={handleGoToWallet} className="primary-button">
          مشاهده کیف پول
        </button>
        <button onClick={() => navigate('/dashboard')} className="secondary-button">
          بازگشت به داشبورد
        </button>
      </div>
    </div>
  );
}
```

### 5. **Comprehensive Error Display**

```typescript
// Failed State with Detailed Information
if (status === 'failed' && errorDetails) {
  return (
    <div className="payment-callback-failed">
      <div className="error-icon">❌</div>
      <h2>{errorDetails.message}</h2>
      
      <div className="error-details">
        <p className="error-description">{errorDetails.description}</p>
        
        {/* Technical Details for Debugging */}
        {verificationResult?.errorDetails && (
          <div className="technical-details">
            <details>
              <summary>جزئیات فنی</summary>
              <pre>{verificationResult.errorDetails}</pre>
            </details>
          </div>
        )}

        {/* Payment Information */}
        {callbackData && (
          <div className="callback-data">
            <details>
              <summary>اطلاعات پرداخت</summary>
              <div className="data-grid">
                <div className="data-item">
                  <span className="label">کد پرداخت:</span>
                  <span className="value">{callbackData.authority}</span>
                </div>
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
          <button onClick={handleRetry} disabled={isRetrying} className="retry-button">
            {isRetrying ? 'در حال تلاش مجدد...' : 'تلاش مجدد'}
          </button>
        )}
        
        {errorDetails.supportRequired && (
          <button onClick={handleContactSupport} className="support-button">
            تماس با پشتیبانی
          </button>
        )}
        
        <button onClick={() => navigate('/dashboard/wallet')} className="wallet-button">
          بازگشت به کیف پول
        </button>
      </div>
    </div>
  );
}
```

### 6. **Support Integration**

```typescript
const handleContactSupport = useCallback(() => {
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
  
  // Open support chat or redirect to support page
  window.open('/support', '_blank');
}, [errorDetails, callbackData, retryCount]);
```

### 7. **Enhanced API Client** (`src/lib/api-client.ts`)

```typescript
// Enhanced verification method with detailed error information
async verifyWalletDeposit(payload: { 
  orderId?: string; 
  authority: string 
}): Promise<{
  success: boolean;
  newBalance?: number;
  refId?: string;
  orderId?: string;
  amount?: number;
  description?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  retryable?: boolean;
  supportRequired?: boolean;
}> {
  return this.request('/wallets/me/deposit/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

## Error Types Handled

### 1. **User-Initiated Errors**
- **PAYMENT_CANCELED**: User canceled payment or left gateway
- **INSUFFICIENT_FUNDS**: User doesn't have enough balance

### 2. **Technical Errors**
- **VERIFICATION_FAILED**: Payment completed but verification failed
- **INVALID_AUTHORITY**: Invalid or expired payment code
- **DUPLICATE_PAYMENT**: Payment already processed

### 3. **System Errors**
- **NETWORK_ERROR**: Connection issues
- **TIMEOUT_ERROR**: Request timeout
- **GATEWAY_ERROR**: Payment gateway issues
- **UNKNOWN_ERROR**: Unexpected errors

## Features Implemented

### 1. **Smart Error Classification**
- Automatic error type detection based on response
- Context-aware error messages
- Appropriate retry and support recommendations

### 2. **Intelligent Retry Logic**
- Configurable retry attempts (default: 3)
- Retry only for appropriate error types
- Automatic retry count tracking
- Retry button disabled after max attempts

### 3. **Enhanced User Experience**
- Clear, actionable error messages
- Step-by-step guidance for users
- Multiple action options (retry, support, navigation)
- Progress indicators during retry

### 4. **Support Integration**
- Automatic support data collection
- Direct support contact options
- Technical details for support team
- Error context preservation

### 5. **Debugging Support**
- Technical error details (collapsible)
- Payment information display
- Retry attempt tracking
- Comprehensive logging

### 6. **Security Features**
- XSS prevention in descriptions
- Safe content rendering
- Input validation
- Error sanitization

## Usage Examples

### 1. **Basic Implementation**

```typescript
import { PaymentCallbackHandler } from './PaymentCallbackHandler';

// In your routing
<Route path="/payment/callback" element={<PaymentCallbackHandler />} />
```

### 2. **Using the Hook**

```typescript
import { usePaymentCallback } from './PaymentCallbackHandler';

const MyComponent = () => {
  const { isProcessing, result, processCallback } = usePaymentCallback();
  
  const handleCallback = async (callbackData) => {
    const result = await processCallback(callbackData);
    
    if (result.success) {
      // Handle success
      console.log('Payment verified:', result.refId);
    } else {
      // Handle error with context
      console.log('Error:', result.errorCode, result.error);
    }
  };
};
```

### 3. **Custom Error Handling**

```typescript
// Add custom error types
const CUSTOM_ERRORS = {
  'CUSTOM_ERROR': {
    code: 'CUSTOM_ERROR',
    message: 'خطای سفارشی',
    description: 'توضیحات خطای سفارشی',
    retryable: true,
    supportRequired: false,
    action: 'لطفاً دوباره تلاش کنید'
  }
};

// Merge with existing errors
const ALL_ERRORS = { ...PAYMENT_ERRORS, ...CUSTOM_ERRORS };
```

## Testing Scenarios

### 1. **Success Scenarios**
- ✅ Payment completed and verified successfully
- ✅ Complete payment details displayed
- ✅ Navigation options provided

### 2. **User Error Scenarios**
- ✅ Payment canceled by user
- ✅ Insufficient funds
- ✅ User guidance provided

### 3. **Technical Error Scenarios**
- ✅ Verification failure
- ✅ Invalid authority
- ✅ Duplicate payment
- ✅ Retry mechanism works

### 4. **System Error Scenarios**
- ✅ Network errors
- ✅ Timeout errors
- ✅ Gateway errors
- ✅ Support integration

## Best Practices

### 1. **Error Handling**
- Always classify errors appropriately
- Provide clear, actionable messages
- Log errors for monitoring
- Preserve error context

### 2. **User Experience**
- Guide users through next steps
- Provide multiple action options
- Show progress during operations
- Maintain consistent UI patterns

### 3. **Retry Logic**
- Limit retry attempts
- Only retry appropriate errors
- Show retry progress
- Disable retry after max attempts

### 4. **Support Integration**
- Collect relevant error data
- Provide direct support access
- Include technical details
- Preserve user context

### 5. **Security**
- Sanitize all user content
- Validate all inputs
- Prevent XSS attacks
- Log security events

## Benefits

1. **Improved User Experience**: Clear guidance and multiple action options
2. **Better Error Resolution**: Specific error types with appropriate solutions
3. **Reduced Support Load**: Self-service options and clear error messages
4. **Enhanced Debugging**: Technical details and comprehensive logging
5. **Increased Success Rate**: Intelligent retry mechanisms
6. **Better Monitoring**: Detailed error tracking and analytics
7. **Security Enhancement**: XSS prevention and input validation
8. **Maintainability**: Modular design and clear separation of concerns

## Migration Guide

### 1. **Replace Basic Callback Handler**

```typescript
// Before
<Route path="/payment/callback" element={<BasicCallbackHandler />} />

// After
<Route path="/payment/callback" element={<PaymentCallbackHandler />} />
```

### 2. **Update API Integration**

```typescript
// Before
const result = await apiClient.verifyWalletDeposit({ authority, orderId });

// After (enhanced response handling)
const result = await apiClient.verifyWalletDeposit({ authority, orderId });
if (result.success) {
  // Handle success with complete data
} else {
  // Handle error with context
  console.log('Error:', result.errorCode, result.errorDetails);
}
```

### 3. **Add Error Monitoring**

```typescript
// Add error logging
if (result.errorCode) {
  console.warn('Payment error:', {
    errorCode: result.errorCode,
    error: result.error,
    authority,
    timestamp: new Date().toISOString()
  });
}
```

This implementation provides a comprehensive solution for payment callback handling with intelligent error management, user guidance, and support integration.
