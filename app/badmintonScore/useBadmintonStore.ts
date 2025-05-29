import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { BadmintonScoreSettings, CourtPosition, PlayerColor } from './types';
import { initialPositions, T_TEAMS, TEAM_NAME } from './constants';

// Type for the state that can be undone
interface UndoableState {
  player1Score: number;
  player2Score: number;
  player1Name: string;
  player2Name: string;
  gameOver: boolean;
  winner: string;
  positions: Record<CourtPosition, PlayerColor>;
  servingTeam: T_TEAMS;
  settings: BadmintonScoreSettings;
}

// Define the state interface
interface BadmintonScoreState {
  // Score state
  player1Score: number;
  player2Score: number;
  player1Name: string;
  player2Name: string;
  gameOver: boolean;
  winner: string;
  positions: Record<CourtPosition, PlayerColor>;
  
  // Court layout state
  servingTeam: T_TEAMS;

  // Settings state
  settingsOpen: boolean;
  settings: BadmintonScoreSettings;
  tempSettings: BadmintonScoreSettings;
  
  // Undo history
  history: UndoableState[];
  currentHistoryIndex: number;
  
  // Actions
  setPlayer1Score: (score: number) => void;
  setPlayer2Score: (score: number) => void;
  setPlayer1Name: (name: string) => void;
  setPlayer2Name: (name: string) => void;
  setGameOver: (gameOver: boolean) => void;
  setWinner: (winner: string) => void;
  setServingTeam: (team: T_TEAMS) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettings: (settings: BadmintonScoreSettings) => void;
  handleSettingsChange: <K extends keyof BadmintonScoreSettings>(field: K, value: BadmintonScoreSettings[K]) => void;
  handleScore: (scoringTeam: T_TEAMS) => void;
  resetGame: () => void;
  resetStore: () => void;  // Added resetStore function
  handleOpenSettings: () => void;
  handleCloseSettings: () => void;
  handleSaveSettings: () => void;
  
  // Undo functionality
  saveHistory: () => void;
  canUndo: () => boolean;
  undo: () => void;
}

// Initial state definition
const initialState = {
  player1Score: 0,
  player2Score: 0,
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  gameOver: false,
  winner: '',
  positions: initialPositions,
  servingTeam: TEAM_NAME.TEAM2,
  settingsOpen: false,
  settings: {
    maxScore: 21,
    pointsToWin: 2,
    bestOf: 3,
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    swapSides: true,
    showCourtLayout: true,
    doubleMatch: true
  },
  tempSettings: {
    maxScore: 21,
    pointsToWin: 2,
    bestOf: 3,
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    swapSides: true,
    showCourtLayout: true,
    doubleMatch: true
  },
  history: [],
  currentHistoryIndex: -1,
};

// Create the Zustand store
export const useBadmintonStore = create<BadmintonScoreState>()(
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
            positions: { ...state.positions },
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
              state.positions = { ...previousState.positions };
              state.servingTeam = previousState.servingTeam;
              state.settings = { ...previousState.settings };
            }
          }),

          // Basic setters - modified to save history
          setGameOver: (gameOver) => set((state) => { 
            state.gameOver = gameOver;
            state.saveHistory();
          }),
          setPlayer1Name: (name) => set((state) => { 
            state.player1Name = name; 
            state.saveHistory();
          }),
          setPlayer1Score: (score) => set((state) => { 
            state.player1Score = score;
            state.saveHistory(); 
          }),
          setPlayer2Name: (name) => set((state) => { 
            state.player2Name = name;
            state.saveHistory(); 
          }),
          setPlayer2Score: (score) => set((state) => { 
            state.player2Score = score;
            state.saveHistory(); 
          }),
          setSettings: (settings) => set((state) => { 
            state.settings = settings;
            state.saveHistory(); 
          }),
          
          // These are exempt from undo/redo
          setSettingsOpen: (open) => set((state) => { state.settingsOpen = open; }),
          
          setWinner: (winner) => set((state) => { 
            state.winner = winner;
            state.saveHistory(); 
          }),

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
              if (state.settings.doubleMatch) {
                // If the scoring team is the serving team, they keep serving
                // Otherwise, the service changes to the scoring team
                if (scoringTeam !== state.servingTeam) {
                  state.servingTeam = scoringTeam;
                } else {
                  // Position swapping logic
                  if (scoringTeam === TEAM_NAME.TEAM1) {
                    // Swap positions for team Q1Q4
                    const tempQ1 = state.positions.Q1;
                    state.positions.Q1 = state.positions.Q4;
                    state.positions.Q4 = tempQ1;
                  } else {
                    // Swap positions for team Q2Q3
                    const tempQ2 = state.positions.Q2;
                    state.positions.Q2 = state.positions.Q3;
                    state.positions.Q3 = tempQ2;
                  }
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
          }
        };
      }),
      {
        name: 'badminton-score-storage',
        // Don't persist undo history
        partialize: (state) => ({
          ...state,
          history: [],
          currentHistoryIndex: -1,
          settingsOpen: false, // Don't persist dialog state
        }),
      }
    )
  )
);