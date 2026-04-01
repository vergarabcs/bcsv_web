export interface Player {
  id: string;
  name: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  currentStreak: number; // Positive for wins, negative for losses
  lastGameTime?: Date;
  joinedQueueTime?: Date;
  status: PlayerStatus;
}

export interface RatingChange {
  gameId: string;
  oldRating: number;
  newRating: number;
  change: number;
  timestamp: Date;
  opponent1: string;
  opponent2: string;
  partner: string;
  won: boolean;
}

export enum PlayerStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  RESTING = 'resting',
  INACTIVE = 'inactive'
}

export interface Court {
  id: string;
  name: string;
  status: CourtStatus;
  currentGame?: Game;
}

export enum CourtStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance'
}

export interface Game {
  id: string;
  courtId: string;
  gameNumber?: number;
  team1: Team;
  team2: Team;
  status: GameStatus;
  startTime: Date;
  endTime?: Date;
  winner?: 1 | 2;
  syncedToSheet?: boolean;
  syncedAt?: Date;
  score?: GameScore;
  ratingChanges?: RatingChange[];
}

export interface Team {
  player1: Player;
  player2: Player;
  averageRating: number;
}

export interface MatchTeam {
  player1Id: string;
  player2Id: string;
  averageRating: number;
}

export interface GameScore {
  team1Sets: number;
  team2Sets: number;
  sets: SetScore[];
}

export interface SetScore {
  team1Points: number;
  team2Points: number;
}

export enum GameStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface QueueEntry {
  playerId: string;
  priority: number;
  waitTimeScore: number;
  balanceScore: number;
}

export interface MatchSuggestion {
  playerIds: [string, string, string, string];
  teams: [MatchTeam, MatchTeam];
  balanceQuality: number;
  totalPriority: number;
  ratingDifference: number;
}

export interface SessionStats {
  date: Date;
  playersCount: number;
  gamesPlayed: number;
  averageRating: number;
  courtUtilization: number;
  totalWaitTime: number;
  averageGameDuration: number;
}

export interface AppSettings {
  courtCount: number;
  maxWaitTime: number; // minutes
  ratingBalanceTolerance: number; // points
  emergencyWaitTime: number; // minutes
  kFactorNew: number; // for players with <30 games
  kFactorExperienced: number; // for players with 30+ games
}

// Priority scoring configuration
export interface PriorityConfig {
  waitTimeWeight: number; // 0.6
  balanceWeight: number; // 0.4
  waitTimeMultiplier: number; // 10 points per minute
  firstGameBonus: number; // 50 points
  gamesPlayedPenalty: number; // -20 points per game
  partnershipPenalty: number; // -30 points for recent partners
  streakBonus: number; // +10 points for 3+ losses
}

// Rating calculation types
export interface RatingCalculation {
  expectedScore: number;
  actualScore: number;
  kFactor: number;
  ratingChange: number;
}

export interface PartnershipHistory {
  player1Id: string;
  player2Id: string;
  gameIds: string[];
  lastPlayedTogether: Date;
}

export const DEFAULT_SETTINGS: AppSettings = {
  courtCount: 2,
  maxWaitTime: 30,
  ratingBalanceTolerance: 200,
  emergencyWaitTime: 30,
  kFactorNew: 32,
  kFactorExperienced: 16
};

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  waitTimeWeight: 0.6,
  balanceWeight: 0.4,
  waitTimeMultiplier: 10,
  firstGameBonus: 50,
  gamesPlayedPenalty: 20,
  partnershipPenalty: 30,
  streakBonus: 10
};

// Rating categories for display
export enum RatingCategory {
  BEGINNER = 'Beginner',
  NOVICE = 'Novice', 
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert',
  MASTER = 'Master'
}

export const getRatingCategory = (rating: number): RatingCategory => {
  if (rating < 1200) return RatingCategory.BEGINNER;
  if (rating < 1400) return RatingCategory.NOVICE;
  if (rating < 1600) return RatingCategory.INTERMEDIATE;
  if (rating < 1800) return RatingCategory.ADVANCED;
  if (rating < 2000) return RatingCategory.EXPERT;
  return RatingCategory.MASTER;
};

export const getRatingCategoryColor = (category: RatingCategory): string => {
  switch (category) {
    case RatingCategory.BEGINNER: return '#8BC34A'; // Light Green
    case RatingCategory.NOVICE: return '#CDDC39'; // Lime
    case RatingCategory.INTERMEDIATE: return '#FFC107'; // Amber
    case RatingCategory.ADVANCED: return '#FF9800'; // Orange
    case RatingCategory.EXPERT: return '#F44336'; // Red
    case RatingCategory.MASTER: return '#9C27B0'; // Purple
    default: return '#757575'; // Grey
  }
};