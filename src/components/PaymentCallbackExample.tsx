import React, { useState } from 'react';
import { PaymentCallbackHandler, usePaymentCallback, PaymentCallbackData } from './PaymentCallbackHandler';

// Example callback scenarios for testing
const exampleCallbacks = [
  {
    id: 'success',
    name: 'پرداخت موفق',
    description: 'پرداخت با موفقیت انجام شده و تأیید شده است',
    url: '/payment/callback?Status=OK&Authority=A000000000000000000000000000000000000&orderId=order123&amount=1000000&description=پرداخت%20موفق'
  },
  {
    id: 'canceled',
    name: 'پرداخت لغو شده',
    description: 'کاربر پرداخت را لغو کرده است',
    url: '/payment/callback?Status=NOK&Authority=A000000000000000000000000000000000000&orderId=order124&amount=500000&description=پرداخت%20لغو%20شده'
  },
  {
    id: 'verification_failed',
    name: 'خطای تأیید پرداخت',
    description: 'پرداخت انجام شده اما تأیید آن با مشکل مواجه شد',
    url: '/payment/callback?Status=OK&Authority=A000000000000000000000000000000000000&orderId=order125&amount=750000&description=خطای%20تأیید%20پرداخت'
  },
  {
    id: 'invalid_authority',
    name: 'کد پرداخت نامعتبر',
    description: 'کد پرداخت ارسالی معتبر نیست یا منقضی شده است',
    url: '/payment/callback?Status=OK&Authority=invalid_authority&orderId=order126&amount=300000&description=کد%20پرداخت%20نامعتبر'
  },
  {
    id: 'duplicate_payment',
    name: 'پرداخت تکراری',
    description: 'این پرداخت قبلاً انجام شده است',
    url: '/payment/callback?Status=OK&Authority=A000000000000000000000000000000000000&orderId=order127&amount=200000&description=پرداخت%20تکراری'
  },
  {
    id: 'network_error',
    name: 'خطای شبکه',
    description: 'خطایی در ارتباط با سرور رخ داده است',
    url: '/payment/callback?Status=OK&Authority=A000000000000000000000000000000000000&orderId=order128&amount=400000&description=خطای%20شبکه'
  },
  {
    id: 'gateway_error',
    name: 'خطای درگاه پرداخت',
    description: 'خطایی در درگاه پرداخت رخ داده است',
    url: '/payment/callback?Status=OK&Authority=A000000000000000000000000000000000000&orderId=order129&amount=600000&description=خطای%20درگاه%20پرداخت'
  }
];

export const PaymentCallbackExample: React.FC = () => {
  const [selectedCallback, setSelectedCallback] = useState(exampleCallbacks[0]);
  const [showHandler, setShowHandler] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const handleCallbackSelect = (callback: typeof exampleCallbacks[0]) => {
    setSelectedCallback(callback);
    setCurrentUrl(callback.url);
    setShowHandler(false);
  };

  const handleTestCallback = () => {
    setShowHandler(true);
    // Simulate navigation to callback URL
    window.history.pushState({}, '', selectedCallback.url);
  };

  const handleReset = () => {
    setShowHandler(false);
    setCurrentUrl('');
    window.history.pushState({}, '', '/payment/callback-example');
  };

  return (
    <div className="payment-callback-example">
      <h2>نمونه‌های بهبود یافته پردازش بازگشت پرداخت</h2>
      
      <div className="example-description">
        <p>
          این کامپوننت نشان می‌دهد که چگونه می‌توان پردازش بازگشت پرداخت را بهبود داد تا:
        </p>
        <ul>
          <li>خطاهای مختلف را به درستی تشخیص دهد</li>
          <li>پیام‌های واضح و مفید به کاربر نمایش دهد</li>
          <li>امکان تلاش مجدد برای خطاهای قابل حل فراهم کند</li>
          <li>در صورت نیاز، کاربر را به پشتیبانی هدایت کند</li>
          <li>جزئیات فنی را برای عیب‌یابی ارائه دهد</li>
        </ul>
      </div>

      {!showHandler ? (
        <div className="callback-testing">
          <h3>انتخاب سناریو برای تست</h3>
          
          <div className="callback-scenarios">
            {exampleCallbacks.map((callback) => (
              <div 
                key={callback.id}
                className={`callback-scenario ${selectedCallback.id === callback.id ? 'selected' : ''}`}
                onClick={() => handleCallbackSelect(callback)}
              >
                <h4>{callback.name}</h4>
                <p>{callback.description}</p>
                <div className="scenario-url">
                  <small>URL: {callback.url}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="test-controls">
            <button 
              onClick={handleTestCallback}
              className="test-button"
            >
              تست این سناریو
            </button>
          </div>

          <div className="implementation-details">
            <h3>جزئیات پیاده‌سازی</h3>
            
            <div className="detail-section">
              <h4>1. تشخیص خطاهای مختلف</h4>
              <pre>
{`const PAYMENT_ERRORS = {
  'PAYMENT_CANCELED': {
    message: 'پرداخت لغو شد',
    retryable: true,
    supportRequired: false
  },
  'VERIFICATION_FAILED': {
    message: 'تأیید پرداخت ناموفق بود',
    retryable: true,
    supportRequired: true
  },
  // ... سایر خطاها
};`}
              </pre>
            </div>

            <div className="detail-section">
              <h4>2. مکانیزم تلاش مجدد</h4>
              <pre>
{`const handleRetry = async () => {
  if (retryCount >= MAX_RETRY_ATTEMPTS) {
    // حداکثر تعداد تلاش‌ها انجام شده
    return;
  }
  await handleVerification(true);
};`}
              </pre>
            </div>

            <div className="detail-section">
              <h4>3. نمایش جزئیات فنی</h4>
              <pre>
{`{verificationResult?.errorDetails && (
  <details>
    <summary>جزئیات فنی</summary>
    <pre>{verificationResult.errorDetails}</pre>
  </details>
)}`}
              </pre>
            </div>

            <div className="detail-section">
              <h4>4. هدایت به پشتیبانی</h4>
              <pre>
{`const handleContactSupport = () => {
  const supportData = {
    errorCode: errorDetails?.code,
    authority: callbackData?.authority,
    retryCount,
    timestamp: new Date().toISOString()
  };
  // ارسال اطلاعات به سیستم پشتیبانی
};`}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="callback-handler-demo">
          <div className="demo-header">
            <h3>نمایش پردازش بازگشت پرداخت</h3>
            <p>سناریو: {selectedCallback.name}</p>
            <button onClick={handleReset} className="reset-button">
              بازگشت به انتخاب سناریو
            </button>
          </div>

          <div className="handler-container">
            <PaymentCallbackHandler />
          </div>

          <div className="demo-info">
            <h4>ویژگی‌های بهبود یافته:</h4>
            <ul>
              <li>✅ تشخیص خودکار نوع خطا</li>
              <li>✅ پیام‌های واضح و کاربرپسند</li>
              <li>✅ امکان تلاش مجدد برای خطاهای قابل حل</li>
              <li>✅ هدایت به پشتیبانی در صورت نیاز</li>
              <li>✅ نمایش جزئیات فنی برای عیب‌یابی</li>
              <li>✅ محدودیت تعداد تلاش‌ها</li>
              <li>✅ نمایش اطلاعات کامل پرداخت</li>
              <li>✅ پیام‌های راهنما برای کاربر</li>
            </ul>
          </div>
        </div>
      )}

      <div className="usage-instructions">
        <h3>نحوه استفاده</h3>
        
        <div className="instruction-section">
          <h4>1. استفاده مستقیم از کامپوننت:</h4>
          <pre>
{`import { PaymentCallbackHandler } from './PaymentCallbackHandler';

// در route تعریف کنید
<Route path="/payment/callback" element={<PaymentCallbackHandler />} />`}
          </pre>
        </div>

        <div className="instruction-section">
          <h4>2. استفاده از Hook:</h4>
          <pre>
{`import { usePaymentCallback } from './PaymentCallbackHandler';

const MyComponent = () => {
  const { isProcessing, result, processCallback } = usePaymentCallback();
  
  const handleCallback = async (callbackData) => {
    const result = await processCallback(callbackData);
    // پردازش نتیجه
  };
};`}
          </pre>
        </div>

        <div className="instruction-section">
          <h4>3. پیکربندی خطاها:</h4>
          <pre>
{`// می‌توانید خطاهای سفارشی اضافه کنید
const CUSTOM_ERRORS = {
  'CUSTOM_ERROR': {
    code: 'CUSTOM_ERROR',
    message: 'خطای سفارشی',
    description: 'توضیحات خطای سفارشی',
    retryable: true,
    supportRequired: false
  }
};`}
          </pre>
        </div>
      </div>

      <div className="best-practices">
        <h3>بهترین شیوه‌ها</h3>
        
        <div className="practice-section">
          <h4>✅ همیشه خطاها را لاگ کنید</h4>
          <p>برای عیب‌یابی و نظارت، تمام خطاها را در سیستم لاگ ثبت کنید.</p>
        </div>

        <div className="practice-section">
          <h4>✅ پیام‌های واضح ارائه دهید</h4>
          <p>پیام‌های خطا باید برای کاربر قابل فهم باشند و راه حل ارائه دهند.</p>
        </div>

        <div className="practice-section">
          <h4>✅ امکان تلاش مجدد فراهم کنید</h4>
          <p>برای خطاهای موقت، امکان تلاش مجدد را فراهم کنید.</p>
        </div>

        <div className="practice-section">
          <h4>✅ اطلاعات پشتیبانی ارائه دهید</h4>
          <p>در صورت نیاز، اطلاعات لازم برای تماس با پشتیبانی را ارائه دهید.</p>
        </div>

        <div className="practice-section">
          <h4>✅ محدودیت تلاش مجدد اعمال کنید</h4>
          <p>برای جلوگیری از سوء استفاده، تعداد تلاش‌های مجدد را محدود کنید.</p>
        </div>
      </div>
    </div>
  );
};
