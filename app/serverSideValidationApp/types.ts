export interface FormData {
  name: string;
  email: string;
  age: string; // Using string for form input, will convert to number for validation
  message: string;
}

export interface ValidationError {
  [field: string]: string;
}

export interface ValidationResult {
  success: boolean;
  data?: FormData;
  timestamp: string;
}

export interface ValidationFormProps {
  formData: FormData;
  errors: ValidationError;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (name: string, value: string) => void;
  submitting: boolean;
}

export interface ValidationResultsProps {
  result: ValidationResult;
}