import { beforeEach, describe, expect, test } from '@jest/globals';
import { act } from '@testing-library/react';

import { CourtStatus, GameStatus, PlayerStatus } from './types';
import { useDoublesQueueStore } from './useDoublesQueueStore';
import { getInitialState } from './storeState';

const resetStore = () => {
  window.localStorage.clear();
  useDoublesQueueStore.setState({
    ...getInitialState(),
    undoStack: [],
    canUndo: false,
  });
};

describe('useDoublesQueueStore undo', () => {
  beforeEach(() => {
    resetStore();
  });

  test('undoes the most recent player addition', () => {
    act(() => {
      useDoublesQueueStore.getState().addPlayer('Alice');
    });

    expect(useDoublesQueueStore.getState().players).toHaveLength(1);
    expect(useDoublesQueueStore.getState().canUndo).toBe(true);

    act(() => {
      useDoublesQueueStore.getState().undoLastAction();
    });

    expect(useDoublesQueueStore.getState().players).toHaveLength(0);
    expect(useDoublesQueueStore.getState().canUndo).toBe(false);
  });

  test('restores an in-progress game when undoing completion', () => {
    act(() => {
      const store = useDoublesQueueStore.getState();
      store.initializeSession();
      ['Alice', 'Bob', 'Cara', 'Dylan'].forEach(name => store.addPlayer(name));
    });

    const playerIds = useDoublesQueueStore.getState().players.map(player => player.id);

    act(() => {
      const store = useDoublesQueueStore.getState();
      playerIds.forEach(playerId => store.joinQueue(playerId));
    });

    const preGameState = useDoublesQueueStore.getState();
    const match = preGameState.nextMatches[0];
    expect(match).toBeDefined();

    const courtId = preGameState.courts[0].id;
    let gameId = '';

    act(() => {
      const game = useDoublesQueueStore.getState().startGame(courtId, match!);
      gameId = game.id;
    });

    act(() => {
      useDoublesQueueStore.getState().completeGame(gameId, 1);
    });

    const completedState = useDoublesQueueStore.getState();
    expect(completedState.games.find(game => game.id === gameId)?.status).toBe(GameStatus.COMPLETED);
    expect(completedState.courts.find(court => court.id === courtId)?.status).toBe(CourtStatus.AVAILABLE);
    expect(completedState.currentSession.totalGames).toBe(1);

    act(() => {
      useDoublesQueueStore.getState().undoLastAction();
    });

    const restoredState = useDoublesQueueStore.getState();
    expect(restoredState.games.find(game => game.id === gameId)?.status).toBe(GameStatus.IN_PROGRESS);
    expect(restoredState.courts.find(court => court.id === courtId)?.status).toBe(CourtStatus.OCCUPIED);
    expect(restoredState.currentSession.totalGames).toBe(0);

    const activePlayers = restoredState.players.filter(player => match!.playerIds.includes(player.id));
    expect(activePlayers).toHaveLength(4);
    expect(activePlayers.every(player => player.status === PlayerStatus.PLAYING)).toBe(true);
  });
});