import { 
  Player, 
  Game, 
  Team, 
  MatchTeam,
  QueueEntry, 
  MatchSuggestion, 
  RatingCalculation, 
  PartnershipHistory,
  AppSettings,
  PriorityConfig,
  DEFAULT_SETTINGS,
  DEFAULT_PRIORITY_CONFIG,
  PlayerStatus 
} from './types';

/**
 * Rating System - Elo-based rating calculations
 */
export class RatingSystem {
  private settings: AppSettings;
  private priorityConfig: PriorityConfig;

  constructor(settings: AppSettings = DEFAULT_SETTINGS, priorityConfig: PriorityConfig = DEFAULT_PRIORITY_CONFIG) {
    this.settings = settings;
    this.priorityConfig = priorityConfig;
  }

  /**
   * Calculate expected score for Team A vs Team B
   */
  calculateExpectedScore(teamARating: number, teamBRating: number): number {
    return 1 / (1 + Math.pow(10, (teamBRating - teamARating) / 400));
  }

  /**
   * Calculate rating change for a team
   */
  calculateRatingChange(
    currentRating: number, 
    expectedScore: number, 
    actualScore: number, 
    gamesPlayed: number
  ): RatingCalculation {
    const kFactor = gamesPlayed < 30 ? this.settings.kFactorNew : this.settings.kFactorExperienced;
    const ratingChange = Math.round(kFactor * (actualScore - expectedScore));

    return {
      expectedScore,
      actualScore,
      kFactor,
      ratingChange
    };
  }

  /**
   * Calculate new ratings after a game
   */
  calculateGameRatings(game: Game, winningTeam: 1 | 2): {
    team1Changes: [RatingCalculation, RatingCalculation];
    team2Changes: [RatingCalculation, RatingCalculation];
  } {
    const team1AvgRating = (game.team1.player1.rating + game.team1.player2.rating) / 2;
    const team2AvgRating = (game.team2.player1.rating + game.team2.player2.rating) / 2;

    const team1Expected = this.calculateExpectedScore(team1AvgRating, team2AvgRating);
    const team2Expected = 1 - team1Expected;

    const team1Actual = winningTeam === 1 ? 1 : 0;
    const team2Actual = winningTeam === 2 ? 1 : 0;

    const team1Player1Change = this.calculateRatingChange(
      game.team1.player1.rating,
      team1Expected,
      team1Actual,
      game.team1.player1.gamesPlayed
    );

    const team1Player2Change = this.calculateRatingChange(
      game.team1.player2.rating,
      team1Expected,
      team1Actual,
      game.team1.player2.gamesPlayed
    );

    const team2Player1Change = this.calculateRatingChange(
      game.team2.player1.rating,
      team2Expected,
      team2Actual,
      game.team2.player1.gamesPlayed
    );

    const team2Player2Change = this.calculateRatingChange(
      game.team2.player2.rating,
      team2Expected,
      team2Actual,
      game.team2.player2.gamesPlayed
    );

    return {
      team1Changes: [team1Player1Change, team1Player2Change],
      team2Changes: [team2Player1Change, team2Player2Change]
    };
  }
}

/**
 * Queue Management - Priority scoring and team balancing
 */
export class QueueManager {
  private ratingSystem: RatingSystem;
  private settings: AppSettings;
  private priorityConfig: PriorityConfig;

  constructor(settings: AppSettings = DEFAULT_SETTINGS, priorityConfig: PriorityConfig = DEFAULT_PRIORITY_CONFIG) {
    this.ratingSystem = new RatingSystem(settings, priorityConfig);
    this.settings = settings;
    this.priorityConfig = priorityConfig;
  }

  /**
   * Calculate wait time score for a player
   */
  calculateWaitTimeScore(player: Player, sessionGamesPlayed: number = 0): number {
    let score = 0;

    // Base wait time score
    if (player.joinedQueueTime) {
      const waitMinutes = (Date.now() - player.joinedQueueTime.getTime()) / (1000 * 60);
      score += waitMinutes * this.priorityConfig.waitTimeMultiplier;
    }

    // First game bonus
    if (sessionGamesPlayed === 0) {
      score += this.priorityConfig.firstGameBonus;
    }

    // Games played penalty (diminishing returns)
    score -= sessionGamesPlayed * this.priorityConfig.gamesPlayedPenalty;

    // Losing streak bonus
    if (player.currentStreak < -2) {
      score += this.priorityConfig.streakBonus;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate balance score - how well a player fits into balanced combinations
   */
  calculateBalanceScore(player: Player, waitingPlayers: Player[]): number {
    // This is a simplified version - in reality, we'd calculate all possible team combinations
    // and see how many balanced matches this player enables
    
    let balanceablePartners = 0;
    const playerRating = player.rating;

    // Count how many other players could form balanced teams with this player
    for (const other of waitingPlayers) {
      if (other.id === player.id) continue;
      
      const ratingDiff = Math.abs(playerRating - other.rating);
      if (ratingDiff <= this.settings.ratingBalanceTolerance) {
        balanceablePartners++;
      }
    }

    // Score based on how many balanced options this player provides
    return balanceablePartners * 10;
  }

  /**
   * Calculate partnership penalty for recent partners
   */
  getPartnershipPenalty(player1: Player, player2: Player, partnershipHistory: PartnershipHistory[]): number {
    const partnership = partnershipHistory.find(p => 
      (p.player1Id === player1.id && p.player2Id === player2.id) ||
      (p.player1Id === player2.id && p.player2Id === player1.id)
    );

    if (!partnership) return 0;

    // Check if they played together in the last 3 games
    const recentGames = partnership.gameIds.slice(-3);
    if (recentGames.length > 0) {
      return this.priorityConfig.partnershipPenalty;
    }

    return 0;
  }

  /**
   * Generate priority queue entries
   */
  generateQueueEntries(
    players: Player[], 
    sessionGamesPlayed: Map<string, number> = new Map(),
    partnershipHistory: PartnershipHistory[] = []
  ): QueueEntry[] {
    const waitingPlayers = players.filter(p => p.status === PlayerStatus.WAITING);

    return waitingPlayers.map(player => {
      const playerSessionGames = sessionGamesPlayed.get(player.id) || 0;
      const waitTimeScore = this.calculateWaitTimeScore(player, playerSessionGames);
      const balanceScore = this.calculateBalanceScore(player, waitingPlayers);
      
      const priority = (waitTimeScore * this.priorityConfig.waitTimeWeight) + 
                      (balanceScore * this.priorityConfig.balanceWeight);

      return {
        playerId: player.id,
        priority,
        waitTimeScore,
        balanceScore
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate all possible team combinations from a set of players
   */
  private generateTeamCombinations(players: Player[]): Team[][] {
    if (players.length < 4) return [];

    const combinations: Team[][] = [];
    
    for (let i = 0; i < players.length - 3; i++) {
      for (let j = i + 1; j < players.length - 2; j++) {
        for (let k = j + 1; k < players.length - 1; k++) {
          for (let l = k + 1; l < players.length; l++) {
            const fourPlayers = [players[i], players[j], players[k], players[l]];
            
            // Generate the two possible team arrangements
            const arrangement1: Team[] = [
              {
                player1: fourPlayers[0],
                player2: fourPlayers[1],
                averageRating: (fourPlayers[0].rating + fourPlayers[1].rating) / 2
              },
              {
                player1: fourPlayers[2],
                player2: fourPlayers[3],
                averageRating: (fourPlayers[2].rating + fourPlayers[3].rating) / 2
              }
            ];
            
            const arrangement2: Team[] = [
              {
                player1: fourPlayers[0],
                player2: fourPlayers[2],
                averageRating: (fourPlayers[0].rating + fourPlayers[2].rating) / 2
              },
              {
                player1: fourPlayers[1],
                player2: fourPlayers[3],
                averageRating: (fourPlayers[1].rating + fourPlayers[3].rating) / 2
              }
            ];
            
            const arrangement3: Team[] = [
              {
                player1: fourPlayers[0],
                player2: fourPlayers[3],
                averageRating: (fourPlayers[0].rating + fourPlayers[3].rating) / 2
              },
              {
                player1: fourPlayers[1],
                player2: fourPlayers[2],
                averageRating: (fourPlayers[1].rating + fourPlayers[2].rating) / 2
              }
            ];

            combinations.push(arrangement1, arrangement2, arrangement3);
          }
        }
      }
    }

    return combinations;
  }

  private toMatchTeam(team: Team): MatchTeam {
    return {
      player1Id: team.player1.id,
      player2Id: team.player2.id,
      averageRating: team.averageRating
    };
  }

  /**
   * Find the best match from available players
   */
  findBestMatch(
    queueEntries: QueueEntry[], 
    players: Player[],
    partnershipHistory: PartnershipHistory[] = []
  ): MatchSuggestion | null {
    if (queueEntries.length < 4) return null;

    const playerById = new Map(players.map(player => [player.id, player]));

    // Take top 8-12 players by priority for consideration
    const candidatePlayers = queueEntries
      .slice(0, Math.min(12, queueEntries.length))
      .map(entry => playerById.get(entry.playerId))
      .filter((player): player is Player => !!player);

    if (candidatePlayers.length < 4) return null;

    const teamCombinations = this.generateTeamCombinations(candidatePlayers);

    let bestMatch: MatchSuggestion | null = null;
    let bestScore = -Infinity;

    for (const teams of teamCombinations) {
      const [team1, team2] = teams;
      const ratingDifference = Math.abs(team1.averageRating - team2.averageRating);
      
      // Check for recent partnerships
      let partnershipPenalty = 0;
      partnershipPenalty += this.getPartnershipPenalty(team1.player1, team1.player2, partnershipHistory);
      partnershipPenalty += this.getPartnershipPenalty(team2.player1, team2.player2, partnershipHistory);

      // Calculate balance quality (higher is better)
      const balanceQuality = Math.max(0, 100 - ratingDifference);
      
      // Calculate total priority of all 4 players
      const totalPriority = [team1.player1, team1.player2, team2.player1, team2.player2]
        .reduce((sum, player) => {
          const entry = queueEntries.find(e => e.playerId === player.id);
          return sum + (entry?.priority || 0);
        }, 0);

      // Combined score favoring balance and high priority players
      const score = (balanceQuality * 1) + (totalPriority * 1) - partnershipPenalty;

      // Emergency rule: if someone has waited too long, prioritize them
      const hasEmergencyWait = [team1.player1, team1.player2, team2.player1, team2.player2]
        .some(player => {
          if (!player.joinedQueueTime) return false;
          const waitMinutes = (Date.now() - player.joinedQueueTime.getTime()) / (1000 * 60);
          return waitMinutes >= this.settings.emergencyWaitTime;
        });

      if (hasEmergencyWait && !bestMatch) {
        bestMatch = {
          playerIds: [team1.player1.id, team1.player2.id, team2.player1.id, team2.player2.id],
          teams: [this.toMatchTeam(team1), this.toMatchTeam(team2)],
          balanceQuality,
          totalPriority,
          ratingDifference
        };
      } else if (score > bestScore && ratingDifference <= this.settings.ratingBalanceTolerance) {
        bestScore = score;
        bestMatch = {
          playerIds: [team1.player1.id, team1.player2.id, team2.player1.id, team2.player2.id],
          teams: [this.toMatchTeam(team1), this.toMatchTeam(team2)],
          balanceQuality,
          totalPriority,
          ratingDifference
        };
      }
    }

    return bestMatch;
  }

  /**
   * Find multiple matches for multiple courts
   */
  findMultipleMatches(
    queueEntries: QueueEntry[], 
    players: Player[],
    courtCount: number, 
    partnershipHistory: PartnershipHistory[] = []
  ): MatchSuggestion[] {
    const matches: MatchSuggestion[] = [];
    let remainingPlayers = [...queueEntries];

    for (let court = 0; court < courtCount && remainingPlayers.length >= 4; court++) {
      const match = this.findBestMatch(remainingPlayers, players, partnershipHistory);
      
      if (match) {
        matches.push(match);
        
        // Remove selected players from remaining pool
        remainingPlayers = remainingPlayers.filter(entry => 
          !match.playerIds.includes(entry.playerId)
        );
      } else {
        break;
      }
    }

    return matches;
  }
}