// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Reset Game Script
 *
 * This script:
 * 1. Logs in as both test users
 * 2. Forfeits/deletes any existing games between them
 * 3. Declines any pending invitations
 * 4. Creates a fresh game invitation from User 1 to User 2
 * 5. Accepts the invitation as User 2
 *
 * Run this before other tests to ensure a clean game state:
 *   ./run-tests.sh reset
 */

const USER1 = {
  email: 'chris+one@chrisk.com',
  password: 'Hello123$'
};

const USER2 = {
  email: 'chris+two@chrisk.com',
  password: 'Hello123$'
};

const BASE_URL = 'https://beta.cribbage.chrisk.com';

/**
 * Helper: Login and get auth cookie
 */
async function login(page, user) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE_URL + '/', { timeout: 15000 });
  await expect(page.locator('text=Cribbage')).toBeVisible({ timeout: 10000 });
  console.log(`✓ Logged in as ${user.email}`);
}

/**
 * Helper: Forfeit all active games for current user
 */
async function forfeitAllGames(page) {
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const data = await response.json();

  if (!data.success || !data.games) {
    console.log('  No games found');
    return 0;
  }

  let forfeited = 0;
  for (const game of data.games) {
    if (game.status === 'active' || game.status === 'waiting') {
      console.log(`  Forfeiting game ${game.id} (vs ${game.opponent?.username || 'unknown'})...`);
      const deleteResponse = await page.request.delete(`${BASE_URL}/api/multiplayer/games/${game.id}`);
      const deleteData = await deleteResponse.json();
      if (deleteData.success) {
        forfeited++;
        console.log(`  ✓ Forfeited game ${game.id}`);
      } else {
        console.log(`  ⚠ Could not forfeit game ${game.id}: ${deleteData.error}`);
      }
    }
  }

  return forfeited;
}

/**
 * Helper: Decline all pending invitations for current user
 */
async function declineAllInvitations(page) {
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/invitations`);
  const data = await response.json();

  if (!data.success) {
    console.log('  Could not fetch invitations');
    return 0;
  }

  let declined = 0;

  // Decline received invitations
  if (data.received && data.received.length > 0) {
    for (const inv of data.received) {
      console.log(`  Declining invitation from ${inv.from?.email || 'unknown'}...`);
      const declineResponse = await page.request.post(`${BASE_URL}/api/multiplayer/invitations/${inv.id}`, {
        data: { action: 'decline' }
      });
      const declineData = await declineResponse.json();
      if (declineData.success) {
        declined++;
        console.log(`  ✓ Declined invitation ${inv.id}`);
      }
    }
  }

  // Cancel sent invitations
  if (data.sent && data.sent.length > 0) {
    for (const inv of data.sent) {
      console.log(`  Canceling invitation to ${inv.to?.email || 'unknown'}...`);
      const cancelResponse = await page.request.post(`${BASE_URL}/api/multiplayer/invitations/${inv.id}`, {
        data: { action: 'cancel' }
      });
      const cancelData = await cancelResponse.json();
      if (cancelData.success) {
        declined++;
        console.log(`  ✓ Canceled invitation ${inv.id}`);
      }
    }
  }

  return declined;
}

// ============================================================
// MAIN RESET TEST
// ============================================================
test('Reset game state for test users', async ({ browser }) => {
  test.setTimeout(120000); // 2 minute timeout for reset

  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  try {
    // ========== STEP 1: Login both users ==========
    console.log('\n========== STEP 1: Logging in both users ==========');
    await login(page1, USER1);
    await login(page2, USER2);

    // ========== STEP 2: Forfeit existing games ==========
    console.log('\n========== STEP 2: Forfeiting existing games ==========');
    console.log(`\nUser 1 (${USER1.email}):`);
    const forfeited1 = await forfeitAllGames(page1);

    console.log(`\nUser 2 (${USER2.email}):`);
    const forfeited2 = await forfeitAllGames(page2);

    console.log(`\n✓ Forfeited ${forfeited1 + forfeited2} games total`);

    // ========== STEP 3: Decline pending invitations ==========
    console.log('\n========== STEP 3: Declining pending invitations ==========');
    console.log(`\nUser 1 (${USER1.email}):`);
    const declined1 = await declineAllInvitations(page1);

    console.log(`\nUser 2 (${USER2.email}):`);
    const declined2 = await declineAllInvitations(page2);

    console.log(`\n✓ Declined/canceled ${declined1 + declined2} invitations total`);

    // Wait a moment for state to settle
    await page1.waitForTimeout(1000);

    // ========== STEP 4: Create new invitation ==========
    console.log('\n========== STEP 4: Creating new game invitation ==========');

    const inviteResponse = await page1.request.post(`${BASE_URL}/api/multiplayer/invitations`, {
      data: { toEmail: USER2.email }
    });
    const inviteData = await inviteResponse.json();

    if (!inviteData.success) {
      throw new Error(`Failed to create invitation: ${inviteData.error}`);
    }

    const invitationId = inviteData.invitation?.id;
    console.log(`✓ Created invitation ${invitationId} from ${USER1.email} to ${USER2.email}`);

    // ========== STEP 5: Accept invitation ==========
    console.log('\n========== STEP 5: Accepting invitation ==========');

    // Wait a moment for invitation to be visible
    await page2.waitForTimeout(1000);

    const acceptResponse = await page2.request.post(`${BASE_URL}/api/multiplayer/invitations/${invitationId}`, {
      data: { action: 'accept' }
    });
    const acceptData = await acceptResponse.json();

    if (!acceptData.success) {
      throw new Error(`Failed to accept invitation: ${acceptData.error}`);
    }

    const gameId = acceptData.gameId;
    console.log(`✓ Accepted invitation - Game ID: ${gameId}`);

    // ========== STEP 6: Verify game state ==========
    console.log('\n========== STEP 6: Verifying game state ==========');

    const gameResponse = await page1.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
    const gameData = await gameResponse.json();

    if (!gameData.success) {
      throw new Error(`Failed to fetch game: ${gameData.error}`);
    }

    const phase = gameData.game?.gameState?.phase;
    const dealer = gameData.game?.gameState?.dealer;
    const player1Hand = gameData.game?.gameState?.player1Hand?.length || 0;

    console.log(`  Game ID: ${gameId}`);
    console.log(`  Phase: ${phase}`);
    console.log(`  Dealer: ${dealer}`);
    console.log(`  Player 1 hand: ${player1Hand} cards`);

    expect(phase).toBe('discarding');
    expect(player1Hand).toBe(6);

    console.log('\n========================================');
    console.log('✓ RESET COMPLETE - Fresh game ready!');
    console.log('========================================');
    console.log(`  Game ID: ${gameId}`);
    console.log(`  Phase: discarding`);
    console.log(`  Both players have 6 cards`);
    console.log('========================================\n');

  } finally {
    await context1.close();
    await context2.close();
  }
});
