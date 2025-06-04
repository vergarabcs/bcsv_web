import { CourtPosition, PlayerColor } from "./types";

export const TEAM_NAME = {
  TEAM1: 'Q1Q2',
  TEAM2: 'Q3Q4'
} as const;  // Add "as const" here

export type T_TEAMS = typeof TEAM_NAME[keyof typeof TEAM_NAME];

// The initial position of each player color
export const initialPositions: Record<CourtPosition, PlayerColor> = {
  Q1: 'white',
  Q2: 'blue',
  Q3: 'red',
  Q4: 'yellow'
};