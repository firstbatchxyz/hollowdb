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
  // Warp & Arlocal takes some time to close, so make this 10 secs
  openHandlesTimeout: 10000,
  // Tests may hang randomly (not known why yet, it was fixed before)
  // that will cause workflow to run all the way, so we might force exit
  forceExit: true,
};

export default config;
