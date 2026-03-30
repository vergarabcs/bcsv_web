'use client';

import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';

interface GlobalLoaderProps {
  open: boolean;
  label?: string;
}

export default function GlobalLoader({
  open,
  label = 'Loading...',
}: GlobalLoaderProps) {
  return (
    <Backdrop
      open={open}
      sx={(theme) => ({
        color: '#fff',
        zIndex: theme.zIndex.drawer + 100,
        backdropFilter: 'blur(4px)',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
      })}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1" component="p">
          {label}
        </Typography>
      </Box>
    </Backdrop>
  );
}