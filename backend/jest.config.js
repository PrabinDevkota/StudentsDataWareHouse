module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/simple.test.js'], // Only run simple tests for now
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true
};
