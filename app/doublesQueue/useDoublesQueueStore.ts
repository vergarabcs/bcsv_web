import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Player, 
  Team,
  Game, 
  Court, 
  QueueEntry,
  MatchSuggestion,
  SessionStats,
  AppSettings,
  PartnershipHistory,
  PlayerStatus,
  GameStatus,
  CourtStatus,
  DEFAULT_SETTINGS,
  RatingChange
} from './types';
import { RatingSystem, QueueManager } from './algorithms';

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
  partnershipHistory: PartnershipHistory[];
  
  // Algorithms
  ratingSystem: RatingSystem;
  queueManager: QueueManager;

  // Actions
  initializeSession: () => void;
  endSession: () => void;
  
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
  importData: (data: string) => void;
  clearAllData: () => void;
}

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const createPlayer = (name: string, rating: number = 1500): Player => ({
  id: generateId(),
  name,
  rating,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  status: PlayerStatus.INACTIVE,
  ratingHistory: []
});

const createCourt = (name: string): Court => ({
  id: generateId(),
  name,
  status: CourtStatus.AVAILABLE
});

const today = () => new Date().toISOString().split('T')[0];

const stripPlayerHistory = (player: Player): Player => ({
  ...player,
  ratingHistory: []
});

export const useDoublesQueueStore = create<DoublesQueueState>()(
  persist(
    (set, get) => ({
      // Initial state
      players: [],
      games: [],
      courts: [
        createCourt('Court 1'),
        createCourt('Court 2')
      ],
      settings: DEFAULT_SETTINGS,
      
      currentSession: {
        date: today(),
        isActive: false,
        gamesPlayed: new Map(),
        totalGames: 0
      },
      
      queueEntries: [],
      nextMatches: [],
      manualMatches: [],
      partnershipHistory: [],
      
      ratingSystem: new RatingSystem(DEFAULT_SETTINGS),
      queueManager: new QueueManager(DEFAULT_SETTINGS),

      // Session management
      initializeSession: () => {
        const currentDate = today();
        set(state => ({
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

      // Player management
      addPlayer: (name: string, initialRating: number = 1500) => {
        const newPlayer = createPlayer(name, initialRating);
        set(state => ({
          players: [...state.players, newPlayer]
        }));
      },

      removePlayer: (playerId: string) => {
        set(state => ({
          players: state.players.filter(p => p.id !== playerId),
          queueEntries: state.queueEntries.filter(entry => entry.player.id !== playerId)
        }));
        get().refreshQueue();
      },

      updatePlayerStatus: (playerId: string, status: PlayerStatus) => {
        set(state => ({
          players: state.players.map(player =>
            player.id === playerId 
              ? { ...player, status }
              : player
          )
        }));
        
        if (status !== PlayerStatus.WAITING) {
          get().leaveQueue(playerId);
        }
        
        get().refreshQueue();
      },

      joinQueue: (playerId: string) => {
        const joinTime = new Date();
        set(state => ({
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
          players: state.players.map(player =>
            player.id === playerId
              ? { 
                  ...player, 
                  status: PlayerStatus.INACTIVE,
                  joinedQueueTime: undefined
                }
              : player
          ),
          queueEntries: state.queueEntries.filter(entry => entry.player.id !== playerId)
        }));
        get().refreshQueue();
      },

      // Court management
      addCourt: (name: string) => {
        const newCourt = createCourt(name);
        set(state => ({
          courts: [...state.courts, newCourt]
        }));
      },

      removeCourt: (courtId: string) => {
        set(state => ({
          courts: state.courts.filter(c => c.id !== courtId)
        }));
      },

      updateCourtStatus: (courtId: string, status: CourtStatus) => {
        set(state => ({
          courts: state.courts.map(court =>
            court.id === courtId
              ? { ...court, status }
              : court
          )
        }));
      },

      // Game management
      startGame: (courtId: string, match: MatchSuggestion) => {
        const game: Game = {
          id: generateId(),
          courtId,
          team1: match.teams[0],
          team2: match.teams[1],
          status: GameStatus.IN_PROGRESS,
          startTime: new Date()
        };

        // Check if it was a manual match and remove it
        const state = get();
        const manualMatchIndex = state.manualMatches.findIndex(m => 
            m.players.length === match.players.length &&
            m.players.every(p => match.players.some(mp => mp.id === p.id))
        );
        
        let newManualMatches = state.manualMatches;
        if (manualMatchIndex !== -1) {
            newManualMatches = state.manualMatches.filter((_, i) => i !== manualMatchIndex);
        }

        // Update court status
        set(state => ({
          courts: state.courts.map(court =>
            court.id === courtId
              ? { ...court, status: CourtStatus.OCCUPIED, currentGame: game }
              : court
          ),
          games: [...state.games, game],
          manualMatches: newManualMatches,
          // Update player statuses to playing
          players: state.players.map(player => {
            if (match.players.some(p => p.id === player.id)) {
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
            !match.players.some(p => p.id === entry.player.id)
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
          winner: winningTeam,
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

            const ratingHistoryEntry: RatingChange = {
              gameId,
              oldRating: player.rating,
              newRating,
              change: ratingChange.ratingChange,
              timestamp: endTime,
              opponent1: '', // Will be filled based on teams
              opponent2: '',
              partner: '',
              won
            };

            return {
              ...player,
              rating: Math.max(1000, Math.min(3000, newRating)),
              gamesPlayed: player.gamesPlayed + 1,
              wins: won ? player.wins + 1 : player.wins,
              losses: won ? player.losses : player.losses + 1,
              currentStreak: newStreak,
              status: PlayerStatus.RESTING,
              lastGameTime: endTime,
              ratingHistory: [...player.ratingHistory, ratingHistoryEntry]
            };
          }
          return player;
        });

        // Update partnership history
        const newPartnerships = [
          { player1Id: game.team1.player1.id, player2Id: game.team1.player2.id },
          { player1Id: game.team2.player1.id, player2Id: game.team2.player2.id }
        ];

        const updatedPartnershipHistory = [...state.partnershipHistory];
        
        newPartnerships.forEach(({ player1Id, player2Id }) => {
          const existing = updatedPartnershipHistory.find(p =>
            (p.player1Id === player1Id && p.player2Id === player2Id) ||
            (p.player1Id === player2Id && p.player2Id === player1Id)
          );

          if (existing) {
            existing.gameIds.push(gameId);
            existing.lastPlayedTogether = endTime;
          } else {
            updatedPartnershipHistory.push({
              player1Id,
              player2Id,
              gameIds: [gameId],
              lastPlayedTogether: endTime
            });
          }
        });

        // Update session games count
        const updatedSessionGamesPlayed = new Map(state.currentSession.gamesPlayed);
        [game.team1.player1.id, game.team1.player2.id, game.team2.player1.id, game.team2.player2.id]
          .forEach(playerId => {
            updatedSessionGamesPlayed.set(playerId, (updatedSessionGamesPlayed.get(playerId) || 0) + 1);
          });

        set({
          games: state.games.map(g => g.id === gameId ? updatedGame : g),
          players: updatedPlayers,
          partnershipHistory: updatedPartnershipHistory,
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

      cancelGame: (gameId: string) => {
        const state = get();
        const game = state.games.find(g => g.id === gameId);
        if (!game) return;

        set({
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
        const queueEntries = state.queueManager.generateQueueEntries(
          state.players,
          state.currentSession.gamesPlayed,
          state.partnershipHistory
        );
        
        set({ queueEntries });
        get().generateNextMatches();
      },

      generateNextMatches: () => {
        const state = get();
        const availableCourts = state.courts.filter(c => c.status === CourtStatus.AVAILABLE);
        
        // Filter out players already in manual matches
        const manualMatchPlayerIds = new Set(
          state.manualMatches.flatMap(m => m.players.map(p => p.id))
        );
        
        const availableQueueEntries = state.queueEntries.filter(
          entry => !manualMatchPlayerIds.has(entry.player.id)
        );

        let nextMatches = [...state.manualMatches];
        
        const slotsNeeded = Math.max(0, availableCourts.length - state.manualMatches.length);
        
        if (availableQueueEntries.length >= 4 && slotsNeeded > 0) {
          const autoMatches = state.queueManager.findMultipleMatches(
            availableQueueEntries,
            slotsNeeded,
            state.partnershipHistory
          );
          
          nextMatches = [...nextMatches, ...autoMatches];
        }
        
        set({ nextMatches });
      },

      addManualMatch: (match: MatchSuggestion) => {
        set(state => ({
          manualMatches: [...state.manualMatches, match]
        }));
        get().generateNextMatches();
      },

      removeManualMatch: (index: number) => {
        set(state => ({
          manualMatches: state.manualMatches.filter((_, i) => i !== index)
        }));
        get().generateNextMatches();
      },

      // Settings
      updateSettings: (newSettings: Partial<AppSettings>) => {
        const updatedSettings = { ...get().settings, ...newSettings };
        set({
          settings: updatedSettings,
          ratingSystem: new RatingSystem(updatedSettings),
          queueManager: new QueueManager(updatedSettings)
        });
      },

      // Data management
      exportData: () => {
        const { players, games, settings, partnershipHistory } = get();
        return JSON.stringify({
          players,
          games,
          settings,
          partnershipHistory,
          exportDate: new Date().toISOString()
        });
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          set({
            players: parsed.players || [],
            games: parsed.games || [],
            settings: parsed.settings || DEFAULT_SETTINGS,
            partnershipHistory: parsed.partnershipHistory || []
          });
          get().refreshQueue();
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      },

      clearAllData: () => {
        set({
          players: [],
          games: [],
          queueEntries: [],
          nextMatches: [],
          manualMatches: [],
          partnershipHistory: [],
          currentSession: {
            date: today(),
            isActive: false,
            gamesPlayed: new Map(),
            totalGames: 0
          }
        });
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
        queueEntries: state.queueEntries.map(entry => ({
          ...entry,
          player: stripPlayerHistory(entry.player)
        })),
        nextMatches: state.nextMatches.map(match => ({
          ...match,
          players: match.players.map(stripPlayerHistory) as [Player, Player, Player, Player],
          teams: match.teams.map(t => ({
            ...t,
            player1: stripPlayerHistory(t.player1),
            player2: stripPlayerHistory(t.player2)
          })) as [Team, Team]
        })),
        manualMatches: state.manualMatches.map(match => ({
          ...match,
          players: match.players.map(stripPlayerHistory) as [Player, Player, Player, Player],
          teams: match.teams.map(t => ({
            ...t,
            player1: stripPlayerHistory(t.player1),
            player2: stripPlayerHistory(t.player2)
          })) as [Team, Team]
        })),
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
        partnershipHistory: state.partnershipHistory,
        currentSession: state.currentSession
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
          state.players = state.players.map(player => ({
            ...player,
            lastGameTime: player.lastGameTime ? new Date(player.lastGameTime) : undefined,
            joinedQueueTime: player.joinedQueueTime ? new Date(player.joinedQueueTime) : undefined,
            ratingHistory: player.ratingHistory.map(entry => ({
              ...entry,
              timestamp: new Date(entry.timestamp)
            }))
          }));
          state.partnershipHistory = state.partnershipHistory.map(partnership => ({
            ...partnership,
            lastPlayedTogether: new Date(partnership.lastPlayedTogether)
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
          state.queueEntries = state.queueEntries.map(entry => ({
            ...entry,
            player: {
              ...entry.player,
              lastGameTime: entry.player.lastGameTime ? new Date(entry.player.lastGameTime) : undefined,
              joinedQueueTime: entry.player.joinedQueueTime ? new Date(entry.player.joinedQueueTime) : undefined,
              ratingHistory: entry.player.ratingHistory.map(ratingEntry => ({
                ...ratingEntry,
                timestamp: new Date(ratingEntry.timestamp)
              }))
            }
          }));
        }
      }
    }
  )
);