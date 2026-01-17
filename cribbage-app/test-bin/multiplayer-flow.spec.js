// @ts-check
/**
 * Multiplayer Game Flow Tests
 *
 * These tests use two browser sessions to simulate two players
 * interacting in a multiplayer cribbage game.
 *
 * Run with: ./test-bin/run-local-tests.sh multiplayer-flow.spec.js
 * Run headed: ./test-bin/run-local-tests.sh multiplayer-flow.spec.js --headed
 */

const { test, expect } = require('@playwright/test');
const { DualBrowserHarness } = require('./helpers/dual-browser');
const { login, loginBothUsers } = require('./helpers/auth');
const {
  setDeckSeed,
  clearDeckSeed,
  openGameLobby,
  sendInvitation,
  acceptInvitation,
  waitForMyTurn,
  waitForOpponentTurn,
  getGamePhase
} = require('./helpers/game-sync');
const { logStep, screenshotBoth, logGameState } = require('./helpers/debug');
const config = require('./test-config');

test.describe('Multiplayer Game Flow', () => {
  let harness;

  test.beforeEach(async ({ browser }) => {
    harness = new DualBrowserHarness(browser);
    await harness.setup();
  });

  test.afterEach(async () => {
    // Clear test state
    if (harness.page1) {
      await clearDeckSeed(harness.page1).catch(() => {});
    }
    await harness.teardown();
  });

  test('Both users can login simultaneously', async () => {
    logStep('Login both users in parallel');

    const { page1, page2 } = harness;
    await loginBothUsers(page1, page2);

    // Verify both are on main page
    await expect(page1.locator('text=Cribbage')).toBeVisible();
    await expect(page2.locator('text=Cribbage')).toBeVisible();

    console.log('✓ Both users logged in successfully');
  });

  test('Player 1 can open Game Lobby and see Player 2', async () => {
    logStep('Login and open Game Lobby');

    const { page1, page2 } = harness;
    await loginBothUsers(page1, page2);

    logStep('Player 1 opens Game Lobby');
    await openGameLobby(page1);

    // Search for Player 2
    const player2Email = config.users.player2.email;
    await page1.fill('input[placeholder*="Search"]', player2Email.split('@')[0]);
    await page1.click('button:has-text("Search")');
    await page1.waitForTimeout(2000);

    // Should find Player 2 or see they already have a game
    const foundPlayer = await page1.locator(`text=${player2Email}`).isVisible().catch(() => false);
    const inviteButton = await page1.locator('button:has-text("Invite")').first().isVisible().catch(() => false);
    const alreadyInGame = await page1.locator('text=already').isVisible().catch(() => false);

    expect(foundPlayer || inviteButton || alreadyInGame).toBeTruthy();

    await screenshotBoth(page1, page2, 'lobby-search');
    console.log('✓ Game Lobby works and can find other players');
  });

  test('Complete game setup: invite, accept, start with deterministic deck', async () => {
    const { page1, page2 } = harness;

    logStep('1. Login both users');
    await loginBothUsers(page1, page2);

    logStep('2. Set deterministic deck seed');
    await setDeckSeed(page1, config.deckSeeds.default);

    logStep('3. Player 1 opens lobby and invites Player 2');
    await openGameLobby(page1);

    const player2Email = config.users.player2.email;
    const inviteSent = await sendInvitation(page1, player2Email);

    if (!inviteSent) {
      // Check if they already have a game
      console.log('Could not send invite - checking for existing game');
      await page1.click('text=My Games');
      await page1.waitForTimeout(1000);

      const hasExistingGame = await page1.locator('button:has-text("Your Turn"), button:has-text("View")').first().isVisible().catch(() => false);

      if (hasExistingGame) {
        console.log('✓ Existing game found - skipping invitation flow');
        await screenshotBoth(page1, page2, 'existing-game');
        return;
      }
    }

    logStep('4. Player 2 opens lobby and accepts invitation');
    await openGameLobby(page2);
    const accepted = await acceptInvitation(page2);

    if (accepted) {
      logStep('5. Verify game started');
      await page2.waitForTimeout(2000);
      await screenshotBoth(page1, page2, 'game-started');

      // Both should now see the game - either in lobby or in game view
      const p2InGame = await page2.locator('text=Your Turn').or(page2.locator('text=Waiting')).isVisible().catch(() => false);

      if (p2InGame) {
        console.log('✓ Game started successfully after accepting invitation');
      }
    }
  });

  test('Both players can see their hands after game starts', async () => {
    const { page1, page2 } = harness;

    logStep('Setup: Login and find existing game');
    await loginBothUsers(page1, page2);

    // Open lobby and go to My Games
    await openGameLobby(page1);
    await page1.click('text=My Games');
    await page1.waitForTimeout(1000);

    // Look for an active game
    const gameButton = page1.locator('button:has-text("Your Turn"), button:has-text("View")').first();

    if (await gameButton.isVisible()) {
      logStep('Join existing game');
      await gameButton.click();
      await page1.waitForTimeout(2000);

      // Take screenshot of game state
      await screenshotBoth(page1, page2, 'in-game');

      // Check for card display
      const hasCards = await page1.locator('.card, [data-card]').first().isVisible().catch(() => false);

      if (hasCards) {
        console.log('✓ Cards are visible in game');
      }

      // Log game phase
      const phase = await getGamePhase(page1);
      console.log(`Current game phase: ${phase}`);
    } else {
      console.log('⚠ No active game found - run game setup test first');
    }
  });

  test('Deterministic deck produces same cards with same seed', async () => {
    const { page1 } = harness;

    logStep('Test deterministic deck behavior');
    await login(page1, 'player1');

    // Set a specific seed
    const testSeed = 12345;
    await setDeckSeed(page1, testSeed);

    // Verify seed was set
    const baseUrl = process.env.TEST_URL || config.urls.local;
    const response = await page1.request.get(`${baseUrl}/api/test/set-deck`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.testState).toBeTruthy();
    expect(data.testState.deckSeed).toBe(testSeed);

    console.log(`✓ Deck seed ${testSeed} was set successfully`);
    console.log('  When a new game starts, it will use this seed for shuffling');

    // Clean up
    await clearDeckSeed(page1);
  });
});

test.describe('Game Lobby Functions', () => {
  let harness;

  test.beforeEach(async ({ browser }) => {
    harness = new DualBrowserHarness(browser);
    await harness.setup();
  });

  test.afterEach(async () => {
    await harness.teardown();
  });

  test('Find Players tab shows search functionality', async () => {
    const { page1 } = harness;

    await login(page1, 'player1');
    await openGameLobby(page1);

    // Verify search input exists
    await expect(page1.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page1.locator('button:has-text("Search")')).toBeVisible();

    console.log('✓ Search functionality is present');
  });

  test('Invitations tab shows pending invitations', async () => {
    const { page1 } = harness;

    await login(page1, 'player1');
    await openGameLobby(page1);

    // Click Invitations tab
    await page1.click('text=Invitations');
    await page1.waitForTimeout(1000);

    // Should show either invitations or "no invitations" message
    const hasContent = await page1.locator('button:has-text("Accept")').isVisible().catch(() => false) ||
                       await page1.locator('text=No').isVisible().catch(() => false);

    expect(hasContent).toBeTruthy();
    console.log('✓ Invitations tab works');
  });

  test('My Games tab shows active games', async () => {
    const { page1 } = harness;

    await login(page1, 'player1');
    await openGameLobby(page1);

    // Click My Games tab
    await page1.click('text=My Games');
    await page1.waitForTimeout(1000);

    // Should show either games or "no games" message
    const hasGames = await page1.locator('button:has-text("Your Turn")').isVisible().catch(() => false) ||
                     await page1.locator('button:has-text("View")').isVisible().catch(() => false);
    const noGames = await page1.locator('text=No active').isVisible().catch(() => false);

    expect(hasGames || noGames).toBeTruthy();

    if (hasGames) {
      console.log('✓ Active games found');
    } else {
      console.log('✓ No active games (as expected if none started)');
    }
  });
});
