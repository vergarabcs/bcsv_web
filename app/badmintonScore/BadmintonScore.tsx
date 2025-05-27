import { 
  Button, 
  Typography, 
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
  Box
} from '@mui/material';
import { useState, useEffect } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import styles from './BadmintonScore.module.css';
import { CourtLayout } from './CourtLayout';
import { TEAM_NAME } from './constants';
import { useBadmintonScore } from './useBadmintonScore';

const TEXT_SHADOW = `0px 0px 10px white`
                
export default function BadmintonScore() {
  // Keep isLandscape state in the component
  const [isLandscape, setIsLandscape] = useState(true);

  // Get everything else from the custom hook
  const {
    player1Score,
    player2Score,
    player1Name,
    player2Name,
    gameOver,
    winner,
    positions,
    settingsOpen,
    settings,
    tempSettings,
    handleScore,
    resetGame,
    handleOpenSettings,
    handleCloseSettings,
    handleSaveSettings,
    handleSettingsChange
  } = useBadmintonScore();

  // Check orientation on load and on resize
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    // Check on mount
    checkOrientation();
    
    // Add listener for resize
    window.addEventListener('resize', checkOrientation);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  return (
    <>
      {!isLandscape && (
        <div className={styles.rotateMessage}>
          <Typography variant="h5">
            Please rotate your device to landscape mode for the best experience
          </Typography>
        </div>
      )}
      
      <div className={styles.forceLandscape}>
        <div className={styles.landscapeContainer}>
          {/* Settings button */}
          <div className={styles.settingsButton}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SettingsIcon />}
              onClick={handleOpenSettings}
            >
              Settings
            </Button>
          </div>

          {/* Court layout as background */}
          {settings.doubleMatch && (
            <CourtLayout
              positions={positions}
            />
          )}

          {/* Score display overlaid on court layout */}
          <div className={styles.scoreDisplay} style={{ position: 'relative', zIndex: 1 }}>
            {/* Player 1 side */}
            <div 
              onClick={() => handleScore(TEAM_NAME.TEAM1)}
              className={styles.playerArea1}
              style={{ 
                cursor: gameOver ? 'default' : 'pointer',
                backgroundColor: 'transparent' 
              }}
            >
              <Typography 
                variant="h4" 
                className={styles.playerName} 
                sx={{ 
                  color: 'black', 
                  textShadow: TEXT_SHADOW,
                  fontWeight: 'bold'
                }}
              >
                {player1Name}
              </Typography>
              <Typography 
                variant="h1" 
                className={styles.scoreNumber}
                sx={{ 
                  color: 'black',
                  fontSize: "17rem",
                  WebkitTextStroke: "4px white", 
                  textShadow: TEXT_SHADOW,
                  fontWeight: 'bold'
                }}
              >
                {player1Score}
              </Typography>
            </div>

            {/* Player 2 side */}
            <div 
              onClick={() => handleScore(TEAM_NAME.TEAM2)}
              className={styles.playerArea2}
              style={{ 
                cursor: gameOver ? 'default' : 'pointer',
                backgroundColor: 'transparent' 
              }}
            >
              <Typography 
                variant="h4" 
                className={styles.playerName} 
                sx={{ 
                  color: 'black', 
                  textShadow: TEXT_SHADOW,
                  fontWeight: 'bold'
                }}
              >
                {player2Name}
              </Typography>
              <Typography 
                variant="h1" 
                className={styles.scoreNumber}
                sx={{ 
                  color: 'black',
                  WebkitTextStroke: "4px white", 
                  textShadow: TEXT_SHADOW,
                  fontSize: "17rem",
                  fontWeight: 'bold'
                }}
              >
                {player2Score}
              </Typography>
            </div>
          </div>

          {/* Game over overlay */}
          {gameOver && (
            <div className={styles.gameOverlay}>
              <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
                Game Over
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', mb: 4 }}>
                {winner} wins!
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                onClick={resetGame}
              >
                New Game
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
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
                  onChange={(e) => handleSettingsChange('maxScore', e.target.value)}
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
                  onChange={(e) => handleSettingsChange('pointsToWin', e.target.value)}
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
                  onChange={(e) => handleSettingsChange('bestOf', e.target.value)}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}