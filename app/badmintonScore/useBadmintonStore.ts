import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { BadmintonScoreSettings, CourtPosition, GAMEPAD_ACTIONS, PlayerColor, TGamePadAction } from './types';
import { T_TEAMS, TEAM_NAME } from './constants';
import { PositionFlags } from '../types';

// Type for the state that can be undone
interface UndoableState {
  player1Score: number;
  player2Score: number;
  player1Name: string;
  player2Name: string;
  gameOver: boolean;
  winner: string;
  servingTeam: T_TEAMS;
  settings: BadmintonScoreSettings;
  positionFlags: PositionFlags;
}

// Define the state interface
interface State {
  // Score state
  player1Score: number;
  player2Score: number;
  player1Name: string;
  player2Name: string;
  gameOver: boolean;
  winner: string;
  positionFlags: PositionFlags;

  // Court layout state
  servingTeam: T_TEAMS;

  // Settings state
  settingsOpen: boolean;
  settings: BadmintonScoreSettings;
  tempSettings: BadmintonScoreSettings;

  // Gamepad controls
  buttonMappings: Record<number, TGamePadAction>;

  // Undo history
  history: UndoableState[];
  currentHistoryIndex: number;
}

interface StoreActions {
  // Actions
  setSettings: (settings: BadmintonScoreSettings) => void;
  handleSettingsChange: <K extends keyof BadmintonScoreSettings>(field: K, value: BadmintonScoreSettings[K]) => void;
  handleScore: (scoringTeam: T_TEAMS) => void;
  resetGame: () => void;
  resetStore: () => void;  // Added resetStore function
  handleOpenSettings: () => void;
  handleCloseSettings: () => void;
  handleSaveSettings: () => void;
  swapServingTeam: () => void;  // handler for swapping the serving team
  swapCourt: () => void;

  // Gamepad actions
  updateButtonMapping: (buttonIndex: number, action: TGamePadAction) => void;
  dispatchGamepadAction: (action: TGamePadAction) => void;

  // Undo functionality
  saveHistory: () => void;
  canUndo: () => boolean;
  undo: () => void;
}

type BadmintonStore = State & StoreActions

// Initial state definition
const initialState : State = {
  player1Score: 0,
  player2Score: 0,
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  gameOver: false,
  winner: '',
  positionFlags: {
    p1: false,
    p2: false,
    courtPos: false
  },
  servingTeam: TEAM_NAME.TEAM2,
  settingsOpen: false,
  settings: {
    maxScore: 21,
    pointsToWin: 2,
    player1Name: 'Player 1',
    player2Name: 'Player 2'
  },
  tempSettings: {
    maxScore: 21,
    pointsToWin: 2,
    player1Name: 'Player 1',
    player2Name: 'Player 2',
  },
  buttonMappings: {},
  history: [],
  currentHistoryIndex: -1,
};

// Create the Zustand store
export const useBadmintonStore = create<BadmintonStore>()(
  devtools(
    persist(
      immer((set, get) => {
        // Helper function to capture current undoable state
        const captureUndoableState = (): UndoableState => {
          const state = get();
          return {
            player1Score: state.player1Score,
            player2Score: state.player2Score,
            player1Name: state.player1Name,
            player2Name: state.player2Name,
            gameOver: state.gameOver,
            winner: state.winner,
            positionFlags: {...state.positionFlags},
            servingTeam: state.servingTeam,
            settings: { ...state.settings }
          };
        };

        return {
          // Initial state
          ...initialState,

          // Undo functionality
          saveHistory: () => set((state) => {
            // Capture current state
            const currentState = captureUndoableState();

            // If we're in the middle of the history, remove future states
            if (state.currentHistoryIndex >= 0 && state.currentHistoryIndex < state.history.length - 1) {
              state.history = state.history.slice(0, state.currentHistoryIndex + 1);
            }

            // Add current state to history
            state.history.push(currentState);
            state.currentHistoryIndex = state.history.length - 1;
          }),

          canUndo: () => {
            const state = get();
            return state.currentHistoryIndex > 0;
          },

          undo: () => set((state) => {
            if (state.currentHistoryIndex > 0) {
              state.currentHistoryIndex--;
              const previousState = state.history[state.currentHistoryIndex];

              // Restore state from history (except settingsOpen and tempSettings)
              state.player1Score = previousState.player1Score;
              state.player2Score = previousState.player2Score;
              state.player1Name = previousState.player1Name;
              state.player2Name = previousState.player2Name;
              state.gameOver = previousState.gameOver;
              state.winner = previousState.winner;
              state.servingTeam = previousState.servingTeam;
              state.settings = { ...previousState.settings };
            }
          }),

          setSettings: (settings) => {
            set((state) => {
              state.settings = settings;
            })
            get().saveHistory();
          },

          // Complex actions
          handleSettingsChange: <K extends keyof BadmintonScoreSettings>(field: K, value: BadmintonScoreSettings[K]) => set((state) => {
            state.tempSettings[field] = value;
          }),

          handleScore: (scoringTeam) => {
            const state = get();
            if (state.gameOver) return;

            // Save history before making changes


            set((state) => {
              // For doubles match, track which team scored
              // If the scoring team is the serving team, they keep serving
              // Otherwise, the service changes to the scoring team
              if (scoringTeam !== state.servingTeam) {
                state.servingTeam = scoringTeam;
              } else {
                // Position swapping logic
                if (scoringTeam === TEAM_NAME.TEAM1) {
                  // Swap positions for team Q2Q3
                  state.positionFlags.p1 = !state.positionFlags.p1
                } else {
                  // Swap positions for team Q1Q4
                  state.positionFlags.p2 = !state.positionFlags.p2
                }
              }

              // Update the score in the same transaction
              if (scoringTeam === TEAM_NAME.TEAM1) {
                state.player1Score += 1;
              } else {
                state.player2Score += 1;
              }

              // Check win condition directly in this method
              const { maxScore, pointsToWin } = state.settings;
              const score1 = state.player1Score;
              const score2 = state.player2Score;
              const leading = score1 > score2 ? 1 : 2;
              const leadingScore = leading === 1 ? score1 : score2;
              const trailingScore = leading === 1 ? score2 : score1;

              if ((leadingScore >= maxScore) && ((leadingScore - trailingScore) >= pointsToWin)) {
                const winnerName = leading === 1 ? state.player1Name : state.player2Name;
                state.gameOver = true;
                state.winner = winnerName;
              }
            });

            get().saveHistory();
          },

          resetGame: () => set((state) => {
            state.player1Score = 0;
            state.player2Score = 0;
            state.gameOver = false;
            state.winner = '';
            state.positionFlags = initialState.positionFlags
            state.saveHistory();
          }),

          // Complete reset function that resets the entire store to initial values
          resetStore: () => set(initialState),

          handleOpenSettings: () => set((state) => {
            state.tempSettings = { ...state.settings };
            state.settingsOpen = true;
          }),

          handleCloseSettings: () => set((state) => {
            state.settingsOpen = false;
          }),

          handleSaveSettings: () => {
            set((state) => {
              state.settings = { ...state.tempSettings };
              state.player1Name = state.tempSettings.player1Name;
              state.player2Name = state.tempSettings.player2Name;
              state.settingsOpen = false;
              state.saveHistory(); // Moved saveHistory to after state changes
            });
            get().resetGame();
          },

          // New action to swap the serving team
          swapServingTeam: () => {
            const state = get();
            // Only swap if both scores are 0
            if (state.player1Score === 0 && state.player2Score === 0) {
              set((state) => {
                state.servingTeam = state.servingTeam === TEAM_NAME.TEAM1 ? TEAM_NAME.TEAM2 : TEAM_NAME.TEAM1;
              });
            }
          },

          swapCourt: () => {
            const state = get();
            // Only swap if both scores are 0
            if (state.player1Score === 0 && state.player2Score === 0) {
              set((state) => {
                state.positionFlags.courtPos = !state.positionFlags.courtPos
              });
            }
          },

          // Gamepad action methods
          updateButtonMapping: (buttonIndex: number, action: TGamePadAction) => {
            set((state) => {
              state.buttonMappings[buttonIndex] = action;
              state.saveHistory();
            });
          },

          dispatchGamepadAction: (action: TGamePadAction) => {
            const state = get();
            switch (action) {
              case GAMEPAD_ACTIONS.UNDO:
                if (state.canUndo()) {
                  state.undo();
                }
                break;
              case GAMEPAD_ACTIONS.TEAM1_SCORES:
                state.handleScore(TEAM_NAME.TEAM1);
                break;
              case GAMEPAD_ACTIONS.TEAM2_SCORES:
                state.handleScore(TEAM_NAME.TEAM2);
                break;
              case GAMEPAD_ACTIONS.SWAP_SERVE:
                state.swapServingTeam()
                break;
              case GAMEPAD_ACTIONS.SWAP_COURT:
                state.swapCourt()
                break;
            }
          }
        };
      }),
      {
        name: 'badminton-score-storage',
        // Don't persist undo history
        partialize: (state) => ({
          ...state,
          tempSettings: state.settings,
          history: [],
          currentHistoryIndex: -1,
          settingsOpen: false, // Don't persist dialog state
        }),
      }
    )
  )
);