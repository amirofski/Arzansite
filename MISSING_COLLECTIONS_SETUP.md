# Missing Appwrite Collections Setup Guide

## Overview
This guide provides the complete setup for the missing Appwrite collections needed for the Wallet & Invoice Management System. The error you're seeing indicates that the `invoices` collection doesn't exist in your Appwrite database.

## 🔧 Required Collections to Add

### 1. invoices Collection

**Collection ID**: `invoices`

**Attributes**:
```json
{
  "user_id": {
    "type": "string",
    "required": true,
    "array": false
  },
  "order_id": {
    "type": "string",
    "required": false,
    "array": false
  },
  "amount": {
    "type": "double",
    "required": true,
    "array": false
  },
  "due_date": {
    "type": "datetime",
    "required": false,
    "array": false
  },
  "status": {
    "type": "enum",
    "required": true,
    "array": false,
    "elements": ["pending", "paid", "due", "overdue", "cancelled"]
  },
  "service_name": {
    "type": "string",
    "required": false,
    "array": false
  },
  "description": {
    "type": "string",
    "required": false,
    "array": false
  },
  "created_at": {
    "type": "datetime",
    "required": true,
    "array": false
  },
  "updated_at": {
    "type": "datetime",
    "required": true,
    "array": false
  }
}
```

**Indexes**:
- `user_id` (ascending)
- `status` (ascending)
- `due_date` (ascending)
- `created_at` (descending)
- `service_name` (full-text search)

**Permissions**:
- Read: `role:users`
- Write: `server key only`

### 2. receipts Collection

**Collection ID**: `receipts`

**Attributes**:
```json
{
  "user_id": {
    "type": "string",
    "required": true,
    "array": false
  },
  "invoice_id": {
    "type": "string",
    "required": false,
    "array": false
  },
  "payment_id": {
    "type": "string",
    "required": false,
    "array": false
  },
  "ref_id": {
    "type": "string",
    "required": false,
    "array": false
  },
  "amount": {
    "type": "double",
    "required": true,
    "array": false
  },
  "service": {
    "type": "string",
    "required": false,
    "array": false
  },
  "format": {
    "type": "enum",
    "required": true,
    "array": false,
    "elements": ["pdf", "html"]
  },
  "created_at": {
    "type": "datetime",
    "required": true,
    "array": false
  }
}
```

**Indexes**:
- `user_id` (ascending)
- `invoice_id` (ascending)
- `ref_id` (ascending)
- `created_at` (descending)
- `service` (full-text search)

**Permissions**:
- Read: `role:users`
- Write: `server key only`

### 3. wallet_adjustments Collection

**Collection ID**: `wallet_adjustments`

**Attributes**:
```json
{
  "wallet_id": {
    "type": "string",
    "required": true,
    "array": false
  },
  "user_id": {
    "type": "string",
    "required": true,
    "array": false
  },
  "admin_id": {
    "type": "string",
    "required": true,
    "array": false
  },
  "type": {
    "type": "enum",
    "required": true,
    "array": false,
    "elements": ["credit", "debit", "correction"]
  },
  "amount": {
    "type": "double",
    "required": true,
    "array": false
  },
  "balance_before": {
    "type": "double",
    "required": true,
    "array": false
  },
  "balance_after": {
    "type": "double",
    "required": true,
    "array": false
  },
  "reason": {
    "type": "string",
    "required": true,
    "array": false
  },
  "notes": {
    "type": "string",
    "required": false,
    "array": false
  },
  "created_at": {
    "type": "datetime",
    "required": true,
    "array": false
  }
}
```

**Indexes**:
- `wallet_id` (ascending)
- `user_id` (ascending)
- `admin_id` (ascending)
- `type` (ascending)
- `created_at` (descending)

**Permissions**:
- Read: `role:admin`
- Write: `server key only`

## 🚀 Setup Instructions

### Step 1: Access Appwrite Dashboard

1. Go to your Appwrite dashboard
2. Navigate to **Databases** > **Your Database** (ID: `6898cb8d001acb670f24`)

### Step 2: Create Collections

For each collection above:

1. Click **"Add Collection"**
2. Enter the Collection ID (e.g., `invoices`)
3. Add all attributes as specified above
4. Create the indexes as listed
5. Set permissions as specified

### Step 3: Verify Collection Creation

After creating all collections, you can verify they exist by:

1. Going to the Collections list in your database
2. Checking that all three collections (`invoices`, `receipts`, `wallet_adjustments`) are present

### Step 4: Test the API

Once the collections are created, test the API endpoints:

```bash
# Test invoices endpoint
curl -X GET "https://nest.arzansite.com/api/invoices" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test receipts endpoint  
curl -X GET "https://nest.arzansite.com/api/receipts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 Troubleshooting

### Common Issues

1. **Collection ID Mismatch**: Ensure the collection IDs exactly match what the backend expects
2. **Permission Issues**: Make sure the server key has write permissions
3. **Attribute Types**: Double-check that all attribute types match the specifications
4. **Index Creation**: Ensure all required indexes are created

### Error Messages

- **"Collection with the requested ID could not be found"**: The collection doesn't exist - create it
- **"Permission denied"**: Check collection permissions
- **"Invalid attribute"**: Verify attribute types and requirements

## 📋 Collection Summary

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `invoices` | Store user invoices | user_id, amount, status, due_date |
| `receipts` | Store payment receipts | user_id, invoice_id, ref_id, amount |
| `wallet_adjustments` | Track admin wallet changes | wallet_id, admin_id, type, reason |

## 🎯 Next Steps

After creating these collections:

1. **Test the frontend** - The invoice and receipt components should now work
2. **Create sample data** - Add some test invoices to verify functionality
3. **Monitor logs** - Check for any remaining API errors
4. **Update documentation** - Add these collections to your main setup guide

## 📞 Support

If you encounter any issues:

1. Check the Appwrite console logs
2. Verify collection permissions
3. Test with a simple API call first
4. Ensure your backend is properly configured to use these collections

The frontend is ready and waiting for these collections to be created. Once they're set up, the wallet and invoice management system should work perfectly!
