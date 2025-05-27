import { useState, useEffect } from 'react';
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
import SettingsIcon from '@mui/icons-material/Settings';
import { BadmintonScoreSettings } from './types';
import styles from './BadmintonScore.module.css';
import { CourtLayout } from './CourtLayout';
import { T_TEAMS, TEAM_NAME } from './constants';

const TEXT_SHADOW = `0px 0px 10px white`
                
export default function BadmintonScore() {
  // Score state
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [isLandscape, setIsLandscape] = useState(true);
  
  // Court layout state
  const [servingTeam, setServingTeam] = useState<T_TEAMS>(TEAM_NAME.TEAM2);
  const [lastScorer, setLastScorer] = useState<T_TEAMS | null>(null);

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<BadmintonScoreSettings>({
    maxScore: 21,
    pointsToWin: 2,
    bestOf: 3,
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    swapSides: true,
    showCourtLayout: true,
    doubleMatch: true
  });
  const [tempSettings, setTempSettings] = useState<BadmintonScoreSettings>({...settings});

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

  // Handle scoring
  const handleScore = (player: 1 | 2) => {
    if (gameOver) return;

    // For doubles match, track which team scored
    if (settings.doubleMatch) {
      const scoringTeam = player === 1 ? TEAM_NAME.TEAM2 : TEAM_NAME.TEAM1;
      setLastScorer(scoringTeam);
      
      // If the scoring team is the serving team, they keep serving
      // Otherwise, the service changes to the scoring team
      if (scoringTeam !== servingTeam) {
        setServingTeam(scoringTeam);
      }
    }

    if (player === 1) {
      setPlayer1Score(prev => {
        const newScore = prev + 1;
        checkWinCondition(newScore, player2Score, player);
        return newScore;
      });
    } else {
      setPlayer2Score(prev => {
        const newScore = prev + 1;
        checkWinCondition(player1Score, newScore, player);
        return newScore;
      });
    }
  };

  // Check if a player has won
  const checkWinCondition = (score1: number, score2: number, playerScored: 1 | 2) => {
    const { maxScore, pointsToWin } = settings;
    const leading = score1 > score2 ? 1 : 2;
    const leadingScore = leading === 1 ? score1 : score2;
    const trailingScore = leading === 1 ? score2 : score1;
    
    if ((leadingScore >= maxScore) && ((leadingScore - trailingScore) >= pointsToWin)) {
      setGameOver(true);
      setWinner(leading === 1 ? player1Name : player2Name);
    }
  };

  // Reset the game
  const resetGame = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
    setGameOver(false);
    setWinner('');
  };

  // Settings dialog handlers
  const handleOpenSettings = () => {
    setTempSettings({...settings});
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const handleSaveSettings = () => {
    setSettings({...tempSettings});
    setPlayer1Name(tempSettings.player1Name);
    setPlayer2Name(tempSettings.player2Name);
    resetGame();
    setSettingsOpen(false);
  };

  const handleSettingsChange = (field: keyof BadmintonScoreSettings, value: any) => {
    setTempSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
              servingTeam={servingTeam}
              lastScorer={lastScorer}
            />
          )}

          {/* Score display overlaid on court layout */}
          <div className={styles.scoreDisplay} style={{ position: 'relative', zIndex: 1 }}>
            {/* Player 1 side */}
            <div 
              onClick={() => handleScore(1)}
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
              onClick={() => handleScore(2)}
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