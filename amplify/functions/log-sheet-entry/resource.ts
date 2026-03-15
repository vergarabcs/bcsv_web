import { defineFunction } from '@aws-amplify/backend';

export const logSheetEntryFunction = defineFunction({
  name: 'log-sheet-entry',
  entry: './handler.ts',
});
