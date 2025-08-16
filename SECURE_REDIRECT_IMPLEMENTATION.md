# Secure Redirect Implementation - Preventing Open Redirect Vulnerabilities

## Problem Fixed

The original implementation used `window.location.href = result.paymentUrl` directly without validation, creating an open redirect vulnerability where attackers could craft malicious redirects.

## Security Risks

### Before (Vulnerable)
```typescript
// ❌ Direct redirect without validation
const result = await apiClient.requestWalletDeposit({ amount });
window.location.href = result.paymentUrl; // Could be malicious!
```

**Attack Scenarios:**
1. **Malicious URL Injection**: Attacker crafts `paymentUrl` with `javascript:alert('xss')`
2. **Phishing Redirects**: Attacker redirects to fake payment site
3. **Data Exfiltration**: Attacker redirects to their server with sensitive data
4. **Session Hijacking**: Attacker redirects to capture session tokens

## Solution Implemented

### 1. **URL Validation** (`src/lib/secureRedirect.ts`)

```typescript
// Validate if a URL is safe for redirect
export function validateRedirectUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Check protocol (only HTTPS in production)
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      return { isValid: false, error: 'Invalid protocol' };
    }
    
    // Check domain whitelist
    const domain = urlObj.hostname.toLowerCase();
    const isAllowedDomain = ALLOWED_PAYMENT_DOMAINS.some(allowed => 
      domain === allowed || domain.endsWith(`.${allowed}`)
    );
    
    if (!isAllowedDomain) {
      return { isValid: false, error: `Domain not allowed: ${domain}` };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [/javascript:/i, /data:/i, /vbscript:/i];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { isValid: false, error: 'URL contains suspicious patterns' };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}
```

### 2. **Secure Redirect Handler** (`src/lib/secureRedirect.ts`)

```typescript
export class SecurePaymentRedirect {
  static async handlePaymentRedirect(paymentData: PaymentRedirectData): Promise<void> {
    try {
      // Validate payment response data
      const validatedData = validatePaymentResponse(paymentData);
      
      // Validate the payment URL
      const urlValidation = validateRedirectUrl(validatedData.paymentUrl);
      if (!urlValidation.isValid) {
        throw new Error(`Payment URL validation failed: ${urlValidation.error}`);
      }
      
      // Log the redirect attempt for security auditing
      this.logRedirectAttempt(validatedData);
      
      // Perform the secure redirect
      secureRedirectToPayment(validatedData.paymentUrl, validatedData.orderId);
      
    } catch (error) {
      console.error('Payment redirect failed:', error);
      throw error;
    }
  }
}
```

### 3. **Updated Secure Deposit Button** (`src/components/SecureDepositButton.tsx`)

```typescript
const handleDeposit = async () => {
  // ... validation and API call ...
  
  const result = await apiClient.requestWalletDeposit({
    amount: amountInRials,
    description: depositDescription
  });
  
  // Validate payment response data
  const paymentData = {
    orderId: result.orderId,
    authority: result.authority || '',
    paymentUrl: result.paymentUrl,
    amount: amountInRials,
    description: depositDescription
  };
  
  // Use secure redirect handler
  const secureRedirect = SecurePaymentRedirect.getInstance();
  await secureRedirect.handlePaymentRedirect(paymentData);
  
  // Call success callback after successful redirect
  onSuccess?.(result.paymentUrl, result.orderId);
};
```

### 4. **Server-Side Redirect Endpoint** (`src/lib/serverRedirectEndpoint.ts`)

For maximum security, implement a server-side redirect endpoint:

```typescript
// GET /api/payment/redirect?orderId=xxx&authority=xxx
export class PaymentRedirectController {
  static async handleRedirectEndpoint(req: any, res: any): Promise<void> {
    const { orderId, authority } = req.query;
    const userId = req.user?.id; // From authentication middleware
    
    const request: ServerRedirectRequest = {
      orderId,
      authority,
      userId,
      sessionId: req.session?.id
    };
    
    const response = await ServerRedirectHandler.handleRedirect(request);
    
    if (response.success && response.redirectUrl) {
      // Server validates and constructs safe URL
      res.redirect(response.redirectUrl);
    } else {
      res.status(400).json({
        success: false,
        error: response.error
      });
    }
  }
}
```

## Security Features

### 1. **URL Validation**
- **Protocol Validation**: Only HTTPS/HTTP allowed
- **Domain Whitelist**: Only trusted payment gateways
- **Pattern Detection**: Blocks suspicious URLs (javascript:, data:, etc.)
- **Length Limits**: Prevents overly long URLs

### 2. **Authority Validation**
- **Input Sanitization**: Removes dangerous characters
- **Length Validation**: Prevents buffer overflow attacks
- **Pattern Detection**: Blocks malicious patterns

### 3. **Server-Side Validation**
- **Order Verification**: Ensures order exists and belongs to user
- **Authority Verification**: Validates authority matches order
- **Session Validation**: Checks user authentication

### 4. **Security Logging**
- **Audit Trail**: Logs all redirect attempts
- **User Tracking**: Records user agent, IP, session
- **Error Monitoring**: Tracks failed redirects

## Implementation Examples

### Frontend Usage

```typescript
// Option 1: Direct secure redirect
import { SecurePaymentRedirect } from '../lib/secureRedirect';

const secureRedirect = SecurePaymentRedirect.getInstance();
await secureRedirect.handlePaymentRedirect(paymentData);

// Option 2: Server-side redirect
window.location.href = `/api/payment/redirect?orderId=${orderId}&authority=${authority}`;

// Option 3: Secure component
import { SecurePaymentRedirect } from '../components/SecurePaymentRedirect';

<SecurePaymentRedirect
  orderId={orderId}
  authority={authority}
  amount={amount}
  description={description}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### Backend Implementation

```typescript
// NestJS Controller
@Controller('payment')
export class PaymentController {
  @Get('redirect')
  async redirectToPayment(
    @Query('orderId') orderId: string,
    @Query('authority') authority: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const request: ServerRedirectRequest = {
      orderId,
      authority,
      userId: req.user?.id,
      sessionId: req.session?.id
    };
    
    const response = await ServerRedirectHandler.handleRedirect(request);
    
    if (response.success && response.redirectUrl) {
      res.redirect(response.redirectUrl);
    } else {
      res.status(400).json({
        success: false,
        error: response.error
      });
    }
  }
}
```

## Security Best Practices

### 1. **Always Validate URLs**
```typescript
// ✅ Validate before redirect
const validation = validateRedirectUrl(paymentUrl);
if (!validation.isValid) {
  throw new Error(validation.error);
}
```

### 2. **Use Whitelist Approach**
```typescript
// ✅ Only allow trusted domains
const ALLOWED_DOMAINS = ['www.zarinpal.com', 'zarinpal.com'];
const isAllowed = ALLOWED_DOMAINS.some(domain => 
  url.hostname === domain
);
```

### 3. **Server-Side Validation**
```typescript
// ✅ Validate on server before redirect
const orderExists = await verifyOrder(orderId, userId);
const authorityValid = await verifyAuthority(orderId, authority);
```

### 4. **Log Security Events**
```typescript
// ✅ Log all redirects for auditing
await logRedirect({
  orderId,
  authority,
  userId,
  timestamp: new Date(),
  userAgent: req.headers['user-agent']
});
```

### 5. **Use HTTPS Only**
```typescript
// ✅ Only allow HTTPS in production
if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
  throw new Error('HTTPS required in production');
}
```

## Testing

### Unit Tests

```typescript
describe('Secure Redirect', () => {
  test('should validate safe URLs', () => {
    const safeUrl = 'https://www.zarinpal.com/pg/StartPay/123456';
    const validation = validateRedirectUrl(safeUrl);
    expect(validation.isValid).toBe(true);
  });
  
  test('should reject malicious URLs', () => {
    const maliciousUrl = 'javascript:alert("xss")';
    const validation = validateRedirectUrl(maliciousUrl);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('suspicious patterns');
  });
  
  test('should reject untrusted domains', () => {
    const untrustedUrl = 'https://evil.com/payment';
    const validation = validateRedirectUrl(untrustedUrl);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('Domain not allowed');
  });
});
```

### Integration Tests

```typescript
describe('Payment Redirect Flow', () => {
  test('should redirect to payment gateway securely', async () => {
    const paymentData = {
      orderId: 'order123',
      authority: 'auth456',
      paymentUrl: 'https://www.zarinpal.com/pg/StartPay/auth456',
      amount: 1000000,
      description: 'Test payment'
    };
    
    const secureRedirect = SecurePaymentRedirect.getInstance();
    await expect(secureRedirect.handlePaymentRedirect(paymentData))
      .resolves.not.toThrow();
  });
});
```

## Migration Guide

### 1. **Update Existing Components**

```typescript
// Before (Vulnerable)
window.location.href = result.paymentUrl;

// After (Secure)
const secureRedirect = SecurePaymentRedirect.getInstance();
await secureRedirect.handlePaymentRedirect(paymentData);
```

### 2. **Add Server-Side Endpoint**

```typescript
// Add to your backend
app.get('/api/payment/redirect', paymentRedirectMiddleware, PaymentRedirectController.handleRedirectEndpoint);
```

### 3. **Update API Responses**

```typescript
// Ensure API returns authority along with paymentUrl
{
  "success": true,
  "paymentUrl": "https://www.zarinpal.com/pg/StartPay/authority123",
  "orderId": "order123",
  "authority": "authority123"
}
```

## Benefits

1. **Prevents Open Redirects**: No arbitrary URL redirects
2. **Domain Whitelist**: Only trusted payment gateways
3. **Input Validation**: Sanitizes all inputs
4. **Security Logging**: Complete audit trail
5. **Server-Side Control**: Maximum security with server validation
6. **Error Handling**: Graceful failure with clear messages

## Security Checklist

- [ ] URL validation before redirect
- [ ] Domain whitelist implementation
- [ ] Protocol validation (HTTPS in production)
- [ ] Suspicious pattern detection
- [ ] Server-side authority validation
- [ ] Order ownership verification
- [ ] Security logging implemented
- [ ] Error handling for failed redirects
- [ ] Input sanitization
- [ ] Session validation

This implementation ensures that payment redirects are secure and cannot be exploited for malicious purposes.
