import { 
  Player, 
  Team,
  Game, 
  Court, 
  QueueEntry,
  MatchSuggestion,
  MatchTeam,
  PartnershipHistory,
  PlayerStatus,
  GameStatus,
  CourtStatus,
} from './types';
import { RatingSystem } from './algorithms';
import { getMostRecentPlayerActivityTime } from './playerActivity';

// ID Generation
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Factory Functions
export const createPlayer = (name: string, rating: number = 1500): Player => ({
  id: generateId(),
  name,
  rating,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  status: PlayerStatus.INACTIVE
});

export const createCourt = (name: string): Court => ({
  id: generateId(),
  name,
  status: CourtStatus.AVAILABLE
});

// Date Utilities
export const today = () => new Date().toISOString().split('T')[0];

export { getMostRecentPlayerActivityTime };

// Data Transformation Helpers
export const toGamesPlayedMap = (value: unknown): Map<string, number> => {
  if (value instanceof Map) {
    return new Map(value);
  }

  if (Array.isArray(value)) {
    return new Map(
      value
        .filter(
          (entry): entry is [string, number] =>
            Array.isArray(entry) &&
            entry.length >= 2 &&
            typeof entry[0] === 'string' &&
            typeof entry[1] === 'number'
        )
        .map(([playerId, gamesCount]) => [playerId, gamesCount])
    );
  }

  if (value && typeof value === 'object') {
    return new Map(
      Object.entries(value)
        .filter(([, gamesCount]) => typeof gamesCount === 'number')
        .map(([playerId, gamesCount]) => [playerId, gamesCount])
    );
  }

  return new Map();
};

export const toGameDurationMap = (value: unknown): Map<string, number> => {
  if (value instanceof Map) {
    return new Map(value);
  }

  if (Array.isArray(value)) {
    return new Map(
      value
        .filter(
          (entry): entry is [string, number] =>
            Array.isArray(entry) &&
            entry.length >= 2 &&
            typeof entry[0] === 'string' &&
            typeof entry[1] === 'number'
        )
        .map(([playerId, durationMs]) => [playerId, durationMs])
    );
  }

  if (value && typeof value === 'object') {
    return new Map(
      Object.entries(value)
        .filter(([, durationMs]) => typeof durationMs === 'number')
        .map(([playerId, durationMs]) => [playerId, durationMs])
    );
  }

  return new Map();
};

export const toWaitDurationMap = (value: unknown): Map<string, number> => {
  if (value instanceof Map) {
    return new Map(value);
  }

  if (Array.isArray(value)) {
    return new Map(
      value
        .filter(
          (entry): entry is [string, number] =>
            Array.isArray(entry) &&
            entry.length >= 2 &&
            typeof entry[0] === 'string' &&
            typeof entry[1] === 'number'
        )
        .map(([playerId, durationMs]) => [playerId, durationMs])
    );
  }

  if (value && typeof value === 'object') {
    return new Map(
      Object.entries(value)
        .filter(([, durationMs]) => typeof durationMs === 'number')
        .map(([playerId, durationMs]) => [playerId, durationMs])
    );
  }

  return new Map();
};

export const formatDurationMs = (durationMs: number): string => {
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};

export const stripPlayerHistory = (player: Player): Player => ({
  ...player
});

export const getBaselinePlayer = (player: Player): Player => {
  return {
    ...player,
    currentStreak: 0,
    lastGameTime: undefined
  };
};

export const derivePartnershipHistoryFromGames = (games: Game[]): PartnershipHistory[] => {
  const completedGames = games
    .filter((game): game is Game & { team1: Team; team2: Team } => (
      game.status === GameStatus.COMPLETED
    ))
    .sort((a, b) => {
      const aTime = a.endTime?.getTime() ?? a.startTime.getTime();
      const bTime = b.endTime?.getTime() ?? b.startTime.getTime();
      return aTime - bTime;
    });

  const partnershipByKey = new Map<string, PartnershipHistory>();

  completedGames.forEach(game => {
    const completedAt = game.endTime ?? game.startTime;
    const pairs: Array<[string, string]> = [
      [game.team1.player1.id, game.team1.player2.id],
      [game.team2.player1.id, game.team2.player2.id]
    ];

    pairs.forEach(([playerA, playerB]) => {
      const [player1Id, player2Id] = [playerA, playerB].sort();
      const key = `${player1Id}|${player2Id}`;
      const existing = partnershipByKey.get(key);

      if (existing) {
        existing.gameIds.push(game.id);
        existing.lastPlayedTogether = completedAt;
        return;
      }

      partnershipByKey.set(key, {
        player1Id,
        player2Id,
        gameIds: [game.id],
        lastPlayedTogether: completedAt
      });
    });
  });

  return Array.from(partnershipByKey.values());
};

export const rebuildPlayersFromGames = (
  players: Player[],
  games: Game[],
  ratingSystem: RatingSystem
): Player[] => {
  const playersById = new Map(
    players.map(player => [player.id, getBaselinePlayer(player)])
  );

  const completedGames = [...games]
    .filter((game): game is Game & { winner: 1 | 2 } => (
      game.status === GameStatus.COMPLETED && (game.winner === 1 || game.winner === 2)
    ))
    .sort((a, b) => {
      const aTime = a.endTime?.getTime() ?? a.startTime.getTime();
      const bTime = b.endTime?.getTime() ?? b.startTime.getTime();
      return aTime - bTime;
    });

  completedGames.forEach(game => {
    const ratingChanges = ratingSystem.calculateGameRatings(game, game.winner);
    const participantUpdates = [
      {
        playerId: game.team1.player1.id,
        ratingChange: ratingChanges.team1Changes[0],
        won: game.winner === 1,
      },
      {
        playerId: game.team1.player2.id,
        ratingChange: ratingChanges.team1Changes[1],
        won: game.winner === 1,
      },
      {
        playerId: game.team2.player1.id,
        ratingChange: ratingChanges.team2Changes[0],
        won: game.winner === 2,
      },
      {
        playerId: game.team2.player2.id,
        ratingChange: ratingChanges.team2Changes[1],
        won: game.winner === 2,
      }
    ];

    participantUpdates.forEach(({ playerId, ratingChange, won }) => {
      const player = playersById.get(playerId);
      if (!player) {
        return;
      }

      const oldRating = player.rating;
      const newRating = Math.max(1000, Math.min(3000, oldRating + ratingChange.ratingChange));
      const nextStreak = won
        ? (player.currentStreak >= 0 ? player.currentStreak + 1 : 1)
        : (player.currentStreak <= 0 ? player.currentStreak - 1 : -1);
      const completedAt = game.endTime ?? game.startTime;

      playersById.set(playerId, {
        ...player,
        rating: newRating,
        gamesPlayed: player.gamesPlayed + 1,
        wins: won ? player.wins + 1 : player.wins,
        losses: won ? player.losses : player.losses + 1,
        currentStreak: nextStreak,
        lastGameTime: completedAt
      });
    });
  });

  return players.map(player => playersById.get(player.id) ?? player);
};

// Persistence/Normalization Helpers
export const normalizePersistedQueueEntry = (entry: any): QueueEntry | null => {
  const playerId =
    typeof entry?.playerId === 'string'
      ? entry.playerId
      : typeof entry?.player?.id === 'string'
        ? entry.player.id
        : null;

  if (!playerId) {
    return null;
  }

  return {
    playerId,
    priority: typeof entry?.priority === 'number' ? entry.priority : 0,
    waitTimeScore: typeof entry?.waitTimeScore === 'number' ? entry.waitTimeScore : 0
  };
};

export const normalizePersistedMatchTeam = (team: any): MatchTeam | null => {
  const player1Id =
    typeof team?.player1Id === 'string'
      ? team.player1Id
      : typeof team?.player1?.id === 'string'
        ? team.player1.id
        : null;
  const player2Id =
    typeof team?.player2Id === 'string'
      ? team.player2Id
      : typeof team?.player2?.id === 'string'
        ? team.player2.id
        : null;

  if (!player1Id || !player2Id) {
    return null;
  }

  return {
    player1Id,
    player2Id,
    averageRating: typeof team?.averageRating === 'number' ? team.averageRating : 0
  };
};

export const normalizePersistedMatchSuggestion = (match: any): MatchSuggestion | null => {
  const playerIds = Array.isArray(match?.playerIds)
    ? match.playerIds.filter((playerId: unknown): playerId is string => typeof playerId === 'string')
    : Array.isArray(match?.players)
      ? match.players
          .map((player: any) => (typeof player?.id === 'string' ? player.id : null))
          .filter((playerId: string | null): playerId is string => !!playerId)
      : [];

  const teams = Array.isArray(match?.teams)
    ? match.teams
        .map(normalizePersistedMatchTeam)
        .filter((team: MatchTeam | null): team is MatchTeam => !!team)
    : [];

  if (playerIds.length !== 4 || teams.length !== 2) {
    return null;
  }

  return {
    playerIds: playerIds as [string, string, string, string],
    teams: teams as [MatchTeam, MatchTeam],
    balanceQuality: typeof match?.balanceQuality === 'number' ? match.balanceQuality : 0,
    totalPriority: typeof match?.totalPriority === 'number' ? match.totalPriority : 0,
    ratingDifference: typeof match?.ratingDifference === 'number' ? match.ratingDifference : 0
  };
};

// Type Resolution Helpers
export const resolveMatchTeam = (matchTeam: MatchTeam, playersById: Map<string, Player>): Team | null => {
  const player1 = playersById.get(matchTeam.player1Id);
  const player2 = playersById.get(matchTeam.player2Id);

  if (!player1 || !player2) {
    return null;
  }

  return {
    player1,
    player2,
    averageRating: matchTeam.averageRating
  };
};
