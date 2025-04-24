'use client';

import { Paper, Typography, Box, Alert, Divider, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ValidationResultsProps } from './types';

const ValidationResults = ({ result }: ValidationResultsProps) => {
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CheckCircleIcon color="success" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Validation Successful
        </Typography>
      </Box>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        Your form data has passed server-side validation!
      </Alert>
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Submission timestamp: {result.timestamp}
      </Typography>
      
      <Divider sx={{ my: 2 }}>
        <Chip label="Validated Data" />
      </Divider>
      
      <Box sx={{ 
        bgcolor: 'background.default', 
        p: 2, 
        borderRadius: 1,
        fontFamily: 'monospace'
      }}>
        <pre>{JSON.stringify(result.data, null, 2)}</pre>
      </Box>
    </Paper>
  );
};

export default ValidationResults;