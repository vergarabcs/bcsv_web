import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Box
} from '@mui/material';
import { BadmintonScoreSettings } from './types';

interface SettingsDialogProps {
  open: boolean;
  settings: BadmintonScoreSettings;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof BadmintonScoreSettings, value: any) => void;
}

export const SettingsDialog = ({
  open,
  settings,
  onClose,
  onSave,
  onChange
}: SettingsDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Badminton Score Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <TextField
              fullWidth
              label="Player 1 Name"
              value={settings.player1Name}
              onChange={(e) => onChange('player1Name', e.target.value)}
              margin="normal"
            />
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <TextField
              fullWidth
              label="Player 2 Name"
              value={settings.player2Name}
              onChange={(e) => onChange('player2Name', e.target.value)}
              margin="normal"
            />
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Max Score</InputLabel>
              <Select
                value={settings.maxScore}
                onChange={(e) => onChange('maxScore', e.target.value)}
                label="Max Score"
              >
                <MenuItem value={11}>11 points</MenuItem>
                <MenuItem value={15}>15 points</MenuItem>
                <MenuItem value={21}>21 points</MenuItem>
                <MenuItem value={30}>30 points</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Points to Win</InputLabel>
              <Select
                value={settings.pointsToWin}
                onChange={(e) => onChange('pointsToWin', e.target.value)}
                label="Points to Win"
              >
                <MenuItem value={1}>1 point lead</MenuItem>
                <MenuItem value={2}>2 points lead</MenuItem>
                <MenuItem value={3}>3 points lead</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Best of</InputLabel>
              <Select
                value={settings.bestOf}
                onChange={(e) => onChange('bestOf', e.target.value)}
                label="Best of"
              >
                <MenuItem value={1}>1 game</MenuItem>
                <MenuItem value={3}>3 games</MenuItem>
                <MenuItem value={5}>5 games</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.doubleMatch}
                  onChange={(e) => onChange('doubleMatch', e.target.checked)}
                />
              }
              label="Doubles Match"
              sx={{ mt: 2 }}
            />
          </Box>

          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showCourtLayout}
                  onChange={(e) => onChange('showCourtLayout', e.target.checked)}
                />
              }
              label="Show Court Layout"
              sx={{ mt: 2 }}
            />
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.swapSides}
                  onChange={(e) => onChange('swapSides', e.target.checked)}
                />
              }
              label="Swap sides after games"
              sx={{ mt: 2 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};