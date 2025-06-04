export interface BadmintonScoreSettings {
  maxScore: number;
  pointsToWin: number;
  player1Name: string;
  player2Name: string;
}

export const GAMEPAD_ACTIONS = {
  UNDO: 'undo',
  TEAM1_SCORES: 'team1Scores',
  TEAM2_SCORES: 'team2Scores',
  SWAP_SERVE: 'swapServe'
} as const;  // Add "as const" here

export type TGamePadAction = typeof GAMEPAD_ACTIONS[keyof typeof GAMEPAD_ACTIONS];

// Define the court position types
export type CourtPosition = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type PlayerColor = 'blue' | 'red' | 'yellow' | 'white';
