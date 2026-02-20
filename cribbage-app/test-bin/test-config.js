/**
 * Test configuration for Playwright tests
 *
 * To set credentials, either:
 * 1. Set environment variables: TEST_EMAIL and TEST_PASSWORD
 * 2. Create a .env.test file with these values
 * 3. Update this file directly (not recommended for git)
 */
module.exports = {
  // Test account credentials
  testUser: {
    email: process.env.TEST_EMAIL || 'chris@chrisk.com',
    password: process.env.TEST_PASSWORD || 'Hello123$'
  },

  // URLs
  urls: {
    local: 'http://localhost:3004',
    production: 'https://cribbage.chrisk.com'
  },

  // Timeouts
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000
  }
};
