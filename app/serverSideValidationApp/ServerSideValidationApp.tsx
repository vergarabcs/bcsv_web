'use client';

import { Box, Typography, Paper } from '@mui/material';
import { useServerSideValidation } from './useServerSideValidation';
import ValidationForm from './ValidationForm';
import ValidationResults from './ValidationResults';

const ServerSideValidationApp = () => {
  const {
    formData,
    errors,
    validationResult,
    handleChange,
    handleSubmit,
    submitting,
  } = useServerSideValidation();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
        Server-Side Validation Demo
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="body1" paragraph>
          This app demonstrates server-side validation using Next.js API routes.
          Try submitting the form with invalid data to see server-side validation in action.
        </Typography>
        
        <ValidationForm 
          formData={formData}
          errors={errors}
          onSubmit={handleSubmit}
          onChange={handleChange}
          submitting={submitting}
        />
      </Paper>

      {validationResult && (
        <ValidationResults result={validationResult} />
      )}
    </Box>
  );
};

export default ServerSideValidationApp;