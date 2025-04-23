'use client';

import { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import WordFactory from '../components/WordFactory';

export default function WordFactoryPage() {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>Word Factory</Typography>
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }>
        <WordFactory />
      </Suspense>
    </Box>
  );
}