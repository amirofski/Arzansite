# ZarinPal Integration Debugging Guide

## Common Issues and Solutions

### 1. Amount Unit Mismatch (Rials vs Tomans)

**Problem**: Frontend sends Tomans but backend expects Rials, or vice versa.

**Symptoms**:
- "Invalid request parameters" error
- Payment verification fails
- Amount mismatch in logs

**Solution**:
```typescript
// Frontend: Convert Tomans to Rials
const amountInRials = Math.floor(amountInTomans * 10);

// Backend: Validate minimum amount (1,000,000 Rials)
@Min(1000000)
amount: number;
```

**Debug Steps**:
1. Check frontend logs for amount conversion
2. Verify backend receives correct Rials amount
3. Ensure ZarinPal receives same amount in verification

### 2. Metadata Storage Type Error

**Problem**: Appwrite requires string metadata, but objects are being stored.

**Symptoms**:
- "Invalid document structure" error
- Metadata not saved properly

**Solution**:
```typescript
// Before storing in Appwrite
metadata: JSON.stringify({
  type: 'wallet_deposit',
  source: 'web',
  timestamp: Date.now()
})
```

**Debug Steps**:
1. Check metadata type before saving
2. Verify JSON.stringify is used
3. Validate metadata size (max 8192 chars)

### 3. Environment Variable Configuration

**Problem**: Missing or incorrect environment variables.

**Symptoms**:
- "Gateway not configured" error
- Wrong payment URLs
- Connection failures

**Required Variables**:
```env
ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_SANDBOX=true
ZARINPAL_CALLBACK_URL=https://arzansite.com/payment/callback
```

**Debug Steps**:
1. Verify all environment variables are set
2. Check sandbox vs production URLs
3. Test API connectivity

### 4. Fragile Response Parsing

**Problem**: Code assumes specific response structure from ZarinPal.

**Symptoms**:
- Unexpected errors
- Failed verifications
- Missing error details

**Solution**:
```typescript
// Robust response handling
if (response.data?.data?.code === 100) {
  return { success: true, ref_id: response.data.data.ref_id };
}

const errorMsg = response.data?.errors?.message || 
                 JSON.stringify(response.data) || 
                 'Unknown error';
```

**Debug Steps**:
1. Log full ZarinPal responses
2. Handle different response shapes
3. Provide clear error messages

### 5. Missing Amount During Verification

**Problem**: Verification call doesn't include the original amount.

**Symptoms**:
- Verification fails
- "Amount mismatch" errors

**Solution**:
```typescript
// Include amount in verification
const verifyData = {
  merchant_id: this.merchantId,
  authority: payload.authority,
  amount: payload.amount  // MUST match request amount
};
```

**Debug Steps**:
1. Store original amount with payment request
2. Pass amount to verification
3. Verify amount consistency

### 6. Duplicate Processing

**Problem**: Same payment gets credited multiple times.

**Symptoms**:
- Double wallet credits
- Duplicate transactions

**Solution**:
```typescript
// Check for existing transaction before crediting
const existingTransaction = await this.findTransactionByRefId(refId);
if (existingTransaction) {
  throw new Error('Transaction already processed');
}
```

**Debug Steps**:
1. Check transaction collection for duplicates
2. Use unique identifiers (refId, authority)
3. Implement idempotency

## Debugging Checklist

### 1. Environment Setup
- [ ] All environment variables configured
- [ ] Sandbox vs production settings correct
- [ ] API URLs accessible

### 2. Frontend Validation
- [ ] Amount conversion (Tomans → Rials) working
- [ ] Minimum amount validation (100,000 Tomans)
- [ ] Metadata stringification applied
- [ ] User ID properly passed

### 3. Backend Validation
- [ ] ZarinPal service configured
- [ ] Request/response logging enabled
- [ ] Error handling robust
- [ ] Amount validation in place

### 4. Payment Flow
- [ ] Request creates payment URL
- [ ] User redirected to ZarinPal
- [ ] Callback receives authority
- [ ] Verification includes amount
- [ ] Wallet credited correctly

### 5. Error Handling
- [ ] Clear error messages
- [ ] Proper logging
- [ ] User-friendly feedback
- [ ] Retry mechanisms

## Log Analysis

### Frontend Logs
Look for:
```
=== WALLET DEPOSIT REQUEST ===
User ID: user123
Amount in Tomans: 100000
Amount in Rials: 1000000
Full payload: {...}
```

### Backend Logs
Look for:
```
=== API CLIENT: WALLET DEPOSIT REQUEST ===
Payload: {...}
=== API CLIENT: WALLET DEPOSIT RESPONSE ===
Response: {...}
```

### ZarinPal Logs
Look for:
- Request/response bodies
- Error codes and messages
- Authority and ref_id values

## Testing Scenarios

### 1. Valid Payment Flow
1. Enter 100,000 Tomans
2. Submit payment request
3. Redirect to ZarinPal
4. Complete payment
5. Verify callback
6. Check wallet balance

### 2. Invalid Amount
1. Enter 50,000 Tomans (below minimum)
2. Verify validation error
3. Check error message

### 3. Payment Failure
1. Start payment flow
2. Cancel at ZarinPal
3. Verify error handling
4. Check retry functionality

### 4. Duplicate Processing
1. Complete payment
2. Try to verify again
3. Check for duplicate prevention

## Common Error Codes

### ZarinPal Error Codes
- `100`: Success
- `101`: Payment already verified
- `102`: Invalid authority
- `103`: Invalid amount
- `104`: Invalid merchant ID

### Backend Error Codes
- `400`: Bad Request (validation errors)
- `404`: Not Found (endpoint issues)
- `500`: Internal Server Error (processing errors)

## Support Resources

1. **ZarinPal Documentation**: https://docs.zarinpal.com
2. **Backend Logs**: Check server logs for detailed errors
3. **Frontend Console**: Browser developer tools
4. **Network Tab**: Monitor API requests/responses
