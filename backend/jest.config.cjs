const { createDefaultPreset } = require('ts-jest')

const tsJestPreset = createDefaultPreset()

/** @type {import('jest').Config} */
module.exports = {
    
  ...tsJestPreset,

  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
}