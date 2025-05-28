import { Typography } from '@mui/material';
import styles from './BadmintonScore.module.css';
import { T_TEAMS, TEAM_NAME } from './constants';
import { useBadmintonStore } from './useBadmintonStore';
import { useCallback } from 'react';

interface PlayerScoreProps {
  team: T_TEAMS;
  className: string;
}

export const PlayerScore = ({
  team,
  className
}: PlayerScoreProps) => {
  // Selectively subscribe only to the data needed for this specific team
  const score = useBadmintonStore(state => team === TEAM_NAME.TEAM1 ? state.player1Score : state.player2Score);
  const name = useBadmintonStore(state => team === TEAM_NAME.TEAM1 ? state.player1Name : state.player2Name);
  const gameOver = useBadmintonStore(state => state.gameOver);
  const handleScore = useBadmintonStore(state => state.handleScore);
  
  const textStroke = `0px ${team === TEAM_NAME.TEAM1 ? 'white' : 'black'}`
  const fontColor = team === TEAM_NAME.TEAM1 ? 'black' : 'white'
  const textShadow = `0px 0px 5px ${team === TEAM_NAME.TEAM1 ? 'black' : 'white'}`
  console.log('rerender', team)

  return (
    <div 
      onClick={() => handleScore(team)}
      className={className}
      style={{ 
        cursor: gameOver ? 'default' : 'pointer',
        backgroundColor: 'transparent' 
      }}
    >
      <Typography 
        variant="h1" 
        className={styles.scoreNumber}
        sx={{ 
          color: fontColor,
          fontSize: "20rem",
          WebkitTextStroke: textStroke, 
          textShadow: textShadow,
          fontWeight: 'bold'
        }}
      >
        {score}
      </Typography>
      <Typography 
        variant="h4" 
        className={styles.playerName} 
        sx={{ 
          color: fontColor, 
          fontWeight: 'bold'
        }}
      >
        {name}
      </Typography>
    </div>
  );
};