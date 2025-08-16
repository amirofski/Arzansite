# Currency Unit Fix - Tomans vs Rials

## Problem Fixed

The frontend was sending amounts in ambiguous units (Tomans vs Rials), leading to payment verification failures when the backend expected Rials but received Tomans or vice versa.

## Root Cause

1. **UI displayed amounts in Tomans** (user-friendly)
2. **Backend expected amounts in Rials** (ZarinPal requirement)
3. **No explicit unit conversion** in components
4. **Ambiguous amount handling** in API calls

## Solution Implemented

### 1. Currency Utilities (`src/lib/currencyUtils.ts`)

Created comprehensive currency handling utilities:

```typescript
// Conversion constants
export const TOMAN_TO_RIAL_RATIO = 10;
export const RIAL_TO_TOMAN_RATIO = 0.1;

// Convert Tomans to Rials
export function tomansToRials(tomans: number): number {
  return Math.round(tomans * TOMAN_TO_RIAL_RATIO);
}

// Normalize amount to Rials for API calls
export function normalizeToRials(amount: number, unit: CurrencyUnit): number {
  return unit === 'TOMAN' ? tomansToRials(amount) : amount;
}
```

### 2. Secure Deposit Components (`src/components/SecureDepositButton.tsx`)

Created components that explicitly handle currency units:

```typescript
interface SecureDepositButtonProps {
  amount: number;
  unit: CurrencyUnit; // Explicitly specify the unit
  description?: string;
  onSuccess?: (paymentUrl: string, orderId: string) => void;
  onError?: (error: string) => void;
}
```

### 3. Validation and Error Handling

```typescript
// Validate minimum deposit amount
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
```

## Usage Examples

### Before (Problematic)

```typescript
// ❌ Ambiguous - is this Tomans or Rials?
const amount = 100000;

// ❌ No unit specification
await apiClient.requestWalletDeposit({ amount });
```

### After (Fixed)

```typescript
// ✅ Explicit unit specification
const amount = 100000; // Tomans
const unit: CurrencyUnit = 'TOMAN';

// ✅ Automatic conversion to Rials
const amountInRials = normalizeToRials(amount, unit); // 1,000,000 Rials

// ✅ Validation before API call
const validation = validateDepositAmount(amount, unit);
if (!validation.isValid) {
  throw new Error(validation.error);
}

// ✅ Secure component with explicit unit
<SecureDepositButton
  amount={amount}
  unit={unit}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

## Components Created

### 1. SecureDepositButton
- Explicit unit specification
- Automatic conversion to Rials
- Validation before API call
- Error handling

### 2. QuickDepositButton
- Pre-defined amounts
- Unit-aware display
- Quick selection

### 3. DepositAmountInput
- Input validation
- Unit selection
- Real-time conversion

### 4. DepositForm
- Complete deposit form
- Unit selection dropdown
- Quick amount buttons

## API Integration

### Updated API Client

```typescript
// API client now expects amounts in Rials
async requestWalletDeposit(payload: { 
  amount: number; // Amount in Rials (normalized)
  description?: string; 
}): Promise<{ paymentUrl: string; orderId: string }> {
  // Validation ensures minimum 1,000,000 Rials
  if (payload.amount < 1000000) {
    throw new Error('Amount must be at least 1,000,000 Rials (100,000 Tomans)');
  }
  // ... rest of implementation
}
```

### Payment Flow

1. **User Input**: Amount in Tomans (UI-friendly)
2. **Validation**: Check minimum amount in Rials
3. **Conversion**: Convert Tomans to Rials
4. **API Call**: Send amount in Rials to backend
5. **Payment Gateway**: ZarinPal receives correct amount in Rials
6. **Verification**: Payment verification succeeds

## Testing

### Unit Conversion Tests

```typescript
// Test conversions
expect(tomansToRials(100000)).toBe(1000000); // 100k Tomans = 1M Rials
expect(rialsToTomans(1000000)).toBe(100000);  // 1M Rials = 100k Tomans

// Test validation
const validation = validateDepositAmount(50000, 'TOMAN');
expect(validation.isValid).toBe(false); // Below minimum

const validation2 = validateDepositAmount(100000, 'TOMAN');
expect(validation2.isValid).toBe(true); // At minimum
```

### Component Tests

```typescript
// Test secure deposit button
<SecureDepositButton
  amount={100000}
  unit="TOMAN"
  onSuccess={mockSuccess}
  onError={mockError}
/>

// Verify API call receives correct amount
expect(mockApiCall).toHaveBeenCalledWith({
  amount: 1000000, // Converted to Rials
  description: expect.stringContaining('100,000 تومان')
});
```

## Migration Guide

### 1. Update Existing Components

```typescript
// Before
<button onClick={() => handleDeposit(amount)}>
  Deposit {amount}
</button>

// After
<SecureDepositButton
  amount={amount}
  unit="TOMAN"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### 2. Update API Calls

```typescript
// Before
await apiClient.requestWalletDeposit({ amount });

// After
const amountInRials = normalizeToRials(amount, 'TOMAN');
await apiClient.requestWalletDeposit({ 
  amount: amountInRials,
  description: createAmountDescription(amount, 'TOMAN')
});
```

### 3. Update Validation

```typescript
// Before
if (amount < 1000000) {
  throw new Error('Amount too low');
}

// After
const validation = validateDepositAmount(amount, 'TOMAN');
if (!validation.isValid) {
  throw new Error(validation.error);
}
```

## Benefits

1. **Prevents Payment Failures**: Correct amounts sent to payment gateway
2. **Clear Unit Specification**: No ambiguity about currency units
3. **User-Friendly UI**: Display in Tomans, process in Rials
4. **Validation**: Prevents invalid amounts before API calls
5. **Error Handling**: Clear error messages for users
6. **Maintainability**: Centralized currency logic

## Common Amounts Reference

| Tomans | Rials | Description |
|--------|-------|-------------|
| 50,000 | 500,000 | Below minimum |
| 100,000 | 1,000,000 | Minimum deposit |
| 500,000 | 5,000,000 | Medium deposit |
| 1,000,000 | 10,000,000 | Large deposit |

## Best Practices

1. **Always specify units** in component props
2. **Convert to Rials** before API calls
3. **Validate amounts** before sending requests
4. **Display in Tomans** for user-friendly UI
5. **Log conversions** for debugging
6. **Handle errors** gracefully with clear messages

## Future Enhancements

1. **User Preferences**: Allow users to choose display unit
2. **Dynamic Conversion**: Real-time currency conversion
3. **Multiple Currencies**: Support for other currencies
4. **Rate Management**: Dynamic exchange rates
5. **Audit Trail**: Log all currency conversions
