import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PianoRoll } from '../app/synthesiaClone/components/PianoRoll';
import type { PianoKey, VisibleBar } from '../app/synthesiaClone/types';

type StoryFrameProps = {
  children: React.ReactNode;
  width?: number;
  height: number;
};

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const BLACK_KEY_WIDTH_RATIO = 0.65;

const isBlackKey = (midi: number) => BLACK_KEYS.has(midi % 12);

const getNoteLabel = (midi: number) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNames[midi % 12]}${octave}`;
};

const buildKeys = (start: number, end: number): PianoKey[] => {
  const whiteKeyCount = Array.from({ length: end - start + 1 }, (_, index) => start + index).filter(
    (midi) => !isBlackKey(midi)
  ).length || 1;

  const whiteKeyWidth = 100 / whiteKeyCount;
  const blackKeyWidth = whiteKeyWidth * BLACK_KEY_WIDTH_RATIO;
  let whiteIndex = 0;

  return Array.from({ length: end - start + 1 }, (_, index) => start + index).map((midi) => {
    const black = isBlackKey(midi);
    const width = black ? blackKeyWidth : whiteKeyWidth;
    const rawLeft = black
      ? whiteIndex * whiteKeyWidth - blackKeyWidth / 2
      : whiteIndex * whiteKeyWidth;
    const left = Math.min(Math.max(rawLeft, 0), Math.max(100 - width, 0));

    if (!black) {
      whiteIndex += 1;
    }

    return {
      midi,
      isBlack: black,
      left,
      width: Math.max(Math.min(width, 100 - left), 0),
      label: getNoteLabel(midi),
    };
  });
};

const keys = buildKeys(43, 84);

const visibleBars: VisibleBar[] = [
  { id: 'bar-1', left: 42.856, width: 2.288, bottom: 387.273, height: 35.1273, color: '#7dd3fc' },
  { id: 'bar-2', left: 70.856, width: 2.288, bottom: 387.273, height: 52.1818, color: '#7dd3fc' },
  { id: 'bar-3', left: 86.856, width: 2.288, bottom: 421.127, height: 44.2909, color: '#7dd3fc' },
  { id: 'bar-4', left: 42.856, width: 2.288, bottom: 422.4, height: 87.0545, color: '#7dd3fc' },
  { id: 'bar-5', left: 58.856, width: 2.288, bottom: 422.4, height: 140.509, color: '#7dd3fc' },
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
    activeNoteSet: {
      control: false,
    },
    keys: {
      control: false,
    },
    visibleBars: {
      control: false,
    },
  },
  args: {
    pianoRollHeight: 666,
    keys,
    activeNoteSet: new Set<number>([50]),
    visibleBars,
  },
} satisfies Meta<typeof PianoRoll>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RegressionReference: Story = {
  args: {
    hasNotes: true,
  },
};

export const EmptyState: Story = {
  args: {
    hasNotes: false,
    activeNoteSet: new Set<number>(),
    visibleBars: [],
  },
};

export const MobileWidth: Story = {
  args: {
    hasNotes: true,
  },
  decorators: [
    (Story, context) => (
      <StoryFrame width={390} height={context.args.pianoRollHeight as number}>
        <Story />
      </StoryFrame>
    ),
  ],
};