import { expect, test, describe } from '@jest/globals';
import { DISTRIBUTION, TRIE, generateBoard, getHighlighted, squarify } from "../utils";

describe("utils", () => {
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
    expect(TRIE.hasPurePrefix('car')).toBeTruthy()
    expect(TRIE.has('cara')).toBeTruthy()
  })

  test('getHighlighted returns correct indices', () => {
    const board = [
      ['C', 'G', 'N', 'Y', 'D'],
      ['A', 'O', 'R', 'V', 'R'],
      ['X', 'C', 'Z', 'D', 'Z'],
      ['T', 'E', 'Q', 'N', 'U'],
      ['N', 'L', 'Z', 'O', 'A']
    ]
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
})