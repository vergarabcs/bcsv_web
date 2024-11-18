import { Trie } from 'trie-typed'
import { DIRECTION_OFFSET, DISTRIBUTION, MINIMUM_WORD_LENGTH } from '../constants.js'
import { dictionaryString } from '../files/dictWithDef.js'

export const randomPickElements = <ElementType>(list:ElementType[], n:number) => {
  return Array(n).fill(null).map(
    () => list[Math.floor(Math.random() * list.length)]
  )
}

export const generateBoard = () => {
  const charSource: string[] = Object.entries(DISTRIBUTION).map(
    ([char, count]) => Array(count).fill(char)
  ).flat()

  return randomPickElements(charSource, 25)
}

export const squarify = <GElement>(dim: number, charList: GElement[]) => {
  const newBoard: GElement[][] = []
  charList.forEach((char, index) => {
    if (index % dim === 0) {
      newBoard.push([])
    }
    newBoard[newBoard.length - 1].push(char)
  })
  return newBoard
}

const isValidIndex = (newX: number, newY: number, board: string[][]) => {
  return (
    newX >= 0 &&
    newX < board.length &&
    newY >= 0 &&
    newY < board[0].length
  )
}

export const getHighlighted = (word: string, board: string[][]) => {
  const indices: number[][] = []
  const isVisited: boolean[][] = board.map((row): boolean[] => row.map((_cell) => false))


  const dfs = (currX: number, currY: number): boolean => {
    if (
      !isValidIndex(currX, currY, board) ||
      indices.length >= word.length ||
      word.charAt(indices.length) !== board[currX][currY] ||
      isVisited[currX][currY]
    ) {
      return false
    }
    isVisited[currX][currY] = true
    indices.push([currX, currY])

    if (
      indices.length === word.length &&
      indices.map((gridIndex) => board[gridIndex[0]][gridIndex[1]]).join('') === word
    ) {
      return true
    }

    for (const offset of DIRECTION_OFFSET) {
      if (dfs(currX + offset[0], currY + offset[1])) {
        return true
      }
    }

    isVisited[currX][currY] = false
    indices.pop()
    return false
  }
  board.forEach((row, i) => row.forEach((_cell, j) => {
    if (dfs(i, j)) {
      return indices
    }
  }))
  return indices
}

// TODO: serializable prefix trie for smaller size
export const TRIE = new Trie(
  dictionaryString.split('\n')
  .map(
    (line) => line.split('\t')[0].toUpperCase()
  ).filter(
    (key) => key.length >= MINIMUM_WORD_LENGTH
  )
)

export const findValidWords = (board: string[][]): string[] => {
  const words: Set<string> = new Set()
  const indices: number[][] = []
  const isVisited: boolean[][] = board.map((row): boolean[] => row.map((_cell) => false))

  const dfs = (currX: number, currY: number): boolean => {
    if (
      !isValidIndex(currX, currY, board) ||
      isVisited[currX][currY]
    ) {
      return false
    }
    isVisited[currX][currY] = true
    indices.push([currX, currY])
    const currWord = indices.map((gridIndex) => board[gridIndex[0]][gridIndex[1]]).join('')

    if (!TRIE.hasPrefix(currWord)) {
      isVisited[currX][currY] = false
      indices.pop()
      return false
    }
    if (TRIE.has(currWord)) words.add(currWord)


    for (const offset of DIRECTION_OFFSET) {
      dfs(currX + offset[0], currY + offset[1])
    }

    isVisited[currX][currY] = false
    indices.pop()
    return false
  }

  board.forEach((row, i) => row.forEach((_cell, j) => {
    dfs(i, j)
  }))
  return Array.from(words).sort((word1, word2) => {
    let retVal = word2.length - word1.length;
    if(retVal !== 0) return retVal;

    return word1.localeCompare(word2)
  })
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const getWordScore = (word: string) => {
  const retValue = word.length - MINIMUM_WORD_LENGTH + 1
  return (retValue > 0)? retValue : 0
}

export const getListScore = (moves:string[], validWords:string[]) => {
  const validSet = new Set(validWords)
  return moves.reduce(
    (prevVal, currVal) => {
      if(!validSet.has(currVal)) return prevVal - 1;
      return prevVal + getWordScore(currVal)
    },
    0
  )
}