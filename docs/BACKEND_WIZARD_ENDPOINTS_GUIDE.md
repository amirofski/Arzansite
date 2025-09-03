# 🚀 Backend Wizard Endpoints Implementation Guide

## 📋 Overview

This guide provides the backend implementation details for the missing wizard endpoints that are required for full wizard functionality. Currently, only `/api/wizard/complete-order` exists, but we need additional endpoints for progress management and order saving.

## 🔑 Required Endpoints

### 1. Save Wizard Progress
**Endpoint**: `POST /api/wizard/save-progress`  
**Purpose**: Save wizard progress during the design process  
**Authentication**: Required (JWT Bearer Token)

#### Request Body
```typescript
interface SaveProgressRequest {
  session_id: string;           // Unique wizard session identifier
  data: {
    currentStep: number;        // Current wizard step (1-5)
    siteType: 'personal' | 'business' | '';
    modules: Array<{
      id: string;
      name: string;
      nameEn: string;
      complexity: number;
      customizations: {
        layout: string;
        colors: string;
        animations: string;
      };
    }>;
    websiteFramework?: {
      dynamicDesign?: {
        pages?: Array<{
          id: string;
          name: string;
          sections: Array<{
            id: string;
            sectionType: string;
            layoutId: string;
            order: number;
            customData?: Record<string, unknown>;
          }>;
          canvasDimensions: {
            width: number;
            height: number;
          };
        }>;
        currentPageId: string;
      };
    };
    branding?: {
      primaryColor?: string;
      fontFamily?: string;
      logo?: string;
    };
    pricing?: {
      additionalServices?: Record<string, boolean>;
      customizationLevel?: number[];
      rushDelivery?: boolean;
      totalPrice?: number;
    };
    userInfo?: {
      domain?: string;
      name?: string;
      email?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
  };
}
```

#### Response
```typescript
interface SaveProgressResponse {
  success: boolean;
  session_id: string;
  message: string;
  saved_at: string;
}
```

#### Implementation Notes
- Store progress data in a `wizard_progress` table
- Use `session_id` as the primary key for progress tracking
- Implement automatic cleanup for old progress data (older than 30 days)
- Consider encrypting sensitive design data

---

### 2. Load Wizard Progress
**Endpoint**: `GET /api/wizard/load-progress/{sessionId}`  
**Purpose**: Load previously saved wizard progress  
**Authentication**: Required (JWT Bearer Token)

#### Path Parameters
- `sessionId`: The wizard session identifier

#### Response
```typescript
interface LoadProgressResponse {
  success: boolean;
  session_id: string;
  data: {
    currentStep: number;
    siteType: 'personal' | 'business' | '';
    modules: Array<{
      id: string;
      name: string;
      nameEn: string;
      complexity: number;
      customizations: {
        layout: string;
        colors: string;
        animations: string;
      };
    }>;
    websiteFramework?: {
      dynamicDesign?: {
        pages?: Array<{
          id: string;
          name: string;
          sections: Array<{
            id: string;
            sectionType: string;
            layoutId: string;
            order: number;
            customData?: Record<string, unknown>;
          }>;
          canvasDimensions: {
            width: number;
            height: number;
          };
        }>;
        currentPageId: string;
      };
    };
    branding?: {
      primaryColor?: string;
      fontFamily?: string;
      logo?: string;
    };
    pricing?: {
      additionalServices?: Record<string, boolean>;
      customizationLevel?: number[];
      rushDelivery?: boolean;
      totalPrice?: number;
    };
    userInfo?: {
      domain?: string;
      name?: string;
      email?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
  };
  last_updated: string;
}
```

#### Implementation Notes
- Verify that the user owns the session (security check)
- Return 404 if session not found
- Implement rate limiting to prevent abuse

---

### 3. Save Order for Later
**Endpoint**: `POST /api/wizard/save-order`  
**Purpose**: Save a completed wizard order without immediate payment  
**Authentication**: Required (JWT Bearer Token)

#### Request Body
```typescript
interface SaveOrderRequest {
  session_id: string;           // Wizard session identifier
  order: {
    title: string;              // Website title
    description: string;        // Website description
    priceTomans: number;        // Price in Tomans
    comments?: string;          // Optional comments
    site_type?: 'personal' | 'business'; // Optional site type
  };
  design_snapshot: {
    websiteFramework: {
      dynamicDesign: {
        pages: Array<{
          id: string;
          name: string;
          sections: Array<{
            id: string;
            section_type: string;
            layout_id: string;
            order: number;
            custom_data: Record<string, unknown>;
          }>;
          canvas_dimensions: {
            width: number;
            height: number;
          };
        }>;
        current_page_id: string;
      };
    };
    branding: {
      primaryColor: string;
      fontFamily: string;
      logo?: string;
    };
    additionalServices: {
      socialMediaIntegration: boolean;
      seoOptimization: boolean;
      analyticsSetup: boolean;
      maintenancePlan: boolean;
      rushDelivery: boolean;
    };
    domains: {
      primary_domain: string;
      additional_domains: string[];
    };
    pricing: {
      additionalServices: Record<string, boolean>;
      customizationLevel: number[];
      rushDelivery: boolean;
      totalPrice: number;
    };
    paymentOptions: Record<string, unknown>;
  };
  payment_intent?: 'pay_later' | 'save_for_later'; // Payment intent
}
```

#### Response
```typescript
interface SaveOrderResponse {
  success: boolean;
  order_id: string;
  message: string;
  order: {
    id: string;
    title: string;
    description: string;
    price: number;              // Price in Rials (Tomans × 10)
    status: 'draft' | 'pending_payment';
    user_id: string;
    created_at: string;
    updated_at: string;
    session_id: string;
    payment_status: 'pending' | 'deferred';
  };
}
```

#### Implementation Notes
- Create order with status 'draft' or 'pending_payment'
- Store complete design snapshot in `wizard_data` field
- Generate unique order ID
- Set payment status to 'deferred'
- Don't create invoice immediately

---

### 4. Get Saved Orders
**Endpoint**: `GET /api/wizard/saved-orders`  
**Purpose**: Retrieve all saved orders for the authenticated user  
**Authentication**: Required (JWT Bearer Token)

#### Response
```typescript
interface SavedOrdersResponse {
  success: boolean;
  orders: Array<{
    id: string;
    title: string;
    description: string;
    price: number;              // Price in Rials
    status: 'draft' | 'pending_payment';
    session_id: string;
    payment_status: 'pending' | 'deferred';
    created_at: string;
    updated_at: string;
  }>;
}
```

#### Implementation Notes
- Filter by authenticated user ID
- Only return orders with status 'draft' or 'pending_payment'
- Implement pagination for large datasets
- Sort by creation date (newest first)

---

### 5. Convert Saved Order to Paid
**Endpoint**: `POST /api/wizard/saved-orders/{orderId}/convert-to-paid`  
**Purpose**: Convert a saved order to a paid order  
**Authentication**: Required (JWT Bearer Token)

#### Path Parameters
- `orderId`: The ID of the saved order to convert

#### Request Body
```typescript
interface ConvertOrderRequest {
  paymentMethod: 'wallet' | 'gateway'; // Payment method
}
```

#### Response
```typescript
interface ConvertOrderResponse {
  success: boolean;
  orderId: string;
  invoiceId: string;
  message: string;
  order: {
    id: string;
    title: string;
    description: string;
    price: number;              // Price in Rials
    status: 'pending';
    user_id: string;
    created_at: string;
    updated_at: string;
    session_id: string;
  };
  invoice: {
    id: string;
    order_id: string;
    user_id: string;
    amount: number;             // Amount in Rials
    dueDate: string;            // Due date (30 days from creation)
    status: 'pending';
    description: string;
    created_at: string;
    updated_at: string;
  };
}
```

#### Implementation Notes
- Update order status from 'draft' to 'pending'
- Create invoice with 30-day due date
- Process payment based on selected method
- Update payment status to 'pending'

---

## 🗄️ Database Schema

### Wizard Progress Table
```sql
CREATE TABLE wizard_progress (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 DAY),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### Orders Table (Extended)
```sql
ALTER TABLE orders ADD COLUMN session_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'succeeded', 'failed', 'deferred') DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN wizard_data JSON;
```

---

## 🔒 Security Considerations

1. **Session Ownership**: Verify that users can only access their own wizard sessions
2. **Data Validation**: Validate all input data before processing
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Data Encryption**: Consider encrypting sensitive design data
5. **Session Expiration**: Automatically expire old wizard sessions
6. **Input Sanitization**: Sanitize all user inputs to prevent injection attacks

---

## 🧪 Testing

### Test Cases
1. **Save Progress**: Test saving progress with various data combinations
2. **Load Progress**: Test loading progress for valid and invalid sessions
3. **Save Order**: Test saving orders with different design configurations
4. **Convert Order**: Test converting saved orders to paid orders
5. **Error Handling**: Test various error scenarios (invalid data, expired sessions, etc.)

### Test Data
```typescript
const testProgressData = {
  session_id: `test_${Date.now()}`,
  data: {
    currentStep: 3,
    siteType: 'personal',
    modules: [],
    websiteFramework: { test: true },
    branding: { primaryColor: '#000000' },
    pricing: { totalPrice: 1000000 }
  }
};
```

---

## 🚀 Implementation Priority

1. **High Priority**: Save Progress, Load Progress
2. **Medium Priority**: Save Order for Later
3. **Low Priority**: Get Saved Orders, Convert to Paid

## 📞 Support

For questions about this implementation:
1. Review the existing `/api/wizard/complete-order` endpoint for reference
2. Follow the same authentication and error handling patterns
3. Use consistent response formats across all endpoints
4. Implement proper logging for debugging

---

**Note**: This guide assumes you're using Node.js/Express with a SQL database. Adjust the implementation details according to your backend technology stack.
