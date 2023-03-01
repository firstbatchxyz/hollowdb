module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['/.yalc/', '/data/', '/_helpers'],
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@assemblyscript/.*)'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  globals: {
    __REDIS_URL__: 'redis://default:redispw@localhost:6379',
  },
};
