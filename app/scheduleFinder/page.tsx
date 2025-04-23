'use client';

import { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import ScheduleFinder from '../apps/ScheduleFinder/ScheduleFinder';

export default function ScheduleFinderPage() {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>Schedule Finder</Typography>
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }>
        <ScheduleFinder />
      </Suspense>
    </Box>
  );
}