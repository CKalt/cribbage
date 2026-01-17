/**
 * Authentication helpers for multiplayer tests
 */

const { expect } = require('@playwright/test');
const config = require('../test-config');

/**
 * Get the base URL for tests
 * @returns {string}
 */
function getBaseUrl() {
  return process.env.TEST_URL || config.urls.local;
}

/**
 * Login as a specific user
 * @param {Page} page - Playwright page
 * @param {'player1' | 'player2'} userKey - Which user to login as
 * @returns {Promise<Object>} The user config object
 */
async function login(page, userKey) {
  const user = config.users[userKey];
  if (!user) {
    throw new Error(`Unknown user key: ${userKey}`);
  }

  const baseUrl = getBaseUrl();

  console.log(`[${userKey}] Logging in as ${user.email}...`);

  await page.goto(`${baseUrl}/login`);

  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit and wait for redirect
  await page.click('button[type="submit"]');

  // Wait for redirect to main app (handle both / and /login redirect)
  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  } catch (e) {
    // Check for error message on login page
    const errorMsg = await page.locator('.text-red-500, .error, [role="alert"]').textContent().catch(() => null);
    if (errorMsg) {
      throw new Error(`Login failed for ${user.email}: ${errorMsg}`);
    }
    throw new Error(`Login redirect timeout for ${user.email}`);
  }

  // Verify logged in by checking for main app content
  await expect(page.locator('text=Cribbage')).toBeVisible({ timeout: 10000 });

  console.log(`[${userKey}] Logged in successfully as ${user.email}`);
  return user;
}

/**
 * Login both users in parallel
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 * @returns {Promise<Array>} [user1, user2]
 */
async function loginBothUsers(page1, page2) {
  const results = await Promise.all([
    login(page1, 'player1'),
    login(page2, 'player2')
  ]);
  console.log('[BOTH] Both users logged in successfully');
  return results;
}

/**
 * Logout current user
 * @param {Page} page - Playwright page
 */
async function logout(page) {
  // Click menu
  await page.click('button:has-text("⋮")');
  await page.waitForTimeout(300);

  // Click logout
  await page.click('text=Logout');
  await page.waitForTimeout(500);

  // Verify on login page
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  console.log('[AUTH] Logged out successfully');
}

/**
 * Check if user is logged in
 * @param {Page} page - Playwright page
 * @returns {Promise<boolean>}
 */
async function isLoggedIn(page) {
  try {
    await page.waitForSelector('text=Cribbage', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  login,
  loginBothUsers,
  logout,
  isLoggedIn,
  getBaseUrl
};
