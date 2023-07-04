module.exports = {
  clearMocks: true,
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['/.yalc/', '/data/', '/_helpers'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@assemblyscript/.*)'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  globals: {
    __REDIS_URL__: 'redis://default:redispw@localhost:6379',
  },
  testTimeout: 60000,
  maxConcurrency: 1,
};
