// @ts-check
/**
 * Simple login test to verify basic functionality
 */

const { test, expect } = require('@playwright/test');
const config = require('./test-config');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test('Simple login test', async ({ page }) => {
  console.log(`Navigating to ${BASE_URL}/login...`);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  console.log(`Page loaded. URL: ${page.url()}`);

  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'test-bin/screenshots/login-page.png' });
  console.log('Screenshot saved to test-bin/screenshots/login-page.png');

  // Check if "Got It!" modal appears and dismiss it
  const gotItButton = page.locator('button:has-text("Got It!")');
  if (await gotItButton.isVisible().catch(() => false)) {
    console.log('Found "Got It!" modal, clicking...');
    await gotItButton.click();
    await page.waitForTimeout(500);
  }

  // Now look for login form
  const emailInput = page.locator('input[type="email"]');
  console.log('Looking for email input...');

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  console.log('Email input found!');

  // Fill in credentials
  const user = config.users.player1;
  await emailInput.fill(user.email);
  await page.fill('input[type="password"]', user.password);
  console.log('Credentials filled');

  // Submit
  await page.click('button[type="submit"]');
  console.log('Login submitted, waiting for redirect...');

  // Wait for redirect away from login page
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  console.log(`Redirected to: ${page.url()}`);

  // Dismiss "What's New" modal if it appears after login
  try {
    const gotItButton = page.locator('button:has-text("Got It!")');
    const modalVisible = await gotItButton.isVisible();
    if (modalVisible) {
      console.log('Dismissing "What\'s New" modal after login...');
      await gotItButton.click();
      await page.waitForTimeout(300);
    }
  } catch {
    // Modal not present, continue
  }

  // Verify we're logged in by looking for the main app title (not the modal)
  await expect(page.getByText('Cribbage', { exact: true })).toBeVisible({ timeout: 10000 });
  console.log('SUCCESS: Logged in and see Cribbage text');
});
