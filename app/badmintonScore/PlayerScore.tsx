import { Typography } from '@mui/material';
import styles from './BadmintonScore.module.css';
import { T_TEAMS, TEAM_NAME } from './constants';
import { useBadmintonStore } from './useBadmintonStore';
import { useCallback } from 'react';

interface PlayerScoreProps {
  team: T_TEAMS;
}

function shadowBuilder(strokeWidth: string, strokeColor: string, glowColor: string) {
  // strokeWidth like '2px', color like 'white', glowColor like 'black'
  return [
    `${strokeWidth} ${strokeWidth} 0 ${strokeColor}`,
    `-${strokeWidth} -${strokeWidth} 0 ${strokeColor}`,
    `${strokeWidth} -${strokeWidth} 0 ${strokeColor}`,
    `-${strokeWidth} ${strokeWidth} 0 ${strokeColor}`,
    `0 ${strokeWidth} 0 ${strokeColor}`,
    `${strokeWidth} 0 0 ${strokeColor}`,
    `-${strokeWidth} 0 0 ${strokeColor}`,
    `0 -${strokeWidth} 0 ${strokeColor}`,
    `0 0 5px ${glowColor}`
  ].join(', ');
}

export const PlayerScore = ({
  team
}: PlayerScoreProps) => {
  // Selectively subscribe only to the data needed for this specific team
  const score = useBadmintonStore(state => team === TEAM_NAME.TEAM1 ? state.player1Score : state.player2Score);
  const name = useBadmintonStore(state => team === TEAM_NAME.TEAM1 ? state.player1Name : state.player2Name);
  const gameOver = useBadmintonStore(state => state.gameOver);
  const handleScore = useBadmintonStore(state => state.handleScore);
  
  const textStroke = `${team === TEAM_NAME.TEAM1 ? 'white' : 'black'}`
  const fontColor = team === TEAM_NAME.TEAM1 ? 'black' : 'white'
  const textShadow = `${team === TEAM_NAME.TEAM1 ? 'black' : 'white'}`
  
  return (
    <div
      data-testid={`playerScore-${team}`} 
      onClick={() => handleScore(team)}
      className={styles.playerArea}
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
          lineHeight: 1,
          fontSize: 'clamp(0px, 85vh, 45vw)',
          textShadow: shadowBuilder('1vh', textStroke, textShadow),
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
          fontWeight: 'bold',
          fontSize: 'clamp(0px, 5vh, 2.5vw)'
        }}
      >
        {name}
      </Typography>
    </div>
  );
};