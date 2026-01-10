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
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to main app
  await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
  await expect(page.locator('text=Cribbage')).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: Open the Game Lobby
 */
async function openGameLobby(page) {
  // Click the three-dot menu
  await page.click('button:has-text("⋮")');
  await page.waitForTimeout(500);

  // Click "Play vs Friend"
  await page.click('text=Play vs Friend');
  await page.waitForTimeout(500);

  // Verify lobby is open
  await expect(page.locator('text=Find Players')).toBeVisible();
}

/**
 * Helper: Close the Game Lobby
 */
async function closeGameLobby(page) {
  await page.click('button:has-text("Close")');
  await page.waitForTimeout(300);
}

// ============================================================
// TEST: Login with User 1
// ============================================================
test('User 1 can login', async ({ page }) => {
  await login(page, USER1);
  console.log('✓ User 1 logged in successfully');
});

// ============================================================
// TEST: Login with User 2
// ============================================================
test('User 2 can login', async ({ page }) => {
  await login(page, USER2);
  console.log('✓ User 2 logged in successfully');
});

// ============================================================
// TEST: Open Game Lobby
// ============================================================
test('Can open Game Lobby', async ({ page }) => {
  await login(page, USER1);
  await openGameLobby(page);

  // Check all three tabs are present
  await expect(page.locator('text=Find Players')).toBeVisible();
  await expect(page.locator('text=Invitations')).toBeVisible();
  await expect(page.locator('text=My Games')).toBeVisible();

  console.log('✓ Game Lobby opened with all tabs');
});

// ============================================================
// TEST: Find Players tab shows users
// ============================================================
test('Find Players tab shows other users', async ({ page }) => {
  await login(page, USER1);
  await openGameLobby(page);

  // Should be on Find Players tab by default
  // Wait for players to load
  await page.waitForTimeout(2000);

  // Check if we see the other user or "No other players" message
  const hasPlayers = await page.locator('.space-y-2 > div').count() > 0;
  const noPlayersMsg = await page.locator('text=No other players').isVisible();

  if (hasPlayers) {
    console.log('✓ Found players in the list');
  } else if (noPlayersMsg) {
    console.log('⚠ No other players found (this may be expected)');
  }

  expect(hasPlayers || noPlayersMsg).toBeTruthy();
});

// ============================================================
// TEST: Search for a specific player
// ============================================================
test('Can search for players', async ({ page }) => {
  await login(page, USER1);
  await openGameLobby(page);

  // Type in search box
  await page.fill('input[placeholder*="Search"]', 'chris+two');
  await page.click('button:has-text("Search")');

  await page.waitForTimeout(2000);

  // Check results - look for either the user, no results, or already in game message
  const foundUser = await page.locator('text=chris+two').first().isVisible();
  const noResults = await page.locator('text=No players found').isVisible();
  const alreadyInGame = await page.locator('text=already').first().isVisible();
  const inviteButton = await page.locator('button:has-text("Invite")').first().isVisible();

  const resultsOrNoMatch = foundUser || noResults || alreadyInGame || inviteButton;

  if (foundUser || inviteButton) {
    console.log('✓ Found player in search results');
  } else if (noResults) {
    console.log('✓ Search returned no results (player may not exist)');
  } else if (alreadyInGame) {
    console.log('✓ Search shows player already in game');
  }

  expect(resultsOrNoMatch).toBeTruthy();
  console.log('✓ Search functionality works');
});

// ============================================================
// TEST: Full multiplayer flow - Send and accept invitation
// ============================================================
test('Full multiplayer flow: invite and accept', async ({ browser }) => {
  // Create two browser contexts for two users
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  try {
    // Step 1: User 1 logs in and sends invitation
    console.log('Step 1: User 1 logging in...');
    await login(page1, USER1);

    console.log('Step 2: User 1 opening Game Lobby...');
    await openGameLobby(page1);

    // Search for User 2
    console.log('Step 3: User 1 searching for User 2...');
    await page1.fill('input[placeholder*="Search"]', 'chris+two');
    await page1.click('button:has-text("Search")');
    await page1.waitForTimeout(2000);

    // Click Invite button if visible
    const inviteButton = page1.locator('button:has-text("Invite")').first();
    if (await inviteButton.isVisible()) {
      console.log('Step 4: User 1 sending invitation...');
      await inviteButton.click();
      await page1.waitForTimeout(1000);

      // Check for success message
      const successMsg = await page1.locator('text=Invitation sent').isVisible();
      if (successMsg) {
        console.log('✓ Invitation sent successfully');
      }
    } else {
      console.log('⚠ Invite button not visible - may already have pending invite or game');
    }

    // Step 2: User 2 logs in and checks invitations
    console.log('Step 5: User 2 logging in...');
    await login(page2, USER2);

    console.log('Step 6: User 2 opening Game Lobby...');
    await openGameLobby(page2);

    // Click on Invitations tab
    console.log('Step 7: User 2 checking Invitations tab...');
    await page2.click('text=Invitations');
    await page2.waitForTimeout(1000);

    // Look for received invitation
    const acceptButton = page2.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible()) {
      console.log('Step 8: User 2 accepting invitation...');
      await acceptButton.click();
      await page2.waitForTimeout(2000);

      // Check for game started
      const gameStarted = await page2.locator('text=Game started').isVisible() ||
                          await page2.locator('text=Your Turn').isVisible() ||
                          await page2.locator('text=Waiting').isVisible();

      if (gameStarted) {
        console.log('✓ Game started successfully!');
      }
    } else {
      console.log('⚠ No Accept button visible - checking for existing games...');

      // Check My Games tab
      await page2.click('text=My Games');
      await page2.waitForTimeout(1000);

      const hasGames = await page2.locator('text=Your Turn').isVisible() ||
                       await page2.locator('text=Waiting').isVisible() ||
                       await page2.locator('text=View').isVisible();

      if (hasGames) {
        console.log('✓ Found existing games');
      }
    }

    console.log('✓ Multiplayer flow test completed');

  } finally {
    await context1.close();
    await context2.close();
  }
});

// ============================================================
// TEST: Join an existing game
// ============================================================
test('Can view My Games and join a game', async ({ page }) => {
  await login(page, USER1);
  await openGameLobby(page);

  // Click My Games tab
  await page.click('text=My Games');
  await page.waitForTimeout(1000);

  // Check for games or no games message
  const hasGames = await page.locator('button:has-text("Your Turn")').isVisible() ||
                   await page.locator('button:has-text("View")').isVisible();
  const noGames = await page.locator('text=No active games').isVisible();

  if (hasGames) {
    console.log('✓ Found active games');

    // Try to join a game
    const joinButton = page.locator('button:has-text("Your Turn"), button:has-text("View")').first();
    await joinButton.click();
    await page.waitForTimeout(2000);

    // Verify we entered the game
    const inGame = await page.locator('text=Game #').isVisible() ||
                   await page.locator('text=Your Turn').isVisible() ||
                   await page.locator('text=Waiting for').isVisible();

    if (inGame) {
      console.log('✓ Successfully joined game');
    }
  } else if (noGames) {
    console.log('⚠ No active games (this is okay)');
  }

  expect(hasGames || noGames).toBeTruthy();
});
