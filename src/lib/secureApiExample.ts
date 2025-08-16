// Secure API Client Usage Examples
// Demonstrates proper authentication without localStorage token storage

import { secureApiClient } from './secureApiClient';

// Example 1: Secure Authentication Flow
export async function secureLoginExample() {
  try {
    // Login - server sets httpOnly cookies, no localStorage needed
    const auth = await secureApiClient.signIn('user@example.com', 'password');
    console.log('Login successful:', auth.user);
    
    // Check authentication status
    const authStatus = await secureApiClient.checkAuth();
    console.log('Auth status:', authStatus);
    
    return auth;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Example 2: Secure Wallet Operations
export async function secureWalletExample() {
  try {
    // Get wallet balance - automatically uses httpOnly cookies
    const balance = await secureApiClient.getWalletBalance();
    console.log('Current balance:', balance.balance);
    
    // Request wallet deposit
    const deposit = await secureApiClient.requestWalletDeposit({
      amount: 1000000, // 1,000,000 Rials
      description: 'Wallet topup'
    });
    console.log('Payment URL:', deposit.paymentUrl);
    
    return deposit;
  } catch (error) {
    console.error('Wallet operation failed:', error);
    throw error;
  }
}

// Example 3: Payment Verification
export async function securePaymentVerification(orderId: string, authority: string) {
  try {
    // Verify payment with gateway
    const verification = await secureApiClient.verifyWithGateway({
      orderId,
      authority
    });
    
    if (verification.success) {
      console.log('Payment verified, RefId:', verification.refId);
      
      // Top up wallet with RefId
      const topup = await secureApiClient.topUpWallet({
        amount: 1000000,
        refId: verification.refId!,
        idempotencyKey: `topup-${orderId}` // Prevent duplicate transactions
      });
      
      console.log('Wallet topped up, new balance:', topup.newBalance);
      return topup;
    } else {
      console.error('Payment verification failed:', verification.error);
      throw new Error(verification.error);
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
}

// Example 4: Secure Order Management
export async function secureOrderExample() {
  try {
    // Get user orders
    const orders = await secureApiClient.getOrders();
    console.log('User orders:', orders);
    
    // Create new order
    const newOrder = await secureApiClient.createOrder({
      title: 'Website Design',
      description: 'Custom website design project',
      price: 5000000 // 5,000,000 Rials
    });
    
    console.log('Order created:', newOrder);
    return newOrder;
  } catch (error) {
    console.error('Order operation failed:', error);
    throw error;
  }
}

// Example 5: Secure Logout
export async function secureLogoutExample() {
  try {
    // Logout - server clears httpOnly cookies
    await secureApiClient.logout();
    console.log('Logged out successfully');
    
    // Verify logout by checking auth status
    try {
      await secureApiClient.checkAuth();
      console.warn('Auth check should have failed after logout');
    } catch (error) {
      console.log('Auth check correctly failed after logout');
    }
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

// Example 6: Complete Secure Workflow
export async function completeSecureWorkflow() {
  try {
    console.log('=== Starting Secure Workflow ===');
    
    // 1. Login
    const auth = await secureLoginExample();
    
    // 2. Check wallet
    const balance = await secureApiClient.getWalletBalance();
    console.log('Initial balance:', balance.balance);
    
    // 3. Create order
    const order = await secureApiClient.createOrder({
      title: 'Test Order',
      description: 'Test order for security demo',
      price: 1000000
    });
    
    // 4. Request payment
    const payment = await secureApiClient.requestWalletDeposit({
      amount: 1000000,
      description: `Payment for order ${order.id}`
    });
    
    console.log('=== Workflow Complete ===');
    console.log('Payment URL:', payment.paymentUrl);
    console.log('Order ID:', order.id);
    
    return { auth, balance, order, payment };
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

// Example 7: Error Handling with Secure Client
export async function secureErrorHandlingExample() {
  try {
    // This will fail if not authenticated
    await secureApiClient.getWalletBalance();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('User not authenticated, redirecting to login...');
        // Redirect to login page
        window.location.href = '/auth';
        return;
      }
    }
    console.error('Unexpected error:', error);
    throw error;
  }
}

// Example 8: Health Check
export async function healthCheckExample() {
  try {
    const health = await secureApiClient.healthCheck();
    console.log('API Health:', health);
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// Usage in React components:
/*
import { secureLoginExample, secureWalletExample } from './lib/secureApiExample';

function LoginComponent() {
  const handleLogin = async () => {
    try {
      await secureLoginExample();
      // Navigate to dashboard
    } catch (error) {
      // Handle error
    }
  };
  
  return <button onClick={handleLogin}>Login Securely</button>;
}

function WalletComponent() {
  const handleTopup = async () => {
    try {
      await secureWalletExample();
      // Show payment modal
    } catch (error) {
      // Handle error
    }
  };
  
  return <button onClick={handleTopup}>Top Up Wallet</button>;
}
*/
