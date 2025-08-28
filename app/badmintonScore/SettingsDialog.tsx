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
  Alert,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Grid,
} from '@mui/material';
import { useBadmintonStore } from './useBadmintonStore';
import { GAMEPAD_ACTIONS, TGamePadAction } from './types';
import { useGamepad, InputDevice } from './useGamepad';
import { useState, useEffect } from 'react';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import KeyboardIcon from '@mui/icons-material/Keyboard';

import { MapButton } from './MapButton';

import { InstallPwaButton } from './InstallPwaButton';

export const SettingsDialog = () => {
  const [showClearAlert, setShowClearAlert] = useState(false);
  const [inputDevice, setInputDevice] = useState<InputDevice>('gamepad');
  
  const {
    settingsOpen,
    tempSettings,
    handleSettingsChange,
    handleCloseSettings,
    handleSaveSettings,
    resetGame,
    player1Score,
    player2Score,
    swapServingTeam,
    resetStore
  } = useBadmintonStore();

  // Keep useGamepad in the parent component
  const { isListening, listeningDevice, startListening } = useGamepad();

  // Handle input mapping for a specific action
  const handleInputMapping = (action: TGamePadAction) => {
    startListening(action, inputDevice);
  };

  // Handle clearing local storage cache
  const handleClearCache = () => {
    // Clear the specific storage key for badminton score
    localStorage.clear()
    // Reset the store state to defaults
    resetStore();
    // Show confirmation alert
    setShowClearAlert(true);
    // Hide alert after 3 seconds
    setTimeout(() => setShowClearAlert(false), 3000);
  };

  // Check if swapping serving team is allowed (both scores must be 0)
  const canSwapServe = player1Score === 0 && player2Score === 0;

  return (
    <Dialog 
      open={settingsOpen} 
      onClose={handleCloseSettings}
      fullWidth
      maxWidth="sm"
    >
      <DialogContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Grid container spacing={{ xs: 2}} columns={{ xs: 4, sm: 8}}>
            <Grid size={4}>
              <TextField
                fullWidth
                label="Player 1 Name"
                value={tempSettings.player1Name}
                onChange={(e) => handleSettingsChange('player1Name', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth
                label="Player 2 Name"
                value={tempSettings.player2Name}
                onChange={(e) => handleSettingsChange('player2Name', e.target.value)}
                margin="normal"
              />
            </Grid>
            
            <Grid size={4}>
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
            </Grid>
            
            <Grid size={4}>
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
            </Grid>
          </Grid>


          
          <Grid container direction="row" spacing={{xs: 2}} sx={{justifyContent: 'space-between'}}>
            <Grid>
              <Button 
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    document.documentElement.requestFullscreen();
                  }
                }}
              >
                Fullscreen
              </Button>
            </Grid>
            <Grid>
              <Button 
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={swapServingTeam}
                disabled={!canSwapServe}
              >
                Swap Serve
              </Button>
            </Grid>
            <Grid>
              <Button 
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => {
                  resetGame();
                  handleCloseSettings();
                }}
              >
                Reset Game
              </Button>
            </Grid>
            <Grid>
              <InstallPwaButton />
            </Grid>
          </Grid>
          
          {/* Input Controls Section */}
          <Box sx={{ flexBasis: '100%', mt: 2 }}>
            <Divider />
            <Typography variant="h6" sx={{ my: 2 }}>Input Controls</Typography>
            
            {/* Toggle between gamepad and keyboard */}
            <ToggleButtonGroup
              value={inputDevice}
              exclusive
              onChange={(_, newDevice) => {
                if (newDevice !== null) {
                  setInputDevice(newDevice);
                }
              }}
              aria-label="Input device"
              sx={{ mb: 2, display: 'flex', width: '100%' }}
            >
              <ToggleButton value="gamepad" aria-label="gamepad" sx={{ flex: 1 }}>
                <VideogameAssetIcon sx={{ mr: 1 }} /> Gamepad
              </ToggleButton>
              <ToggleButton value="keyboard" aria-label="keyboard" sx={{ flex: 1 }}>
                <KeyboardIcon sx={{ mr: 1 }} /> Keyboard
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {/* Player 1 Score Mapping */}
              <MapButton 
                action={GAMEPAD_ACTIONS.TEAM1_SCORES}
                label="Player 1 Score"
                inputDevice={inputDevice}
                isListening={isListening}
                listeningDevice={listeningDevice}
                onMap={() => handleInputMapping(GAMEPAD_ACTIONS.TEAM1_SCORES)}
              />
              
              {/* Player 2 Score Mapping */}
              <MapButton 
                action={GAMEPAD_ACTIONS.TEAM2_SCORES}
                label="Player 2 Score"
                inputDevice={inputDevice}
                isListening={isListening}
                listeningDevice={listeningDevice}
                onMap={() => handleInputMapping(GAMEPAD_ACTIONS.TEAM2_SCORES)}
              />
              
              {/* Undo Mapping */}
              <MapButton 
                action={GAMEPAD_ACTIONS.UNDO}
                label="Undo Action"
                inputDevice={inputDevice}
                isListening={isListening}
                listeningDevice={listeningDevice}
                onMap={() => handleInputMapping(GAMEPAD_ACTIONS.UNDO)}
              />

              {/* Swap Serve Mapping */}
              <MapButton 
                action={GAMEPAD_ACTIONS.SWAP_SERVE}
                label="Swap Serve"
                inputDevice={inputDevice}
                isListening={isListening}
                listeningDevice={listeningDevice}
                onMap={() => handleInputMapping(GAMEPAD_ACTIONS.SWAP_SERVE)}
              />

              {/* Swap Court Mapping */}
              <MapButton 
                action={GAMEPAD_ACTIONS.SWAP_COURT}
                label="Swap Court"
                inputDevice={inputDevice}
                isListening={isListening}
                listeningDevice={listeningDevice}
                onMap={() => handleInputMapping(GAMEPAD_ACTIONS.SWAP_COURT)}
              />

              {/* Reset Game */}
              <MapButton 
                action={GAMEPAD_ACTIONS.RESET_GAME}
                label="Reset Game"
                inputDevice={inputDevice}
                isListening={isListening}
                listeningDevice={listeningDevice}
                onMap={() => handleInputMapping(GAMEPAD_ACTIONS.RESET_GAME)}
              />
            </Box>
          </Box>

          {/* Clear Cache Section */}
          <Box sx={{ flexBasis: '100%', mt: 2 }}>
            <Divider />
            <Typography variant="h6" sx={{ my: 2 }}>Clear Cache</Typography>
            
            <Button 
              variant="outlined"
              color="error"
              fullWidth
              onClick={handleClearCache}
            >
              Clear Local Storage Cache
            </Button>
            
            <Collapse in={showClearAlert}>
              <Alert 
                severity="success" 
                sx={{ mt: 1 }}
                onClose={() => setShowClearAlert(false)}
              >
                Cache cleared successfully!
              </Alert>
            </Collapse>
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