'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SendIcon from '@mui/icons-material/Send';
import { ampClient } from '../lib/amplifyClient';

interface FormState {
  team1p1: string;
  team1p2: string;
  team2p1: string;
  team2p2: string;
  winner: string;
}

const emptyForm: FormState = {
  team1p1: '',
  team1p2: '',
  team2p1: '',
  team2p2: '',
  winner: '',
};

export const GoogleSheetPoc = () => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const winnerOptions = () => {
    const t1 = [form.team1p1, form.team1p2].filter(Boolean);
    const t2 = [form.team2p1, form.team2p2].filter(Boolean);
    const options: { label: string; value: string }[] = [];
    if (t1.length === 2) options.push({ label: `Team 1: ${t1.join(' & ')}`, value: t1.join(',') });
    if (t2.length === 2) options.push({ label: `Team 2: ${t2.join(' & ')}`, value: t2.join(',') });
    return options;
  };

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data, errors } = await ampClient.mutations.logSheetEntry({
        ...form,
        date: new Date().toISOString(),
      });

      if (errors?.length || !data) {
        setResult({ success: false, message: errors?.[0]?.message ?? 'Unknown error' });
      } else {
        setResult({ success: true, message: `Row inserted into ${data.updatedRange}` });
        setForm(emptyForm);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error — could not reach the server';
      setResult({ success: false, message });
    } finally {
      setLoading(false);
    }
  };

  const options = winnerOptions();

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Log a Badminton Match
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Fill in the players and winner. The entry will be appended to <strong>RawLogs</strong> in Google Sheets.
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">Team 1</Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Player 1"
                  value={form.team1p1}
                  onChange={handleChange('team1p1')}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Player 2"
                  value={form.team1p2}
                  onChange={handleChange('team1p2')}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Team 2</Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Player 1"
                  value={form.team2p1}
                  onChange={handleChange('team2p1')}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Player 2"
                  value={form.team2p2}
                  onChange={handleChange('team2p2')}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
            </Grid>

            <Divider />

            <TextField
              label="Winner"
              select
              value={form.winner}
              onChange={handleChange('winner')}
              fullWidth
              required
              size="small"
              disabled={options.length === 0}
              helperText={options.length === 0 ? 'Enter all 4 players first' : ''}
            >
              {options.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            {result && (
              <Alert severity={result.success ? 'success' : 'error'}>
                {result.message}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              disabled={loading}
            >
              {loading ? 'Submitting…' : 'Submit to Google Sheets'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};
