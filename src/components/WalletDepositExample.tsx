import React, { useState } from 'react';
import { 
  SecureDepositButton, 
  QuickDepositButton, 
  DepositAmountInput, 
  DepositForm 
} from './SecureDepositButton';
import { CurrencyUnit, formatAmount, normalizeToRials } from '../lib/currencyUtils';

// Example component showing proper currency handling
export const WalletDepositExample: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [selectedUnit, setSelectedUnit] = useState<CurrencyUnit>('TOMAN');
  const [lastDeposit, setLastDeposit] = useState<string>('');

  const handleDeposit = (amount: number, unit: CurrencyUnit) => {
    const amountInRials = normalizeToRials(amount, unit);
    const displayAmount = formatAmount(amount, unit);
    
    console.log('=== DEPOSIT REQUEST ===');
    console.log('Amount:', amount, unit);
    console.log('Converted to Rials:', amountInRials);
    console.log('Display:', displayAmount);
    
    setLastDeposit(`${displayAmount} (${amountInRials.toLocaleString()} ریال)`);
  };

  const handleSuccess = (paymentUrl: string, orderId: string) => {
    console.log('Deposit successful:', { paymentUrl, orderId });
    // Handle success (e.g., show success message, redirect, etc.)
  };

  const handleError = (error: string) => {
    console.error('Deposit error:', error);
    // Handle error (e.g., show error message)
  };

  return (
    <div className="wallet-deposit-example">
      <h2>واریز کیف پول - مثال امن</h2>
      
      {/* Example 1: Simple secure deposit button */}
      <section className="example-section">
        <h3>مثال 1: دکمه واریز ساده</h3>
        <p>مبلغ: {formatAmount(selectedAmount, selectedUnit)}</p>
        <SecureDepositButton
          amount={selectedAmount}
          unit={selectedUnit}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </section>

      {/* Example 2: Quick deposit buttons */}
      <section className="example-section">
        <h3>مثال 2: دکمه‌های واریز سریع</h3>
        <div className="quick-buttons">
          <QuickDepositButton
            amount={100000}
            unit="TOMAN"
            onDeposit={handleDeposit}
          />
          <QuickDepositButton
            amount={500000}
            unit="TOMAN"
            onDeposit={handleDeposit}
          />
          <QuickDepositButton
            amount={1000000}
            unit="TOMAN"
            onDeposit={handleDeposit}
          />
        </div>
      </section>

      {/* Example 3: Amount input with validation */}
      <section className="example-section">
        <h3>مثال 3: ورودی مبلغ با اعتبارسنجی</h3>
        <DepositAmountInput
          unit="TOMAN"
          onAmountChange={(amount, unit) => {
            setSelectedAmount(amount);
            setSelectedUnit(unit);
          }}
          onDeposit={handleDeposit}
          placeholder="مبلغ را به تومان وارد کنید"
        />
      </section>

      {/* Example 4: Complete deposit form */}
      <section className="example-section">
        <h3>مثال 4: فرم کامل واریز</h3>
        <DepositForm
          onDeposit={handleDeposit}
          defaultUnit="TOMAN"
        />
      </section>

      {/* Example 5: Unit conversion demonstration */}
      <section className="example-section">
        <h3>مثال 5: تبدیل واحد</h3>
        <div className="conversion-demo">
          <div className="conversion-row">
            <span>100,000 تومان = {formatAmount(1000000, 'RIAL')}</span>
          </div>
          <div className="conversion-row">
            <span>1,000,000 ریال = {formatAmount(100000, 'TOMAN')}</span>
          </div>
        </div>
      </section>

      {/* Last deposit info */}
      {lastDeposit && (
        <section className="example-section">
          <h3>آخرین درخواست واریز</h3>
          <p>مبلغ: {lastDeposit}</p>
        </section>
      )}

      {/* Usage instructions */}
      <section className="example-section">
        <h3>نحوه استفاده</h3>
        <div className="usage-instructions">
          <h4>نکات مهم:</h4>
          <ul>
            <li>همیشه واحد پول را مشخص کنید (TOMAN یا RIAL)</li>
            <li>مقادیر به صورت خودکار به ریال تبدیل می‌شوند</li>
            <li>حداقل مبلغ: 100,000 تومان (1,000,000 ریال)</li>
            <li>اعتبارسنجی قبل از ارسال درخواست انجام می‌شود</li>
          </ul>
          
          <h4>کد نمونه:</h4>
          <pre>
{`// استفاده از دکمه واریز امن
<SecureDepositButton
  amount={100000}
  unit="TOMAN"
  onSuccess={(paymentUrl, orderId) => {
    // پردازش موفقیت
  }}
  onError={(error) => {
    // پردازش خطا
  }}
/>

// تبدیل واحد
const amountInRials = normalizeToRials(100000, 'TOMAN');
// نتیجه: 1000000 ریال`}
          </pre>
        </div>
      </section>
    </div>
  );
};

// Example of how to use in a real wallet component
export const WalletComponent: React.FC = () => {
  const [balance, setBalance] = useState<number>(0); // Balance in Rials
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async (amount: number, unit: CurrencyUnit) => {
    setIsLoading(true);
    try {
      // The SecureDepositButton will handle the conversion and API call
      console.log(`Depositing ${formatAmount(amount, unit)}`);
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wallet-component">
      <div className="wallet-header">
        <h2>کیف پول</h2>
        <div className="balance">
          موجودی: {formatAmount(balance, 'RIAL')}
        </div>
      </div>

      <div className="wallet-actions">
        <h3>واریز کیف پول</h3>
        <DepositForm
          onDeposit={handleDeposit}
          defaultUnit="TOMAN"
        />
      </div>

      {isLoading && (
        <div className="loading">
          در حال پردازش...
        </div>
      )}
    </div>
  );
};

// Example of a payment component for orders
export const OrderPaymentComponent: React.FC<{ orderAmount: number }> = ({ orderAmount }) => {
  // orderAmount is in Rials from the backend
  const displayAmount = formatAmount(orderAmount, 'RIAL');

  const handlePayment = async (amount: number, unit: CurrencyUnit) => {
    const amountInRials = normalizeToRials(amount, unit);
    
    // Verify the amount matches the order
    if (amountInRials !== orderAmount) {
      alert('مبلغ وارد شده با مبلغ سفارش مطابقت ندارد');
      return;
    }

    console.log('Processing payment:', formatAmount(amount, unit));
  };

  return (
    <div className="order-payment">
      <h3>پرداخت سفارش</h3>
      <p>مبلغ سفارش: {displayAmount}</p>
      
      <SecureDepositButton
        amount={orderAmount}
        unit="RIAL"
        description={`پرداخت سفارش - ${displayAmount}`}
        onSuccess={(paymentUrl, orderId) => {
          window.location.href = paymentUrl;
        }}
        onError={(error) => {
          alert(`خطا در پرداخت: ${error}`);
        }}
      />
    </div>
  );
};
