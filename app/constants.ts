import { createContext } from "react";

export const DEFAULT_TIME = 15;
export const BOARD_SIZE = 5;
export const MINIMUM_WORD_LENGTH = 4;
export const L_RANGE = {
  MIN: 30,
  MAX: 90,
}

export const UNDERLINED_STRING = ['W', 'M']

export const STORE_KEYS = {
  USERNAME: 'username',
  DICTIONARY: 'wf_dictionary'
}

export const SessionContext = createContext<{sessionId?: string}>({});