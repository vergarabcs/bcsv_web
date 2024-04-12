import {expect, test, describe} from '@jest/globals';
import { DISTRIBUTION, generateBoard } from "../utils";

describe("utils", () => {
    test("Board should have correct count", () => {
        const counter : Record<string, number> = {}
        let totalCount = 0;
        for(let i=0 ; i<100000 ; i++){
            const board = generateBoard();
            board.forEach((char) => {
                if(!counter[char]){
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
                Math.round(100 * count/sourceCount)
            )
        })
    })
})