# 🧪 **ZarinPal Payment Gateway - Comprehensive Testing Guide**

## 🎯 **Testing Overview**

This guide provides comprehensive testing scenarios for your ZarinPal payment gateway integration. Test all scenarios to ensure a production-ready payment system.

---

## 🚀 **Pre-Testing Setup**

### **1. Development Environment**
```bash
# Start development server
npm run dev

# Access the application
http://localhost:8083/ (or available port)
```

### **2. Test Data Preparation**
```typescript
// Test amounts for wallet deposits
const TEST_AMOUNTS = {
  VALID_MIN: 100000,        // 100,000 Tomans (1,000,000 Rials) - Minimum
  VALID_STANDARD: 500000,   // 500,000 Tomans (5,000,000 Rials) - Standard
  VALID_LARGE: 1000000,     // 1,000,000 Tomans (10,000,000 Rials) - Large
  INVALID_SMALL: 50000,     // 50,000 Tomans (500,000 Rials) - Below minimum
  INVALID_ZERO: 0,          // 0 Tomans - Invalid
  INVALID_NEGATIVE: -10000  // Negative amount - Invalid
};

// Test descriptions
const TEST_DESCRIPTIONS = {
  VALID_SHORT: 'شارژ کیف پول',
  VALID_MEDIUM: 'شارژ کیف پول برای خرید خدمات طراحی',
  VALID_LONG: 'شارژ کیف پول - مبلغ ۵۰۰,۰۰۰ تومان برای استفاده در خرید خدمات طراحی وب‌سایت و اپلیکیشن موبایل',
  INVALID_SHORT: 'AB',      // Too short (less than 3 characters)
  INVALID_LONG: 'A'.repeat(300)  // Too long (more than 255 characters)
};
```

---

## 🧪 **Test Scenarios**

### **1. 🏦 Wallet Deposit Form Testing**

#### **1.1 Amount Validation Tests**
```typescript
// Test Case: Valid Minimum Amount
describe('Valid Minimum Amount', () => {
  it('should accept 100,000 Tomans (minimum)', () => {
    // Navigate to wallet tab
    // Click "شارژ" button
    // Enter amount: 100000
    // Verify form accepts the amount
    // Verify no validation errors
  });
});

// Test Case: Invalid Amount Below Minimum
describe('Invalid Amount Below Minimum', () => {
  it('should reject amounts below 100,000 Tomans', () => {
    // Enter amount: 50000
    // Verify validation error appears
    // Verify submit button is disabled
    // Verify error message: "مبلغ باید حداقل ۱۰۰,۰۰۰ تومان باشد"
  });
});

// Test Case: Maximum Amount Validation
describe('Maximum Amount Validation', () => {
  it('should reject amounts above 999,999,999 Tomans', () => {
    // Enter amount: 1000000000
    // Verify validation error appears
    // Verify error message: "حداکثر مبلغ شارژ ۹۹۹,۹۹۹,۹۹۹ تومان است"
  });
});
```

#### **1.2 Description Validation Tests**
```typescript
// Test Case: Valid Description
describe('Valid Description', () => {
  it('should accept descriptions with 3+ characters', () => {
    // Enter description: "شارژ کیف پول"
    // Verify no validation errors
    // Verify character count shows correctly
  });
});

// Test Case: Invalid Short Description
describe('Invalid Short Description', () => {
  it('should reject descriptions with less than 3 characters', () => {
    // Enter description: "AB"
    // Verify validation error appears
    // Verify error message: "توضیحات باید حداقل ۳ کاراکتر باشد"
  });
});

// Test Case: Character Count Display
describe('Character Count Display', () => {
  it('should show character count and limit', () => {
    // Enter description: "شارژ کیف پول"
    // Verify character count shows: "12/255 کاراکتر"
    // Verify limit warning appears at 255 characters
  });
});
```

#### **1.3 Form State Tests**
```typescript
// Test Case: Form Loading States
describe('Form Loading States', () => {
  it('should show loading state during submission', () => {
    // Fill valid form data
    // Click submit button
    // Verify loading spinner appears
    // Verify form is disabled
    // Verify button text changes to "در حال پردازش..."
  });
});

// Test Case: Form Reset
describe('Form Reset', () => {
  it('should clear form after successful submission', () => {
    // Fill and submit form
    // After successful payment
    // Verify form fields are cleared
    // Verify form is ready for new input
  });
});
```

### **2. 🔄 Payment Flow Testing**

#### **2.1 Payment Request Creation**
```typescript
// Test Case: Successful Payment Request
describe('Successful Payment Request', () => {
  it('should create payment request and redirect to ZarinPal', () => {
    // Fill valid deposit form
    // Click submit
    // Verify API call to /api/wallets/me/deposit
    // Verify payment URL is received
    // Verify redirect to ZarinPal gateway
    // Verify payment info stored in session storage
  });
});

// Test Case: Payment Request Failure
describe('Payment Request Failure', () => {
  it('should handle API errors gracefully', () => {
    // Mock API failure
    // Submit form
    // Verify error toast appears
    // Verify form remains enabled
    // Verify user can retry
  });
});
```

#### **2.2 Payment Gateway Integration**
```typescript
// Test Case: ZarinPal Redirect
describe('ZarinPal Redirect', () => {
  it('should redirect to ZarinPal with correct parameters', () => {
    // Submit deposit form
    // Verify redirect to ZarinPal
    // Verify payment amount is correct
    // Verify callback URL is set
  });
});

// Test Case: Payment Gateway Error
describe('Payment Gateway Error', () => {
  it('should handle ZarinPal gateway errors', () => {
    // Simulate ZarinPal error
    // Verify error handling
    // Verify user can return to form
  });
});
```

### **3. 📱 Payment Callback Testing**

#### **3.1 Successful Payment Callback**
```typescript
// Test Case: Successful Payment Verification
describe('Successful Payment Verification', () => {
  it('should verify payment and credit wallet', () => {
    // Complete payment on ZarinPal
    // Return to callback URL
    // Verify payment verification API call
    // Verify wallet is credited
    // Verify success message appears
    // Verify new balance is displayed
    // Verify reference ID is shown
  });
});

// Test Case: Payment Verification Failure
describe('Payment Verification Failure', () => {
  it('should handle verification errors', () => {
    // Mock verification failure
    // Verify error message appears
    // Verify retry button is available
    // Verify error details are shown
  });
});
```

#### **3.2 Error Handling Tests**
```typescript
// Test Case: Network Error Handling
describe('Network Error Handling', () => {
  it('should handle network failures gracefully', () => {
    // Simulate network failure
    // Verify error message appears
    // Verify retry functionality works
    // Verify user can navigate away
  });
});

// Test Case: Invalid Callback Data
describe('Invalid Callback Data', () => {
  it('should handle invalid callback parameters', () => {
    // Access callback with invalid data
    // Verify error handling
    // Verify user guidance
  });
});
```

### **4. 📊 Payment Status Management**

#### **4.1 Status Display Tests**
```typescript
// Test Case: Payment Status Messages
describe('Payment Status Messages', () => {
  it('should display appropriate status messages', () => {
    // Test success status
    // Verify success message: "پرداخت با موفقیت انجام شد"
    
    // Test failure status
    // Verify failure message: "پرداخت ناموفق بود یا لغو شد"
    
    // Test loading status
    // Verify loading message: "در حال بررسی شارژ کیف پول..."
  });
});

// Test Case: Payment Recovery Tips
describe('Payment Recovery Tips', () => {
  it('should show helpful recovery suggestions', () => {
    // Navigate to failed payment
    // Verify recovery tips appear
    // Verify tips are actionable
    // Verify retry button is prominent
  });
});
```

#### **4.2 Retry Functionality Tests**
```typescript
// Test Case: Payment Retry
describe('Payment Retry', () => {
  it('should allow users to retry failed payments', () => {
    // Navigate to failed payment
    // Click retry button
    // Verify new payment request is created
    // Verify redirect to ZarinPal
    // Verify old payment info is cleared
  });
});
```

### **5. 🔒 Security & Validation Testing**

#### **5.1 Client-Side Validation**
```typescript
// Test Case: Input Sanitization
describe('Input Sanitization', () => {
  it('should sanitize user inputs', () => {
    // Test XSS attempts
    // Test SQL injection attempts
    // Test special characters
    // Verify inputs are properly sanitized
  });
});

// Test Case: Amount Tampering Prevention
describe('Amount Tampering Prevention', () => {
  it('should prevent amount manipulation', () => {
    // Try to modify amount in browser dev tools
    // Verify server-side validation catches it
    // Verify error message appears
  });
});
```

#### **5.2 Session Security**
```typescript
// Test Case: Payment Info Storage
describe('Payment Info Storage', () => {
  it('should store payment info securely', () => {
    // Verify sensitive data is not stored in localStorage
    // Verify session storage is used appropriately
    // Verify data is cleared after completion
  });
});
```

---

## 📱 **Mobile Testing Scenarios**

### **1. Mobile Responsiveness**
```typescript
// Test Case: Mobile Form Display
describe('Mobile Form Display', () => {
  it('should display correctly on mobile devices', () => {
    // Test on various screen sizes (320px, 375px, 414px, 768px)
    // Verify form elements are touch-friendly
    // Verify text is readable
    // Verify buttons are properly sized
  });
});

// Test Case: Mobile Payment Gateway
describe('Mobile Payment Gateway', () => {
  it('should work seamlessly on mobile', () => {
    // Test ZarinPal integration on mobile
    // Verify full-screen payment experience
    // Verify smooth navigation back to app
  });
});
```

### **2. Touch Interactions**
```typescript
// Test Case: Touch Targets
describe('Touch Targets', () => {
  it('should have appropriate touch target sizes', () => {
    // Verify buttons are at least 44px height
    // Verify input fields are easily tappable
    // Verify proper spacing between elements
  });
});
```

---

## 🌐 **Cross-Browser Testing**

### **1. Browser Compatibility**
```typescript
// Test Case: Browser Support
describe('Browser Support', () => {
  it('should work on all supported browsers', () => {
    // Test on Chrome (latest)
    // Test on Firefox (latest)
    // Test on Safari (latest)
    // Test on Edge (latest)
    // Verify consistent behavior
  });
});
```

### **2. JavaScript Features**
```typescript
// Test Case: JavaScript Compatibility
describe('JavaScript Compatibility', () => {
  it('should work with modern JavaScript features', () => {
    // Test async/await functionality
    // Test modern array methods
    // Test template literals
    // Verify no syntax errors
  });
});
```

---

## 🚀 **Performance Testing**

### **1. Loading Performance**
```typescript
// Test Case: Component Loading
describe('Component Loading', () => {
  it('should load components efficiently', () => {
    // Measure initial load time
    // Measure form render time
    // Measure API response time
    // Verify acceptable performance metrics
  });
});

// Test Case: Payment Processing
describe('Payment Processing', () => {
  it('should process payments efficiently', () => {
    // Measure payment request time
    // Measure verification time
    // Verify timeouts are appropriate
  });
});
```

---

## 🧹 **Cleanup & Maintenance Testing**

### **1. Data Cleanup**
```typescript
// Test Case: Session Cleanup
describe('Session Cleanup', () => {
  it('should clean up payment data properly', () => {
    // Complete successful payment
    // Verify session storage is cleared
    // Verify no sensitive data remains
    // Verify user can start new payment
  });
});

// Test Case: Expired Payment Handling
describe('Expired Payment Handling', () => {
  it('should handle expired payments gracefully', () => {
    // Simulate expired payment
    // Verify cleanup occurs
    // Verify user is notified
    // Verify retry is available
  });
});
```

---

## 📋 **Testing Checklist**

### **✅ Form Validation**
- [ ] Amount validation (minimum, maximum)
- [ ] Description validation (length, characters)
- [ ] Real-time validation feedback
- [ ] Form state management

### **✅ Payment Flow**
- [ ] Payment request creation
- [ ] ZarinPal gateway integration
- [ ] Payment callback handling
- [ ] Payment verification

### **✅ Error Handling**
- [ ] Network error handling
- [ ] API error handling
- [ ] User-friendly error messages
- [ ] Error recovery mechanisms

### **✅ User Experience**
- [ ] Loading states
- [ ] Success feedback
- [ ] Mobile responsiveness
- [ ] Accessibility features

### **✅ Security**
- [ ] Input validation
- [ ] Data sanitization
- [ ] Session security
- [ ] Payment verification

---

## 🎯 **Expected Test Results**

After completing all test scenarios, you should have:

1. **✅ Robust Payment System**: All payment flows work correctly
2. **✅ Excellent User Experience**: Smooth, intuitive payment process
3. **✅ Mobile Optimization**: Perfect performance on all devices
4. **✅ Security Compliance**: Secure payment processing
5. **✅ Error Resilience**: Graceful handling of all error scenarios
6. **✅ Production Readiness**: System ready for live users

---

## 🚀 **Next Steps After Testing**

1. **Fix Any Issues**: Address any bugs or problems found
2. **Performance Optimization**: Optimize any slow components
3. **User Testing**: Conduct real user testing sessions
4. **Production Deployment**: Deploy to production environment
5. **Monitoring Setup**: Implement payment monitoring and analytics

Your ZarinPal integration will be **production-ready** and provide users with an **exceptional payment experience**! 🎉
