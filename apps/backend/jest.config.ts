export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testMatch: ['**/?(*.)+(spec|test).ts'],
};
