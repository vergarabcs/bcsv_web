'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material';

import { Player } from '../types';

interface PlayerRatingDialogProps {
  open: boolean;
  player: Player | null;
  onClose: () => void;
  onSave: (rating: number) => void;
}

const PlayerRatingDialog: React.FC<PlayerRatingDialogProps> = ({
  open,
  player,
  onClose,
  onSave,
}) => {
  const [ratingDraft, setRatingDraft] = useState('');

  useEffect(() => {
    if (open && player) {
      setRatingDraft(String(Math.round(player.rating)));
      return;
    }

    setRatingDraft('');
  }, [open, player]);

  const parsedRatingDraft = Number(ratingDraft);
  const ratingDraftError = useMemo(
    () =>
      ratingDraft.trim().length > 0 &&
      (!Number.isInteger(parsedRatingDraft) || parsedRatingDraft < 1000 || parsedRatingDraft > 3000),
    [parsedRatingDraft, ratingDraft]
  );

  const handleSave = () => {
    if (!player || ratingDraft.trim().length === 0 || ratingDraftError) {
      return;
    }

    onSave(parsedRatingDraft);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Update Rating</DialogTitle>
      <DialogContent>
        {player && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
              {player.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current rating: {player.rating} | Status: {player.status}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="Rating"
              type="number"
              value={ratingDraft}
              onChange={event => setRatingDraft(event.target.value)}
              error={ratingDraft.trim().length > 0 && ratingDraftError}
              helperText={
                ratingDraft.trim().length > 0 && ratingDraftError
                  ? 'Enter a whole number from 1000 to 3000.'
                  : 'Manual rating overrides should stay within the supported rating range.'
              }
              inputProps={{
                min: 1000,
                max: 3000,
                step: 1,
                inputMode: 'numeric'
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSave();
                }
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={ratingDraft.trim().length === 0 || ratingDraftError}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayerRatingDialog;