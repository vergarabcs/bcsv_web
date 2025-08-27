import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { BadmintonScoreSettings, CourtPosition, GAMEPAD_ACTIONS, PlayerColor, TGamePadAction } from './types';
import { T_TEAMS, TEAM_NAME } from './constants';
import { PositionFlags } from '../types';
import { State } from 'aws-cdk-lib/aws-stepfunctions';

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

  // Input controls
  buttonMappings: Record<number, TGamePadAction>;
  keyMappings: Record<string, TGamePadAction>; // New: keyboard mappings
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
  updateKeyMapping: (key: string, action: TGamePadAction) => void; // Add keyboard mapping
  dispatchGamepadAction: (action: TGamePadAction) => void;
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
  keyMappings: {}, // Initialize keyMappings
};

// Create the Zustand store
export const useBadmintonStore = create<BadmintonStore>()(
  devtools(
    persist(
      temporal(
        immer((set, get) => ({
          // Initial state
          ...initialState,

          setSettings: (settings) => {
            set((state) => {
              state.settings = settings;
            });
          },

          // Complex actions
          handleSettingsChange: <K extends keyof BadmintonScoreSettings>(field: K, value: BadmintonScoreSettings[K]) => set((state) => {
            state.tempSettings[field] = value;
          }),

          handleScore: (scoringTeam) => {
            const state = get();
            if (state.gameOver) return;

            set((state) => {
              // For doubles match, track which team scored
              // If the scoring team is the serving team, they keep serving
              // Otherwise, the service changes to the scoring team

              if (scoringTeam !== state.servingTeam) {
                state.servingTeam = scoringTeam;
              } else {
                // Position swapping logic
                if (scoringTeam === TEAM_NAME.TEAM1) {
                  // Swap positions for team TEAM1
                  state.positionFlags.p1 = !state.positionFlags.p1;
                } else {
                  // Swap positions for team TEAM2
                  state.positionFlags.p2 = !state.positionFlags.p2;
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
          },

          resetGame: () => set((state) => {
            state.player1Score = 0;
            state.player2Score = 0;
            state.gameOver = false;
            state.winner = '';
            state.positionFlags = initialState.positionFlags;
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
            set((state) => {
              state.positionFlags.courtPos = !state.positionFlags.courtPos;
            });

          },

          // Gamepad action methods
          updateButtonMapping: (buttonIndex: number, action: TGamePadAction) => {
            set((state) => {
              state.buttonMappings[buttonIndex] = action;
            });
          },

          // New method to update key mappings
          updateKeyMapping: (key: string, action: TGamePadAction) => {
            set((state) => {
              state.keyMappings[key] = action;
            });
          },

          dispatchGamepadAction: (action: TGamePadAction) => {
            const state = get();
            switch (action) {
              case GAMEPAD_ACTIONS.UNDO:
                // Use zundo's undo function
                useBadmintonStore.temporal.getState().undo();
                break;
              case GAMEPAD_ACTIONS.TEAM1_SCORES:
                state.handleScore(TEAM_NAME.TEAM1);
                break;
              case GAMEPAD_ACTIONS.TEAM2_SCORES:
                state.handleScore(TEAM_NAME.TEAM2);
                break;
              case GAMEPAD_ACTIONS.SWAP_SERVE:
                state.swapServingTeam();
                break;
              case GAMEPAD_ACTIONS.SWAP_COURT:
                state.swapCourt();
                break;
              case GAMEPAD_ACTIONS.RESET_GAME:
                state.resetGame();
            }
          }
        })),
        {
          // Configure zundo options
          partialize: (state: BadmintonStore) => ({
            player1Score: state.player1Score,
            player2Score: state.player2Score,
            player1Name: state.player1Name,
            player2Name: state.player2Name,
            gameOver: state.gameOver,
            winner: state.winner,
            positionFlags: state.positionFlags,
            servingTeam: state.servingTeam,
            settings: state.settings,
          }),
          limit: 100, // Limit the number of states stored in history
        }
      ),
      {
        name: 'badminton-score-storage',
        // Don't persist some temporary state
        partialize: (state) => ({
          ...state,
          tempSettings: state.settings,
          settingsOpen: false, // Don't persist dialog state
        }),
      }
    )
  )
);