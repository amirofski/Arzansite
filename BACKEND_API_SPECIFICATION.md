# Backend API Specification for Enhanced Order Registration & Wallet Management

## Overview
This document outlines the complete backend API endpoints required for the enhanced order registration and wallet management system. The API follows RESTful principles and provides comprehensive functionality for order processing, wallet operations, payment handling, and progress tracking.

## Base URL
```
https://api.arzansite.com/api/v1
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. ORDER MANAGEMENT ENDPOINTS



### 1.1 Create Enhanced Order
**Endpoint:** `POST /orders`  
**Description:** Creates a new order with comprehensive wizard data and payment options.

**Request Payload:**
```json
{
  "title": "string",
  "description": "string", 
  "price": "number",
  "siteType": "personal" | "business",
  "wizardData": {
    "websiteFramework": {
      "dynamicDesign": {
        "pages": [
          {
            "id": "string",
            "name": "string",
            "sections": [
              {
                "id": "string",
                "sectionType": "string",
                "layoutId": "string",
                "order": "number",
                "customData": "object"
              }
            ],
            "canvasDimensions": {
              "width": "number",
              "height": "number"
            }
          }
        ],
        "currentPageId": "string"
      }
    },
    "branding": {
      "primaryColor": "string",
      "fontFamily": "string",
      "logo": "string"
    },
    "additionalServices": {
      "seoOptimization": "boolean",
      "socialMediaIntegration": "boolean",
      "analyticsSetup": "boolean",
      "backupService": "boolean",
      "maintenancePlan": "boolean",
      "rushDelivery": "boolean"
    },
    "domains": {
      "primary_domain": "string",
      "additional_domains": [
        {
          "domain": "string",
          "extension": "string",
          "price": "number",
          "available": "boolean"
        }
      ]
    },
    "pricing": {
      "basePrice": "number",
      "pagesCost": "number",
      "sectionsCost": "number",
      "additionalServicesCost": "number",
      "totalPrice": "number",
      "paymentCycle": "monthly" | "annual",
      "autoRenewal": "boolean",
      "annualDiscount": "number"
    },
    "paymentCycle": "monthly" | "annual",
    "autoRenewal": "boolean",
    "userInfo": {
      "domain": "string",
      "name": "string",
      "email": "string",
      "additionalDomains": "array"
    }
  },
  "status": "pending",
  "payment_status": "pending"
}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "price": "number",
  "status": "pending",
  "payment_status": "pending",
  "user_id": "string",
  "wizard_data": "object",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 1.2 Get Enhanced Order Details
**Endpoint:** `GET /orders/{orderId}/enhanced`  
**Description:** Retrieves comprehensive order details including progress and wallet information.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "price": "number",
  "status": "string",
  "payment_status": "string",
  "payment_method": "wallet" | "zarinpal",
  "transaction_id": "string",
  "zarinpal_authority": "string",
  "zarinpal_ref_id": "string",
  "user_id": "string",
  "wizard_data": "object",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "progress": {
    "currentStep": "string",
    "completedSteps": ["string"],
    "remainingSteps": ["string"],
    "estimatedDelivery": "string"
  },
  "walletBalance": "number",
  "canPayWithWallet": "boolean"
}
```

### 1.3 Update Order Payment Status
**Endpoint:** `PATCH /orders/{orderId}`  
**Description:** Updates order payment status and related information.

**Request Payload:**
```json
{
  "payment_status": "succeeded" | "failed" | "refunded",
  "payment_method": "wallet" | "zarinpal",
  "transaction_id": "string",
  "zarinpal_authority": "string",
  "zarinpal_ref_id": "string",
  "status": "in_progress" | "completed" | "cancelled"
}
```

### 1.4 Get User Orders with Pagination
**Endpoint:** `GET /users/me/orders`  
**Description:** Retrieves user's order history with filtering and pagination.

**Query Parameters:**
- `status`: Order status filter
- `payment_status`: Payment status filter
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `from_date`: Start date filter
- `to_date`: End date filter

**Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "title": "string",
      "price": "number",
      "status": "string",
      "payment_status": "string",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

---

## 2. WALLET MANAGEMENT ENDPOINTS

### 2.1 Get Enhanced Wallet Balance
**Endpoint:** `GET /wallets/me/enhanced-balance`  
**Description:** Retrieves comprehensive wallet information including balance, transactions, and statistics.

**Response:**
```json
{
  "balance": "number",
  "currency": "string",
  "lastUpdated": "timestamp",
  "recentTransactions": [
    {
      "id": "string",
      "type": "deposit" | "withdrawal" | "payment" | "refund" | "credit" | "debit",
      "amount": "number",
      "description": "string",
      "status": "pending" | "completed" | "failed",
      "balance_before": "number",
      "balance_after": "number",
      "created_at": "timestamp"
    }
  ],
  "statistics": {
    "totalDeposits": "number",
    "totalWithdrawals": "number",
    "totalPayments": "number",
    "totalRefunds": "number"
  }
}
```

### 2.2 Get Enhanced Wallet Transactions
**Endpoint:** `GET /wallets/me/transactions/enhanced`  
**Description:** Retrieves detailed wallet transactions with filtering and analytics.

**Query Parameters:**
- `type`: Transaction type filter
- `status`: Transaction status filter
- `from_date`: Start date filter
- `to_date`: End date filter
- `page`: Page number
- `limit`: Items per page
- `reference_type`: Reference type filter
- `reference_id`: Reference ID filter

**Response:**
```json
{
  "transactions": [
    {
      "id": "string",
      "type": "string",
      "amount": "number",
      "description": "string",
      "status": "string",
      "reference_id": "string",
      "reference_type": "string",
      "balance_before": "number",
      "balance_after": "number",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  },
  "summary": {
    "totalAmount": "number",
    "transactionCount": "number",
    "averageAmount": "number"
  }
}
```

### 2.3 Process Wallet Payment for Order
**Endpoint:** `POST /wallets/me/pay-order`  
**Description:** Processes payment for an order using wallet balance.

**Request Payload:**
```json
{
  "orderId": "string",
  "amount": "number",
  "description": "string",
  "referenceData": {
    "order_title": "string",
    "site_type": "string",
    "domain": "string"
  }
}
```

**Response:**
```json
{
  "success": "boolean",
  "transactionId": "string",
  "newBalance": "number",
  "paymentDetails": {
    "amount": "number",
    "description": "string",
    "timestamp": "timestamp",
    "referenceId": "string"
  }
}
```

### 2.4 Request Enhanced Wallet Deposit
**Endpoint:** `POST /wallets/me/deposit/enhanced`  
**Description:** Creates an enhanced wallet deposit request with additional metadata.

**Request Payload:**
```json
{
  "amount": "number",
  "description": "string",
  "callbackUrl": "string",
  "metadata": {
    "source": "dashboard" | "order_flow" | "wallet_page",
    "user_agent": "string",
    "ip_address": "string",
    "referrer": "string"
  },
  "preferredPaymentMethod": "zarinpal" | "other"
}
```

**Response:**
```json
{
  "paymentUrl": "string",
  "orderId": "string",
  "depositId": "string",
  "expiresAt": "timestamp",
  "qrCode": "string"
}
```

---

## 3. PAYMENT PROCESSING ENDPOINTS

### 3.1 Request Enhanced ZarinPal Payment
**Endpoint:** `POST /payments/zarinpal/request`  
**Description:** Creates an enhanced ZarinPal payment request with comprehensive data.

**Request Payload:**
```json
{
  "orderId": "string",
  "amount": "number",
  "description": "string",
  "callbackUrl": "string",
  "userData": {
    "email": "string",
    "mobile": "string",
    "name": "string"
  },
  "metadata": {
    "source": "wizard" | "dashboard" | "wallet_topup",
    "order_type": "string",
    "site_type": "string"
  }
}
```

**Response:**
```json
{
  "paymentUrl": "string",
  "authority": "string",
  "orderId": "string",
  "expiresAt": "timestamp",
  "qrCode": "string"
}
```

### 3.2 Verify Enhanced ZarinPal Payment
**Endpoint:** `POST /payments/zarinpal/verify`  
**Description:** Verifies ZarinPal payment with comprehensive validation.

**Request Payload:**
```json
{
  "authority": "string",
  "orderId": "string",
  "amount": "number",
  "userIp": "string",
  "userAgent": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "refId": "string",
  "orderId": "string",
  "amount": "number",
  "description": "string",
  "error": "string",
  "errorCode": "string",
  "errorDetails": "string",
  "retryable": "boolean",
  "supportRequired": "boolean"
}
```

### 3.3 Verify Enhanced Wallet Deposit
**Endpoint:** `POST /wallets/me/deposit/verify`  
**Description:** Verifies wallet deposit payment with enhanced validation.

**Request Payload:**
```json
{
  "orderId": "string",
  "authority": "string",
  "userIp": "string",
  "userAgent": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "refId": "string",
  "orderId": "string",
  "amount": "number",
  "description": "string",
  "error": "string",
  "errorCode": "string",
  "errorDetails": "string",
  "retryable": "boolean",
  "supportRequired": "boolean"
}
```

---

## 4. ORDER PROGRESS TRACKING ENDPOINTS

### 4.1 Get Order Progress
**Endpoint:** `GET /orders/{orderId}/progress`  
**Description:** Retrieves comprehensive order progress information and timeline.

**Response:**
```json
{
  "orderId": "string",
  "currentStep": "string",
  "completedSteps": ["string"],
  "remainingSteps": ["string"],
  "progressPercentage": "number",
  "estimatedDelivery": "string",
  "lastUpdate": "timestamp",
  "nextMilestone": "string",
  "timeline": [
    {
      "step": "string",
      "status": "completed" | "in_progress" | "pending",
      "completedAt": "timestamp",
      "estimatedDuration": "string",
      "description": "string"
    }
  ]
}
```

### 4.2 Update Order Progress
**Endpoint:** `PATCH /orders/{orderId}/progress`  
**Description:** Updates order progress step with notes and attachments.

**Request Payload:**
```json
{
  "step": "string",
  "status": "completed" | "in_progress" | "pending",
  "notes": "string",
  "attachments": [
    {
      "filename": "string",
      "url": "string",
      "type": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": "boolean",
  "updatedStep": "string",
  "progressPercentage": "number",
  "nextStep": "string"
}
```

---

## 5. NOTIFICATION & COMMUNICATION ENDPOINTS

### 5.1 Send Order Status Notification
**Endpoint:** `POST /notifications/order-status`  
**Description:** Sends order status notifications through multiple channels.

**Request Payload:**
```json
{
  "orderId": "string",
  "userId": "string",
  "notificationType": "order_created" | "payment_success" | "payment_failed" | "progress_update" | "order_completed",
  "message": "string",
  "priority": "low" | "medium" | "high",
  "channels": ["email", "sms", "push", "dashboard"],
  "metadata": "object"
}
```

**Response:**
```json
{
  "success": "boolean",
  "notificationId": "string",
  "sentChannels": ["string"],
  "failedChannels": ["string"]
}
```

### 5.2 Get Notification Preferences
**Endpoint:** `GET /users/me/notification-preferences`  
**Description:** Retrieves user's notification preferences and settings.

**Response:**
```json
{
  "email": {
    "order_updates": "boolean",
    "payment_notifications": "boolean",
    "progress_updates": "boolean",
    "marketing": "boolean"
  },
  "sms": {
    "order_updates": "boolean",
    "payment_notifications": "boolean",
    "progress_updates": "boolean"
  },
  "push": {
    "order_updates": "boolean",
    "payment_notifications": "boolean",
    "progress_updates": "boolean"
  },
  "dashboard": {
    "show_notifications": "boolean",
    "auto_refresh": "boolean"
  }
}
```

---

## 6. ANALYTICS & REPORTING ENDPOINTS

### 6.1 Get User Order Analytics
**Endpoint:** `GET /users/me/analytics/orders`  
**Description:** Retrieves comprehensive order analytics and trends.

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d, 1y, all)
- `groupBy`: Grouping method (day, week, month)

**Response:**
```json
{
  "totalOrders": "number",
  "totalSpent": "number",
  "averageOrderValue": "number",
  "orderStatusDistribution": "object",
  "paymentMethodDistribution": "object",
  "monthlyTrends": [
    {
      "month": "string",
      "orders": "number",
      "revenue": "number"
    }
  ],
  "topServices": [
    {
      "service": "string",
      "count": "number",
      "revenue": "number"
    }
  ]
}
```

### 6.2 Get Wallet Transaction Analytics
**Endpoint:** `GET /wallets/me/analytics/transactions`  
**Description:** Retrieves comprehensive wallet transaction analytics.

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d, 1y, all)
- `type`: Transaction type filter

**Response:**
```json
{
  "totalTransactions": "number",
  "totalVolume": "number",
  "averageTransactionValue": "number",
  "transactionTypeDistribution": "object",
  "monthlyTrends": [
    {
      "month": "string",
      "transactions": "number",
      "volume": "number"
    }
  ],
  "topTransactionSources": [
    {
      "source": "string",
      "count": "number",
      "volume": "number"
    }
  ]
}
```

---

## 7. ERROR HANDLING & SUPPORT ENDPOINTS

### 7.1 Report Issue
**Endpoint:** `POST /support/report-issue`  
**Description:** Reports payment or order issues for support.

**Request Payload:**
```json
{
  "type": "payment_failed" | "order_problem" | "wallet_issue" | "technical_problem" | "other",
  "orderId": "string",
  "transactionId": "string",
  "description": "string",
  "priority": "low" | "medium" | "high" | "urgent",
  "attachments": [
    {
      "filename": "string",
      "url": "string",
      "type": "string"
    }
  ],
  "contactPreference": "email" | "phone" | "dashboard",
  "userAgent": "string",
  "ipAddress": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "ticketId": "string",
  "estimatedResponseTime": "string",
  "supportEmail": "string",
  "supportPhone": "string"
}
```

### 7.2 Get Support Ticket Status
**Endpoint:** `GET /support/tickets/{ticketId}`  
**Description:** Retrieves support ticket status and conversation history.

**Response:**
```json
{
  "ticketId": "string",
  "status": "open" | "in_progress" | "resolved" | "closed",
  "priority": "low" | "medium" | "high" | "urgent",
  "subject": "string",
  "description": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "estimatedResolution": "string",
  "assignedTo": "string",
  "messages": [
    {
      "id": "string",
      "sender": "user" | "support",
      "message": "string",
      "timestamp": "timestamp",
      "attachments": "array"
    }
  ]
}
```

---

## 8. ERROR CODES & RESPONSES

### Standard Error Response Format
```json
{
  "success": false,
  "error": "string",
  "errorCode": "string",
  "errorDetails": "string",
  "retryable": "boolean",
  "supportRequired": "boolean",
  "timestamp": "timestamp"
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED`: Invalid or expired token
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request payload validation failed
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `PAYMENT_FAILED`: Payment processing failed
- `INSUFFICIENT_WALLET_BALANCE`: Wallet balance too low
- `ORDER_ALREADY_PAID`: Order has already been paid
- `PAYMENT_EXPIRED`: Payment request has expired
- `GATEWAY_ERROR`: External payment gateway error
- `INTERNAL_SERVER_ERROR`: Server-side processing error

---

## 9. RATE LIMITING & SECURITY

### Rate Limits
- **Authentication endpoints**: 5 requests per minute
- **Order endpoints**: 20 requests per minute
- **Wallet endpoints**: 30 requests per minute
- **Payment endpoints**: 10 requests per minute
- **Analytics endpoints**: 15 requests per minute

### Security Measures
- JWT token authentication for all endpoints
- HTTPS encryption for all communications
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation
- IP-based rate limiting
- Request logging and monitoring

---

## 10. IMPLEMENTATION NOTES

### Database Schema Requirements
- **Orders table**: Store order details, wizard data, and payment information
- **Wallet_transactions table**: Track all wallet operations with audit trail
- **Order_progress table**: Store progress steps and timeline
- **Notifications table**: Manage user notifications and preferences
- **Support_tickets table**: Handle support requests and conversations

### Integration Requirements
- **ZarinPal Gateway**: Payment processing and verification
- **Email Service**: SMTP or third-party email provider
- **SMS Service**: SMS gateway for notifications
- **File Storage**: Cloud storage for attachments and files
- **Caching Layer**: Redis for session management and caching
- **Queue System**: Background job processing for notifications

### Performance Considerations
- Database indexing on frequently queried fields
- Caching of wallet balances and order status
- Asynchronous processing for notifications
- Pagination for large data sets
- Database connection pooling
- CDN for static assets and files

This API specification provides a comprehensive foundation for implementing the enhanced order registration and wallet management system, ensuring scalability, security, and user experience excellence.

