import React, { useState, useEffect } from 'react';
import {
  sanitizeHtml,
  stripAllHtml,
  escapeHtml,
  containsDangerousContent,
  formatTransactionDescription,
  SafeContentRenderer,
  createSafeHtml,
  SanitizationOptions,
  SanitizationResult
} from '../lib/sanitizationUtils';

interface SafeTransactionDescriptionProps {
  description?: string;
  allowHtml?: boolean;
  maxLength?: number;
  showFullText?: boolean;
  className?: string;
  onSanitizationComplete?: (result: SanitizationResult) => void;
  sanitizationOptions?: SanitizationOptions;
}

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
  const [isExpanded, setIsExpanded] = useState(showFullText);
  const [sanitizationResult, setSanitizationResult] = useState<SanitizationResult | null>(null);
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
    setSanitizationResult(result);

    // Notify parent component about sanitization
    onSanitizationComplete?.(result);

    // Log dangerous content for security monitoring
    if (dangerCheck.isDangerous) {
      console.warn('Dangerous content detected in transaction description:', {
        threats: dangerCheck.threats,
        description: description.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }, [description, allowHtml, maxLength, isExpanded, sanitizationOptions, onSanitizationComplete]);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const renderContent = () => {
    if (allowHtml) {
      // Render HTML with sanitization
      return (
        <div
          className={`safe-transaction-description ${className}`}
          dangerouslySetInnerHTML={createSafeHtml(description, {
            allowHtml: true,
            maxLength: isExpanded ? undefined : maxLength,
            ...sanitizationOptions
          })}
        />
      );
    } else {
      // Render plain text
      return (
        <div className={`safe-transaction-description ${className}`}>
          {sanitizedContent}
        </div>
      );
    }
  };

  const renderDangerousContentWarning = () => {
    if (!hasDangerousContent) return null;

    return (
      <div className="dangerous-content-warning">
        <span className="warning-icon">⚠️</span>
        <span className="warning-text">
          این محتوا شامل عناصر خطرناک است و برای امنیت شما فیلتر شده است.
        </span>
        <details className="threat-details">
          <summary>جزئیات تهدیدات</summary>
          <ul>
            {threats.map((threat, index) => (
              <li key={index}>{threat}</li>
            ))}
          </ul>
        </details>
      </div>
    );
  };

  const renderExpandButton = () => {
    if (!sanitizationResult || sanitizationResult.originalLength <= maxLength) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={handleToggleExpanded}
        className="expand-button"
        aria-label={isExpanded ? 'نمایش کمتر' : 'نمایش بیشتر'}
      >
        {isExpanded ? 'نمایش کمتر' : 'نمایش بیشتر'}
      </button>
    );
  };

  const renderSanitizationInfo = () => {
    if (!sanitizationResult || !sanitizationResult.isSanitized) {
      return null;
    }

    const hasRemovedContent = 
      sanitizationResult.removedTags.length > 0 || 
      sanitizationResult.removedAttributes.length > 0;

    if (!hasRemovedContent) return null;

    return (
      <div className="sanitization-info">
        <small>
          محتوا برای امنیت فیلتر شده است
          {sanitizationResult.removedTags.length > 0 && (
            <span> - تگ‌های حذف شده: {sanitizationResult.removedTags.join(', ')}</span>
          )}
          {sanitizationResult.removedAttributes.length > 0 && (
            <span> - ویژگی‌های حذف شده: {sanitizationResult.removedAttributes.join(', ')}</span>
          )}
        </small>
      </div>
    );
  };

  return (
    <div className="safe-transaction-description-container">
      {renderDangerousContentWarning()}
      {renderContent()}
      {renderExpandButton()}
      {renderSanitizationInfo()}
    </div>
  );
};

// Alternative component using DOMPurify (if available)
interface DOMPurifyTransactionDescriptionProps {
  description?: string;
  className?: string;
  maxLength?: number;
  showFullText?: boolean;
}

export const DOMPurifyTransactionDescription: React.FC<DOMPurifyTransactionDescriptionProps> = ({
  description = '',
  className = '',
  maxLength = 200,
  showFullText = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showFullText);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');

  useEffect(() => {
    // Try to use DOMPurify if available, fallback to our sanitization
    let clean: string;
    
    try {
      // Check if DOMPurify is available
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
      // Fallback to plain text
      clean = stripAllHtml(description);
    }

    setSanitizedContent(clean);
  }, [description, isExpanded, maxLength]);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const displayContent = isExpanded 
    ? sanitizedContent 
    : truncateText(sanitizedContent, maxLength);

  return (
    <div className={`dompurify-transaction-description ${className}`}>
      <div
        className="description-content"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {sanitizedContent.length > maxLength && (
        <button
          type="button"
          onClick={handleToggleExpanded}
          className="expand-button"
        >
          {isExpanded ? 'نمایش کمتر' : 'نمایش بیشتر'}
        </button>
      )}
    </div>
  );
};

// Utility function for truncating text
function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last complete word within the limit
  const truncated = text.substring(0, maxLength - suffix.length);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + suffix;
  }
  
  return truncated + suffix;
}

// Hook for safe content rendering
export const useSafeContent = (content: string, options: SanitizationOptions = {}) => {
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [isSafe, setIsSafe] = useState(true);
  const [sanitizationResult, setSanitizationResult] = useState<SanitizationResult | null>(null);

  useEffect(() => {
    const result = formatTransactionDescription(content, options);
    setSanitizedContent(result.clean);
    setSanitizationResult(result);
    
    const safetyCheck = SafeContentRenderer.isSafe(content);
    setIsSafe(safetyCheck.safe);
  }, [content, options]);

  return {
    sanitizedContent,
    isSafe,
    sanitizationResult,
    renderText: () => SafeContentRenderer.renderText(content, options.maxLength),
    renderHtml: () => SafeContentRenderer.renderHtml(content, options)
  };
};

// High-order component for wrapping components with safe content rendering
export const withSafeContent = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  contentProp: keyof P,
  options: SanitizationOptions = {}
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const content = props[contentProp] as string;
    const { sanitizedContent, isSafe } = useSafeContent(content, options);

    const safeProps = {
      ...props,
      [contentProp]: sanitizedContent,
      isContentSafe: isSafe
    };

    return <WrappedComponent {...safeProps} ref={ref} />;
  });
};
