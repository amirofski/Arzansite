# 🚀 API Integration Migration Guide

This guide helps you migrate from the old API client to the new structured services with proper field mapping and error handling.

## 📋 Overview

The new API integration provides:
- **Consistent field mapping** between camelCase (frontend) and snake_case (backend)
- **Standardized error handling** with user-friendly messages
- **Automatic retry logic** with exponential backoff
- **Type-safe interfaces** for all API operations
- **Loading states and hooks** for better UX

## 🔄 Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { apiClient } from '@/lib/api-client';
```

**After:**
```typescript
import { 
  authService, 
  ordersService, 
  walletService, 
  paymentService,
  wizardService 
} from '@/lib/services';
```

### Step 2: Update API Calls

#### Authentication

**Before:**
```typescript
const response = await apiClient.signIn(email, password);
```

**After:**
```typescript
const response = await authService.signIn({ email, password });
```

#### Orders

**Before:**
```typescript
const orders = await apiClient.getOrders({ mine: true });
```

**After:**
```typescript
const response = await ordersService.getOrders({ mine: true });
const orders = response.orders;
```

#### Wallet

**Before:**
```typescript
const balance = await apiClient.getWalletBalance();
```

**After:**
```typescript
const response = await walletService.getBalance();
const balance = response.balance;
```

### Step 3: Use the useApi Hook

**Before:**
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState(null);

const fetchData = async () => {
  setLoading(true);
  try {
    const result = await apiClient.getData();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**After:**
```typescript
import { useApi } from '@/hooks/useApi';

const { data, loading, error, execute: fetchData } = useApi(
  () => ordersService.getOrders({ mine: true })
);

// Auto-execute on mount
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### Step 4: Handle Field Mapping

The new services automatically handle field mapping between camelCase and snake_case.

**Before:**
```typescript
// Manual field mapping
const order = {
  order_id: response.order_id,
  total_amount: response.total_amount,
  payment_status: response.payment_status,
};
```

**After:**
```typescript
// Automatic field mapping
const order = response.order; // Already in camelCase
// order.orderId, order.totalAmount, order.paymentStatus
```

## 📝 Component Migration Examples

### Example 1: Login Component

**Before:**
```typescript
import { apiClient } from '@/lib/api-client';

const LoginComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.signIn(email, password);
      // Handle success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
};
```

**After:**
```typescript
import { useApiSubmit } from '@/hooks/useApi';
import { authService } from '@/lib/services';

const LoginComponent = () => {
  const { 
    loading: isSubmitting, 
    error, 
    submit: handleLogin 
  } = useApiSubmit(
    ({ email, password }) => authService.signIn({ email, password }),
    {
      onSuccess: (response) => {
        // Handle success
      },
      onError: (error) => {
        // Additional error handling if needed
      }
    }
  );

  const handleSubmit = async (email: string, password: string) => {
    await handleLogin({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
};
```

### Example 2: Orders List Component

**Before:**
```typescript
import { apiClient } from '@/lib/api-client';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await apiClient.getOrders({ mine: true });
        setOrders(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          <h3>{order.title}</h3>
          <p>Status: {order.status}</p>
          <p>Price: {order.price}</p>
        </div>
      ))}
    </div>
  );
};
```

**After:**
```typescript
import { useApi } from '@/hooks/useApi';
import { ordersService } from '@/lib/services';

const OrdersList = () => {
  const { data, loading, error, execute: fetchOrders } = useApi(
    () => ordersService.getOrders({ mine: true })
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const orders = data?.orders || [];

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          <h3>{order.title}</h3>
          <p>Status: {order.status}</p>
          <p>Price: {order.price}</p>
        </div>
      ))}
    </div>
  );
};
```

### Example 3: Wallet Deposit Component

**Before:**
```typescript
import { apiClient } from '@/lib/api-client';

const WalletDeposit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async (amount: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.requestWalletDeposit({
        amount,
        description: 'Wallet deposit'
      });
      
      // Redirect to payment URL
      window.location.href = response.paymentUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={() => handleDeposit(1000000)} disabled={loading}>
        {loading ? 'Processing...' : 'Deposit 100,000 Tomans'}
      </button>
    </div>
  );
};
```

**After:**
```typescript
import { useApiSubmit } from '@/hooks/useApi';
import { walletService } from '@/lib/services';

const WalletDeposit = () => {
  const { 
    loading: isSubmitting, 
    error, 
    submit: handleDeposit 
  } = useApiSubmit(
    (amount: number) => walletService.requestDeposit({
      amount,
      description: 'Wallet deposit'
    }),
    {
      onSuccess: (response) => {
        // Redirect to payment URL
        window.location.href = response.paymentUrl;
      }
    }
  );

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button 
        onClick={() => handleDeposit(1000000)} 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Processing...' : 'Deposit 100,000 Tomans'}
      </button>
    </div>
  );
};
```

## 🔧 Advanced Usage

### Custom Retry Configuration

```typescript
const { data, loading, error, execute } = useApi(
  () => ordersService.getOrders({ mine: true }),
  {
    retryConfig: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
      jitter: true
    }
  }
);
```

### Caching

```typescript
const { data, loading, error, execute, cached } = useApiWithCache(
  () => ordersService.getOrders({ mine: true }),
  'user-orders'
);
```

### Optimistic Updates

```typescript
const { data, execute, optimisticData } = useApiWithOptimisticUpdate(
  (orderId: string, status: string) => ordersService.updateOrder(orderId, { status }),
  ([orderId, status]) => ({ id: orderId, status, updatedAt: new Date().toISOString() })
);
```

### Polling

```typescript
const { data, loading, startPolling, stopPolling, isPolling } = useApiWithPolling(
  () => ordersService.getOrder(orderId),
  5000 // Poll every 5 seconds
);

useEffect(() => {
  startPolling();
  return () => stopPolling();
}, [startPolling, stopPolling]);
```

## 🚨 Breaking Changes

1. **Field Names**: All response fields are now in camelCase
2. **Error Handling**: Errors now have standardized structure
3. **Response Structure**: Some responses are now wrapped in a `data` property
4. **Method Signatures**: Some methods now require objects instead of individual parameters

## ✅ Migration Checklist

- [ ] Update all import statements
- [ ] Replace `apiClient` calls with service calls
- [ ] Update field names from snake_case to camelCase
- [ ] Implement `useApi` hooks for loading states
- [ ] Update error handling to use new error structure
- [ ] Test all API interactions
- [ ] Update TypeScript interfaces if needed
- [ ] Remove old API client imports
