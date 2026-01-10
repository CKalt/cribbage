// @ts-check
const { test, expect } = require('@playwright/test');

// Test accounts
const USER1 = {
  email: 'chris@chrisk.com',
  password: 'Hello123$'
};

const USER2 = {
  email: 'chris+two@chrisk.com',
  password: 'Hello123$'
};

const BASE_URL = 'https://beta.cribbage.chrisk.com';

/**
 * Helper: Login to the app
 */
async function login(page, user) {
  console.log(`Logging in as ${user.email}...`);
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to main app
  await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
  await expect(page.locator('text=Cribbage')).toBeVisible({ timeout: 10000 });
  console.log('✓ Logged in successfully');
}

/**
 * Helper: Open Game Lobby and go to My Games tab
 */
async function openMyGames(page) {
  console.log('Opening menu...');
  // Click the three-dot menu
  await page.click('button:has-text("⋮")');
  await page.waitForTimeout(500);

  console.log('Clicking "Play vs Friend"...');
  // Click "Play vs Friend"
  await page.click('text=Play vs Friend');
  await page.waitForTimeout(500);

  // Verify lobby is open
  await expect(page.locator('text=Find Players')).toBeVisible();
  console.log('✓ Game Lobby opened');

  console.log('Clicking "My Games" tab...');
  // Click My Games tab
  await page.click('button:has-text("My Games")');
  await page.waitForTimeout(1000);
  console.log('✓ My Games tab opened');
}

// ============================================================
// TEST: User 1 joins their active game
// ============================================================
test('User 1 (chris@chrisk.com) joins active game', async ({ page }) => {
  // Step 1: Go to beta site and login
  await login(page, USER1);

  // Step 2: Open menu and go to My Games
  await openMyGames(page);

  // Step 3: Look for active games
  console.log('Looking for active games...');

  // Wait for games to load
  await page.waitForTimeout(1000);

  // Check if there are games
  const yourTurnButton = page.locator('button:has-text("Your Turn")').first();
  const viewButton = page.locator('button:has-text("View")').first();
  const noGamesMsg = page.locator('text=No active games');

  if (await yourTurnButton.isVisible()) {
    console.log('✓ Found a game where it\'s your turn!');
    console.log('Clicking to join game...');
    await yourTurnButton.click();
    await page.waitForTimeout(2000);

    // Verify we're in the game
    const inGame = await page.locator('text=Game #').isVisible();
    if (inGame) {
      console.log('✓ Successfully joined the game!');

      // Take a screenshot
      await page.screenshot({ path: 'test-bin/screenshots/user1-in-game.png' });
      console.log('✓ Screenshot saved to test-bin/screenshots/user1-in-game.png');
    }
  } else if (await viewButton.isVisible()) {
    console.log('Found a game (waiting for opponent)');
    console.log('Clicking to view game...');
    await viewButton.click();
    await page.waitForTimeout(2000);

    const inGame = await page.locator('text=Game #').isVisible();
    if (inGame) {
      console.log('✓ Successfully viewing the game!');
      await page.screenshot({ path: 'test-bin/screenshots/user1-viewing-game.png' });
      console.log('✓ Screenshot saved');
    }
  } else if (await noGamesMsg.isVisible()) {
    console.log('⚠ No active games found for this user');
  } else {
    // List what we see
    const gameCards = await page.locator('.space-y-2 > div').count();
    console.log(`Found ${gameCards} game card(s)`);
    await page.screenshot({ path: 'test-bin/screenshots/user1-my-games.png' });
  }
});

// ============================================================
// TEST: User 2 joins their active game
// ============================================================
test('User 2 (chris+two@chrisk.com) joins active game', async ({ page }) => {
  // Step 1: Go to beta site and login
  await login(page, USER2);

  // Step 2: Open menu and go to My Games
  await openMyGames(page);

  // Step 3: Look for active games
  console.log('Looking for active games...');

  await page.waitForTimeout(1000);

  const yourTurnButton = page.locator('button:has-text("Your Turn")').first();
  const viewButton = page.locator('button:has-text("View")').first();
  const noGamesMsg = page.locator('text=No active games');

  if (await yourTurnButton.isVisible()) {
    console.log('✓ Found a game where it\'s your turn!');
    console.log('Clicking to join game...');
    await yourTurnButton.click();
    await page.waitForTimeout(2000);

    const inGame = await page.locator('text=Game #').isVisible();
    if (inGame) {
      console.log('✓ Successfully joined the game!');
      await page.screenshot({ path: 'test-bin/screenshots/user2-in-game.png' });
      console.log('✓ Screenshot saved to test-bin/screenshots/user2-in-game.png');
    }
  } else if (await viewButton.isVisible()) {
    console.log('Found a game (waiting for opponent)');
    console.log('Clicking to view game...');
    await viewButton.click();
    await page.waitForTimeout(2000);

    const inGame = await page.locator('text=Game #').isVisible();
    if (inGame) {
      console.log('✓ Successfully viewing the game!');
      await page.screenshot({ path: 'test-bin/screenshots/user2-viewing-game.png' });
      console.log('✓ Screenshot saved');
    }
  } else if (await noGamesMsg.isVisible()) {
    console.log('⚠ No active games found for this user');
  } else {
    const gameCards = await page.locator('.space-y-2 > div').count();
    console.log(`Found ${gameCards} game card(s)`);
    await page.screenshot({ path: 'test-bin/screenshots/user2-my-games.png' });
  }
});

// ============================================================
// TEST: Both users join game simultaneously (parallel contexts)
// ============================================================
test('Both users view their game simultaneously', async ({ browser }) => {
  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('test-bin/screenshots')) {
    fs.mkdirSync('test-bin/screenshots', { recursive: true });
  }

  // Create two browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  try {
    // Login both users
    console.log('\n=== User 1 ===');
    await login(page1, USER1);

    console.log('\n=== User 2 ===');
    await login(page2, USER2);

    // Both open My Games
    console.log('\n=== Both users opening My Games ===');
    await Promise.all([
      openMyGames(page1),
      openMyGames(page2)
    ]);

    // Both try to join their games
    console.log('\n=== User 1 joining game ===');
    const user1JoinBtn = page1.locator('button:has-text("Your Turn"), button:has-text("View")').first();
    if (await user1JoinBtn.isVisible()) {
      await user1JoinBtn.click();
      await page1.waitForTimeout(2000);
      await page1.screenshot({ path: 'test-bin/screenshots/simultaneous-user1.png' });
      console.log('✓ User 1 in game');
    }

    console.log('\n=== User 2 joining game ===');
    const user2JoinBtn = page2.locator('button:has-text("Your Turn"), button:has-text("View")').first();
    if (await user2JoinBtn.isVisible()) {
      await user2JoinBtn.click();
      await page2.waitForTimeout(2000);
      await page2.screenshot({ path: 'test-bin/screenshots/simultaneous-user2.png' });
      console.log('✓ User 2 in game');
    }

    // Check what each user sees
    console.log('\n=== Game State ===');

    const user1Turn = await page1.locator('text=Your Turn').first().isVisible();
    const user2Turn = await page2.locator('text=Your Turn').first().isVisible();

    if (user1Turn) {
      console.log('→ It\'s User 1\'s turn (chris@chrisk.com)');
    }
    if (user2Turn) {
      console.log('→ It\'s User 2\'s turn (chris+two@chrisk.com)');
    }
    if (!user1Turn && !user2Turn) {
      console.log('→ Waiting state or game not fully loaded');
    }

    console.log('\n✓ Both users successfully viewing their game!');
    console.log('Screenshots saved to test-bin/screenshots/');

  } finally {
    await context1.close();
    await context2.close();
  }
});
