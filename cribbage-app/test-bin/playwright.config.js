// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  fullyParallel: false,  // Sequential for multiplayer testing
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html'], ['list']],  // Show progress in console
  timeout: 60000,

  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.HEADED !== 'true',  // HEADED=true for visible browser
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start dev server when testing locally (not when TEST_URL is set)
  webServer: process.env.TEST_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,  // 2 minutes to start
    stdout: 'pipe',   // Show server output
    stderr: 'pipe',
  },
});
