import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { logSheetEntryFunction } from "../functions/log-sheet-entry/resource";

const schemaObj = {
  GameState: a.model({
    // board is a 25 char string that represents a 5 x 5 grid
    board: a.string().required(),
    remainingTime: a.integer(),
    answers: a.hasMany('Answer', 'gameId'),
    allValidWords: a.string().array(),
    status: a.enum(['STANDBY', 'PLAYING', 'FINISHED'])
  }).authorization(allow => [allow.owner()]),

  Users: a.model({
    userId: a.string().required(),
    name: a.string().required(),
    answers: a.hasMany('Answer', 'userId')
  }).authorization(allow => [allow.owner()])
  .identifier(["userId"]),

  Answer: a.model({
    words: a.string().array(),
    gameId: a.id().required(),
    game: a.belongsTo('GameState', 'gameId'),
    userId: a.string().required(),
    user: a.belongsTo('Users', 'userId')
  }).authorization(allow => [allow.owner()]),

  ScheduleFinder: a.model({
    personRangeMap: a.string()
  }).authorization(allow => [allow.publicApiKey()]),

  logSheetEntry: a
    .mutation()
    .arguments({
      date: a.string(),
      team1p1: a.string().required(),
      team1p2: a.string().required(),
      team2p1: a.string().required(),
      team2p2: a.string().required(),
      winner: a.string().required(),
    })
    .returns(
      a.customType({
        success: a.boolean().required(),
        updatedRange: a.string(),
        updatedRows: a.integer(),
      })
    )
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(logSheetEntryFunction))
}

const schema = a.schema(schemaObj);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey', // Default authorization mode for all models
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 365, // Changed from 30 days to maximum 365 days
    },
  },
});
