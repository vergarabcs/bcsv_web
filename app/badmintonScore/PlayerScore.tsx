import { Typography } from '@mui/material';
import styles from './BadmintonScore.module.css';
import { T_TEAMS, TEAM_NAME } from './constants';
import { useBadmintonStore } from './useBadmintonStore';

interface PlayerScoreProps {
  team: T_TEAMS;
  className: string;
}

export const PlayerScore = ({
  team,
  className
}: PlayerScoreProps) => {
  const { 
    player1Score, 
    player2Score, 
    player1Name, 
    player2Name, 
    gameOver, 
    handleScore 
  } = useBadmintonStore();

  // Determine the current player's name and score based on the team
  const name = team === TEAM_NAME.TEAM1 ? player1Name : player2Name;
  const score = team === TEAM_NAME.TEAM1 ? player1Score : player2Score;
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
        variant="h4" 
        className={styles.playerName} 
        sx={{ 
          color: fontColor, 
          fontWeight: 'bold'
        }}
      >
        {name}
      </Typography>
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
    </div>
  );
};