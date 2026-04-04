import { 
  AppSettings,
  DEFAULT_SETTINGS,
  CourtStatus,
} from './types';
import { RatingSystem, QueueManager } from './algorithms';
import { createCourt, today } from './storeHelpers';

export const getInitialState = () => ({
  // Core data
  players: [],
  games: [],
  courts: [
    createCourt('Court 1'),
    createCourt('Court 2')
  ],
  settings: DEFAULT_SETTINGS,
  
  // Session data
  currentSession: {
    date: today(),
    isActive: false,
    gamesPlayed: new Map(),
    totalGames: 0
  },
  
  // Queue management
  queueEntries: [],
  nextMatches: [],
  manualMatches: [],
  
  // Algorithms
  ratingSystem: new RatingSystem(DEFAULT_SETTINGS),
  queueManager: new QueueManager(DEFAULT_SETTINGS),

  // Undo history
  undoStack: [],
  canUndo: false,
});
