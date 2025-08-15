# Zarinpal Payment Gateway Integration Guide

## Overview
This guide provides a comprehensive approach to integrating Zarinpal payment gateway with your NestJS backend and React frontend.

## Backend Integration (NestJS)

### 1. Install Required Dependencies
```bash
npm install axios @nestjs/config
```

### 2. Environment Configuration
Add to your `.env` file:
```env
ZARINPAL_MERCHANT_ID=your_merchant_id_here
ZARINPAL_SANDBOX=true  # Set to false for production
ZARINPAL_CALLBACK_URL=https://arzansite.com/payment/callback
```

### 3. Create Zarinpal Service
Create `src/payment/zarinpal.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ZarinpalPaymentRequest {
  amount: number;
  description: string;
  callback_url: string;
  metadata?: {
    email?: string;
    mobile?: string;
    order_id?: string;
  };
}

export interface ZarinpalPaymentResponse {
  authority: string;
  payment_url: string;
  success: boolean;
  error?: string;
}

export interface ZarinpalVerificationRequest {
  authority: string;
  amount: number;
}

export interface ZarinpalVerificationResponse {
  ref_id: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class ZarinpalService {
  private readonly logger = new Logger(ZarinpalService.name);
  private readonly merchantId: string;
  private readonly isSandbox: boolean;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get<string>('ZARINPAL_MERCHANT_ID');
    this.isSandbox = this.configService.get<boolean>('ZARINPAL_SANDBOX', true);
    this.baseUrl = this.isSandbox 
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://api.zarinpal.com/pg/v4/payment';
  }

  async createPaymentRequest(payload: ZarinpalPaymentRequest): Promise<ZarinpalPaymentResponse> {
    try {
      const requestData = {
        merchant_id: this.merchantId,
        amount: payload.amount,
        description: payload.description,
        callback_url: payload.callback_url,
        metadata: payload.metadata || {}
      };

      this.logger.log(`Creating payment request: ${JSON.stringify(requestData)}`);

      const response = await axios.post(`${this.baseUrl}/request.json`, requestData);
      
      if (response.data.data.code === 100) {
        const authority = response.data.data.authority;
        const paymentUrl = this.isSandbox
          ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
          : `https://www.zarinpal.com/pg/StartPay/${authority}`;

        return {
          authority,
          payment_url: paymentUrl,
          success: true
        };
      } else {
        this.logger.error(`Zarinpal payment request failed: ${response.data.errors.message}`);
        return {
          authority: '',
          payment_url: '',
          success: false,
          error: response.data.errors.message
        };
      }
    } catch (error) {
      this.logger.error('Error creating Zarinpal payment request:', error);
      return {
        authority: '',
        payment_url: '',
        success: false,
        error: 'خطا در ایجاد درخواست پرداخت'
      };
    }
  }

  async verifyPayment(payload: ZarinpalVerificationRequest): Promise<ZarinpalVerificationResponse> {
    try {
      const requestData = {
        merchant_id: this.merchantId,
        authority: payload.authority,
        amount: payload.amount
      };

      this.logger.log(`Verifying payment: ${JSON.stringify(requestData)}`);

      const response = await axios.post(`${this.baseUrl}/verify.json`, requestData);
      
      if (response.data.data.code === 100) {
        return {
          ref_id: response.data.data.ref_id,
          success: true
        };
      } else {
        this.logger.error(`Zarinpal payment verification failed: ${response.data.errors.message}`);
        return {
          ref_id: '',
          success: false,
          error: response.data.errors.message
        };
      }
    } catch (error) {
      this.logger.error('Error verifying Zarinpal payment:', error);
      return {
        ref_id: '',
        success: false,
        error: 'خطا در تأیید پرداخت'
      };
    }
  }
}
```

### 4. Create Payment Controller
Create `src/payment/payment.controller.ts`:

```typescript
import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ZarinpalService } from './zarinpal.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly zarinpalService: ZarinpalService,
    private readonly configService: ConfigService,
  ) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async createPaymentRequest(
    @Body() body: {
      amount: number;
      description: string;
      orderId?: string;
    },
    @User() user: any
  ) {
    const callbackUrl = `${this.configService.get('ZARINPAL_CALLBACK_URL')}?order_id=${body.orderId}`;
    
    const result = await this.zarinpalService.createPaymentRequest({
      amount: body.amount,
      description: body.description,
      callback_url: callbackUrl,
      metadata: {
        email: user.email,
        order_id: body.orderId
      }
    });

    if (result.success) {
      // Store payment request in database
      // await this.paymentService.createPaymentRequest({
      //   userId: user.id,
      //   orderId: body.orderId,
      //   amount: body.amount,
      //   authority: result.authority,
      //   status: 'pending'
      // });
    }

    return result;
  }

  @Post('verify')
  async verifyPayment(
    @Body() body: {
      authority: string;
      orderId?: string;
    }
  ) {
    // Get payment details from database using orderId
    // const payment = await this.paymentService.getPaymentByOrderId(body.orderId);
    
    const result = await this.zarinpalService.verifyPayment({
      authority: body.authority,
      amount: 100000 // Get from database
    });

    if (result.success) {
      // Update payment status in database
      // await this.paymentService.updatePaymentStatus(body.orderId, 'completed', result.ref_id);
      
      // Update order status
      // await this.orderService.updateOrderStatus(body.orderId, 'paid');
    }

    return result;
  }

  @Get('callback')
  async handleCallback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
    @Query('order_id') orderId: string
  ) {
    if (status === 'OK') {
      const result = await this.zarinpalService.verifyPayment({
        authority,
        amount: 100000 // Get from database
      });

      if (result.success) {
        // Update payment and order status
        return { success: true, refId: result.ref_id };
      } else {
        return { success: false, error: result.error };
      }
    } else {
      return { success: false, error: 'پرداخت توسط کاربر لغو شد' };
    }
  }
}
```

### 5. Create Payment Module
Create `src/payment/payment.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { ZarinpalService } from './zarinpal.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentController],
  providers: [ZarinpalService],
  exports: [ZarinpalService]
})
export class PaymentModule {}
```

## Frontend Integration (React)

### 1. Update API Client
Add to `src/lib/api-client.ts`:

```typescript
// Payment endpoints
async requestPayment(payload: { 
  amount: number; 
  description: string; 
  orderId?: string; 
}): Promise<{ paymentUrl: string; authority: string; success: boolean; error?: string }> {
  return this.request('/payments/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async verifyPayment(payload: { 
  authority: string; 
  orderId?: string; 
}): Promise<{ success: boolean; refId?: string; error?: string }> {
  return this.request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

### 2. Enhanced PaymentCallback Component
The current `PaymentCallback.tsx` is well-structured. Here are some improvements:

```typescript
// Add these interfaces to types.ts
export interface PaymentVerificationResponse {
  success: boolean;
  refId?: string;
  error?: string;
}

export interface PaymentRequestResponse {
  paymentUrl: string;
  authority: string;
  success: boolean;
  error?: string;
}
```

### 3. Create Payment Button Component
Create `src/components/PaymentButton.tsx`:

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  amount: number;
  description: string;
  orderId?: string;
  onSuccess?: (refId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  description,
  orderId,
  onSuccess,
  onError,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiClient.requestPayment({
        amount,
        description,
        orderId
      });

      if (response.success && response.paymentUrl) {
        // Redirect to Zarinpal payment gateway
        window.location.href = response.paymentUrl;
      } else {
        const errorMessage = response.error || 'خطا در ایجاد درخواست پرداخت';
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'destructive',
        });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در پرداخت';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      {isLoading ? 'در حال پردازش...' : 'پرداخت با زرین‌پال'}
    </Button>
  );
};
```

## Security Best Practices

### 1. Input Validation
```typescript
// Add validation pipes to your DTOs
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(1000) // Minimum 1000 Rials
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}
```

### 2. Amount Validation
```typescript
// In your service
if (payload.amount < 1000) {
  throw new BadRequestException('مبلغ باید حداقل 1000 ریال باشد');
}
```

### 3. Callback URL Validation
```typescript
// Validate callback URL is from your domain
const allowedDomains = ['yourdomain.com', 'www.yourdomain.com'];
const callbackDomain = new URL(payload.callback_url).hostname;
if (!allowedDomains.includes(callbackDomain)) {
  throw new BadRequestException('Invalid callback URL');
}
```

## Testing

### 1. Sandbox Testing
- Use Zarinpal sandbox environment for testing
- Test with different amounts and scenarios
- Verify callback handling

### 2. Error Handling
- Test network failures
- Test invalid amounts
- Test expired authorities

### 3. Production Checklist
- [ ] Switch to production Zarinpal API
- [ ] Update callback URLs
- [ ] Test with real amounts
- [ ] Monitor payment logs
- [ ] Set up error alerts

## Monitoring and Logging

### 1. Payment Logs
```typescript
// Add comprehensive logging
this.logger.log(`Payment request created: ${authority} for amount: ${amount}`);
this.logger.log(`Payment verified: ${refId} for authority: ${authority}`);
```

### 2. Error Tracking
```typescript
// Track failed payments
if (!result.success) {
  this.logger.error(`Payment failed: ${result.error}`, {
    authority,
    amount,
    userId: user.id
  });
}
```

This integration provides a robust, secure, and scalable payment solution using Zarinpal payment gateway.
