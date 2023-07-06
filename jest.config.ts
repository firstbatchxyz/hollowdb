import type {Config} from 'jest';

const config: Config = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  // environment setup & teardown scripts
  globalSetup: '<rootDir>/tests/environment/setup.ts',
  globalTeardown: '<rootDir>/tests/environment/teardown.ts',
  testTimeout: 60000,
  // print everything like Mocha
  verbose: true,
  // Warp & Arlocal takes some time to close, so make this 5 secs
  openHandlesTimeout: 5000,
};

export default config;
