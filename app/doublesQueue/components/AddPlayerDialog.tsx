import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

interface AddPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  players: { name: string }[];
  addPlayer: (name: string, rating?: number) => void;
}

const AddPlayerDialog: React.FC<AddPlayerDialogProps> = ({ open, onClose, players, addPlayer }) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState('1500');

  const isDuplicate = players.some(p => p.name.toLowerCase() === name.trim().toLowerCase());

  const handleClose = () => { onClose(); setName(''); setRating('1500'); };

  const handleAdd = () => {
    if (name.trim() && !isDuplicate) {
      addPlayer(name.trim(), parseInt(rating) || 1500);
      setName('');
      setRating('1500');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Player</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Player Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={isDuplicate}
          helperText={isDuplicate ? 'A player with this name already exists' : ''}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Initial Rating"
          type="number"
          fullWidth
          variant="outlined"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          helperText="Default: 1500 (Range: 1000-3000)"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" disabled={!name.trim() || isDuplicate}>
          Add Player
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPlayerDialog;
