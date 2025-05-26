export const TEAM_NAME = {
  TEAM1: 'Team 1',
  TEAM2: 'Team 2'
} as const;  // Add "as const" here

export type T_TEAMS = typeof TEAM_NAME[keyof typeof TEAM_NAME];