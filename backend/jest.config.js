module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setup.js'],
  clearMocks: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/*.test.js'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ]
};