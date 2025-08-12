# Appwrite Integration Setup Guide

## Overview
This guide covers the complete setup of Appwrite integration for the Arzansite project, including authentication, database collections, and realtime subscriptions.

## 1. Appwrite Dashboard Setup

### Project Configuration
- **Project ID**: `6898b35e003067cd7b43`
- **Endpoint**: `http://arzansite-appwrite-c6990a-82-115-13-113.traefik.me/v1`

### Authentication Settings
1. Go to **Auth > Allowed Origins**
2. Add your frontend domains:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)

## 2. Database Collections Setup

### Database
- **Database ID**: `6898cb8d001acb670f24`

### Required Collections

#### 1. orders
```json
{
  "user_id": "string",
  "title": "string", 
  "description": "string",
  "status": "enum['pending','in_progress','completed','cancelled']",
  "price": "float",
  "comments": "string",
  "payment_status": "enum['pending','paid','refunded','cancelled']",
  "zarinpal_authority": "string",
  "zarinpal_ref_id": "string",
  "design_options": "json",
  "design_preview_url": "string",
  "total_pages": "int",
  "total_sections": "int",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes:**
- `user_id` (ascending)
- `created_at` (descending)
- `description` (full-text search)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 2. designs
```json
{
  "order_id": "string",
  "design": "json",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes:**
- `order_id` (ascending)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 3. wallets
```json
{
  "user_id": "string",
  "balance": "float",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes:**
- `user_id` (ascending)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 4. transactions
```json
{
  "wallet_id": "string",
  "user_id": "string",
  "type": "enum['deposit','withdrawal','payment','refund','credit','debit']",
  "status": "enum['pending','completed','failed','cancelled']",
  "amount": "float",
  "balance_before": "float",
  "balance_after": "float",
  "description": "string",
  "reference_id": "string",
  "reference_type": "string",
  "metadata": "json",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes:**
- `user_id` (ascending)
- `reference_id` (ascending)
- `created_at` (descending)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 5. payment_transactions
```json
{
  "order_id": "string",
  "user_id": "string",
  "transaction_type": "enum['payment_request','payment_verification','refund','cancellation']",
  "zarinpal_authority": "string",
  "zarinpal_ref_id": "string",
  "amount": "float",
  "status": "enum['pending','completed','failed','cancelled']",
  "gateway_response": "json",
  "metadata": "json",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes:**
- `order_id` (ascending)
- `user_id` (ascending)
- `created_at` (descending)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 6. profiles
```json
{
  "user_id": "string",
  "email": "string",
  "full_name": "string",
  "phone": "string",
  "address": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes:**
- `user_id` (ascending)
- `created_at` (descending)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 7. user_roles
```json
{
  "user_id": "string",
  "role": "enum['user','admin']",
  "created_at": "datetime"
}
```

**Indexes:**
- `user_id` (ascending)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 8. site_config
```json
{
  "mode": "enum['normal','temporarily_unavailable','update_mode','development_mode']",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes:**
- `created_at` (descending)

**Permissions:**
- Read: `role:users`
- Write: `server key only`

#### 9. email_logs
```json
{
  "to_email": "string",
  "subject": "string",
  "success": "boolean",
  "error_message": "string",
  "service_used": "string",
  "template_type": "string",
  "created_at": "datetime"
}
```

**Indexes:**
- `created_at` (descending)

**Permissions:**
- Read: `server key only`
- Write: `server key only`

## 3. Frontend Integration

### Authentication Flow
1. **Signup**: User creates account via Appwrite
2. **Email Verification**: Appwrite sends verification email
3. **Login**: User logs in and receives JWT
4. **API Calls**: JWT automatically attached to backend requests

### Key Services

#### AppwriteAuthService
- Handles all authentication operations
- Creates JWT tokens for backend API calls
- Manages user sessions

#### AppwriteDatabaseService
- Provides database query methods
- Handles filtering, searching, and pagination
- Supports all collection types

#### AppwriteRealtimeService
- Manages realtime subscriptions
- Filters events by user when needed
- Handles subscription cleanup

#### AppwriteApiClient
- Automatically attaches JWT to requests
- Handles authentication errors
- Provides consistent API interface

## 4. Usage Examples

### Authentication
```typescript
import { AppwriteAuthService } from '@/lib/appwriteAuth';

// Signup
const result = await AppwriteAuthService.signup(email, password, name);

// Login
const { jwt } = await AppwriteAuthService.login(email, password);

// Get current user
const user = await AppwriteAuthService.getCurrentUser();
```

### Database Operations
```typescript
import { AppwriteDatabaseService } from '@/lib/appwriteDatabase';

// Get user orders
const orders = await AppwriteDatabaseService.getOrders(userId, 'pending');

// Get user wallet
const wallet = await AppwriteDatabaseService.getUserWallet(userId);

// Search orders
const searchResults = await AppwriteDatabaseService.searchOrders('design');
```

### Realtime Subscriptions
```typescript
import { realtimeService } from '@/lib/appwriteRealtime';

// Subscribe to user orders
const unsubscribe = realtimeService.subscribeToUserOrders(userId, (event) => {
  console.log('Order updated:', event.payload);
});

// Subscribe to site config changes
realtimeService.subscribeToSiteConfig((event) => {
  console.log('Site config changed:', event.payload);
});

// Cleanup on component unmount
useEffect(() => {
  return () => {
    realtimeService.unsubscribeAll();
  };
}, []);
```

### API Calls
```typescript
import { apiClient } from '@/lib/appwriteApiClient';

// JWT automatically attached
const response = await apiClient.post('/orders', orderData);
const orders = await apiClient.get('/orders');
```

## 5. Migration Notes

### From Supabase to Appwrite
- **Auth**: Frontend now uses Appwrite Account APIs directly
- **JWT**: Backend validates Appwrite JWT instead of Supabase
- **Database**: Collections moved to Appwrite with same structure
- **Realtime**: Appwrite realtime replaces Supabase subscriptions

### Backend Changes Required
- Update JWT validation to use Appwrite Account.get()
- Remove Supabase client dependencies
- Update environment variables for Appwrite configuration

## 6. Security Considerations

### Permissions
- Client-side write operations disabled
- All writes go through backend with server key
- Read permissions granted to authenticated users
- Sensitive collections (email_logs) server-only

### JWT Management
- JWT automatically refreshed for API calls
- No manual token storage required
- Automatic cleanup on logout

## 7. Troubleshooting

### Common Issues
1. **CORS Errors**: Check allowed origins in Appwrite dashboard
2. **Permission Denied**: Verify collection permissions and user roles
3. **JWT Expired**: JWT automatically refreshed by interceptor
4. **Realtime Not Working**: Ensure realtime enabled at project level

### Debug Mode
Enable console logging in services to debug issues:
```typescript
// In appwriteAuth.ts, appwriteDatabase.ts, etc.
console.log('Debug info:', data);
```

## 8. Next Steps

1. **Test Authentication**: Verify signup, login, and JWT creation
2. **Test Database**: Create test documents and verify queries
3. **Test Realtime**: Verify subscriptions work correctly
4. **Update Backend**: Modify backend to validate Appwrite JWT
5. **Deploy**: Update production environment variables

## Support
For Appwrite-specific issues, refer to the [Appwrite Documentation](https://appwrite.io/docs).
For project-specific questions, check the existing codebase and documentation.
