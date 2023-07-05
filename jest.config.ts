import type {Config} from 'jest';

const config: Config = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  // setupFilesAfterEnv: ['<rootDir>/tests/common/env.ts'],
  globalSetup: '<rootDir>/tests/common/setup.ts',
  globalTeardown: '<rootDir>/tests/common/teardown.ts',
  testTimeout: 60000,
  verbose: true,
};

export default config;
