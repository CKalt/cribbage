// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  fullyParallel: false,  // Sequential for multiplayer testing
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html'], ['list']],
  timeout: 60000,

  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup project - runs first to create game between test users
    {
      name: 'setup',
      testMatch: /reset-game\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Main tests - depend on setup completing first
    {
      name: 'chromium',
      testIgnore: /reset-game\.spec\.js/,  // Don't run reset again
      dependencies: ['setup'],  // Wait for setup to complete
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
