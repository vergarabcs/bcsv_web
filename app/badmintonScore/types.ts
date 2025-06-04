export interface BadmintonScoreSettings {
  maxScore: number;
  pointsToWin: number;
  player1Name: string;
  player2Name: string;
}

export type TGamePadAction = "undo" | "team1Scores" | "team2Scores"

// Define the court position types
export type CourtPosition = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type PlayerColor = 'blue' | 'red' | 'yellow' | 'white';
