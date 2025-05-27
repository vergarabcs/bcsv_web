import { 
  Button, 
  Typography, 
  Box
} from '@mui/material';
import { useState, useEffect } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import styles from './BadmintonScore.module.css';
import { CourtLayout } from './CourtLayout';
import { TEAM_NAME } from './constants';
import { useBadmintonStore } from './useBadmintonStore';
import { SettingsDialog } from './SettingsDialog';

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
  } = useBadmintonStore();

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

      {/* Settings Dialog - Replaced with the new component */}
      <SettingsDialog
        open={settingsOpen}
        settings={tempSettings}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        onChange={handleSettingsChange}
      />
    </>
  );
}