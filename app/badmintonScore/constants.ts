import { CourtPosition, PlayerColor } from "./types";

export const TEAM_NAME = {
  TEAM1: 'Q2Q3',
  TEAM2: 'Q1Q4'
} as const;  // Add "as const" here

export type T_TEAMS = typeof TEAM_NAME[keyof typeof TEAM_NAME];

// The initial position of each player color
export const initialPositions: Record<CourtPosition, PlayerColor> = {
  Q1: 'blue',
  Q2: 'white',
  Q3: 'yellow',
  Q4: 'red'
};

export const TOP_HALF = ["Q1", "Q2"]