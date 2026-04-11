import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Player, 
  Team,
  Game, 
  Court, 
  QueueEntry,
  MatchSuggestion,
  MatchTeam,
  SessionStats,
  AppSettings,
  PlayerStatus,
  GameStatus,
  CourtStatus,
  DEFAULT_SETTINGS
} from './types';
import { RatingSystem, QueueManager } from './algorithms';
import {
  generateId,
  createPlayer,
  createCourt,
  today,
  toGamesPlayedMap,
  stripPlayerHistory,
  derivePartnershipHistoryFromGames,
  normalizePersistedQueueEntry,
  normalizePersistedMatchTeam,
  normalizePersistedMatchSuggestion,
  resolveMatchTeam
} from './storeHelpers';
import { getInitialState } from './storeState';

const MAX_GAMES_HISTORY = 100;
const MAX_UNDO_HISTORY = 20;

const keepMostRecentGames = (games: Game[]): Game[] => {
  if (games.length <= MAX_GAMES_HISTORY) {
    return games;
  }
  return games.slice(-MAX_GAMES_HISTORY);
};

interface DoublesQueueState {
  // Core data
  players: Player[];
  games: Game[];
  courts: Court[];
  settings: AppSettings;
  
  // Session data
  currentSession: {
    date: string;
    isActive: boolean;
    gamesPlayed: Map<string, number>; // playerId -> games count
    totalGames: number;
  };
  
  // Queue management
  queueEntries: QueueEntry[];
  nextMatches: MatchSuggestion[];
  manualMatches: MatchSuggestion[];
  
  // Algorithms
  ratingSystem: RatingSystem;
  queueManager: QueueManager;

  // Undo history
  undoStack: UndoSnapshot[];
  canUndo: boolean;

  // Actions
  initializeSession: () => void;
  endSession: () => void;
  undoLastAction: () => void;
  
  // Player management
  addPlayer: (name: string, initialRating?: number) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerStatus: (playerId: string, status: PlayerStatus) => void;
  joinQueue: (playerId: string) => void;
  leaveQueue: (playerId: string) => void;
  
  // Court management
  addCourt: (name: string) => void;
  removeCourt: (courtId: string) => void;
  updateCourtStatus: (courtId: string, status: CourtStatus) => void;
  
  // Game management
  startGame: (courtId: string, match: MatchSuggestion) => Game;
  completeGame: (gameId: string, winningTeam: 1 | 2, score?: any) => void;
  switchGameWinner: (gameId: string) => void;
  markGamesSynced: (gameIds: string[]) => void;
  cancelGame: (gameId: string) => void;
  
  // Queue operations
  refreshQueue: () => void;
  generateNextMatches: () => void;
  addManualMatch: (match: MatchSuggestion) => void;
  removeManualMatch: (index: number) => void;
  
  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Data management
  exportData: () => string;
  clearAllData: () => void;
}

interface UndoSnapshot {
  players: Player[];
  games: Game[];
  courts: Court[];
  settings: AppSettings;
  currentSession: DoublesQueueState['currentSession'];
  manualMatches: MatchSuggestion[];
}

const createUndoSnapshot = (state: DoublesQueueState): UndoSnapshot => structuredClone({
  players: state.players,
  games: state.games,
  courts: state.courts,
  settings: state.settings,
  currentSession: state.currentSession,
  manualMatches: state.manualMatches,
});

const pushUndoSnapshot = (undoStack: UndoSnapshot[], snapshot: UndoSnapshot): UndoSnapshot[] => {
  const nextUndoStack = [...undoStack, snapshot];
  if (nextUndoStack.length <= MAX_UNDO_HISTORY) {
    return nextUndoStack;
  }
  return nextUndoStack.slice(nextUndoStack.length - MAX_UNDO_HISTORY);
};

const withUndoState = (state: DoublesQueueState) => {
  const undoStack = pushUndoSnapshot(state.undoStack, createUndoSnapshot(state));
  return {
    undoStack,
    canUndo: undoStack.length > 0,
  };
};

export const useDoublesQueueStore = create<DoublesQueueState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // Session management
      initializeSession: () => {
        const currentDate = today();
        set(state => ({
          ...withUndoState(state),
          currentSession: {
            date: currentDate,
            isActive: true,
            gamesPlayed: new Map(),
            totalGames: 0
          }
        }));
        get().refreshQueue();
      },

      endSession: () => {
        set(state => ({
          ...withUndoState(state),
          currentSession: {
            ...state.currentSession,
            isActive: false
          },
          // Reset all players to inactive
          players: state.players.map(player => ({
            ...player,
            status: PlayerStatus.INACTIVE,
            joinedQueueTime: undefined
          })),
          queueEntries: [],
          manualMatches: [],
          nextMatches: []
        }));
      },

      undoLastAction: () => {
        const state = get();
        const snapshot = state.undoStack[state.undoStack.length - 1];
        if (!snapshot) return;

        const undoStack = state.undoStack.slice(0, -1);

        set({
          players: snapshot.players,
          games: snapshot.games,
          courts: snapshot.courts,
          settings: snapshot.settings,
          currentSession: snapshot.currentSession,
          manualMatches: snapshot.manualMatches,
          queueEntries: [],
          nextMatches: [],
          ratingSystem: new RatingSystem(snapshot.settings),
          queueManager: new QueueManager(snapshot.settings),
          undoStack,
          canUndo: undoStack.length > 0,
        });

        get().refreshQueue();
      },

      // Player management
      addPlayer: (name: string, initialRating?: number) => {
        const existingPlayer = get().players.find(p => p.name === name);
        if (existingPlayer) {
          if (typeof initialRating === 'number') {
            set(state => ({
              ...withUndoState(state),
              players: state.players.map(player =>
                player.id === existingPlayer.id
                  ? { ...player, rating: initialRating }
                  : player
              )
            }));
            get().refreshQueue();
          }
          return;
        }

        const newPlayer = createPlayer(name, initialRating ?? 1500);
        set(state => ({
          ...withUndoState(state),
          players: [...state.players, newPlayer]
        }));
        get().refreshQueue();
      },

      removePlayer: (playerId: string) => {
        set(state => ({
          ...withUndoState(state),
          players: state.players.filter(p => p.id !== playerId),
          queueEntries: state.queueEntries.filter(entry => entry.playerId !== playerId)
        }));
        get().refreshQueue();
      },

      updatePlayerStatus: (playerId: string, status: PlayerStatus) => {
        set(state => ({
          ...withUndoState(state),
          players: state.players.map(player =>
            player.id === playerId 
              ? {
                  ...player,
                  status,
                  joinedQueueTime: status === PlayerStatus.WAITING ? player.joinedQueueTime : undefined,
                }
              : player
          ),
          queueEntries:
            status === PlayerStatus.WAITING
              ? state.queueEntries
              : state.queueEntries.filter(entry => entry.playerId !== playerId),
        }));

        get().refreshQueue();
      },

      joinQueue: (playerId: string) => {
        const joinTime = new Date();
        set(state => ({
          ...withUndoState(state),
          players: state.players.map(player =>
            player.id === playerId
              ? { 
                  ...player, 
                  status: PlayerStatus.WAITING,
                  joinedQueueTime: joinTime
                }
              : player
          )
        }));
        get().refreshQueue();
      },

      leaveQueue: (playerId: string) => {
        set(state => ({
          ...withUndoState(state),
          players: state.players.map(player =>
            player.id === playerId
              ? { 
                  ...player, 
                  status: PlayerStatus.INACTIVE,
                  joinedQueueTime: undefined
                }
              : player
          ),
          queueEntries: state.queueEntries.filter(entry => entry.playerId !== playerId)
        }));
        get().refreshQueue();
      },

      // Court management
      addCourt: (name: string) => {
        const newCourt = createCourt(name);
        set(state => ({
          ...withUndoState(state),
          courts: [...state.courts, newCourt]
        }));
      },

      removeCourt: (courtId: string) => {
        set(state => ({
          ...withUndoState(state),
          courts: state.courts.filter(c => c.id !== courtId)
        }));
      },

      updateCourtStatus: (courtId: string, status: CourtStatus) => {
        set(state => ({
          ...withUndoState(state),
          courts: state.courts.map(court =>
            court.id === courtId
              ? { ...court, status }
              : court
          )
        }));
      },

      // Game management
      startGame: (courtId: string, match: MatchSuggestion) => {
        const playersById = new Map(get().players.map(player => [player.id, player]));
        const team1 = resolveMatchTeam(match.teams[0], playersById);
        const team2 = resolveMatchTeam(match.teams[1], playersById);

        if (!team1 || !team2) {
          throw new Error('Unable to resolve match players from current player state');
        }

        const game: Game = {
          id: generateId(),
          courtId,
          team1,
          team2,
          status: GameStatus.IN_PROGRESS,
          startTime: new Date()
        };

        // Check if it was a manual match and remove it
        const state = get();
        const manualMatchIndex = state.manualMatches.findIndex(m => 
          m.playerIds.length === match.playerIds.length &&
          m.playerIds.every(playerId => match.playerIds.includes(playerId))
        );
        
        let newManualMatches = state.manualMatches;
        if (manualMatchIndex !== -1) {
            newManualMatches = state.manualMatches.filter((_, i) => i !== manualMatchIndex);
        }

        // Update court status
        set(state => ({
          ...withUndoState(state),
          courts: state.courts.map(court =>
            court.id === courtId
              ? { ...court, status: CourtStatus.OCCUPIED, currentGame: game }
              : court
          ),
          games: keepMostRecentGames([...state.games, game]),
          manualMatches: newManualMatches,
          // Update player statuses to playing
          players: state.players.map(player => {
            if (match.playerIds.includes(player.id)) {
              return { 
                ...player, 
                status: PlayerStatus.PLAYING,
                joinedQueueTime: undefined
              };
            }
            return player;
          }),
          // Remove players from queue
          queueEntries: state.queueEntries.filter(entry => 
            !match.playerIds.includes(entry.playerId)
          )
        }));

        get().refreshQueue();
        return game;
      },

      completeGame: (gameId: string, winningTeam: 1 | 2, score?: any) => {
        const state = get();
        const game = state.games.find(g => g.id === gameId);
        if (!game) return;

        // Calculate rating changes
        const ratingChanges = state.ratingSystem.calculateGameRatings(game, winningTeam);
        const endTime = new Date();

        // Update game
        const updatedGame: Game = {
          ...game,
          status: GameStatus.COMPLETED,
          gameNumber: game.gameNumber ?? state.currentSession.totalGames + 1,
          winner: winningTeam,
          syncedToSheet: false,
          syncedAt: undefined,
          score,
          endTime,
          ratingChanges: []
        };

        // Update players with new ratings and stats
        const updatedPlayers = state.players.map(player => {
          const team1Player1 = game.team1.player1.id === player.id;
          const team1Player2 = game.team1.player2.id === player.id;
          const team2Player1 = game.team2.player1.id === player.id;
          const team2Player2 = game.team2.player2.id === player.id;

          if (team1Player1 || team1Player2 || team2Player1 || team2Player2) {
            let ratingChange: any;
            let won: boolean;

            if (team1Player1) {
              ratingChange = ratingChanges.team1Changes[0];
              won = winningTeam === 1;
            } else if (team1Player2) {
              ratingChange = ratingChanges.team1Changes[1];
              won = winningTeam === 1;
            } else if (team2Player1) {
              ratingChange = ratingChanges.team2Changes[0];
              won = winningTeam === 2;
            } else {
              ratingChange = ratingChanges.team2Changes[1];
              won = winningTeam === 2;
            }

            const newRating = player.rating + ratingChange.ratingChange;
            const newStreak = won ? (player.currentStreak >= 0 ? player.currentStreak + 1 : 1) 
                                  : (player.currentStreak <= 0 ? player.currentStreak - 1 : -1);

            return {
              ...player,
              rating: Math.max(1000, Math.min(3000, newRating)),
              gamesPlayed: player.gamesPlayed + 1,
              wins: won ? player.wins + 1 : player.wins,
              losses: won ? player.losses : player.losses + 1,
              currentStreak: newStreak,
              status: PlayerStatus.RESTING,
              lastGameTime: endTime
            };
          }
          return player;
        });

        // Update session games count
        const updatedSessionGamesPlayed = toGamesPlayedMap(state.currentSession.gamesPlayed);
        [game.team1.player1.id, game.team1.player2.id, game.team2.player1.id, game.team2.player2.id]
          .forEach(playerId => {
            updatedSessionGamesPlayed.set(playerId, (updatedSessionGamesPlayed.get(playerId) || 0) + 1);
          });

        set({
          ...withUndoState(state),
          games: state.games.map(g => g.id === gameId ? updatedGame : g),
          players: updatedPlayers,
          currentSession: {
            ...state.currentSession,
            gamesPlayed: updatedSessionGamesPlayed,
            totalGames: state.currentSession.totalGames + 1
          },
          // Free up the court
          courts: state.courts.map(court =>
            court.id === game.courtId
              ? { ...court, status: CourtStatus.AVAILABLE, currentGame: undefined }
              : court
          )
        });

        get().refreshQueue();
      },

      switchGameWinner: (gameId: string) => {
        const state = get();
        const game = state.games.find(g => g.id === gameId);
        if (!game || game.status !== GameStatus.COMPLETED || !game.winner) return;

        const updatedGames: Game[] = state.games.map(existingGame => {
          if (existingGame.id !== gameId) {
            return existingGame;
          }

          const nextWinner: 1 | 2 = existingGame.winner === 1 ? 2 : 1;

          return {
            ...existingGame,
            winner: nextWinner,
            syncedToSheet: false,
            syncedAt: undefined,
          };
        });

        set({
          ...withUndoState(state),
          games: updatedGames,
        });

        get().refreshQueue();
      },

      markGamesSynced: (gameIds: string[]) => {
        if (gameIds.length === 0) return;
        const syncedAt = new Date();
        set(state => ({
          ...withUndoState(state),
          games: state.games.map(game => (
            gameIds.includes(game.id)
              ? { ...game, syncedToSheet: true, syncedAt }
              : game
          ))
        }));
      },

      cancelGame: (gameId: string) => {
        const state = get();
        const game = state.games.find(g => g.id === gameId);
        if (!game) return;

        set({
          ...withUndoState(state),
          games: state.games.map(g => 
            g.id === gameId 
              ? { ...g, status: GameStatus.CANCELLED }
              : g
          ),
          // Reset players to waiting
          players: state.players.map(player => {
            if ([game.team1.player1.id, game.team1.player2.id, game.team2.player1.id, game.team2.player2.id]
                .includes(player.id)) {
              return { ...player, status: PlayerStatus.WAITING };
            }
            return player;
          }),
          // Free up the court
          courts: state.courts.map(court =>
            court.id === game.courtId
              ? { ...court, status: CourtStatus.AVAILABLE, currentGame: undefined }
              : court
          )
        });

        get().refreshQueue();
      },

      // Queue operations
      refreshQueue: () => {
        const state = get();
        const partnershipHistory = derivePartnershipHistoryFromGames(state.games);
        const queueEntries = state.queueManager.generateQueueEntries(
          state.players,
          state.currentSession.gamesPlayed,
          partnershipHistory
        );
        
        set({ queueEntries });
        get().generateNextMatches();
      },

      generateNextMatches: () => {
        const state = get();
        const partnershipHistory = derivePartnershipHistoryFromGames(state.games);
        const availableCourts = state.courts.filter(c => c.status === CourtStatus.AVAILABLE);
        
        // Filter out players already in manual matches
        const manualMatchPlayerIds = new Set(
          state.manualMatches.flatMap(m => m.playerIds)
        );
        
        const availableQueueEntries = state.queueEntries.filter(
          entry => !manualMatchPlayerIds.has(entry.playerId)
        );

        let nextMatches = [...state.manualMatches];
        
        const slotsNeeded = Math.max(0, availableCourts.length - state.manualMatches.length);
        
        if (availableQueueEntries.length >= 4 && slotsNeeded > 0) {
          const autoMatches = state.queueManager.findMultipleMatches(
            availableQueueEntries,
            state.players,
            slotsNeeded,
            partnershipHistory
          );
          
          nextMatches = [...nextMatches, ...autoMatches];
        }
        
        set({ nextMatches });
      },

      addManualMatch: (match: MatchSuggestion) => {
        set(state => ({
          ...withUndoState(state),
          manualMatches: [...state.manualMatches, match]
        }));
        get().generateNextMatches();
      },

      removeManualMatch: (index: number) => {
        set(state => ({
          ...withUndoState(state),
          manualMatches: state.manualMatches.filter((_, i) => i !== index)
        }));
        get().generateNextMatches();
      },

      // Settings
      updateSettings: (newSettings: Partial<AppSettings>) => {
        const updatedSettings = { ...get().settings, ...newSettings };
        set(state => ({
          ...withUndoState(state),
          settings: updatedSettings,
          ratingSystem: new RatingSystem(updatedSettings),
          queueManager: new QueueManager(updatedSettings)
        }));
        get().refreshQueue();
      },

      // Data management
      exportData: () => {
        const { players, games, settings } = get();
        const partnershipHistory = derivePartnershipHistoryFromGames(games);
        return JSON.stringify({
          players,
          games,
          settings,
          partnershipHistory,
          exportDate: new Date().toISOString()
        });
      },

      clearAllData: () => {
        set(state => ({
          ...withUndoState(state),
          players: [],
          games: [],
          queueEntries: [],
          nextMatches: [],
          manualMatches: [],
          currentSession: {
            date: today(),
            isActive: false,
            gamesPlayed: new Map(),
            totalGames: 0
          }
        }));
      }
    }),
    {
      name: 'doubles-queue-store',
      // Customize what gets persisted
      partialize: (state) => ({
        players: state.players,
        games: state.games.map(game => ({
          ...game,
          team1: {
            ...game.team1,
            player1: stripPlayerHistory(game.team1.player1),
            player2: stripPlayerHistory(game.team1.player2)
          },
          team2: {
            ...game.team2,
            player1: stripPlayerHistory(game.team2.player1),
            player2: stripPlayerHistory(game.team2.player2)
          }
        })),
        queueEntries: state.queueEntries,
        nextMatches: state.nextMatches,
        manualMatches: state.manualMatches,
        courts: state.courts.map(court => ({
          ...court,
          currentGame: court.currentGame ? {
            ...court.currentGame,
            team1: {
              ...court.currentGame.team1,
              player1: stripPlayerHistory(court.currentGame.team1.player1),
              player2: stripPlayerHistory(court.currentGame.team1.player2)
            },
            team2: {
              ...court.currentGame.team2,
              player1: stripPlayerHistory(court.currentGame.team2.player1),
              player2: stripPlayerHistory(court.currentGame.team2.player2)
            }
          } : undefined
        })),
        settings: state.settings,
        currentSession: {
          ...state.currentSession,
          gamesPlayed: Array.from(state.currentSession.gamesPlayed.entries())
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert date strings back to Date objects
          state.games = state.games
            .filter(game => game.startTime) // Filter out games without startTime
            .map(game => ({
              ...game,
              startTime: new Date(game.startTime),
              endTime: game.endTime ? new Date(game.endTime) : undefined
            }));
          state.games = keepMostRecentGames(state.games);
          state.players = state.players.map(player => ({
            ...player,
            lastGameTime: player.lastGameTime ? new Date(player.lastGameTime) : undefined,
            joinedQueueTime: player.joinedQueueTime ? new Date(player.joinedQueueTime) : undefined
          }));
          // Restore courts.currentGame date fields if present
          state.courts = state.courts.map(court => ({
            ...court,
            currentGame: court.currentGame && court.currentGame.startTime ? {
              ...court.currentGame,
              startTime: new Date(court.currentGame.startTime),
              endTime: court.currentGame.endTime ? new Date(court.currentGame.endTime) : undefined
            } : undefined
          }));
          state.queueEntries = state.queueEntries
            .map(normalizePersistedQueueEntry)
            .filter((entry): entry is QueueEntry => !!entry);
          state.nextMatches = state.nextMatches
            .map(normalizePersistedMatchSuggestion)
            .filter((match): match is MatchSuggestion => !!match);
          state.manualMatches = state.manualMatches
            .map(normalizePersistedMatchSuggestion)
            .filter((match): match is MatchSuggestion => !!match);

          state.currentSession = {
            ...state.currentSession,
            gamesPlayed: toGamesPlayedMap(state.currentSession?.gamesPlayed)
          };
        }
      }
    }
  )
);