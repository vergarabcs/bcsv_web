import { 
  Button, 
  Typography, 
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import UndoIcon from '@mui/icons-material/Undo';
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
    resetGame,
    handleOpenSettings
  } = useBadmintonStore();

  const { undo, pastStates } = useBadmintonStore.temporal.getState();
  const canUndo = !!pastStates.length;

  const courtPos = useBadmintonStore(state => state.positionFlags.courtPos)

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
          <div className={styles.topControls}>
            {/* Settings button */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<SettingsIcon />}
              onClick={handleOpenSettings}
            >
              Settings
            </Button>
            
            {/* Undo button */}
            <Tooltip title="Undo last action">
              <span>
                <IconButton 
                  color="primary" 
                  onClick={() => undo()} 
                  disabled={!canUndo}
                  className={styles.undoButton}
                  size="large"
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
          </div>

          {/* Court layout as background */}
          <CourtLayout/>

          {/* Score display overlaid on court layout */}
          <div className={styles.scoreDisplay} style={{ position: 'relative', zIndex: 1 }}>
            {/* Player 1 side */}
            <PlayerScore 
              team={courtPos ? TEAM_NAME.TEAM2 : TEAM_NAME.TEAM1}
            />

            {/* Player 2 side */}
            <PlayerScore 
              team={courtPos ? TEAM_NAME.TEAM1 : TEAM_NAME.TEAM2}
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

      {/* Settings Dialog */}
      <SettingsDialog />
    </>
  );
}