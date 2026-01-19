// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for Cribbage App testing
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
    // Base URL - can be overridden with PLAYWRIGHT_BASE_URL env var
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before tests if not testing production
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
