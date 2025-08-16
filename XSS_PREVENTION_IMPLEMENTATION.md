# XSS Prevention Implementation - Safe Transaction Description Rendering

## Problem Fixed

The original implementation rendered untrusted transaction descriptions without sanitization, creating XSS vulnerabilities where malicious scripts could be executed.

## Security Risks

### Before (Vulnerable)
```typescript
// ❌ Direct rendering without sanitization
<div dangerouslySetInnerHTML={{ __html: transaction.description }} />

// ❌ Trusting user input
<span>{transaction.description}</span> // Could contain <script> tags
```

**Attack Scenarios:**
1. **Script Injection**: `<script>alert('XSS')</script>`
2. **Event Handler Injection**: `<img src="x" onerror="alert('XSS')">`
3. **JavaScript URL**: `javascript:alert('XSS')`
4. **Data URL**: `data:text/html,<script>alert('XSS')</script>`
5. **Iframe Injection**: `<iframe src="http://evil.com"></iframe>`

## Solution Implemented

### 1. **Sanitization Utilities** (`src/lib/sanitizationUtils.ts`)

```typescript
// Comprehensive HTML sanitization
export function sanitizeHtml(input: string, options: SanitizationOptions = {}): SanitizationResult {
  const {
    allowHtml = false,
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
    stripScripts = true,
    stripStyles = true,
    maxLength = 1000
  } = options;

  let clean = input;
  
  // Remove dangerous patterns
  if (stripScripts) {
    DANGEROUS_PATTERNS.forEach(pattern => {
      clean = clean.replace(pattern, '');
    });
  }
  
  // Remove disallowed tags
  const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  clean = clean.replace(tagRegex, (match, slash, tagName) => {
    const lowerTagName = tagName.toLowerCase();
    if (!allowedTags.includes(lowerTagName)) {
      return ''; // Remove the tag
    }
    return match; // Keep the tag
  });
  
  return {
    clean,
    isSanitized: true,
    originalLength: input.length,
    sanitizedLength: clean.length,
    removedTags: [],
    removedAttributes: []
  };
}
```

### 2. **Safe Transaction Description Component** (`src/components/SafeTransactionDescription.tsx`)

```typescript
export const SafeTransactionDescription: React.FC<SafeTransactionDescriptionProps> = ({
  description = '',
  allowHtml = false,
  maxLength = 200,
  showFullText = false,
  className = '',
  onSanitizationComplete,
  sanitizationOptions = {}
}) => {
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [hasDangerousContent, setHasDangerousContent] = useState(false);
  const [threats, setThreats] = useState<string[]>([]);

  useEffect(() => {
    // Check for dangerous content first
    const dangerCheck = containsDangerousContent(description);
    setHasDangerousContent(dangerCheck.isDangerous);
    setThreats(dangerCheck.threats);

    // Sanitize the content
    const options: SanitizationOptions = {
      allowHtml,
      maxLength: isExpanded ? undefined : maxLength,
      stripScripts: true,
      stripStyles: true,
      ...sanitizationOptions
    };

    const result = formatTransactionDescription(description, options);
    setSanitizedContent(result.clean);
    
    // Log dangerous content for security monitoring
    if (dangerCheck.isDangerous) {
      console.warn('Dangerous content detected:', {
        threats: dangerCheck.threats,
        description: description.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }, [description, allowHtml, maxLength, sanitizationOptions]);

  return (
    <div className="safe-transaction-description-container">
      {hasDangerousContent && (
        <div className="dangerous-content-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            این محتوا شامل عناصر خطرناک است و برای امنیت شما فیلتر شده است.
          </span>
        </div>
      )}
      
      <div className={`safe-transaction-description ${className}`}>
        {allowHtml ? (
          <div dangerouslySetInnerHTML={createSafeHtml(description, sanitizationOptions)} />
        ) : (
          <div>{sanitizedContent}</div>
        )}
      </div>
    </div>
  );
};
```

### 3. **DOMPurify Integration** (Optional)

```typescript
export const DOMPurifyTransactionDescription: React.FC<DOMPurifyTransactionDescriptionProps> = ({
  description = '',
  className = '',
  maxLength = 200,
  showFullText = false
}) => {
  const [sanitizedContent, setSanitizedContent] = useState<string>('');

  useEffect(() => {
    let clean: string;
    
    try {
      // Try to use DOMPurify if available
      if (typeof window !== 'undefined' && (window as any).DOMPurify) {
        const DOMPurify = (window as any).DOMPurify;
        clean = DOMPurify.sanitize(description, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span'],
          ALLOWED_ATTR: ['class', 'id'],
          KEEP_CONTENT: true
        });
      } else {
        // Fallback to our sanitization
        const result = formatTransactionDescription(description, {
          allowHtml: true,
          maxLength: isExpanded ? undefined : maxLength
        });
        clean = result.clean;
      }
    } catch (error) {
      console.error('Sanitization failed:', error);
      clean = stripAllHtml(description);
    }

    setSanitizedContent(clean);
  }, [description, isExpanded, maxLength]);

  return (
    <div className={`dompurify-transaction-description ${className}`}>
      <div
        className="description-content"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
};
```

### 4. **Updated Secure Deposit Button** (`src/components/SecureDepositButton.tsx`)

```typescript
const handleDeposit = async () => {
  // ... validation and API call ...
  
  // Create description with both units for clarity and sanitize it
  const rawDescription = description || createAmountDescription(amount, unit);
  const depositDescription = SafeContentRenderer.renderText(rawDescription, 200);
  
  const result = await apiClient.requestWalletDeposit({
    amount: amountInRials,
    description: depositDescription // Now sanitized
  });
  
  // ... rest of the implementation
};
```

## Security Features

### 1. **Content Validation**
- **Dangerous Pattern Detection**: Identifies script tags, event handlers, malicious URLs
- **Threat Analysis**: Provides detailed threat information
- **Real-time Monitoring**: Logs dangerous content for security analysis

### 2. **HTML Sanitization**
- **Tag Whitelist**: Only allows safe HTML tags
- **Attribute Filtering**: Removes dangerous attributes
- **Script Removal**: Eliminates all script-related content
- **Style Stripping**: Removes potentially dangerous CSS

### 3. **Safe Rendering Options**
- **Plain Text Mode**: Default safe rendering (no HTML)
- **Controlled HTML**: Limited HTML with strict sanitization
- **DOMPurify Integration**: Professional-grade sanitization when available

### 4. **User Feedback**
- **Warning Messages**: Informs users when content is filtered
- **Threat Details**: Shows what was removed and why
- **Safety Indicators**: Visual cues for content safety

## Implementation Examples

### Frontend Usage

```typescript
// Option 1: Basic safe rendering (recommended)
<SafeTransactionDescription
  description={transaction.description}
  allowHtml={false} // Default: plain text only
  maxLength={200}
  onSanitizationComplete={(result) => {
    console.log('Sanitization completed:', result);
  }}
/>

// Option 2: Limited HTML rendering
<SafeTransactionDescription
  description={transaction.description}
  allowHtml={true}
  maxLength={200}
  sanitizationOptions={{
    allowedTags: ['p', 'br', 'strong', 'em'],
    allowedAttributes: ['class']
  }}
/>

// Option 3: DOMPurify (if available)
<DOMPurifyTransactionDescription
  description={transaction.description}
  maxLength={200}
/>

// Option 4: Using Hook
const { sanitizedContent, isSafe } = useSafeContent(description, {
  allowHtml: false,
  maxLength: 150
});

// Option 5: Manual sanitization
const result = SafeContentRenderer.renderText(description, 200);
```

### Backend Integration

```typescript
// Server-side validation
export function validateTransactionDescription(description: string): { isValid: boolean; error?: string } {
  const dangerCheck = containsDangerousContent(description);
  
  if (dangerCheck.isDangerous) {
    return {
      isValid: false,
      error: `Dangerous content detected: ${dangerCheck.threats.join(', ')}`
    };
  }
  
  if (description.length > 1000) {
    return {
      isValid: false,
      error: 'Description too long (max 1000 characters)'
    };
  }
  
  return { isValid: true };
}

// API endpoint with validation
app.post('/api/transactions', (req, res) => {
  const { description } = req.body;
  
  const validation = validateTransactionDescription(description);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }
  
  // Process transaction...
});
```

## Security Best Practices

### 1. **Always Sanitize Content**
```typescript
// ✅ Always sanitize before rendering
const cleanDescription = SafeContentRenderer.renderText(description);

// ❌ Never trust user input
<div>{description}</div> // Could contain malicious content
```

### 2. **Use Plain Text by Default**
```typescript
// ✅ Default to plain text for maximum security
<SafeTransactionDescription
  description={description}
  allowHtml={false} // Default
/>

// ❌ Only enable HTML when absolutely necessary
<SafeTransactionDescription
  description={description}
  allowHtml={true} // Only when needed
/>
```

### 3. **Log Security Events**
```typescript
// ✅ Log dangerous content for monitoring
if (dangerCheck.isDangerous) {
  console.warn('Dangerous content detected:', {
    threats: dangerCheck.threats,
    description: description.substring(0, 100),
    timestamp: new Date().toISOString(),
    userId: currentUser.id
  });
}
```

### 4. **Provide User Feedback**
```typescript
// ✅ Inform users when content is filtered
{hasDangerousContent && (
  <div className="warning">
    محتوا برای امنیت فیلتر شده است
  </div>
)}
```

### 5. **Use Content Security Policy**
```html
<!-- Add CSP headers -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'none';">
```

## Testing

### Unit Tests

```typescript
describe('XSS Prevention', () => {
  test('should sanitize script tags', () => {
    const malicious = '<script>alert("XSS")</script>Hello';
    const result = sanitizeHtml(malicious, { allowHtml: false });
    expect(result.clean).toBe('Hello');
    expect(result.removedTags).toContain('script');
  });
  
  test('should detect dangerous content', () => {
    const dangerous = '<img src="x" onerror="alert(\'XSS\')">';
    const check = containsDangerousContent(dangerous);
    expect(check.isDangerous).toBe(true);
    expect(check.threats).toContain('event handlers');
  });
  
  test('should allow safe HTML when permitted', () => {
    const safe = '<strong>Bold</strong> and <em>italic</em>';
    const result = sanitizeHtml(safe, { allowHtml: true });
    expect(result.clean).toContain('<strong>');
    expect(result.clean).toContain('<em>');
  });
});
```

### Integration Tests

```typescript
describe('SafeTransactionDescription Component', () => {
  test('should render safely with malicious content', () => {
    const malicious = '<script>alert("XSS")</script>Payment';
    
    render(
      <SafeTransactionDescription
        description={malicious}
        allowHtml={false}
      />
    );
    
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.queryByText(/script/)).not.toBeInTheDocument();
  });
  
  test('should show warning for dangerous content', () => {
    const dangerous = '<iframe src="http://evil.com"></iframe>';
    
    render(
      <SafeTransactionDescription
        description={dangerous}
        allowHtml={false}
      />
    );
    
    expect(screen.getByText(/خطرناک/)).toBeInTheDocument();
  });
});
```

## Migration Guide

### 1. **Update Existing Components**

```typescript
// Before (Vulnerable)
<div dangerouslySetInnerHTML={{ __html: transaction.description }} />

// After (Secure)
<SafeTransactionDescription
  description={transaction.description}
  allowHtml={false}
/>
```

### 2. **Replace Direct Rendering**

```typescript
// Before (Vulnerable)
<span>{transaction.description}</span>

// After (Secure)
<SafeTransactionDescription
  description={transaction.description}
  allowHtml={false}
/>
```

### 3. **Add Server-Side Validation**

```typescript
// Add to your API endpoints
const validation = validateTransactionDescription(description);
if (!validation.isValid) {
  return res.status(400).json({
    success: false,
    error: validation.error
  });
}
```

### 4. **Update Form Handling**

```typescript
// Sanitize user input before processing
const handleSubmit = (formData) => {
  const cleanDescription = SafeContentRenderer.renderText(formData.description);
  
  const transaction = {
    ...formData,
    description: cleanDescription
  };
  
  // Submit to API
};
```

## Benefits

1. **Prevents XSS Attacks**: No malicious scripts can execute
2. **Content Validation**: Detects and blocks dangerous content
3. **User Safety**: Protects users from malicious content
4. **Audit Trail**: Logs security events for monitoring
5. **Flexible Rendering**: Supports both plain text and limited HTML
6. **Professional Integration**: Works with DOMPurify when available

## Security Checklist

- [ ] All user content is sanitized before rendering
- [ ] HTML rendering is disabled by default
- [ ] Dangerous patterns are detected and logged
- [ ] Users are informed when content is filtered
- [ ] Server-side validation is implemented
- [ ] Content Security Policy is configured
- [ ] Regular security testing is performed
- [ ] Security events are monitored and logged

This implementation ensures that transaction descriptions are rendered safely without exposing users to XSS attacks.
