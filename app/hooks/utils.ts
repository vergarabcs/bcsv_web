import { Trie } from 'trie-typed'
import data from '../files/words_dictionary.json'
import { MINIMUM_WORD_LENGTH } from '../constants'

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

export const generateBoard = () => {
  const charSource: string[] = Object.entries(DISTRIBUTION).map(
    ([char, count]) => Array(count).fill(char)
  ).flat()

  const getRandomChar = () => charSource[Math.floor(Math.random() * charSource.length)]
  return Array(25).fill('').map(getRandomChar)
}

export const findWord = (word: string, board: string[][]) => {

}

// TODO: serializable prefix trie for smaller size
export const TRIE = new Trie(
  Object.keys(data).filter((key) => key.length >= MINIMUM_WORD_LENGTH)
)