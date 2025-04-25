export type PropsBoard = {
  board: string[][],
  highlighted: number[][],
  rotations: TCardinalRotations[][],
  gameStatus?: TGameStatus,
  inputTxt: string,
  setInputTxt: (value: string) => void,
  setHighLighted: (indices: number[][]) => void,
  enterWord: (value: string) => void
}
export const CARDINAL_ROTATIONS = [0, 90, 180, 270] as const
// export const CARDINAL_ROTATIONS = [0] as const
export type TCardinalRotations = typeof CARDINAL_ROTATIONS[number]

export enum TGameStatus{
  STANDBY,
  PLAYING,
  FINISHED
}

// Define game interfaces
export interface AppMeta {
  id: string;
  title: string;
  description: string;
  component: React.LazyExoticComponent<any>;
}