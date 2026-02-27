// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for Cribbage App testing
 * Local dev server runs on port 3004 (3000/3001 used by other projects)
 * Tests run against local dev server or production
 */
module.exports = defineConfig({
  testDir: './test-bin',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // 1 retry locally for flaky login issues
  workers: process.env.CI ? 1 : 2,   // Limit to 2 workers locally for stability
  reporter: 'html',
  timeout: 60000,  // 60 second timeout per test

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -- -p 3004',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
