import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import BadmintonCard from '../app/doublesQueue/components/BadmintonCard';
import { CourtStatus, GameStatus } from '../app/doublesQueue/types';

const meta: Meta<typeof BadmintonCard> = {
  title: 'DoublesQueue/BadmintonCard',
  component: BadmintonCard,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    formatTime: (date: Date) => {
      const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60)));
      return `${mins}m`;
    },
    onWin: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof BadmintonCard>;

export const Occupied: Story = {
  args: {
    court: {
      id: 'court-1',
      name: 'Court 1',
      status: CourtStatus.OCCUPIED,
      currentGame: {
        id: 'game-1',
        courtId: 'court-1',
        status: GameStatus.IN_PROGRESS,
        startTime: new Date(Date.now() - 14 * 60 * 1000),
        team1: {
          averageRating: 1620,
          player1: {
            id: 'p1',
            name: 'Bill',
            rating: 1680,
            gamesPlayed: 12,
            wins: 7,
            losses: 5,
            currentStreak: 2,
            status: 'playing',
            ratingHistory: [],
          },
          player2: {
            id: 'p2',
            name: 'Kyle',
            rating: 1560,
            gamesPlayed: 10,
            wins: 5,
            losses: 5,
            currentStreak: -1,
            status: 'playing',
            ratingHistory: [],
          },
        },
        team2: {
          averageRating: 1610,
          player1: {
            id: 'p3',
            name: 'Fadu',
            rating: 1600,
            gamesPlayed: 14,
            wins: 8,
            losses: 6,
            currentStreak: 1,
            status: 'playing',
            ratingHistory: [],
          },
          player2: {
            id: 'p4',
            name: 'Jayson',
            rating: 1620,
            gamesPlayed: 11,
            wins: 6,
            losses: 5,
            currentStreak: 0,
            status: 'playing',
            ratingHistory: [],
          },
        },
      },
    },
  },
};

export const Available: Story = {
  args: {
    court: {
      id: 'court-2',
      name: 'Court 2',
      status: CourtStatus.AVAILABLE,
    },
  },
};
