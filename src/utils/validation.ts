export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && cleaned.length >= 10;
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validateNumber = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const validatePositiveNumber = (value: number): boolean => {
  return validateNumber(value) && value > 0;
};

export const validateInteger = (value: any): boolean => {
  return Number.isInteger(Number(value));
};

export const validateDate = (date: string): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const validateFutureDate = (date: string): boolean => {
  if (!validateDate(date)) return false;
  return new Date(date) > new Date();
};

export const validatePastDate = (date: string): boolean => {
  if (!validateDate(date)) return false;
  return new Date(date) < new Date();
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateForm = (
  values: Record<string, any>,
  rules: Record<string, Array<(value: any) => string | null>>
): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = values[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const required = (message = 'This field is required') => {
  return (value: any): string | null => {
    return validateRequired(value) ? null : message;
  };
};

export const email = (message = 'Invalid email address') => {
  return (value: string): string | null => {
    return validateEmail(value) ? null : message;
  };
};

export const phone = (message = 'Invalid phone number') => {
  return (value: string): string | null => {
    return validatePhone(value) ? null : message;
  };
};

export const minLength = (min: number, message?: string) => {
  return (value: string): string | null => {
    return validateMinLength(value, min)
      ? null
      : message || `Must be at least ${min} characters`;
  };
};

export const maxLength = (max: number, message?: string) => {
  return (value: string): string | null => {
    return validateMaxLength(value, max)
      ? null
      : message || `Must be no more than ${max} characters`;
  };
};

export const number = (message = 'Must be a valid number') => {
  return (value: any): string | null => {
    return validateNumber(value) ? null : message;
  };
};

export const positiveNumber = (message = 'Must be a positive number') => {
  return (value: number): string | null => {
    return validatePositiveNumber(value) ? null : message;
  };
};
