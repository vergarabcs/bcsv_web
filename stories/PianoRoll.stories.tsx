import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PianoRoll } from '../app/synthesiaClone/components/PianoRoll';
import type { ReactNode } from 'react';
import type { MidiNote } from '../app/synthesiaClone/types';

type StoryFrameProps = {
  children: ReactNode;
  width?: number;
  height: number;
};

const sampleNotes: MidiNote[] = [
  { id: 'n-1', midi: 60, time: 0.0, duration: 0.45, velocity: 0.9, track: 0, name: 'C4' },
  { id: 'n-2', midi: 64, time: 0.45, duration: 0.5, velocity: 0.8, track: 0, name: 'E4' },
  { id: 'n-3', midi: 67, time: 0.95, duration: 0.55, velocity: 0.85, track: 0, name: 'G4' },
  { id: 'n-4', midi: 72, time: 1.55, duration: 0.7, velocity: 0.88, track: 1, name: 'C5' },
  { id: 'n-5', midi: 76, time: 2.1, duration: 0.8, velocity: 0.82, track: 1, name: 'E5' },
  { id: 'n-6', midi: 79, time: 2.75, duration: 0.65, velocity: 0.86, track: 1, name: 'G5' },
];

function StoryFrame({ children, width, height }: StoryFrameProps) {
  return (
    <div
      style={{
        padding: '1px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <div
        style={{
          width: width ? `${width}px` : 'min(720px, 100%)',
          height: `${height + 2}px`,
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: 'SynthesiaClone/PianoRoll',
  component: PianoRoll,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => <StoryFrame height={context.args.pianoRollHeight as number}><Story /></StoryFrame>,
  ],
  argTypes: {
    onSeekToTime: {
      control: false,
    },
  },
  args: {
    pianoRollHeight: 666,
    notes: sampleNotes,
    currentTime: 1.15,
    duration: 3.9,
    isPlaying: false,
    playbackRate: 1,
    onSeekToTime: async () => {},
  },
} satisfies Meta<typeof PianoRoll>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RegressionReference: Story = {
  args: {},
};

export const EmptyState: Story = {
  args: {
    notes: [],
    currentTime: 0,
    duration: 0,
  },
};

export const MobileWidth: Story = {
  args: {},
  decorators: [
    (Story, context) => (
      <StoryFrame width={390} height={context.args.pianoRollHeight as number}>
        <Story />
      </StoryFrame>
    ),
  ],
};