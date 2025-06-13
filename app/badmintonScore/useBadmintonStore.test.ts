import { describe, expect, test, beforeEach } from '@jest/globals';
import { TEAM_NAME } from './constants';
import { useBadmintonStore } from './useBadmintonStore';

describe('BadmintonStore', () => {
  // Reset the useBadmintonStore before each test
  beforeEach(() => {
    useBadmintonStore.getState().resetStore();
  })

  describe('handleScore functionality', () => {
    test('should update score when team 1 scores', () => {
      // Get initial state
      const initialState = useBadmintonStore.getState();
      expect(initialState.player1Score).toBe(0);

      // Update the state
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);

      // Get the updated state
      const updatedState = useBadmintonStore.getState();

      // Verify score is updated
      expect(updatedState.player1Score).toBe(1);
      expect(updatedState.player2Score).toBe(0);

      // Verify history is recorded
      expect(updatedState.history.length).toBe(1);
      expect(updatedState.currentHistoryIndex).toBe(0);
    });

    test('should update score when team 2 scores', () => {
      // Update the state
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM2);

      // Get the updated state
      const updatedState = useBadmintonStore.getState();

      expect(updatedState.player1Score).toBe(0);
      expect(updatedState.player2Score).toBe(1);
    });

    test('should not update score when game is over', () => {

      // Try to update score
      while (!useBadmintonStore.getState().gameOver) {
        useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);
      }

      // Get the updated state
      const updatedState = useBadmintonStore.getState();

      expect(updatedState.player1Score).toBe(21);
      expect(updatedState.player2Score).toBe(0);

      // score should not update when game is over
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);
      expect(useBadmintonStore.getState().player1Score).toBe(21)
    });

    test('should end game when a team reaches max score with required lead', () => {


      // Set max score to 5 and points to win to 2 for easier testing
      useBadmintonStore.getState().setSettings({
        ...useBadmintonStore.getState().settings,
        maxScore: 5,
        pointsToWin: 2
      });

      // Player 1 scores to 5
      for (let i = 0; i < 5; i++) {
        useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);
      }

      // Get final state
      const finalState = useBadmintonStore.getState();

      // Game should be over
      expect(finalState.gameOver).toBe(true);
      expect(finalState.winner).toBe('Player 1');
    });

    test('should not end game when leading score equals max score but without required lead', () => {


      // Set max score to 5 and points to win to 2 for easier testing
      useBadmintonStore.getState().setSettings({
        ...useBadmintonStore.getState().settings,
        maxScore: 5,
        pointsToWin: 2
      });

      // Player 2 scores 4 points
      for (let i = 0; i < 4; i++) {
        useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM2);
      }

      // Player 1 scores 5 points
      for (let i = 0; i < 5; i++) {
        useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);
      }

      // Get final state
      const finalState = useBadmintonStore.getState();

      // Game should not be over as the lead is only 1 point
      expect(finalState.gameOver).toBe(false);
      expect(finalState.winner).toBe('');
    });

    test('should end game when leading score exceeds max score with required lead', () => {


      // Set max score to 5 and points to win to 2 for easier testing
      useBadmintonStore.getState().setSettings({
        ...useBadmintonStore.getState().settings,
        maxScore: 5,
        pointsToWin: 2
      });

      // Player 2 scores 4 points
      for (let i = 0; i < 4; i++) {
        useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM2);
      }

      // Player 1 scores 6 points
      for (let i = 0; i < 6; i++) {
        useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);
      }

      // Get final state
      const finalState = useBadmintonStore.getState();

      // Game should be over as Player 1 has a 2-point lead and exceeded max score
      expect(finalState.gameOver).toBe(true);
      expect(finalState.winner).toBe('Player 1');
    });
  });

  describe('undo functionality', () => {
    test('should save history when score is updated', () => {


      // Update the score
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);

      // Get updated state
      const updatedState = useBadmintonStore.getState();

      expect(updatedState.history.length).toBe(1);
      expect(updatedState.currentHistoryIndex).toBe(0);
    });

    test('should not be able to undo when there is no history', () => {


      // Check if can undo
      const canUndo = useBadmintonStore.getState().canUndo();

      expect(canUndo).toBe(false);
    });

    test('should be able to undo after action is performed', () => {


      // Perform an action
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);

      // Check if can undo after first action
      const canUndoAfterFirstAction = useBadmintonStore.getState().canUndo();
      expect(canUndoAfterFirstAction).toBe(false); // First action can't be undone yet

      // Perform another action
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM2);

      // Check if can undo after second action
      const canUndoAfterSecondAction = useBadmintonStore.getState().canUndo();
      expect(canUndoAfterSecondAction).toBe(true); // Now we can undo
    });

    test('should restore previous state when undo is called, score 1 0', () => {

      // Perform initial action
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);

      // Check initial action state
      const stateAfterSecondAction = useBadmintonStore.getState();
      expect(stateAfterSecondAction.player1Score).toBe(1);
      expect(stateAfterSecondAction.player2Score).toBe(0);
      
      // Undo first action
      useBadmintonStore.getState().undo();

      // Get state after undo
      const stateAfterUndo = useBadmintonStore.getState();

      // Should restore state after first action
      expect(stateAfterUndo.player1Score).toBe(0);
      expect(stateAfterUndo.player2Score).toBe(0);
    });

    test('should restore previous state when undo is called, score 1 1', () => {


      // Perform initial action
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);

      // Check initial action state
      const stateAfterFirstAction = useBadmintonStore.getState();
      expect(stateAfterFirstAction.player1Score).toBe(1);

      // Perform second action
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM2);

      // Check second action state
      const stateAfterSecondAction = useBadmintonStore.getState();
      expect(stateAfterSecondAction.player1Score).toBe(1);
      expect(stateAfterSecondAction.player2Score).toBe(1);

      // Undo second action
      useBadmintonStore.getState().undo();

      // Get state after undo
      const stateAfterUndo = useBadmintonStore.getState();

      // Should restore state after first action
      expect(stateAfterUndo.player1Score).toBe(1);
      expect(stateAfterUndo.player2Score).toBe(0);
    });

    test('should save history when settings are updated', () => {


      // Update settings
      useBadmintonStore.getState().setSettings({
        ...useBadmintonStore.getState().settings,
        maxScore: 11
      });

      // Get updated state
      const updatedState = useBadmintonStore.getState();

      expect(updatedState.history.length).toBe(1);
    });

    test('should properly restore settings when undoing', () => {


      // Get initial state
      const initialState = useBadmintonStore.getState();
      const originalMaxScore = initialState.settings.maxScore;

      // Perform an initial action
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1);

      // Change settings
      useBadmintonStore.getState().setSettings({
        ...useBadmintonStore.getState().settings,
        maxScore: 11
      });

      // Undo settings change
      useBadmintonStore.getState().undo();

      // Get state after undo
      const stateAfterUndo = useBadmintonStore.getState();

      // Settings should be restored
      expect(stateAfterUndo.settings.maxScore).toBe(originalMaxScore);
    });

    test('should trim future history when action is performed after undo', () => {


      // Perform initial actions
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1); // Player 1: 1, Player 2: 0
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1); // Player 1: 2, Player 2: 0
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM2); // Player 1: 2, Player 2: 1

      // Undo last action
      useBadmintonStore.getState().undo();

      // Get state after undo
      const stateAfterUndo = useBadmintonStore.getState();
      expect(stateAfterUndo.player1Score).toBe(2);
      expect(stateAfterUndo.player2Score).toBe(0);

      // Perform new action after undo
      useBadmintonStore.getState().handleScore(TEAM_NAME.TEAM1); // Player 1: 3, Player 2: 0

      // Get state after new action
      const finalState = useBadmintonStore.getState();

      // History should be trimmed and new action should be added
      expect(finalState.history.length).toBe(3);
      expect(finalState.player1Score).toBe(3);
      expect(finalState.player2Score).toBe(0);

      // Should not be able to redo the original action
      useBadmintonStore.getState().undo(); // Go back to Player 1: 2, Player 2: 0
      const stateAfterFirstUndo = useBadmintonStore.getState();
      expect(stateAfterFirstUndo.player1Score).toBe(2);

      useBadmintonStore.getState().undo(); // Go back to Player 1: 1, Player 2: 0
      const stateAfterSecondUndo = useBadmintonStore.getState();
      expect(stateAfterSecondUndo.player1Score).toBe(1);

      // No more history to go back
      const canUndoFurther = useBadmintonStore.getState().canUndo();
      expect(canUndoFurther).toBe(false);
    });
  });
});