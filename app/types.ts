export type PropsBoard = {
  board: string[][],
  highlighted: number[][],
  rotations: TCardinalRotations[][]
}

export enum TCardinalRotations {
  UP = 0,
  RIGHT = 90,
  DOWN = 180,
  LEFT = 270
}