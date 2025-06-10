import { CourtPosition, PlayerColor } from "./types";

export const TEAM_NAME = {
  TEAM1: 'Q2Q3',
  TEAM2: 'Q1Q4'
} as const;  // Add "as const" here

export type T_TEAMS = typeof TEAM_NAME[keyof typeof TEAM_NAME];

// The initial position of each player color
export const initialColorMap: Record<CourtPosition, string> = {
  Q1: '#0032A0', // blue
  Q2: 'white',
  Q3: '#FED141', // yellow
  Q4: '#BF0D3E' // red
};

export const TOP_HALF = ["Q1", "Q2"]