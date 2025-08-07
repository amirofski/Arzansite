// Password validation utility for Arzan Site
// Implements strong password requirements to improve security

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;
  
  // Length check (minimum 8 characters)
  if (password.length < 8) {
    errors.push('رمز عبور باید حداقل 8 کاراکتر باشد');
  } else {
    score += Math.min(password.length * 2, 20); // Up to 20 points for length
  }
  
  // Uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('رمز عبور باید شامل حروف بزرگ باشد');
  } else {
    score += 10;
  }
  
  // Lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('رمز عبور باید شامل حروف کوچک باشد');
  } else {
    score += 10;
  }
  
  // Numbers
  if (!/\d/.test(password)) {
    errors.push('رمز عبور باید شامل اعداد باشد');
  } else {
    score += 10;
  }
  
  // Special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('رمز عبور باید شامل کاراکترهای خاص باشد');
  } else {
    score += 15;
  }
  
  // Bonus points for complexity
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 2, 20); // Up to 20 points for uniqueness
  
  // Check for common patterns (penalty)
  const commonPatterns = [
    /123456/,
    /password/,
    /qwerty/,
    /admin/,
    /user/,
    /test/
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => 
    pattern.test(password.toLowerCase())
  );
  
  if (hasCommonPattern) {
    errors.push('رمز عبور نباید شامل الگوهای رایج باشد');
    score = Math.max(0, score - 20);
  }
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 70) {
    strength = 'strong';
  } else if (score >= 40) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(100, Math.max(0, score))
  };
};

export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

export const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong') => {
  switch (strength) {
    case 'weak':
      return 'ضعیف';
    case 'medium':
      return 'متوسط';
    case 'strong':
      return 'قوی';
    default:
      return 'نامشخص';
  }
}; 