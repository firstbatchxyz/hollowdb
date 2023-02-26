module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['/.yalc/', '/data/', '/_helpers'],
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@assemblyscript/.*)'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
};
