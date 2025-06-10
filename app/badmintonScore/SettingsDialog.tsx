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
  Button,
  Box,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import { useBadmintonStore } from './useBadmintonStore';
import { GAMEPAD_ACTIONS, TGamePadAction } from './types';
import { useGamepad } from './useGamepad';

export const SettingsDialog = () => {
  const {
    settingsOpen,
    tempSettings,
    handleSettingsChange,
    handleCloseSettings,
    handleSaveSettings,
    buttonMappings,
    resetGame,
    player1Score,
    player2Score,
    swapServingTeam
  } = useBadmintonStore();

  // Check if swapping serving team is allowed (both scores must be 0)
  const canSwapServe = player1Score === 0 && player2Score === 0;

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
  const swapServeButton = getMappedButton("swapServe");
  const swapCourtButton = getMappedButton("swapCourt");

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
                <MenuItem value={35}>35 points</MenuItem>
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
          
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
            <Button 
              variant="outlined"
              color="error"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => {
                resetGame();
                handleCloseSettings();
              }}
            >
              Reset Game
            </Button>
          </Box>
          
          <Box sx={{ flexBasis: { xs: '100%' } }}>
            <Button 
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={swapServingTeam}
              disabled={!canSwapServe}
            >
              Swap Serving Team
            </Button>
            {!canSwapServe && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                Serving team can only be swapped when both scores are 0
              </Typography>
            )}
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
                  onClick={() => handleGamepadMapping(GAMEPAD_ACTIONS.TEAM1_SCORES)}
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
                  onClick={() => handleGamepadMapping(GAMEPAD_ACTIONS.TEAM2_SCORES)}
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
                  onClick={() => handleGamepadMapping(GAMEPAD_ACTIONS.UNDO)}
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

              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && "secondary" || "primary"}
                  onClick={() => handleGamepadMapping(GAMEPAD_ACTIONS.SWAP_SERVE)}
                  fullWidth
                >
                  {isListening ? "Press a button..." : "Map Swap Serve"}
                </Button>
                {swapServeButton !== null && (
                  <Chip 
                    label={`Button ${swapServeButton}`} 
                    color="primary" 
                    size="small"
                  />
                )}
              </Box>

              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && "secondary" || "primary"}
                  onClick={() => handleGamepadMapping(GAMEPAD_ACTIONS.SWAP_COURT)}
                  fullWidth
                >
                  {isListening ? "Press a button..." : "Map Swap Court"}
                </Button>
                {swapServeButton !== null && (
                  <Chip 
                    label={`Button ${swapCourtButton}`} 
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