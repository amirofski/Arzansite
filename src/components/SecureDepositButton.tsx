import React, { useState } from 'react';
import { 
  CurrencyUnit, 
  normalizeToRials, 
  validateDepositAmount, 
  formatAmount, 
  createAmountDescription,
  CurrencyDisplay 
} from '../lib/currencyUtils';
import { 
  SecurePaymentRedirect, 
  validatePaymentResponse, 
  validateRedirectUrl,
  constructSafePaymentUrl 
} from '../lib/secureRedirect';
import { SafeTransactionDescription } from './SafeTransactionDescription';
import { SafeContentRenderer } from '../lib/sanitizationUtils';
import { apiClient } from '../lib/api-client';

interface SecureDepositButtonProps {
  amount: number;
  unit: CurrencyUnit; // Explicitly specify the unit to prevent confusion
  description?: string;
  onSuccess?: (paymentUrl: string, orderId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export const SecureDepositButton: React.FC<SecureDepositButtonProps> = ({
  amount,
  unit,
  description,
  onSuccess,
  onError,
  className = '',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    // Validate amount before making API call
    const validation = validateDepositAmount(amount, unit);
    if (!validation.isValid) {
      onError?.(validation.error!);
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert to Rials for API call
      const amountInRials = normalizeToRials(amount, unit);
      
             // Create description with both units for clarity and sanitize it
       const rawDescription = description || createAmountDescription(amount, unit);
       const depositDescription = SafeContentRenderer.renderText(rawDescription, 200);
      
      console.log('=== SECURE DEPOSIT REQUEST ===');
      console.log('Original amount:', amount, unit);
      console.log('Converted to Rials:', amountInRials);
      console.log('Description:', depositDescription);
      
      const result = await apiClient.requestWalletDeposit({
        amount: amountInRials,
        description: depositDescription
      });
      
      console.log('=== DEPOSIT RESPONSE ===');
      console.log('Payment URL:', result.paymentUrl);
      console.log('Order ID:', result.orderId);
      
      // Validate payment response data
      const paymentData = {
        orderId: result.orderId,
        authority: result.authority || '', // Server should provide authority
        paymentUrl: result.paymentUrl,
        amount: amountInRials,
        description: depositDescription
      };
      
      // Use secure redirect handler
      const secureRedirect = SecurePaymentRedirect.getInstance();
      await secureRedirect.handlePaymentRedirect(paymentData);
      
      // Call success callback after successful redirect
      onSuccess?.(result.paymentUrl, result.orderId);
      
    } catch (error) {
      console.error('Deposit request failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Format display amount
  const displayAmount = formatAmount(amount, unit);
  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={handleDeposit}
      disabled={isDisabled}
      className={`secure-deposit-button ${className} ${isDisabled ? 'disabled' : ''}`}
      title={`Deposit ${displayAmount}`}
    >
      {isLoading ? (
        <span>در حال پردازش...</span>
      ) : (
        <span>واریز {displayAmount}</span>
      )}
    </button>
  );
};

// Quick deposit buttons for common amounts
interface QuickDepositButtonProps {
  amount: number;
  unit: CurrencyUnit;
  onDeposit: (amount: number, unit: CurrencyUnit) => void;
  className?: string;
}

export const QuickDepositButton: React.FC<QuickDepositButtonProps> = ({
  amount,
  unit,
  onDeposit,
  className = ''
}) => {
  const displayAmount = formatAmount(amount, unit);
  
  return (
    <button
      onClick={() => onDeposit(amount, unit)}
      className={`quick-deposit-button ${className}`}
    >
      {displayAmount}
    </button>
  );
};

// Deposit amount input component
interface DepositAmountInputProps {
  unit: CurrencyUnit;
  onAmountChange: (amount: number, unit: CurrencyUnit) => void;
  onDeposit: (amount: number, unit: CurrencyUnit) => void;
  placeholder?: string;
  className?: string;
}

export const DepositAmountInput: React.FC<DepositAmountInputProps> = ({
  unit,
  onAmountChange,
  onDeposit,
  placeholder,
  className = ''
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');
    
    const parsedAmount = parseFloat(value.replace(/[^\d.]/g, ''));
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onAmountChange(parsedAmount, unit);
    }
  };

  const handleDeposit = () => {
    const parsedAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('لطفا مبلغ معتبری وارد کنید');
      return;
    }

    const validation = validateDepositAmount(parsedAmount, unit);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    onDeposit(parsedAmount, unit);
  };

  const unitLabel = unit === 'TOMAN' ? 'تومان' : 'ریال';
  const defaultPlaceholder = `مبلغ را به ${unitLabel} وارد کنید`;

  return (
    <div className={`deposit-amount-input ${className}`}>
      <div className="input-group">
        <input
          type="text"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          className={`amount-input ${error ? 'error' : ''}`}
          dir="ltr"
        />
        <span className="unit-label">{unitLabel}</span>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <SecureDepositButton
        amount={parseFloat(amount) || 0}
        unit={unit}
        onError={setError}
        disabled={!amount || parseFloat(amount) <= 0}
      />
    </div>
  );
};

// Deposit form with unit selection
interface DepositFormProps {
  onDeposit: (amount: number, unit: CurrencyUnit) => void;
  defaultUnit?: CurrencyUnit;
  className?: string;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  onDeposit,
  defaultUnit = 'TOMAN',
  className = ''
}) => {
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<CurrencyUnit>(defaultUnit);
  const [error, setError] = useState<string>('');

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');
  };

  const handleUnitChange = (newUnit: CurrencyUnit) => {
    setUnit(newUnit);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('لطفا مبلغ معتبری وارد کنید');
      return;
    }

    const validation = validateDepositAmount(parsedAmount, unit);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    onDeposit(parsedAmount, unit);
  };

  return (
    <form onSubmit={handleSubmit} className={`deposit-form ${className}`}>
      <div className="form-group">
        <label htmlFor="amount">مبلغ واریز:</label>
        <div className="input-group">
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="مبلغ را وارد کنید"
            className={`amount-input ${error ? 'error' : ''}`}
            dir="ltr"
          />
          <select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value as CurrencyUnit)}
            className="unit-select"
          >
            <option value="TOMAN">تومان</option>
            <option value="RIAL">ریال</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="quick-amounts">
        <span>مقادیر سریع:</span>
        <QuickDepositButton
          amount={100000}
          unit="TOMAN"
          onDeposit={(amount, unit) => {
            setAmount(amount.toString());
            setUnit(unit);
          }}
        />
        <QuickDepositButton
          amount={500000}
          unit="TOMAN"
          onDeposit={(amount, unit) => {
            setAmount(amount.toString());
            setUnit(unit);
          }}
        />
        <QuickDepositButton
          amount={1000000}
          unit="TOMAN"
          onDeposit={(amount, unit) => {
            setAmount(amount.toString());
            setUnit(unit);
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!amount || parseFloat(amount) <= 0}
        className="submit-button"
      >
        واریز کیف پول
      </button>
    </form>
  );
};
