import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Import the components
import ServerSideValidationApp from './ServerSideValidationApp';

export default function ServerSideValidationPage() {
  return (
    <Suspense 
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ServerSideValidationApp />
    </Suspense>
  );
}