// @ts-check
const { testUser } = require('../test-config');

/**
 * Login with test credentials and wait for redirect to home page.
 * Timeout: 10s for the full login flow (Cognito auth + redirect).
 * @param {import('@playwright/test').Page} page
 */
async function dismissVersionDialog(page) {
  // The "What's New" version notification dialog blocks interaction.
  // Try clicking "Got It!" up to 3 times with short waits.
  for (let i = 0; i < 3; i++) {
    const gotItBtn = page.getByRole('button', { name: 'Got It!' });
    try {
      await gotItBtn.click({ timeout: 2000 });
      // Wait a moment for the dialog to close
      await page.waitForTimeout(300);
    } catch {
      break; // No dialog visible, continue
    }
  }
}

async function login(page) {
  await page.goto('/login');
  await dismissVersionDialog(page);

  await page.locator('input[type="email"]').fill(testUser.email);
  await page.locator('input[type="password"]').fill(testUser.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('/', { timeout: 10000 });

  await dismissVersionDialog(page);
}

module.exports = { login };
