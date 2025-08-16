// Sanitization Utilities
// Prevents XSS attacks by sanitizing untrusted content before rendering

export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripScripts?: boolean;
  stripStyles?: boolean;
  maxLength?: number;
}

export interface SanitizationResult {
  clean: string;
  isSanitized: boolean;
  originalLength: number;
  sanitizedLength: number;
  removedTags: string[];
  removedAttributes: string[];
}

// Default allowed tags for safe HTML rendering
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'td', 'th'
];

// Default allowed attributes for safe HTML rendering
const DEFAULT_ALLOWED_ATTRIBUTES = [
  'class', 'id', 'style', 'title', 'alt', 'href', 'target'
];

// Dangerous patterns that should always be removed
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /<input\b[^<]*>/gi,
  /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
  /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
  /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
  /<link\b[^<]*>/gi,
  /<meta\b[^<]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi
];

/**
 * Basic HTML sanitization without external dependencies
 */
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
  const removedTags: string[] = [];
  const removedAttributes: string[] = [];
  const originalLength = input.length;

  // Truncate if too long
  if (maxLength && clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }

  // If HTML is not allowed, strip all HTML tags
  if (!allowHtml) {
    clean = stripAllHtml(clean);
    return {
      clean,
      isSanitized: true,
      originalLength,
      sanitizedLength: clean.length,
      removedTags: ['all'],
      removedAttributes: []
    };
  }

  // Remove dangerous patterns
  if (stripScripts) {
    DANGEROUS_PATTERNS.forEach(pattern => {
      const matches = clean.match(pattern);
      if (matches) {
        removedTags.push(...matches);
        clean = clean.replace(pattern, '');
      }
    });
  }

  // Remove disallowed tags
  const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  clean = clean.replace(tagRegex, (match, slash, tagName) => {
    const lowerTagName = tagName.toLowerCase();
    if (!allowedTags.includes(lowerTagName)) {
      removedTags.push(lowerTagName);
      return ''; // Remove the tag
    }
    return match; // Keep the tag
  });

  // Remove disallowed attributes
  const attrRegex = /\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*["'][^"']*["']/g;
  clean = clean.replace(attrRegex, (match, attrName) => {
    const lowerAttrName = attrName.toLowerCase();
    if (!allowedAttributes.includes(lowerAttrName)) {
      removedAttributes.push(lowerAttrName);
      return ''; // Remove the attribute
    }
    return match; // Keep the attribute
  });

  // Remove any remaining dangerous content
  clean = clean.replace(/[<>]/g, (match) => {
    return match === '<' ? '&lt;' : '&gt;';
  });

  return {
    clean,
    isSanitized: true,
    originalLength,
    sanitizedLength: clean.length,
    removedTags,
    removedAttributes
  };
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripAllHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;/g, '<')   // Decode common entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate if content contains potentially dangerous HTML
 */
export function containsDangerousContent(input: string): { isDangerous: boolean; threats: string[] } {
  const threats: string[] = [];

  // Check for script tags
  if (/<script\b/i.test(input)) {
    threats.push('script tags');
  }

  // Check for event handlers
  if (/on\w+\s*=/i.test(input)) {
    threats.push('event handlers');
  }

  // Check for javascript: URLs
  if (/javascript:/i.test(input)) {
    threats.push('javascript URLs');
  }

  // Check for data: URLs
  if (/data:/i.test(input)) {
    threats.push('data URLs');
  }

  // Check for iframe tags
  if (/<iframe\b/i.test(input)) {
    threats.push('iframe tags');
  }

  // Check for form elements
  if (/<(form|input|textarea|select|button)\b/i.test(input)) {
    threats.push('form elements');
  }

  return {
    isDangerous: threats.length > 0,
    threats
  };
}

/**
 * Safe text truncation with ellipsis
 */
export function truncateText(input: string, maxLength: number, suffix: string = '...'): string {
  if (input.length <= maxLength) {
    return input;
  }

  const truncated = input.substring(0, maxLength - suffix.length);
  return truncated + suffix;
}

/**
 * Format transaction description for safe display
 */
export function formatTransactionDescription(
  description: string,
  options: SanitizationOptions = {}
): SanitizationResult {
  const defaultOptions: SanitizationOptions = {
    allowHtml: false, // Default to plain text for security
    maxLength: 200,
    stripScripts: true,
    stripStyles: true,
    ...options
  };

  return sanitizeHtml(description, defaultOptions);
}

/**
 * Create a safe display component for transaction descriptions
 */
export class SafeContentRenderer {
  /**
   * Render plain text safely
   */
  static renderText(content: string, maxLength?: number): string {
    const clean = stripAllHtml(content);
    return maxLength ? truncateText(clean, maxLength) : clean;
  }

  /**
   * Render HTML safely with sanitization
   */
  static renderHtml(content: string, options: SanitizationOptions = {}): string {
    const result = sanitizeHtml(content, {
      allowHtml: true,
      ...options
    });
    return result.clean;
  }

  /**
   * Check if content is safe to render
   */
  static isSafe(content: string): { safe: boolean; reason?: string } {
    const dangerCheck = containsDangerousContent(content);
    
    if (dangerCheck.isDangerous) {
      return {
        safe: false,
        reason: `Content contains dangerous elements: ${dangerCheck.threats.join(', ')}`
      };
    }

    return { safe: true };
  }
}

/**
 * Utility for creating safe CSS classes
 */
export function sanitizeCssClass(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9-_]/g, '') // Remove invalid characters
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .toLowerCase();
}

/**
 * Utility for creating safe IDs
 */
export function sanitizeId(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9-_]/g, '') // Remove invalid characters
    .replace(/^[0-9]/, 'id-$&') // Ensure it doesn't start with a number
    .toLowerCase();
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): { isValid: boolean; clean: string; error?: string } {
  try {
    // Basic URL validation
    const urlObj = new URL(url);
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => urlObj.protocol.toLowerCase().startsWith(protocol))) {
      return {
        isValid: false,
        clean: '',
        error: 'Dangerous protocol detected'
      };
    }

    // Return the original URL if it's safe
    return {
      isValid: true,
      clean: url
    };
  } catch (error) {
    return {
      isValid: false,
      clean: '',
      error: 'Invalid URL format'
    };
  }
}

/**
 * Create a safe object for React dangerouslySetInnerHTML
 */
export function createSafeHtml(html: string, options: SanitizationOptions = {}): { __html: string } {
  const result = sanitizeHtml(html, {
    allowHtml: true,
    ...options
  });
  
  return {
    __html: result.clean
  };
}
