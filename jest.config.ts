/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  // Use jsdom for React component tests
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.setup.ts"],

  clearMocks: true,
  collectCoverage: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleDirectories: [
    "node_modules"
  ],
  preset: 'ts-jest/presets/js-with-ts',
  transformIgnorePatterns: [
    "node_modules/(?!node-fetch/.*)",
    "\\.pnp\\.[^\\/]+$"
  ],
};

export default config;
