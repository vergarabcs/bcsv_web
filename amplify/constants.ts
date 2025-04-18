export const DEFAULT_TIME = 60;
export const BOARD_SIZE = 5;
export const MINIMUM_WORD_LENGTH = 4;

export const DISTRIBUTION = {
  A: 9,
  B: 2,
  C: 2,
  D: 4,
  E: 12,
  F: 2,
  G: 3,
  H: 2,
  I: 9,
  J: 1,
  K: 1,
  L: 4,
  M: 2,
  N: 6,
  O: 8,
  P: 2,
  Q: 1,
  R: 6,
  S: 4,
  T: 6,
  U: 4,
  V: 2,
  W: 2,
  X: 1,
  Y: 2,
  Z: 1
}

export const DIRECTION_OFFSET = [
  //adjacents
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],

  // diagonals
  [1, 1],
  [-1, -1],
  [-1, 1],
  [1, -1]
]