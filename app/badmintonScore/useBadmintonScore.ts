import { useState } from 'react';
import { BadmintonScoreSettings, CourtPosition, PlayerColor } from './types';
import { initialPositions, T_TEAMS, TEAM_NAME } from './constants';

export function useBadmintonScore() {
  // Score state
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [positions, setPositions] = useState<Record<CourtPosition, PlayerColor>>(initialPositions);
  
  // Court layout state
  const [servingTeam, setServingTeam] = useState<T_TEAMS>(TEAM_NAME.TEAM2);

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

  const swapPosition = (scoringTeam: T_TEAMS) => {
    // Create a new positions object to avoid mutation
    const newPositions = {...positions};

    if (scoringTeam === TEAM_NAME.TEAM1) {
      // Swap positions for team Q1Q4
      const tempQ1 = newPositions.Q1;
      newPositions.Q1 = newPositions.Q4;
      newPositions.Q4 = tempQ1;
    } else {
      // Swap positions for team Q2Q3
      const tempQ2 = newPositions.Q2;
      newPositions.Q2 = newPositions.Q3;
      newPositions.Q3 = tempQ2;
    }

    setPositions(newPositions);
  };

  // Handle scoring
  const handleScore = (scoringTeam: T_TEAMS) => {
    if (gameOver) return;

    // For doubles match, track which team scored
    if (settings.doubleMatch) {
      
      // If the scoring team is the serving team, they keep serving
      // Otherwise, the service changes to the scoring team
      if (scoringTeam !== servingTeam) {
        setServingTeam(scoringTeam);
      } else {
        swapPosition(scoringTeam);
      }
    }

    if (scoringTeam === TEAM_NAME.TEAM1) {
      setPlayer1Score(prev => {
        const newScore = prev + 1;
        checkWinCondition(newScore, player2Score);
        return newScore;
      });
    } else {
      setPlayer2Score(prev => {
        const newScore = prev + 1;
        checkWinCondition(player1Score, newScore);
        return newScore;
      });
    }
  };

  // Check if a player has won
  const checkWinCondition = (score1: number, score2: number) => {
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

  return {
    // Score state
    player1Score,
    player2Score,
    player1Name,
    player2Name,
    gameOver,
    winner,
    servingTeam,
    
    // Court layout state
    positions,
    
    // Settings state
    settingsOpen,
    settings,
    tempSettings,
    
    // Methods
    handleScore,
    resetGame,
    handleOpenSettings,
    handleCloseSettings,
    handleSaveSettings,
    handleSettingsChange
  };
}