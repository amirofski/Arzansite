# ZarinPal Environment Configuration

## Required Environment Variables

### Backend (.env)
```env
# ZarinPal Configuration
ZARINPAL_MERCHANT_ID=your_merchant_id_here
ZARINPAL_SANDBOX=true  # Set to false for production
ZARINPAL_CALLBACK_URL=https://arzansite.com/payment/callback

# API Configuration
VITE_API_URL=https://nest.arzansite.com/api
```

### Frontend (.env)
```env
# API Configuration
VITE_API_URL=https://nest.arzansite.com/api
```

## Configuration Validation

### Backend Validation
The backend should validate these environment variables on startup:

```typescript
// In your main.ts or app.module.ts
if (!process.env.ZARINPAL_MERCHANT_ID) {
  throw new Error('ZARINPAL_MERCHANT_ID is required');
}

if (process.env.ZARINPAL_SANDBOX === undefined) {
  throw new Error('ZARINPAL_SANDBOX must be set to true or false');
}
```

### Frontend Validation
The frontend should check API connectivity:

```typescript
// In your API client initialization
if (!import.meta.env.VITE_API_URL) {
  console.error('VITE_API_URL is not configured');
}
```

## Sandbox vs Production

### Sandbox Environment
- `ZARINPAL_SANDBOX=true`
- Base URL: `https://sandbox.zarinpal.com/pg/v4/payment`
- Payment URL: `https://sandbox.zarinpal.com/pg/StartPay/{authority}`
- Use test merchant ID

### Production Environment
- `ZARINPAL_SANDBOX=false`
- Base URL: `https://api.zarinpal.com/pg/v4/payment`
- Payment URL: `https://www.zarinpal.com/pg/StartPay/{authority}`
- Use real merchant ID

## Common Configuration Issues

1. **Missing Merchant ID**: Results in "gateway not configured" errors
2. **Wrong Sandbox Flag**: Redirects to wrong payment URLs
3. **Incorrect Callback URL**: Payment callbacks fail
4. **API URL Mismatch**: Frontend can't connect to backend

## Testing Configuration

### 1. Check Environment Variables
```bash
# Backend
echo $ZARINPAL_MERCHANT_ID
echo $ZARINPAL_SANDBOX

# Frontend
echo $VITE_API_URL
```

### 2. Test API Connectivity
```bash
curl -X GET https://nest.arzansite.com/api/health
```

### 3. Test ZarinPal Integration
- Use sandbox environment for testing
- Minimum amount: 1,000,000 Rials (100,000 Tomans)
- Test both request and verification flows
