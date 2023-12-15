import type {JestConfigWithTsJest} from 'ts-jest';

const config: JestConfigWithTsJest = {
  // ts-jest defaults
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  // environment setup & teardown scripts

  // setup & teardown for spinning up arlocal
  globalSetup: '<rootDir>/tests/environment/setup.ts',
  globalTeardown: '<rootDir>/tests/environment/teardown.ts',
  // timeout should be rather large, especially for the workflows
  testTimeout: 60000,
  // warp & arlocal takes some time to close, so make this 10 secs
  openHandlesTimeout: 10000,
  // print everything like Mocha
  verbose: true,
  // tests may hang randomly (not known why yet, it was fixed before)
  // that will cause workflow to run all the way, so we might force exit
  forceExit: true,
  // ignore tests under examples
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
};

export default config;
