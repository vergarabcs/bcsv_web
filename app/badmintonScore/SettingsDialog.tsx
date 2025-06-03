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
  Box,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import { useBadmintonStore } from './useBadmintonStore';
import { useGamepad } from '@/app/lib/hooks/useGamepad';
import { TGamePadAction } from './types';

export const SettingsDialog = () => {
  const {
    settingsOpen,
    tempSettings,
    handleSettingsChange,
    handleCloseSettings,
    handleSaveSettings,
    buttonMappings
  } = useBadmintonStore();

  const {
    isListening,
    startListening
  } = useGamepad();

  const handleGamepadMapping = (action: TGamePadAction) => {
    startListening(action);
  };

  // Helper function to find a button number mapped to a specific action
  const getMappedButton = (action: TGamePadAction): number | null => {
    for (const [buttonIndex, mappedAction] of Object.entries(buttonMappings)) {
      if (mappedAction === action) {
        return parseInt(buttonIndex);
      }
    }
    return null;
  };

  // Get mapped buttons for each action
  const team1Button = getMappedButton("team1Scores");
  const team2Button = getMappedButton("team2Scores");
  const undoButton = getMappedButton("undo");

  return (
    <Dialog 
      open={settingsOpen} 
      onClose={handleCloseSettings}
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
              value={tempSettings.player1Name}
              onChange={(e) => handleSettingsChange('player1Name', e.target.value)}
              margin="normal"
            />
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <TextField
              fullWidth
              label="Player 2 Name"
              value={tempSettings.player2Name}
              onChange={(e) => handleSettingsChange('player2Name', e.target.value)}
              margin="normal"
            />
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Max Score</InputLabel>
              <Select
                value={tempSettings.maxScore}
                onChange={(e) => handleSettingsChange('maxScore', Number(e.target.value))}
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
                value={tempSettings.pointsToWin}
                onChange={(e) => handleSettingsChange('pointsToWin', Number(e.target.value))}
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
                value={tempSettings.bestOf}
                onChange={(e) => handleSettingsChange('bestOf', Number(e.target.value))}
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
                  checked={tempSettings.doubleMatch}
                  onChange={(e) => handleSettingsChange('doubleMatch', e.target.checked)}
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
                  checked={tempSettings.showCourtLayout}
                  onChange={(e) => handleSettingsChange('showCourtLayout', e.target.checked)}
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
                  checked={tempSettings.swapSides}
                  onChange={(e) => handleSettingsChange('swapSides', e.target.checked)}
                />
              }
              label="Swap sides after games"
              sx={{ mt: 2 }}
            />
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <Button 
              variant="outlined"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen();
                }
              }}
            >
              Toggle Fullscreen
            </Button>
          </Box>
          
          {/* Gamepad Controls Section */}
          <Box sx={{ flexBasis: '100%', mt: 2 }}>
            <Divider />
            <Typography variant="h6" sx={{ my: 2 }}>Gamepad Controls</Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && "secondary" || "primary"}
                  onClick={() => handleGamepadMapping("team1Scores")}
                  fullWidth
                >
                  {isListening ? "Press a button..." : "Map Player 1 Score"}
                </Button>
                {team1Button !== null && (
                  <Chip 
                    label={`Button ${team1Button}`} 
                    color="primary" 
                    size="small"
                  />
                )}
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && "secondary" || "primary"}
                  onClick={() => handleGamepadMapping("team2Scores")}
                  fullWidth
                >
                  {isListening ? "Press a button..." : "Map Player 2 Score"}
                </Button>
                {team2Button !== null && (
                  <Chip 
                    label={`Button ${team2Button}`} 
                    color="primary" 
                    size="small"
                  />
                )}
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && "secondary" || "primary"}
                  onClick={() => handleGamepadMapping("undo")}
                  fullWidth
                >
                  {isListening ? "Press a button..." : "Map Undo Action"}
                </Button>
                {undoButton !== null && (
                  <Chip 
                    label={`Button ${undoButton}`} 
                    color="primary" 
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseSettings} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSaveSettings} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};