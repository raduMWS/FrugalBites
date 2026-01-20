// Input validation utilities

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Phone number validation (basic international format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone.trim());
};

// Password strength validation
export interface PasswordStrength {
  score: number; // 0-4
  label: 'weak' | 'fair' | 'good' | 'strong';
  suggestions: string[];
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    suggestions.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one special character');
  }

  // Deduct for common patterns
  if (/^[a-zA-Z]+$/.test(password) || /^\d+$/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid using only letters or only numbers');
  }

  const labels: PasswordStrength['label'][] = ['weak', 'weak', 'fair', 'good', 'strong'];
  
  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    suggestions: score < 3 ? suggestions : [],
  };
};

// Name validation
export const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && /^[\p{L}\s'-]+$/u.test(trimmed);
};

// Price validation
export const isValidPrice = (price: string): boolean => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && num <= 10000;
};

// Quantity validation
export const isValidQuantity = (quantity: string): boolean => {
  const num = parseInt(quantity);
  return !isNaN(num) && num >= 1 && num <= 1000;
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Credit card validation (Luhn algorithm)
export const isValidCreditCard = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// CVV validation
export const isValidCVV = (cvv: string, isAmex: boolean = false): boolean => {
  const digits = cvv.replace(/\D/g, '');
  return isAmex ? digits.length === 4 : digits.length === 3;
};

// Expiry date validation
export const isValidExpiryDate = (month: string, year: string): boolean => {
  const m = parseInt(month);
  const y = parseInt(year);

  if (isNaN(m) || isNaN(y)) return false;
  if (m < 1 || m > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (y < currentYear) return false;
  if (y === currentYear && m < currentMonth) return false;
  if (y > currentYear + 20) return false;

  return true;
};

// Sanitize input (remove dangerous characters)
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Form validation hook types
export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface FieldValidation<T> {
  value: T;
  rules: ValidationRule<T>[];
}

// Validate a single field
export const validateField = <T>(
  value: T,
  rules: ValidationRule<T>[]
): string | null => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
};

// Validate entire form
export const validateForm = <T extends Record<string, any>>(
  values: T,
  validations: Partial<Record<keyof T, ValidationRule<any>[]>>
): Partial<Record<keyof T, string>> => {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const [field, rules] of Object.entries(validations)) {
    if (rules && Array.isArray(rules)) {
      const error = validateField(values[field as keyof T], rules);
      if (error) {
        errors[field as keyof T] = error;
      }
    }
  }

  return errors;
};

// Common validation rules
export const commonRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value: T) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.trim().length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.trim().length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  email: (message = 'Please enter a valid email'): ValidationRule<string> => ({
    validate: isValidEmail,
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule<string> => ({
    validate: isValidPhone,
    message,
  }),

  password: (message = 'Password is too weak'): ValidationRule<string> => ({
    validate: (value: string) => checkPasswordStrength(value).score >= 2,
    message,
  }),

  match: <T>(otherValue: T, message = 'Values do not match'): ValidationRule<T> => ({
    validate: (value: T) => value === otherValue,
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  number: (message = 'Please enter a valid number'): ValidationRule<string> => ({
    validate: (value: string) => !isNaN(parseFloat(value)),
    message,
  }),

  min: (min: number, message?: string): ValidationRule<string | number> => ({
    validate: (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      return !isNaN(num) && num >= min;
    },
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<string | number> => ({
    validate: (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      return !isNaN(num) && num <= max;
    },
    message: message || `Must be at most ${max}`,
  }),
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

// Format credit card number for display
export const formatCreditCardNumber = (cardNumber: string): string => {
  const digits = cardNumber.replace(/\D/g, '');
  const chunks = digits.match(/.{1,4}/g) || [];
  return chunks.join(' ');
};
