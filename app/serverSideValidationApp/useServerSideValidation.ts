'use client';

import { useState } from 'react';
import { FormData, ValidationError, ValidationResult } from './types';
import { validateFormData } from './utils';

export const useServerSideValidation = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    age: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<ValidationError>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setErrors({});
    setValidationResult(null);

    try {
      // Client-side basic validation
      const clientErrors = validateFormData(formData);
      if (Object.keys(clientErrors).length > 0) {
        setErrors(clientErrors);
        setSubmitting(false);
        return;
      }

      // Send to server for validation
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Server returned validation errors
        setErrors(result.errors || {});
      } else {
        // Server validation passed
        setValidationResult(result);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    validationResult,
    handleChange,
    handleSubmit,
    submitting,
  };
};