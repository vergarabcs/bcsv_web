export type MidiNote = {
  id: string;
  midi: number;
  time: number;
  duration: number;
  velocity: number;
  track: number;
  name: string;
};

export type PianoKey = {
  midi: number;
  isBlack: boolean;
  left: number;
  width: number;
  label: string;
};

export type VisibleBar = {
  id: string;
  left: number;
  width: number;
  bottom: number;
  height: number;
  color: string;
};
