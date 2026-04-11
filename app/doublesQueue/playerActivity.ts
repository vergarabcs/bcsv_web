import { Player } from './types';

export const getMostRecentPlayerActivityTime = (player: Player): Date | undefined => {
  const lastGameTime = player.lastGameTime ? new Date(player.lastGameTime) : null;
  const joinedQueueTime = player.joinedQueueTime ? new Date(player.joinedQueueTime) : null;

  if (!lastGameTime) {
    return joinedQueueTime ?? undefined;
  }

  if (!joinedQueueTime) {
    return lastGameTime;
  }

  return lastGameTime > joinedQueueTime ? lastGameTime : joinedQueueTime;
};