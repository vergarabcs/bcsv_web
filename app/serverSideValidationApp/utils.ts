import { FormData, ValidationError } from './types';

// Client-side validation
export const validateFormData = (data: FormData): ValidationError => {
  const errors: ValidationError = {};
  
  // Name validation
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  // Email validation
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }
  
  // Age validation
  if (!data.age) {
    errors.age = 'Age is required';
  } else {
    const ageNum = parseInt(data.age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      errors.age = 'Age must be a positive number';
    } else if (ageNum < 18) {
      errors.age = 'You must be 18 or older';
    } else if (ageNum > 120) {
      errors.age = 'Please enter a valid age';
    }
  }
  
  // Message validation (optional field)
  if (data.message && data.message.length > 500) {
    errors.message = 'Message cannot exceed 500 characters';
  }
  
  return errors;
};

// Helper function to simulate server-side processing delay
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));