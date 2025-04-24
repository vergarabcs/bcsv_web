import { Trie } from 'trie-typed'
import { MINIMUM_WORD_LENGTH, STORE_KEYS } from '../constants'
import { CARDINAL_ROTATIONS } from '../types'

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

const DIRECTION_OFFSET = [
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

export const generateRotations = () => {
  return randomPickElements([...CARDINAL_ROTATIONS], 25)
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

let dictionaryString: string = ''
let TRIE: Trie<string>

// Get dictionary from CacheStorage
const getDictionaryFromCache = async (): Promise<string | null> => {
  try {
    // Open or create the cache
    const cache = await caches.open('word-factory-cache');
    
    // Try to get the dictionary from cache
    const response = await cache.match(`/cache/${STORE_KEYS.DICTIONARY}`);
    
    if (response && response.ok) {
      return response.text();
    }
    
    return null;
  } catch (error) {
    console.error("Error reading from CacheStorage:", error);
    return null;
  }
};

// Save dictionary to CacheStorage
const saveDictionaryToCache = async (dictionary: string): Promise<void> => {
  try {
    // Open or create the cache
    const cache = await caches.open('word-factory-cache');
    
    // Create a response object with the dictionary string
    const response = new Response(dictionary);
    
    // Store the response in cache
    await cache.put(`/cache/${STORE_KEYS.DICTIONARY}`, response);
  } catch (error) {
    console.error("Error writing to CacheStorage:", error);
  }
};

export const getTrie = async () => {
  if(!dictionaryString){
    // Try to get dictionary from CacheStorage first
    const cachedDictionary = await getDictionaryFromCache();
    
    if (cachedDictionary) {
      dictionaryString = cachedDictionary;
    } else {
      // Fall back to import if not in CacheStorage
      dictionaryString = (await import('./dictWithDef')).dictionaryString;
      
      // Cache the dictionary in CacheStorage for future use
      await saveDictionaryToCache(dictionaryString);
    }
  }

  if(!TRIE){
    TRIE = new Trie(
      dictionaryString.split('\n')
      .map(
        (line) => line.split('\t')[0].toUpperCase()
      ).filter(
        (key) => key.length >= MINIMUM_WORD_LENGTH
      )
    )
  }
  return TRIE
}

export const findValidWords = async (board: string[][]): Promise<string[]> => {
  const words: Set<string> = new Set()
  const indices: number[][] = []
  const isVisited: boolean[][] = board.map((row): boolean[] => row.map((_cell) => false))
  const trie = await getTrie()

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

    if (!trie.hasPrefix(currWord)) {
      isVisited[currX][currY] = false
      indices.pop()
      return false
    }
    if (trie.has(currWord)) words.add(currWord)


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

export const isValidHighlights = (indices: number[][]) => {
  for (let i = 1; i < indices.length; i++) {
    const [prevRow, prevCol] = indices[i - 1];
    const [currRow, currCol] = indices[i];
    if(Math.abs(prevRow - currRow) > 1) return false;
    if(Math.abs(prevCol - currCol) > 1) return false;
    if(prevRow === currRow && currCol === prevCol) return false;
  }
  return true;
}