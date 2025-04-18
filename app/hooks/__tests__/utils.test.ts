import { expect, test, describe } from '@jest/globals';
import { DISTRIBUTION, TRIE, findValidWords, generateBoard, getHighlighted, getListScore, squarify } from "../utils";

describe("utils", () => {
  const board = [
    ['C', 'G', 'N', 'C', 'A'],
    ['A', 'O', 'R', 'V', 'R'],
    ['X', 'C', 'Z', 'D', 'Z'],
    ['T', 'E', 'Q', 'N', 'U'],
    ['N', 'L', 'Z', 'O', 'A']
  ]
  test("Board should have correct count", () => {
    const counter: Record<string, number> = {}
    let totalCount = 0;
    for (let i = 0; i < 100000; i++) {
      const board = generateBoard();
      board.forEach((char) => {
        if (!counter[char]) {
          counter[char] = 0
        }
        counter[char] += 1
        totalCount += 1
      })
    }

    const sourceCount = Object.values(DISTRIBUTION).reduce((a, b) => a + b)

    Object.entries(DISTRIBUTION).forEach(([char, count]) => {
      expect(
        Math.round(100 * counter[char] / totalCount)
      ).toEqual(
        Math.round(100 * count / sourceCount)
      )
    })
  })

  test('globalTrie should function as expected', () => {
    expect(TRIE.hasPurePrefix('CAR')).toBeTruthy()
    expect(TRIE.has('CARD')).toBeTruthy()
  })

  test('getHighlighted returns correct indices', () => {
    expect(
      getHighlighted('CELN', board)
    ).toEqual(
      [[2, 1], [3, 1], [4, 1], [4, 0]]
    )
    expect(
      getHighlighted('ZDNO', board)
    ).not.toEqual(
      [[2, 1], [3, 1], [4, 1], [4, 2]]
    )
  })

  test('findValidWords', () => {
    const validWords = findValidWords(board)
    validWords.forEach((word) => {
      expect(word.length).toBeGreaterThan(3)
      expect(getHighlighted(word, board).length).toBeGreaterThan(0)
    })

    expect(validWords[0].length).toBeGreaterThan(validWords[validWords.length - 1].length)
  })

  test('getListScore', () => {
    const validWords = [
      'BIRD',
      'CHICKEN',
      'RABBIT'
    ]

    const wordList = [
      'BIRD', // 4 letters
      'CHICKEN', // 7 letters
      'RABBIT', // 6 letters
      'TO', // 2 letters
      'NOT_ON_THE_LIST'
    ]
    expect(getListScore(wordList, validWords)).toBe(6)

    expect(
      getListScore(
        ['TO', 'BIRD'],
        []
      )
    ).toBe(-2)
  })
})