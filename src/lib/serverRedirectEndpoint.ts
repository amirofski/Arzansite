// Server-Side Redirect Endpoint Example
// This demonstrates how to implement secure payment redirects on the backend
// to prevent open redirect vulnerabilities

export interface ServerRedirectRequest {
  orderId: string;
  authority: string;
  userId?: string;
  sessionId?: string;
}

export interface ServerRedirectResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  orderId: string;
  authority: string;
  timestamp: string;
}

// Allowed payment gateway domains (server-side validation)
const ALLOWED_PAYMENT_DOMAINS = [
  'www.zarinpal.com',
  'zarinpal.com',
  'sandbox.zarinpal.com',
  'www.sandbox.zarinpal.com'
];

// Payment gateway base URLs
const PAYMENT_GATEWAY_URLS = {
  zarinpal: 'https://www.zarinpal.com/pg/StartPay/',
  zarinpalSandbox: 'https://sandbox.zarinpal.com/pg/StartPay/'
};

/**
 * Server-side URL validation
 */
export function validateServerRedirectUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Check protocol (only HTTPS in production)
    if (urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Only HTTPS URLs are allowed for payment redirects'
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
        error: `Domain not allowed: ${domain}`
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
          error: 'URL contains suspicious patterns'
        };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Validate payment authority
 */
export function validateServerPaymentAuthority(authority: string): { isValid: boolean; error?: string } {
  if (!authority || typeof authority !== 'string') {
    return {
      isValid: false,
      error: 'Authority is required and must be a string'
    };
  }
  
  // Check length
  if (authority.length > 100) {
    return {
      isValid: false,
      error: 'Authority is too long'
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
  
  return { isValid: true };
}

/**
 * Construct safe payment URL on server
 */
export function constructServerPaymentUrl(authority: string, isSandbox = false): string {
  const baseUrl = isSandbox ? PAYMENT_GATEWAY_URLS.zarinpalSandbox : PAYMENT_GATEWAY_URLS.zarinpal;
  const safeAuthority = encodeURIComponent(authority);
  
  return `${baseUrl}${safeAuthority}`;
}

/**
 * Server-side redirect handler
 */
export class ServerRedirectHandler {
  /**
   * Handle payment redirect request
   */
  static async handleRedirect(request: ServerRedirectRequest): Promise<ServerRedirectResponse> {
    try {
      // Validate order ID
      if (!request.orderId || request.orderId.length > 100) {
        return {
          success: false,
          error: 'Invalid order ID',
          orderId: request.orderId || '',
          authority: request.authority || '',
          timestamp: new Date().toISOString()
        };
      }
      
      // Validate authority
      const authorityValidation = validateServerPaymentAuthority(request.authority);
      if (!authorityValidation.isValid) {
        return {
          success: false,
          error: `Invalid authority: ${authorityValidation.error}`,
          orderId: request.orderId,
          authority: request.authority,
          timestamp: new Date().toISOString()
        };
      }
      
      // Verify order exists and belongs to user (implement your logic here)
      const orderExists = await this.verifyOrder(request.orderId, request.userId);
      if (!orderExists) {
        return {
          success: false,
          error: 'Order not found or access denied',
          orderId: request.orderId,
          authority: request.authority,
          timestamp: new Date().toISOString()
        };
      }
      
      // Verify authority matches order (implement your logic here)
      const authorityValid = await this.verifyAuthority(request.orderId, request.authority);
      if (!authorityValid) {
        return {
          success: false,
          error: 'Authority does not match order',
          orderId: request.orderId,
          authority: request.authority,
          timestamp: new Date().toISOString()
        };
      }
      
      // Construct safe payment URL
      const isSandbox = process.env.NODE_ENV !== 'production';
      const redirectUrl = constructServerPaymentUrl(request.authority, isSandbox);
      
      // Validate the constructed URL
      const urlValidation = validateServerRedirectUrl(redirectUrl);
      if (!urlValidation.isValid) {
        return {
          success: false,
          error: `Payment URL validation failed: ${urlValidation.error}`,
          orderId: request.orderId,
          authority: request.authority,
          timestamp: new Date().toISOString()
        };
      }
      
      // Log the redirect for security auditing
      await this.logRedirect(request, redirectUrl);
      
      return {
        success: true,
        redirectUrl,
        orderId: request.orderId,
        authority: request.authority,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Server redirect handler error:', error);
      return {
        success: false,
        error: 'Internal server error',
        orderId: request.orderId || '',
        authority: request.authority || '',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Verify order exists and belongs to user
   */
  private static async verifyOrder(orderId: string, userId?: string): Promise<boolean> {
    // Implement your order verification logic here
    // This should check if the order exists and belongs to the authenticated user
    
    try {
      // Example implementation:
      // const order = await OrderService.getOrderById(orderId);
      // return order && order.userId === userId;
      
      // For now, return true (implement actual verification)
      return true;
    } catch (error) {
      console.error('Order verification failed:', error);
      return false;
    }
  }
  
  /**
   * Verify authority matches order
   */
  private static async verifyAuthority(orderId: string, authority: string): Promise<boolean> {
    // Implement your authority verification logic here
    // This should check if the authority is valid for the given order
    
    try {
      // Example implementation:
      // const payment = await PaymentService.getPaymentByOrderId(orderId);
      // return payment && payment.authority === authority;
      
      // For now, return true (implement actual verification)
      return true;
    } catch (error) {
      console.error('Authority verification failed:', error);
      return false;
    }
  }
  
  /**
   * Log redirect for security auditing
   */
  private static async logRedirect(request: ServerRedirectRequest, redirectUrl: string): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      orderId: request.orderId,
      authority: request.authority,
      userId: request.userId,
      sessionId: request.sessionId,
      redirectUrl,
      userAgent: request.userAgent,
      ipAddress: request.ipAddress,
      environment: process.env.NODE_ENV
    };
    
    console.log('=== SERVER REDIRECT LOG ===');
    console.log(JSON.stringify(logData, null, 2));
    console.log('===========================');
    
    // In production, save to database or send to logging service
    // await LoggingService.logPaymentRedirect(logData);
  }
}

// NestJS Controller Example
export class PaymentRedirectController {
  /**
   * Handle payment redirect endpoint
   * GET /api/payment/redirect?orderId=xxx&authority=xxx
   */
  static async handleRedirectEndpoint(req: any, res: any): Promise<void> {
    try {
      const { orderId, authority } = req.query;
      const userId = req.user?.id; // From authentication middleware
      const sessionId = req.session?.id;
      
      const request: ServerRedirectRequest = {
        orderId,
        authority,
        userId,
        sessionId
      };
      
      const response = await ServerRedirectHandler.handleRedirect(request);
      
      if (response.success && response.redirectUrl) {
        // Log the redirect
        console.log(`Redirecting order ${orderId} to payment gateway`);
        
        // Perform the redirect
        res.redirect(response.redirectUrl);
      } else {
        // Return error response
        res.status(400).json({
          success: false,
          error: response.error,
          orderId: response.orderId,
          timestamp: response.timestamp
        });
      }
      
    } catch (error) {
      console.error('Payment redirect endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Express.js Middleware Example
export const paymentRedirectMiddleware = async (req: any, res: any, next: any) => {
  try {
    // Add request metadata for logging
    req.userAgent = req.headers['user-agent'];
    req.ipAddress = req.ip || req.connection.remoteAddress;
    
    // Validate required parameters
    const { orderId, authority } = req.query;
    
    if (!orderId || !authority) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: orderId and authority',
        timestamp: new Date().toISOString()
      });
    }
    
    // Continue to controller
    next();
    
  } catch (error) {
    console.error('Payment redirect middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};
