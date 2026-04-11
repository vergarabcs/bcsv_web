import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act } from '@testing-library/react';

import { CourtStatus, DEFAULT_SETTINGS, Game, GameStatus, Player, PlayerStatus, QueuePriorityScheme } from './types';
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

    expect(aliceEntry?.waitTimeScore).toBeCloseTo(dylanEntry?.waitTimeScore ?? 0, 3);
    expect(aliceEntry?.priority).toBeCloseTo(dylanEntry?.priority ?? 0, 3);
  });

  test('wait time score uses the most recent player activity time', () => {
    const activityTime = new Date(Date.now() - 10 * 60 * 1000);
    const createWaitingPlayer = (
      id: string,
      name: string,
      extraFields: Partial<Player> = {}
    ): Player => ({
      id,
      name,
      rating: 1500,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      status: PlayerStatus.WAITING,
      ...extraFields,
    });

    const players = [
      createWaitingPlayer('a', 'Alice', { lastGameTime: activityTime }),
      createWaitingPlayer('b', 'Bea', { joinedQueueTime: activityTime }),
    ];

    const queueEntries = new QueueManager().generateQueueEntries(
      players,
      new Map([
        ['a', 1],
        ['b', 1],
      ])
    );

    const aliceEntry = queueEntries.find(entry => entry.playerId === 'a');
    const beaEntry = queueEntries.find(entry => entry.playerId === 'b');

    expect(aliceEntry?.waitTimeScore).toBeGreaterThan(0);
    expect(aliceEntry?.waitTimeScore).toBeCloseTo(beaEntry?.waitTimeScore ?? 0, 3);
    expect(aliceEntry?.priority).toBeCloseTo(beaEntry?.priority ?? 0, 3);
  });

  test('games played priority favors players with fewer session games', () => {
    const createWaitingPlayer = (id: string, name: string): Player => ({
      id,
      name,
      rating: 1500,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      status: PlayerStatus.WAITING,
    });

    const players = [
      createWaitingPlayer('a', 'Alice'),
      createWaitingPlayer('b', 'Bea'),
      createWaitingPlayer('c', 'Cara'),
    ];

    const queueEntries = new QueueManager({
      ...DEFAULT_SETTINGS,
      queuePriorityScheme: QueuePriorityScheme.GAMES_PLAYED,
    }).generateQueueEntries(
      players,
      new Map([
        ['a', 0],
        ['b', 3],
        ['c', 1],
      ])
    );

    expect(queueEntries.map(entry => entry.playerId)).toEqual(['a', 'c', 'b']);
  });

  test('games played priority uses wait time to break ties', () => {
    const olderJoinTime = new Date(Date.now() - 15 * 60 * 1000);
    const newerJoinTime = new Date(Date.now() - 5 * 60 * 1000);

    const createWaitingPlayer = (id: string, name: string, joinedQueueTime: Date): Player => ({
      id,
      name,
      rating: 1500,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      joinedQueueTime,
      status: PlayerStatus.WAITING,
    });

    const players = [
      createWaitingPlayer('a', 'Alice', olderJoinTime),
      createWaitingPlayer('b', 'Bea', newerJoinTime),
      createWaitingPlayer('c', 'Cara', newerJoinTime),
    ];

    const queueEntries = new QueueManager({
      ...DEFAULT_SETTINGS,
      queuePriorityScheme: QueuePriorityScheme.GAMES_PLAYED,
    }).generateQueueEntries(
      players,
      new Map([
        ['a', 1],
        ['b', 1],
        ['c', 2],
      ])
    );

    expect(queueEntries.map(entry => entry.playerId)).toEqual(['a', 'b', 'c']);
  });

  test('final match selection ignores individual priority once candidate players are chosen', () => {
    const createWaitingPlayer = (id: string, name: string, rating: number): Player => ({
      id,
      name,
      rating,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      status: PlayerStatus.WAITING,
    });

    const players = [
      createWaitingPlayer('a', 'Alice', 1500),
      createWaitingPlayer('b', 'Bea', 1500),
      createWaitingPlayer('c', 'Cara', 1500),
      createWaitingPlayer('d', 'Dylan', 1500),
      createWaitingPlayer('e', 'Eli', 1300),
      createWaitingPlayer('f', 'Finn', 1400),
    ];

    const queueEntries = [
      { playerId: 'e', priority: 1000, waitTimeScore: 1000 },
      { playerId: 'f', priority: 1000, waitTimeScore: 1000 },
      { playerId: 'a', priority: 0, waitTimeScore: 0 },
      { playerId: 'b', priority: 0, waitTimeScore: 0 },
      { playerId: 'c', priority: 0, waitTimeScore: 0 },
      { playerId: 'd', priority: 0, waitTimeScore: 0 },
    ];

    const match = new QueueManager().findBestMatch(queueEntries, players, []);

    expect(match).toBeDefined();
    expect([...(match?.playerIds ?? [])].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(match?.ratingDifference).toBe(0);
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

  test('changing queue priority scheme refreshes queue entries', () => {
    const olderJoinTime = new Date(Date.now() - 15 * 60 * 1000);
    const newerJoinTime = new Date(Date.now() - 5 * 60 * 1000);

    useDoublesQueueStore.setState(state => ({
      ...state,
      currentSession: {
        ...state.currentSession,
        isActive: true,
        gamesPlayed: new Map([
          ['a', 3],
          ['b', 0],
        ]),
      },
      players: [
        {
          id: 'a',
          name: 'Alice',
          rating: 1500,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          currentStreak: 0,
          joinedQueueTime: olderJoinTime,
          status: PlayerStatus.WAITING,
        },
        {
          id: 'b',
          name: 'Bea',
          rating: 1500,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          currentStreak: 0,
          joinedQueueTime: newerJoinTime,
          status: PlayerStatus.WAITING,
        },
      ],
    }));

    act(() => {
      useDoublesQueueStore.getState().refreshQueue();
    });

    expect(useDoublesQueueStore.getState().queueEntries.map(entry => entry.playerId)).toEqual(['a', 'b']);

    act(() => {
      useDoublesQueueStore.getState().updateSettings({
        queuePriorityScheme: QueuePriorityScheme.GAMES_PLAYED,
      });
    });

    expect(useDoublesQueueStore.getState().queueEntries.map(entry => entry.playerId)).toEqual(['b', 'a']);
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

  test('simulates a 3 hour session with one 1-hour-late arrival and one 1-hour-early departure', () => {
    jest.useFakeTimers();

    try {
      const sessionStart = new Date('2026-04-11T18:00:00.000Z');
      jest.setSystemTime(sessionStart);

      act(() => {
        const store = useDoublesQueueStore.getState();
        store.initializeSession();
        store.updateSettings({
          kFactorNew: 0, 
          kFactorExperienced: 0,
          queuePriorityScheme: QueuePriorityScheme.GAMES_PLAYED
        });

        for (let index = 1; index <= 18; index += 1) {
          store.addPlayer(`Player ${index}`, 1500);
        }
      });

      const playerIdsByName = new Map(
        useDoublesQueueStore.getState().players.map(player => [player.name, player.id])
      );
      const latePlayerId = playerIdsByName.get('Player 18');
      const earlyDeparturePlayerId = playerIdsByName.get('Player 17');

      expect(latePlayerId).toBeDefined();
      expect(earlyDeparturePlayerId).toBeDefined();

      act(() => {
        const store = useDoublesQueueStore.getState();

        for (let index = 1; index <= 17; index += 1) {
          const playerId = playerIdsByName.get(`Player ${index}`);
          if (playerId) {
            store.joinQueue(playerId);
          }
        }
      });

      const roundDurationMs = 20 * 60 * 1000;
      const rounds = 9;

      for (let round = 0; round < rounds; round += 1) {
        if (round === 3 && latePlayerId) {
          act(() => {
            useDoublesQueueStore.getState().joinQueue(latePlayerId);
          });
        }

        if (round === 6 && earlyDeparturePlayerId) {
          act(() => {
            useDoublesQueueStore.getState().leaveQueue(earlyDeparturePlayerId);
          });
        }

        let startedGames: Game[] = [];
        act(() => {
          const store = useDoublesQueueStore.getState();
          const games = [] as ReturnType<typeof store.startGame>[];

          for (let courtIndex = 0; courtIndex < 2; courtIndex += 1) {
            const currentStore = useDoublesQueueStore.getState();
            const availableCourt = currentStore.courts.find(court => court.status === CourtStatus.AVAILABLE);
            const nextMatch = currentStore.nextMatches[0];

            expect(availableCourt).toBeDefined();
            expect(nextMatch).toBeDefined();

            games.push(currentStore.startGame(availableCourt!.id, nextMatch!));
          }

          startedGames = games;
        });

        jest.setSystemTime(new Date(sessionStart.getTime() + (round + 1) * roundDurationMs));

        act(() => {
          const store = useDoublesQueueStore.getState();

          startedGames.forEach((game, gameIndex) => {
            const winningTeam = ((round + gameIndex) % 2 === 0 ? 1 : 2) as 1 | 2;
            store.completeGame(game.id, winningTeam);

            [
              game.team1.player1.id,
              game.team1.player2.id,
              game.team2.player1.id,
              game.team2.player2.id,
            ].forEach(playerId => {
              store.joinQueue(playerId);
            });
          });
        });
      }

      const finalState = useDoublesQueueStore.getState();
      const gameCounts = Object.fromEntries(
        [...finalState.players]
          .map(player => [player.name, player.gamesPlayed])
          .sort(([leftName], [rightName]) => leftName.localeCompare(rightName, undefined, { numeric: true }))
      );

      console.log('3-hour simulation game counts:', gameCounts);

      expect(finalState.currentSession.totalGames).toBe(18);
      expect(Object.values(gameCounts).reduce((sum, gamesPlayed) => sum + gamesPlayed, 0)).toBe(72);
      expect(gameCounts['Player 18']).toBeDefined();
      expect(gameCounts['Player 17']).toBeDefined();
    } finally {
      jest.useRealTimers();
    }
  });
});