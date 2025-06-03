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
  Divider
} from '@mui/material';
import { useBadmintonStore } from './useBadmintonStore';
import { useGamepad } from '@/app/lib/hooks/useGamepad';
import { TGamePadAction } from './types';

export const SettingsDialog = () => {
  const {
    settingsOpen,
    tempSettings,
    undo,
    handleScore,
    handleSettingsChange,
    handleCloseSettings,
    handleSaveSettings
  } = useBadmintonStore();

  const {
    isListening,
    startListening,
  } = useGamepad();

  const handleGamepadMapping = (action: TGamePadAction) => {
    startListening(action, () => {
      switch(action) {
        case "undo":
          undo();
          break;
        case "team1Scores":
          handleScore("Team 1");
          break;
        case "team2Scores":
          handleScore("Team 2");
          break;
      }
    });
  };

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
          
          {/* Gamepad Controls Section */}
          <Box sx={{ flexBasis: '100%', mt: 2 }}>
            <Divider />
            <Typography variant="h6" sx={{ my: 2 }}>Gamepad Controls</Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button 
                variant="outlined"
                color={isListening && "secondary" || "primary"}
                onClick={() => handleGamepadMapping("team1Scores")}
                sx={{ flexBasis: { xs: '100%', sm: '30%' } }}
              >
                {isListening ? "Press a button..." : "Map Player 1 Score"}
              </Button>
              
              <Button 
                variant="outlined"
                color={isListening && "secondary" || "primary"}
                onClick={() => handleGamepadMapping("team2Scores")}
                sx={{ flexBasis: { xs: '100%', sm: '30%' } }}
              >
                {isListening ? "Press a button..." : "Map Player 2 Score"}
              </Button>
              
              <Button 
                variant="outlined"
                color={isListening && "secondary" || "primary"}
                onClick={() => handleGamepadMapping("undo")}
                sx={{ flexBasis: { xs: '100%', sm: '30%' } }}
              >
                {isListening ? "Press a button..." : "Map Undo Action"}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseSettings}>Cancel</Button>
        <Button onClick={handleSaveSettings} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};