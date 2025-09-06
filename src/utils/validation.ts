// Frontend validation utilities for production-ready authentication

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (!/[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;'\/~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password', '12345678', 'qwerty123', 'admin123',
    'password123', '123456789', 'welcome123'
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  if (email.length > 254) {
    errors.push('Email address is too long');
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFullName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name || !name.trim()) {
    errors.push('Full name is required');
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (trimmedName.length > 100) {
    errors.push('Full name must be less than 100 characters long');
  }

  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
    errors.push('Full name can only contain letters, spaces, hyphens, and apostrophes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  return input.replace(/[<>"']/g, '').trim();
};

export const getPasswordStrengthScore = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;'\/~`]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;

  if (score <= 2) {
    return { score, label: 'Weak', color: 'text-red-500' };
  } else if (score <= 4) {
    return { score, label: 'Fair', color: 'text-yellow-500' };
  } else if (score <= 5) {
    return { score, label: 'Good', color: 'text-blue-500' };
  } else {
    return { score, label: 'Strong', color: 'text-green-500' };
  }
};
