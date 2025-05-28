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
import { PlayerScore } from './PlayerScore';

const TEXT_SHADOW = `0px 0px 10px white`
                
export default function BadmintonScore() {
  // Keep isLandscape state in the component
  const [isLandscape, setIsLandscape] = useState(true);

  // Get everything else from the store
  const {
    gameOver,
    winner,
    positions,
    settings,
    resetGame,
    handleOpenSettings
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
            <PlayerScore 
              team={TEAM_NAME.TEAM1}
              className={styles.playerArea1}
            />

            {/* Player 2 side */}
            <PlayerScore 
              team={TEAM_NAME.TEAM2}
              className={styles.playerArea2}
            />
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

      {/* Settings Dialog - Now doesn't need props */}
      <SettingsDialog />
    </>
  );
}