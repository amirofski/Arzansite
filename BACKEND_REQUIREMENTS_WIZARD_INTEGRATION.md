# Backend Requirements for Wizard Integration

## Overview
This document outlines the backend requirements for integrating the Wizard system with NestJS API and Appwrite database to store complete user order information.

## 1. Data Storage Requirements

### 1.1 Wizard Data Structure
The backend needs to store the complete Wizard data structure:

```typescript
interface WizardOrder {
  id: string;
  userId?: string; // Optional for guest users
  sessionId: string; // For guest users
  
  // Step 1: Website Type
  siteType: 'personal' | 'business';
  
  // Step 2: Design Method & Structure
  websiteFramework: {
    designMethod: 'template' | 'dynamic';
    dynamicDesign?: {
      pages: Array<{
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
  
  // Step 3: Branding & Colors
  branding: {
    primaryColor: string;
    customColors: string[];
    fontFamily: string;
  };
  
  // Step 4: Additional Services
  additionalServices: {
    seoOptimization: boolean;
    socialMediaIntegration: boolean;
    analyticsSetup: boolean;
    backupService: boolean;
    maintenancePlan: boolean;
    rushDelivery: boolean;
  };
  
  // Step 5: Domain Selection
  domains: {
    primaryDomain: string;
    additionalDomains: Array<{
      domain: string;
      extension: string;
      price: number;
      available: boolean;
    }>;
  };
  
  // Pricing Information
  pricing: {
    basePrice: number;
    pagesCost: number;
    sectionsCost: number;
    additionalServicesCost: number;
    domainCost: number;
    totalPrice: number;
    monthlyPrice: number;
    annualPrice: number;
    annualDiscount: number;
  };
  
  // Payment Options
  paymentOptions: {
    paymentCycle: 'monthly' | 'annual';
    autoRenewal: boolean;
  };
  
  // File Uploads
  projectFiles: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: Date;
  }>;
  
  // Order Status
  status: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

## 2. API Endpoints Required

### 2.1 Wizard Data Management
```typescript
// Save Wizard Progress
POST /api/wizard/save-progress
Body: Partial<WizardOrder>

// Get Wizard Progress
GET /api/wizard/progress/:sessionId
GET /api/wizard/progress/user/:userId

// Complete Wizard Order
POST /api/wizard/complete-order
Body: WizardOrder

// Update Wizard Order
PUT /api/wizard/orders/:orderId
Body: Partial<WizardOrder>

// Get Wizard Order
GET /api/wizard/orders/:orderId

// List User Orders
GET /api/wizard/orders/user/:userId

// List All Orders (Admin)
GET /api/wizard/orders/admin
Query: status, page, limit, search
```

### 2.2 File Management
```typescript
// Upload Project Files
POST /api/wizard/upload-files
Body: FormData (multiple files)

// Get File Info
GET /api/wizard/files/:fileId

// Delete File
DELETE /api/wizard/files/:fileId

// List Order Files
GET /api/wizard/orders/:orderId/files
```

### 2.3 Domain Management
```typescript
// Get Available Domain Extensions
GET /api/domains/extensions

// Check Domain Availability
POST /api/domains/check-availability
Body: { domain: string, extension: string }

// Get Domain Prices
GET /api/domains/prices

// Update Domain Prices (Admin)
PUT /api/domains/prices/:extensionId
Body: { price: number, available: boolean }
```

### 2.4 Pricing Calculation
```typescript
// Calculate Order Price
POST /api/wizard/calculate-price
Body: Partial<WizardOrder>

// Get Pricing Configuration
GET /api/wizard/pricing-config
```

## 3. Appwrite Collections Required

### 3.1 wizard_orders
```typescript
{
  $id: string;
  userId?: string;
  sessionId: string;
  siteType: string;
  websiteFramework: object;
  branding: object;
  additionalServices: object;
  domains: object;
  pricing: object;
  paymentOptions: object;
  projectFiles: object[];
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

### 3.2 domain_extensions
```typescript
{
  $id: string;
  extension: string; // .com, .net, .org, etc.
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: string; // international, country, etc.
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 project_files
```typescript
{
  $id: string;
  orderId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucketId: string;
  fileId: string;
  uploadedAt: string;
}
```

## 4. Scheduled Tasks Required

### 4.1 Payment Reminders
```typescript
// Daily cron job to check upcoming payments
@Cron('0 9 * * *') // 9 AM daily
async checkUpcomingPayments() {
  // Find orders with payments due in next 7 days
  // Send reminder emails
  // Generate invoices
}

// Monthly cron job for recurring payments
@Cron('0 9 1 * *') // 1st of month at 9 AM
async processRecurringPayments() {
  // Process monthly/annual payments
  // Generate new invoices
  // Send payment confirmations
}
```

### 4.2 Invoice Generation
```typescript
// Generate invoice for new order
async generateInvoice(orderId: string): Promise<Invoice>

// Generate recurring invoice
async generateRecurringInvoice(orderId: string, cycle: 'monthly' | 'annual'): Promise<Invoice>

// Send invoice email
async sendInvoiceEmail(invoiceId: string, email: string): Promise<void>
```

## 5. Email Templates Required

### 5.1 Order Confirmation
- Order details summary
- Pricing breakdown
- Next steps
- Payment instructions

### 5.2 Payment Reminder
- Upcoming payment date
- Amount due
- Payment link
- Order reference

### 5.3 Invoice
- Invoice number
- Order details
- Pricing breakdown
- Payment terms

### 5.4 Order Status Updates
- Status change notifications
- Progress updates
- Completion confirmation

## 6. Security Requirements

### 6.1 Authentication & Authorization
- JWT token validation
- Role-based access control (user/admin)
- Session management for guest users

### 6.2 Input Validation
- Sanitize all user inputs
- Validate file uploads (type, size, content)
- Rate limiting for API endpoints

### 6.3 Data Protection
- Encrypt sensitive data
- Secure file storage
- Audit logging for admin actions

## 7. Integration Points

### 7.1 Zarrin Pal Payment Gateway
```typescript
// Request payment
POST /api/payments/request
Body: { orderId: string, amount: number, callbackUrl: string }

// Payment verification
POST /api/payments/verify
Body: { authority: string, status: string }

// Payment callback handling
POST /api/payments/callback
Body: Payment callback data
```

### 7.2 Appwrite Integration
```typescript
// Database operations
const ordersCollection = appwrite.database.collection('wizard_orders');
const filesBucket = appwrite.storage.bucket('project_files');

// Real-time updates
appwrite.subscribe('wizard_orders', (response) => {
  // Handle real-time updates
});
```

## 8. Error Handling

### 8.1 Common Error Scenarios
- File upload failures
- Payment gateway errors
- Database connection issues
- Invalid order data

### 8.2 Error Response Format
```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## 9. Testing Requirements

### 9.1 Unit Tests
- Pricing calculation logic
- File upload validation
- Order status transitions

### 9.2 Integration Tests
- API endpoint functionality
- Database operations
- Payment gateway integration

### 9.3 End-to-End Tests
- Complete wizard flow
- File upload process
- Payment completion

## 10. Monitoring & Logging

### 10.1 Application Logs
- API request/response logging
- Error logging with stack traces
- Performance metrics

### 10.2 Business Metrics
- Order completion rates
- Payment success rates
- File upload statistics
- User engagement metrics

## 11. Deployment Considerations

### 11.1 Environment Variables
```bash
# Database
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=

# Payment Gateway
ZARRINPAL_MERCHANT_ID=
ZARRINPAL_CALLBACK_URL=

# Email Service
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# File Storage
MAX_FILE_SIZE=
ALLOWED_FILE_TYPES=
```

### 11.2 Health Checks
- Database connectivity
- Payment gateway status
- File storage availability
- Email service status

## 12. Implementation Priority

### Phase 1 (Week 1-2)
1. Basic API endpoints for wizard data
2. Appwrite collections setup
3. File upload functionality
4. Basic pricing calculation

### Phase 2 (Week 3-4)
1. Domain management system
2. Payment gateway integration
3. Email templates and sending
4. Admin dashboard integration

### Phase 3 (Week 5-6)
1. Scheduled tasks implementation
2. Advanced error handling
3. Monitoring and logging
4. Testing and optimization

## 13. Success Criteria

- [ ] Users can complete wizard and save data
- [ ] Files are properly uploaded and stored
- [ ] Pricing is calculated correctly
- [ ] Orders are saved to database
- [ ] Admins can view and manage orders
- [ ] Payment integration works
- [ ] Email notifications are sent
- [ ] Recurring payments are processed
- [ ] Domain prices are manageable
- [ ] System is secure and performant

## 14. Questions for Backend Team

1. **Database Design**: Are the proposed Appwrite collections optimal for the data structure?
2. **File Storage**: What's the recommended approach for storing project files?
3. **Payment Processing**: How should we handle failed payments and retries?
4. **Real-time Updates**: Do we need WebSocket connections for real-time order updates?
5. **Caching Strategy**: What caching strategy should we implement for pricing and domain data?
6. **Rate Limiting**: What rate limits should we set for file uploads and API calls?
7. **Backup Strategy**: How should we handle data backup and recovery?
8. **Scaling**: What considerations should we have for handling increased load?

---

**Next Steps**: 
1. Review and approve this requirements document
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular progress updates and feedback sessions
