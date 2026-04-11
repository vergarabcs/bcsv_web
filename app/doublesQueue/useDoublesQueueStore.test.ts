import { beforeEach, describe, expect, test } from '@jest/globals';
import { act } from '@testing-library/react';

import { CourtStatus, GameStatus, Player, PlayerStatus } from './types';
import { QueueManager } from './algorithms';
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

  test('individual queue priority ignores balance score differences', () => {
    const joinedQueueTime = new Date(Date.now() - 10 * 60 * 1000);
    const createWaitingPlayer = (id: string, name: string, rating: number): Player => ({
      id,
      name,
      rating,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      joinedQueueTime,
      status: PlayerStatus.WAITING,
    });

    const players = [
      createWaitingPlayer('a', 'Alice', 1500),
      createWaitingPlayer('b', 'Bea', 1510),
      createWaitingPlayer('c', 'Cara', 1490),
      createWaitingPlayer('d', 'Dylan', 1900),
    ];

    const queueEntries = new QueueManager().generateQueueEntries(players, new Map());
    const aliceEntry = queueEntries.find(entry => entry.playerId === 'a');
    const dylanEntry = queueEntries.find(entry => entry.playerId === 'd');

    expect(aliceEntry?.waitTimeScore).toBe(dylanEntry?.waitTimeScore);
    expect(aliceEntry?.priority).toBe(dylanEntry?.priority);
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