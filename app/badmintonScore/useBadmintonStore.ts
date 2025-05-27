import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { BadmintonScoreSettings, CourtPosition, PlayerColor } from './types';
import { initialPositions, T_TEAMS, TEAM_NAME } from './constants';

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
  
  // Actions
  setPlayer1Score: (score: number) => void;
  setPlayer2Score: (score: number) => void;
  setPlayer1Name: (name: string) => void;
  setPlayer2Name: (name: string) => void;
  setGameOver: (gameOver: boolean) => void;
  setWinner: (winner: string) => void;
  setPositions: (positions: Record<CourtPosition, PlayerColor>) => void;
  setServingTeam: (team: T_TEAMS) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettings: (settings: BadmintonScoreSettings) => void;
  setTempSettings: (settings: BadmintonScoreSettings) => void;
  handleSettingsChange: <K extends keyof BadmintonScoreSettings>(field: K, value: BadmintonScoreSettings[K]) => void;
  swapPosition: (scoringTeam: T_TEAMS) => void;
  handleScore: (scoringTeam: T_TEAMS) => void;
  checkWinCondition: (score1: number, score2: number) => void;
  resetGame: () => void;
  handleOpenSettings: () => void;
  handleCloseSettings: () => void;
  handleSaveSettings: () => void;
}

// Create the Zustand store
export const useBadmintonStore = create<BadmintonScoreState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
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

        // Basic setters
        setPlayer1Score: (score) => set((state) => { state.player1Score = score; }),
        setPlayer2Score: (score) => set((state) => { state.player2Score = score; }),
        setPlayer1Name: (name) => set((state) => { state.player1Name = name; }),
        setPlayer2Name: (name) => set((state) => { state.player2Name = name; }),
        setGameOver: (gameOver) => set((state) => { state.gameOver = gameOver; }),
        setWinner: (winner) => set((state) => { state.winner = winner; }),
        setPositions: (positions) => set((state) => { state.positions = positions; }),
        setServingTeam: (team) => set((state) => { state.servingTeam = team; }),
        setSettingsOpen: (open) => set((state) => { state.settingsOpen = open; }),
        setSettings: (settings) => set((state) => { state.settings = settings; }),
        setTempSettings: (settings) => set((state) => { state.tempSettings = settings; }),

        // Complex actions
        handleSettingsChange: <K extends keyof BadmintonScoreSettings>(field: K, value: BadmintonScoreSettings[K]) => set((state) => {
          state.tempSettings[field] = value;
        }),

        swapPosition: (scoringTeam) => set((state) => {
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
        }),

        checkWinCondition: (score1, score2) => {
          const state = get();
          const { maxScore, pointsToWin } = state.settings;
          const leading = score1 > score2 ? 1 : 2;
          const leadingScore = leading === 1 ? score1 : score2;
          const trailingScore = leading === 1 ? score2 : score1;
          
          if ((leadingScore >= maxScore) && ((leadingScore - trailingScore) >= pointsToWin)) {
            const winnerName = leading === 1 ? state.player1Name : state.player2Name;
            set((state) => {
              state.gameOver = true;
              state.winner = winnerName;
            });
          }
        },

        handleScore: (scoringTeam) => {
          const state = get();
          if (state.gameOver) return;

          // For doubles match, track which team scored
          if (state.settings.doubleMatch) {
            // If the scoring team is the serving team, they keep serving
            // Otherwise, the service changes to the scoring team
            if (scoringTeam !== state.servingTeam) {
              set((state) => { state.servingTeam = scoringTeam; });
            } else {
              state.swapPosition(scoringTeam);
            }
          }

          if (scoringTeam === TEAM_NAME.TEAM1) {
            const newScore = state.player1Score + 1;
            set((state) => { state.player1Score = newScore; });
            state.checkWinCondition(newScore, state.player2Score);
          } else {
            const newScore = state.player2Score + 1;
            set((state) => { state.player2Score = newScore; });
            state.checkWinCondition(state.player1Score, newScore);
          }
        },

        resetGame: () => set((state) => {
          state.player1Score = 0;
          state.player2Score = 0;
          state.gameOver = false;
          state.winner = '';
        }),

        handleOpenSettings: () => set((state) => {
          state.tempSettings = { ...state.settings };
          state.settingsOpen = true;
        }),

        handleCloseSettings: () => set((state) => {
          state.settingsOpen = false;
        }),

        handleSaveSettings: () => {
          const state = get();
          set((state) => {
            state.settings = { ...state.tempSettings };
            state.player1Name = state.tempSettings.player1Name;
            state.player2Name = state.tempSettings.player2Name;
            state.settingsOpen = false;
          });
          state.resetGame();
        }
      })),
      {
        name: 'badminton-score-storage'
      }
    )
  )
);