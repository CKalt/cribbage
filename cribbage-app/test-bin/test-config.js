/**
 * Test configuration for Playwright multiplayer tests
 *
 * To set credentials, either:
 * 1. Set environment variables: TEST_USER1_EMAIL, TEST_USER1_PASSWORD, etc.
 * 2. Create a .env.test file with these values
 * 3. Update this file directly (not recommended for git)
 */
module.exports = {
  // Test accounts for multiplayer testing
  users: {
    player1: {
      email: process.env.TEST_USER1_EMAIL || 'chris+one@chrisk.com',
      password: process.env.TEST_USER1_PASSWORD || 'Hello123$',
      name: 'Player One'
    },
    player2: {
      email: process.env.TEST_USER2_EMAIL || 'chris+two@chrisk.com',
      password: process.env.TEST_USER2_PASSWORD || 'Hello123$',
      name: 'Player Two'
    }
  },

  // Legacy single-user config (for backwards compatibility)
  testUser: {
    email: process.env.TEST_EMAIL || 'chris@chrisk.com',
    password: process.env.TEST_PASSWORD || 'Hello123$'
  },

  // URLs
  urls: {
    local: 'http://localhost:3000',
    beta: 'https://beta.cribbage.chrisk.com',
    production: 'https://cribbage.chrisk.com'
  },

  // Deterministic deck seeds for specific test scenarios
  deckSeeds: {
    default: 12345,           // Standard test seed
    highScoring: 67890,       // Produces high-scoring hands
    fifteens: 11111,          // Many 15-combinations
    runs: 22222,              // Many run opportunities
    pairs: 33333,             // Many pair opportunities
    peggingEdge: 44444,       // Edge cases in pegging
    countingEdge: 55555,      // Edge cases in counting
  },

  // Timeouts
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
    gameAction: 3000,  // Wait for game state updates
  }
};
