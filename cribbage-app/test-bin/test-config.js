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
  // Note: These are dedicated test accounts - excluded from leaderboard
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
    },
    player3: {
      email: process.env.TEST_USER3_EMAIL || 'chris+three@chrisk.com',
      password: process.env.TEST_USER3_PASSWORD || 'Hello123$',
      name: 'Player Three'
    },
    player4: {
      email: process.env.TEST_USER4_EMAIL || 'chris+four@chrisk.com',
      password: process.env.TEST_USER4_PASSWORD || 'Hello123$',
      name: 'Player Four'
    },
    player5: {
      email: process.env.TEST_USER5_EMAIL || 'chris+five@chrisk.com',
      password: process.env.TEST_USER5_PASSWORD || 'Hello123$',
      name: 'Player Five'
    },
    player6: {
      email: process.env.TEST_USER6_EMAIL || 'chris+six@chrisk.com',
      password: process.env.TEST_USER6_PASSWORD || 'Hello123$',
      name: 'Player Six'
    }
  },

  // Test email patterns to exclude from leaderboard
  testEmailPatterns: [
    'chris+one@chrisk.com',
    'chris+two@chrisk.com',
    'chris+three@chrisk.com',
    'chris+four@chrisk.com',
    'chris+five@chrisk.com',
    'chris+six@chrisk.com'
  ],

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
