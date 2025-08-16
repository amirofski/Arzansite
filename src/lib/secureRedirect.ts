// Secure Redirect Utilities
// Prevents open redirect vulnerabilities by validating URLs and using controlled redirects

export interface PaymentRedirectData {
  orderId: string;
  authority: string;
  paymentUrl: string;
  amount: number;
  description: string;
}

// Allowed payment gateway domains
const ALLOWED_PAYMENT_DOMAINS = [
  'www.zarinpal.com',
  'zarinpal.com',
  'sandbox.zarinpal.com',
  'www.sandbox.zarinpal.com',
  // Add other trusted payment gateways here
];

// Allowed protocols
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

/**
 * Validate if a URL is safe for redirect
 */
export function validateRedirectUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'Invalid protocol. Only HTTP and HTTPS are allowed.'
      };
    }
    
    // Check domain
    const domain = urlObj.hostname.toLowerCase();
    const isAllowedDomain = ALLOWED_PAYMENT_DOMAINS.some(allowed => 
      domain === allowed || domain.endsWith(`.${allowed}`)
    );
    
    if (!isAllowedDomain) {
      return {
        isValid: false,
        error: `Domain not allowed: ${domain}. Only trusted payment gateways are permitted.`
      };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /mailto:/i,
      /tel:/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return {
          isValid: false,
          error: 'URL contains suspicious patterns and is not allowed.'
        };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format.'
    };
  }
}

/**
 * Secure redirect to payment gateway
 */
export function secureRedirectToPayment(paymentUrl: string, orderId: string): void {
  // Validate the URL before redirecting
  const validation = validateRedirectUrl(paymentUrl);
  
  if (!validation.isValid) {
    console.error('Payment redirect blocked:', validation.error);
    throw new Error(`Payment redirect blocked: ${validation.error}`);
  }
  
  // Log the redirect for security auditing
  console.log('=== SECURE PAYMENT REDIRECT ===');
  console.log('Order ID:', orderId);
  console.log('Payment URL:', paymentUrl);
  console.log('Timestamp:', new Date().toISOString());
  console.log('User Agent:', navigator.userAgent);
  console.log('================================');
  
  // Use a controlled redirect method
  // Option 1: Direct redirect (if URL is validated)
  window.location.href = paymentUrl;
  
  // Option 2: Use a server-side redirect endpoint (more secure)
  // window.location.href = `/api/payment/redirect?orderId=${orderId}&authority=${authority}`;
}

/**
 * Create a secure payment redirect URL using server endpoint
 */
export function createSecureRedirectUrl(orderId: string, authority: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api/payment/redirect?orderId=${encodeURIComponent(orderId)}&authority=${encodeURIComponent(authority)}`;
}

/**
 * Validate payment response data
 */
export function validatePaymentResponse(data: any): PaymentRedirectData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid payment response data');
  }
  
  const { orderId, authority, paymentUrl, amount, description } = data;
  
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Invalid order ID in payment response');
  }
  
  if (!authority || typeof authority !== 'string') {
    throw new Error('Invalid authority in payment response');
  }
  
  if (!paymentUrl || typeof paymentUrl !== 'string') {
    throw new Error('Invalid payment URL in payment response');
  }
  
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid amount in payment response');
  }
  
  if (!description || typeof description !== 'string') {
    throw new Error('Invalid description in payment response');
  }
  
  return { orderId, authority, paymentUrl, amount, description };
}

/**
 * Secure payment redirect handler
 */
export class SecurePaymentRedirect {
  private static instance: SecurePaymentRedirect;
  
  private constructor() {}
  
  static getInstance(): SecurePaymentRedirect {
    if (!SecurePaymentRedirect.instance) {
      SecurePaymentRedirect.instance = new SecurePaymentRedirect();
    }
    return SecurePaymentRedirect.instance;
  }
  
  /**
   * Handle payment redirect with full validation
   */
  async handlePaymentRedirect(paymentData: PaymentRedirectData): Promise<void> {
    try {
      // Validate the payment data
      const validatedData = validatePaymentResponse(paymentData);
      
      // Validate the payment URL
      const urlValidation = validateRedirectUrl(validatedData.paymentUrl);
      if (!urlValidation.isValid) {
        throw new Error(`Payment URL validation failed: ${urlValidation.error}`);
      }
      
      // Log the redirect attempt
      this.logRedirectAttempt(validatedData);
      
      // Perform the secure redirect
      secureRedirectToPayment(validatedData.paymentUrl, validatedData.orderId);
      
    } catch (error) {
      console.error('Payment redirect failed:', error);
      throw error;
    }
  }
  
  /**
   * Log redirect attempt for security auditing
   */
  private logRedirectAttempt(data: PaymentRedirectData): void {
    const logData = {
      timestamp: new Date().toISOString(),
      orderId: data.orderId,
      authority: data.authority,
      amount: data.amount,
      description: data.description,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href,
      sessionId: this.getSessionId()
    };
    
    console.log('=== PAYMENT REDIRECT LOG ===');
    console.log(JSON.stringify(logData, null, 2));
    console.log('============================');
    
    // In production, you might want to send this to your logging service
    // this.sendToLoggingService(logData);
  }
  
  /**
   * Get session ID for tracking
   */
  private getSessionId(): string {
    // Generate a simple session ID for tracking
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Send log data to logging service (implement as needed)
   */
  private async sendToLoggingService(logData: any): Promise<void> {
    try {
      await fetch('/api/logs/payment-redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error('Failed to send log data:', error);
    }
  }
}

/**
 * Payment URL whitelist management
 */
export class PaymentUrlWhitelist {
  private static whitelist = new Set<string>();
  
  /**
   * Add a trusted payment URL pattern
   */
  static addTrustedPattern(pattern: string): void {
    this.whitelist.add(pattern);
  }
  
  /**
   * Remove a trusted payment URL pattern
   */
  static removeTrustedPattern(pattern: string): void {
    this.whitelist.delete(pattern);
  }
  
  /**
   * Check if a URL matches any trusted pattern
   */
  static isTrusted(url: string): boolean {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    return this.whitelist.has(domain) || 
           ALLOWED_PAYMENT_DOMAINS.some(allowed => 
             domain === allowed || domain.endsWith(`.${allowed}`)
           );
  }
  
  /**
   * Get all trusted patterns
   */
  static getTrustedPatterns(): string[] {
    return Array.from(this.whitelist);
  }
}

// Initialize trusted patterns
PaymentUrlWhitelist.addTrustedPattern('www.zarinpal.com');
PaymentUrlWhitelist.addTrustedPattern('zarinpal.com');
PaymentUrlWhitelist.addTrustedPattern('sandbox.zarinpal.com');

/**
 * Utility function for safe URL construction
 */
export function constructSafePaymentUrl(authority: string, orderId: string): string {
  // Construct the payment URL using only trusted components
  const baseUrl = 'https://www.zarinpal.com/pg/StartPay/';
  const safeAuthority = encodeURIComponent(authority);
  
  return `${baseUrl}${safeAuthority}`;
}

/**
 * Validate and sanitize payment authority
 */
export function validatePaymentAuthority(authority: string): { isValid: boolean; error?: string } {
  if (!authority || typeof authority !== 'string') {
    return {
      isValid: false,
      error: 'Authority is required and must be a string'
    };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /[<>]/g, // HTML tags
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /ftp:/i,
    /mailto:/i,
    /tel:/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(authority)) {
      return {
        isValid: false,
        error: 'Authority contains suspicious patterns'
      };
    }
  }
  
  // Check length
  if (authority.length > 100) {
    return {
      isValid: false,
      error: 'Authority is too long'
    };
  }
  
  return { isValid: true };
}
