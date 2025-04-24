'use client';

import { 
  Box, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress
} from '@mui/material';
import { ValidationFormProps } from './types';

const ValidationForm = ({ 
  formData, 
  errors, 
  onSubmit, 
  onChange,
  submitting
}: ValidationFormProps) => {
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name, e.target.value);
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
      {errors.form && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.form}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="name"
        label="Full Name"
        name="name"
        autoComplete="name"
        value={formData.name}
        onChange={handleFieldChange}
        error={!!errors.name}
        helperText={errors.name || ''}
        disabled={submitting}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleFieldChange}
        error={!!errors.email}
        helperText={errors.email || ''}
        disabled={submitting}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="age"
        label="Age"
        name="age"
        type="number"
        value={formData.age}
        onChange={handleFieldChange}
        error={!!errors.age}
        helperText={errors.age || ''}
        disabled={submitting}
        inputProps={{ min: 1 }}
      />

      <TextField
        margin="normal"
        fullWidth
        id="message"
        label="Message"
        name="message"
        multiline
        rows={4}
        value={formData.message}
        onChange={handleFieldChange}
        error={!!errors.message}
        helperText={errors.message || ''}
        disabled={submitting}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            Validating...
          </>
        ) : (
          'Submit for Validation'
        )}
      </Button>
    </Box>
  );
};

export default ValidationForm;