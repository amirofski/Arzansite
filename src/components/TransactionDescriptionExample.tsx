import React, { useState } from 'react';
import { 
  SafeTransactionDescription, 
  DOMPurifyTransactionDescription,
  useSafeContent,
  withSafeContent 
} from './SafeTransactionDescription';
import { 
  sanitizeHtml, 
  containsDangerousContent, 
  SafeContentRenderer 
} from '../lib/sanitizationUtils';

// Example transaction data with potentially dangerous content
const exampleTransactions = [
  {
    id: '1',
    description: 'پرداخت عادی برای خرید محصول',
    amount: 100000,
    safe: true
  },
  {
    id: '2',
    description: '<script>alert("XSS Attack!")</script>پرداخت خطرناک',
    amount: 50000,
    safe: false
  },
  {
    id: '3',
    description: 'پرداخت با <strong>HTML</strong> و <em>فرمت</em>',
    amount: 75000,
    safe: true
  },
  {
    id: '4',
    description: 'javascript:alert("Malicious URL")',
    amount: 25000,
    safe: false
  },
  {
    id: '5',
    description: 'پرداخت با <iframe src="http://evil.com"></iframe>',
    amount: 30000,
    safe: false
  },
  {
    id: '6',
    description: 'پرداخت طولانی با متن بسیار طولانی که باید کوتاه شود و در صورت نیاز دکمه نمایش بیشتر نمایش داده شود',
    amount: 150000,
    safe: true
  }
];

// Example component demonstrating different usage patterns
export const TransactionDescriptionExample: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState(exampleTransactions[0]);
  const [allowHtml, setAllowHtml] = useState(false);
  const [maxLength, setMaxLength] = useState(100);

  return (
    <div className="transaction-description-example">
      <h2>نمونه نمایش امن توضیحات تراکنش</h2>
      
      {/* Controls */}
      <div className="controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={allowHtml}
              onChange={(e) => setAllowHtml(e.target.checked)}
            />
            اجازه نمایش HTML
          </label>
        </div>
        
        <div className="control-group">
          <label>
            حداکثر طول:
            <input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              min="10"
              max="500"
            />
          </label>
        </div>
        
        <div className="control-group">
          <label>
            انتخاب تراکنش:
            <select
              value={selectedTransaction.id}
              onChange={(e) => {
                const transaction = exampleTransactions.find(t => t.id === e.target.value);
                if (transaction) setSelectedTransaction(transaction);
              }}
            >
              {exampleTransactions.map(transaction => (
                <option key={transaction.id} value={transaction.id}>
                  تراکنش {transaction.id} - {transaction.safe ? 'امن' : 'خطرناک'}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Transaction Info */}
      <div className="transaction-info">
        <h3>اطلاعات تراکنش</h3>
        <p><strong>شناسه:</strong> {selectedTransaction.id}</p>
        <p><strong>مبلغ:</strong> {selectedTransaction.amount.toLocaleString()} ریال</p>
        <p><strong>توضیحات خام:</strong></p>
        <pre className="raw-description">{selectedTransaction.description}</pre>
        
        {/* Security Analysis */}
        <div className="security-analysis">
          <h4>تحلیل امنیتی</h4>
          {(() => {
            const dangerCheck = containsDangerousContent(selectedTransaction.description);
            return (
              <div className={`security-status ${dangerCheck.isDangerous ? 'dangerous' : 'safe'}`}>
                <span className="status-icon">
                  {dangerCheck.isDangerous ? '⚠️' : '✅'}
                </span>
                <span className="status-text">
                  {dangerCheck.isDangerous ? 'محتوای خطرناک' : 'محتوای امن'}
                </span>
                {dangerCheck.isDangerous && (
                  <div className="threats">
                    <strong>تهدیدات:</strong>
                    <ul>
                      {dangerCheck.threats.map((threat, index) => (
                        <li key={index}>{threat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Safe Transaction Description Examples */}
      <div className="examples">
        <h3>نمونه‌های نمایش امن</h3>
        
        {/* Example 1: Basic Safe Transaction Description */}
        <div className="example-section">
          <h4>1. نمایش امن پایه (SafeTransactionDescription)</h4>
          <SafeTransactionDescription
            description={selectedTransaction.description}
            allowHtml={allowHtml}
            maxLength={maxLength}
            className="example-description"
            onSanitizationComplete={(result) => {
              console.log('Sanitization completed:', result);
            }}
          />
        </div>

        {/* Example 2: DOMPurify Transaction Description */}
        <div className="example-section">
          <h4>2. نمایش با DOMPurify</h4>
          <DOMPurifyTransactionDescription
            description={selectedTransaction.description}
            maxLength={maxLength}
            className="example-description"
          />
        </div>

        {/* Example 3: Using useSafeContent Hook */}
        <div className="example-section">
          <h4>3. استفاده از Hook (useSafeContent)</h4>
          <HookExample description={selectedTransaction.description} />
        </div>

        {/* Example 4: With HOC */}
        <div className="example-section">
          <h4>4. استفاده از HOC (withSafeContent)</h4>
          <WrappedComponent description={selectedTransaction.description} />
        </div>

        {/* Example 5: Manual Sanitization */}
        <div className="example-section">
          <h4>5. فیلتر کردن دستی</h4>
          <ManualSanitizationExample description={selectedTransaction.description} />
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="usage-instructions">
        <h3>نحوه استفاده</h3>
        
        <div className="instruction-section">
          <h4>برای نمایش امن توضیحات تراکنش:</h4>
          <pre>
{`// 1. استفاده از کامپوننت SafeTransactionDescription
<SafeTransactionDescription
  description={transaction.description}
  allowHtml={false} // پیش‌فرض: فقط متن
  maxLength={200}
  onSanitizationComplete={(result) => {
    console.log('فیلتر کردن کامل شد:', result);
  }}
/>

// 2. استفاده از DOMPurify (اگر موجود باشد)
<DOMPurifyTransactionDescription
  description={transaction.description}
  maxLength={200}
/>

// 3. استفاده از Hook
const { sanitizedContent, isSafe } = useSafeContent(description);

// 4. استفاده از HOC
const SafeComponent = withSafeContent(MyComponent, 'description');

// 5. فیلتر کردن دستی
const result = sanitizeHtml(description, { allowHtml: false });`}
          </pre>
        </div>

        <div className="instruction-section">
          <h4>بهترین شیوه‌ها:</h4>
          <ul>
            <li>✅ همیشه محتوا را قبل از نمایش فیلتر کنید</li>
            <li>✅ از <code>allowHtml: false</code> به عنوان پیش‌فرض استفاده کنید</li>
            <li>✅ محتوای خطرناک را لاگ کنید</li>
            <li>✅ به کاربر اطلاع دهید که محتوا فیلتر شده است</li>
            <li>❌ هرگز از <code>dangerouslySetInnerHTML</code> بدون فیلتر استفاده نکنید</li>
            <li>❌ به محتوای کاربر اعتماد نکنید</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Example component using useSafeContent hook
const HookExample: React.FC<{ description: string }> = ({ description }) => {
  const { sanitizedContent, isSafe, sanitizationResult } = useSafeContent(description, {
    allowHtml: false,
    maxLength: 100
  });

  return (
    <div className="hook-example">
      <div className="description-content">
        {sanitizedContent}
      </div>
      <div className="hook-info">
        <small>
          امن: {isSafe ? 'بله' : 'خیر'} | 
          طول اصلی: {sanitizationResult?.originalLength} | 
          طول فیلتر شده: {sanitizationResult?.sanitizedLength}
        </small>
      </div>
    </div>
  );
};

// Example component wrapped with HOC
const BaseComponent: React.FC<{ description: string; isContentSafe?: boolean }> = ({ 
  description, 
  isContentSafe 
}) => (
  <div className="hoc-example">
    <div className="description-content">{description}</div>
    <div className="safety-indicator">
      {isContentSafe ? '✅ امن' : '⚠️ فیلتر شده'}
    </div>
  </div>
);

const WrappedComponent = withSafeContent(BaseComponent, 'description', {
  allowHtml: false,
  maxLength: 150
});

// Example with manual sanitization
const ManualSanitizationExample: React.FC<{ description: string }> = ({ description }) => {
  const result = SafeContentRenderer.renderText(description, 120);
  const safetyCheck = SafeContentRenderer.isSafe(description);

  return (
    <div className="manual-example">
      <div className="description-content">{result}</div>
      <div className="safety-info">
        <small>
          {safetyCheck.safe ? '✅ محتوای امن' : `⚠️ ${safetyCheck.reason}`}
        </small>
      </div>
    </div>
  );
};
