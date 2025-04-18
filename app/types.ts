export type PropsBoard = {
  board: string[][],
  highlighted: number[][],
  rotations: TCardinalRotations[][],
  gameStatus?: TGameStatus,
  inputTxt: string,
  setInputTxt: (value: string) => void
}
export const CARDINAL_ROTATIONS = [0, 90, 180, 270] as const
export type TCardinalRotations = typeof CARDINAL_ROTATIONS[number]

export enum TGameStatus{
  STANDBY,
  PLAYING,
  FINISHED
}