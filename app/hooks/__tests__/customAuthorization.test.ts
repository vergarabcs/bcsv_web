import { Schema } from "@/amplify/data/resource";
import { describe, test } from "@jest/globals";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import config from '../../../amplify_outputs.json'
Amplify.configure(config)
const client = generateClient<Schema>({});
describe("Amplify Data tests", () => {
  test('Create GameState', async () => {
    
    const { errors, data: newGameState } = await client.models.GameState.create({
      board: 'myBoard',
      remainingTime: 100,
      allValidWords: ['hello', 'world'],
      status: 'PLAYING'
    })
  })
})