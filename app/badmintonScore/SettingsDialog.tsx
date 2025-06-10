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
  Chip,
  Alert,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab
} from '@mui/material';
import { useBadmintonStore } from './useBadmintonStore';
import { GAMEPAD_ACTIONS, TGamePadAction } from './types';
import { useGamepad, InputDevice } from './useGamepad';
import { useState } from 'react';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import KeyboardIcon from '@mui/icons-material/Keyboard';

export const SettingsDialog = () => {
  const [showClearAlert, setShowClearAlert] = useState(false);
  const [inputDevice, setInputDevice] = useState<InputDevice>('gamepad');
  
  const {
    settingsOpen,
    tempSettings,
    handleSettingsChange,
    handleCloseSettings,
    handleSaveSettings,
    buttonMappings,
    keyMappings,
    resetGame,
    player1Score,
    player2Score,
    swapServingTeam,
    resetStore
  } = useBadmintonStore();

  // Handle clearing local storage cache
  const handleClearCache = () => {
    // Clear the specific storage key for badminton score
    localStorage.removeItem('badminton-score-storage');
    // Reset the store state to defaults
    resetStore();
    // Show confirmation alert
    setShowClearAlert(true);
    // Hide alert after 3 seconds
    setTimeout(() => setShowClearAlert(false), 3000);
  };

  // Check if swapping serving team is allowed (both scores must be 0)
  const canSwapServe = player1Score === 0 && player2Score === 0;

  const {
    isListening,
    startListening,
    listeningDevice
  } = useGamepad();

  const handleInputMapping = (action: TGamePadAction) => {
    startListening(action, inputDevice);
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

  // Helper function to find a key mapped to a specific action
  const getMappedKey = (action: TGamePadAction): string | null => {
    for (const [key, mappedAction] of Object.entries(keyMappings)) {
      if (mappedAction === action) {
        return key;
      }
    }
    return null;
  };

  // Format key code for display (convert "KeyA" to "A")
  const formatKeyCode = (keyCode: string | null): string => {
    if (!keyCode) return "None";
    
    // Handle special keys
    if (keyCode === "Space") return "Spacebar";
    if (keyCode === "ArrowLeft") return "←";
    if (keyCode === "ArrowRight") return "→";
    if (keyCode === "ArrowUp") return "↑";
    if (keyCode === "ArrowDown") return "↓";
    if (keyCode.startsWith("Key")) return keyCode.substring(3);
    if (keyCode.startsWith("Digit")) return keyCode.substring(5);
    
    return keyCode;
  };

  // Get mapped inputs for each action
  const team1Button = getMappedButton(GAMEPAD_ACTIONS.TEAM1_SCORES);
  const team2Button = getMappedButton(GAMEPAD_ACTIONS.TEAM2_SCORES);
  const undoButton = getMappedButton(GAMEPAD_ACTIONS.UNDO);
  const swapServeButton = getMappedButton(GAMEPAD_ACTIONS.SWAP_SERVE);
  const swapCourtButton = getMappedButton(GAMEPAD_ACTIONS.SWAP_COURT);
  
  const team1Key = getMappedKey(GAMEPAD_ACTIONS.TEAM1_SCORES);
  const team2Key = getMappedKey(GAMEPAD_ACTIONS.TEAM2_SCORES);
  const undoKey = getMappedKey(GAMEPAD_ACTIONS.UNDO);
  const swapServeKey = getMappedKey(GAMEPAD_ACTIONS.SWAP_SERVE);
  const swapCourtKey = getMappedKey(GAMEPAD_ACTIONS.SWAP_COURT);

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
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && listeningDevice === inputDevice && "secondary" || "primary"}
                  onClick={() => handleInputMapping(GAMEPAD_ACTIONS.TEAM1_SCORES)}
                  fullWidth
                >
                  {isListening && listeningDevice === inputDevice ? 
                    inputDevice === 'gamepad' ? "Press a button..." : "Press a key..." : 
                    `Map Player 1 Score`}
                </Button>
                {inputDevice === 'gamepad' && team1Button !== null ? (
                  <Chip 
                    label={`Button ${team1Button}`} 
                    color="primary" 
                    size="small"
                  />
                ) : inputDevice === 'keyboard' && team1Key ? (
                  <Chip 
                    label={formatKeyCode(team1Key)} 
                    color="primary" 
                    size="small"
                  />
                ) : null}
              </Box>
              
              {/* Player 2 Score Mapping */}
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && listeningDevice === inputDevice && "secondary" || "primary"}
                  onClick={() => handleInputMapping(GAMEPAD_ACTIONS.TEAM2_SCORES)}
                  fullWidth
                >
                  {isListening && listeningDevice === inputDevice ? 
                    inputDevice === 'gamepad' ? "Press a button..." : "Press a key..." : 
                    `Map Player 2 Score`}
                </Button>
                {inputDevice === 'gamepad' && team2Button !== null ? (
                  <Chip 
                    label={`Button ${team2Button}`} 
                    color="primary" 
                    size="small"
                  />
                ) : inputDevice === 'keyboard' && team2Key ? (
                  <Chip 
                    label={formatKeyCode(team2Key)} 
                    color="primary" 
                    size="small"
                  />
                ) : null}
              </Box>
              
              {/* Undo Mapping */}
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && listeningDevice === inputDevice && "secondary" || "primary"}
                  onClick={() => handleInputMapping(GAMEPAD_ACTIONS.UNDO)}
                  fullWidth
                >
                  {isListening && listeningDevice === inputDevice ? 
                    inputDevice === 'gamepad' ? "Press a button..." : "Press a key..." : 
                    `Map Undo Action`}
                </Button>
                {inputDevice === 'gamepad' && undoButton !== null ? (
                  <Chip 
                    label={`Button ${undoButton}`} 
                    color="primary" 
                    size="small"
                  />
                ) : inputDevice === 'keyboard' && undoKey ? (
                  <Chip 
                    label={formatKeyCode(undoKey)} 
                    color="primary" 
                    size="small"
                  />
                ) : null}
              </Box>

              {/* Swap Serve Mapping */}
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && listeningDevice === inputDevice && "secondary" || "primary"}
                  onClick={() => handleInputMapping(GAMEPAD_ACTIONS.SWAP_SERVE)}
                  fullWidth
                >
                  {isListening && listeningDevice === inputDevice ? 
                    inputDevice === 'gamepad' ? "Press a button..." : "Press a key..." : 
                    `Map Swap Serve`}
                </Button>
                {inputDevice === 'gamepad' && swapServeButton !== null ? (
                  <Chip 
                    label={`Button ${swapServeButton}`} 
                    color="primary" 
                    size="small"
                  />
                ) : inputDevice === 'keyboard' && swapServeKey ? (
                  <Chip 
                    label={formatKeyCode(swapServeKey)} 
                    color="primary" 
                    size="small"
                  />
                ) : null}
              </Box>

              {/* Swap Court Mapping */}
              <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="outlined"
                  color={isListening && listeningDevice === inputDevice && "secondary" || "primary"}
                  onClick={() => handleInputMapping(GAMEPAD_ACTIONS.SWAP_COURT)}
                  fullWidth
                >
                  {isListening && listeningDevice === inputDevice ? 
                    inputDevice === 'gamepad' ? "Press a button..." : "Press a key..." : 
                    `Map Swap Court`}
                </Button>
                {inputDevice === 'gamepad' && swapCourtButton !== null ? (
                  <Chip 
                    label={`Button ${swapCourtButton}`} 
                    color="primary" 
                    size="small"
                  />
                ) : inputDevice === 'keyboard' && swapCourtKey ? (
                  <Chip 
                    label={formatKeyCode(swapCourtKey)} 
                    color="primary" 
                    size="small"
                  />
                ) : null}
              </Box>
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