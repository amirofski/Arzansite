// Currency Utilities for Tomans and Rials
// Handles conversion and validation to prevent payment verification failures

export type CurrencyUnit = 'TOMAN' | 'RIAL';

export interface CurrencyAmount {
  value: number;
  unit: CurrencyUnit;
}

// Conversion constants
export const TOMAN_TO_RIAL_RATIO = 10;
export const RIAL_TO_TOMAN_RATIO = 0.1;

// Minimum amounts in different units
export const MINIMUM_DEPOSIT_RIALS = 1000000; // 1,000,000 Rials
export const MINIMUM_DEPOSIT_TOMANS = 100000; // 100,000 Tomans

/**
 * Convert Tomans to Rials
 */
export function tomansToRials(tomans: number): number {
  return Math.round(tomans * TOMAN_TO_RIAL_RATIO);
}

/**
 * Convert Rials to Tomans
 */
export function rialsToTomans(rials: number): number {
  return Math.round(rials * RIAL_TO_TOMAN_RATIO);
}

/**
 * Format amount for display
 */
export function formatCurrency(amount: number, unit: CurrencyUnit): string {
  const formatter = new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: unit === 'TOMAN' ? 'IRR' : 'IRR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  // For Tomans, we need to multiply by 10 for proper display
  const displayAmount = unit === 'TOMAN' ? amount * 10 : amount;
  return formatter.format(displayAmount);
}

/**
 * Format amount with custom unit display
 */
export function formatAmount(amount: number, unit: CurrencyUnit): string {
  const formatted = amount.toLocaleString('fa-IR');
  const unitLabel = unit === 'TOMAN' ? 'تومان' : 'ریال';
  return `${formatted} ${unitLabel}`;
}

/**
 * Validate minimum deposit amount
 */
export function validateDepositAmount(amount: number, unit: CurrencyUnit): { isValid: boolean; error?: string } {
  const amountInRials = unit === 'TOMAN' ? tomansToRials(amount) : amount;
  
  if (amountInRials < MINIMUM_DEPOSIT_RIALS) {
    return {
      isValid: false,
      error: `حداقل مبلغ واریز ${formatAmount(MINIMUM_DEPOSIT_TOMANS, 'TOMAN')} (${formatAmount(MINIMUM_DEPOSIT_RIALS, 'RIAL')}) است`
    };
  }
  
  return { isValid: true };
}

/**
 * Normalize amount to Rials for API calls
 */
export function normalizeToRials(amount: number, unit: CurrencyUnit): number {
  return unit === 'TOMAN' ? tomansToRials(amount) : amount;
}

/**
 * Create a standardized amount object for API calls
 */
export function createApiAmount(amount: number, unit: CurrencyUnit): { amount: number; originalUnit: CurrencyUnit } {
  return {
    amount: normalizeToRials(amount, unit),
    originalUnit: unit
  };
}

/**
 * Parse amount from string input
 */
export function parseAmount(input: string, unit: CurrencyUnit): number | null {
  // Remove non-numeric characters except decimal point
  const cleaned = input.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  
  return Math.round(parsed);
}

/**
 * Get display amount for UI (converts Rials to Tomans for display)
 */
export function getDisplayAmount(amountInRials: number, displayUnit: CurrencyUnit): number {
  return displayUnit === 'TOMAN' ? rialsToTomans(amountInRials) : amountInRials;
}

/**
 * Create amount description for API calls
 */
export function createAmountDescription(amount: number, unit: CurrencyUnit): string {
  const amountInRials = normalizeToRials(amount, unit);
  const displayAmount = formatAmount(amount, unit);
  return `واریز کیف پول - ${displayAmount} (${amountInRials.toLocaleString()} ریال)`;
}

/**
 * Currency conversion utilities for common amounts
 */
export const CurrencyConverter = {
  // Common amounts in Tomans
  TOMAN_AMOUNTS: {
    MINIMUM: MINIMUM_DEPOSIT_TOMANS,
    SMALL: 50000,    // 50,000 Tomans
    MEDIUM: 100000,  // 100,000 Tomans
    LARGE: 500000,   // 500,000 Tomans
    MAXIMUM: 1000000 // 1,000,000 Tomans
  },
  
  // Common amounts in Rials
  RIAL_AMOUNTS: {
    MINIMUM: MINIMUM_DEPOSIT_RIALS,
    SMALL: 500000,    // 500,000 Rials
    MEDIUM: 1000000,  // 1,000,000 Rials
    LARGE: 5000000,   // 5,000,000 Rials
    MAXIMUM: 10000000 // 10,000,000 Rials
  },
  
  // Convert common amounts
  toRials(tomans: number): number {
    return tomansToRials(tomans);
  },
  
  toTomans(rials: number): number {
    return rialsToTomans(rials);
  }
};

/**
 * Validation rules for different payment scenarios
 */
export const PaymentValidation = {
  // Wallet deposit validation
  validateWalletDeposit(amount: number, unit: CurrencyUnit) {
    return validateDepositAmount(amount, unit);
  },
  
  // Order payment validation
  validateOrderPayment(amount: number, unit: CurrencyUnit) {
    const amountInRials = normalizeToRials(amount, unit);
    
    if (amountInRials < 1000) {
      return {
        isValid: false,
        error: 'مبلغ سفارش باید حداقل 1,000 ریال باشد'
      };
    }
    
    return { isValid: true };
  },
  
  // Invoice payment validation
  validateInvoicePayment(amount: number, unit: CurrencyUnit) {
    const amountInRials = normalizeToRials(amount, unit);
    
    if (amountInRials <= 0) {
      return {
        isValid: false,
        error: 'مبلغ فاکتور باید بیشتر از صفر باشد'
      };
    }
    
    return { isValid: true };
  }
};

/**
 * Currency display preferences
 */
export const CurrencyDisplay = {
  // Default display unit for the application
  DEFAULT_UNIT: 'TOMAN' as CurrencyUnit,
  
  // Get user's preferred display unit (could be from user settings)
  getUserDisplayUnit(): CurrencyUnit {
    // In the future, this could read from user preferences
    return this.DEFAULT_UNIT;
  },
  
  // Format balance for display
  formatBalance(balanceInRials: number): string {
    const displayUnit = this.getUserDisplayUnit();
    const displayAmount = getDisplayAmount(balanceInRials, displayUnit);
    return formatAmount(displayAmount, displayUnit);
  },
  
  // Format price for display
  formatPrice(priceInRials: number): string {
    const displayUnit = this.getUserDisplayUnit();
    const displayAmount = getDisplayAmount(priceInRials, displayUnit);
    return formatAmount(displayAmount, displayUnit);
  }
};
