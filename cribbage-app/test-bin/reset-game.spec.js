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
 * 5. Accepts the invitation as User 2 with a KNOWN DECK
 *
 * Run this before other tests to ensure a clean game state:
 *   ./run-tests.sh reset
 *
 * TEST DECK LAYOUT:
 * =================
 * Player 1 (chris+one) gets cards 0-5:  5♥, 5♦, 5♠, J♥, 4♥, 6♥
 *   - Should discard: 4♥, 6♥ (indices 4,5) → keeps 5♥, 5♦, 5♠, J♥
 *   - Hand value with cut: Three 5s + J (nobs) = great hand
 *
 * Player 2 (chris+two) gets cards 6-11: 10♣, 10♦, 5♣, K♠, Q♦, 9♥
 *   - Should discard: K♠, Q♦ (indices 3,4 of their hand) → keeps 10♣, 10♦, 5♣, 9♥
 *
 * Cut card is at index 12: 5♣ (but player 2 already has it, so we use another)
 *   - Actually cut card will be the 5♣ which gives player 1 four 5s!
 *
 * Remaining deck for cut starts at index 12.
 */

const { login: authLogin, getBaseUrl } = require('./helpers/auth');
const config = require('./test-config');

const BASE_URL = getBaseUrl();
const USER1 = config.users.player1;
const USER2 = config.users.player2;

/**
 * Known test deck for deterministic testing
 * Card format: { suit: '♥'|'♦'|'♣'|'♠', rank: 'A'-'K', value: 1-10 }
 */
const TEST_DECK = [
  // Player 1's hand (indices 0-5) - chris+one
  { suit: '♥', rank: '5', value: 5 },   // 0: 5 of hearts
  { suit: '♦', rank: '5', value: 5 },   // 1: 5 of diamonds
  { suit: '♠', rank: '5', value: 5 },   // 2: 5 of spades
  { suit: '♥', rank: 'J', value: 10 },  // 3: Jack of hearts (nobs if cut is ♥)
  { suit: '♥', rank: '4', value: 4 },   // 4: 4 of hearts (discard this)
  { suit: '♥', rank: '6', value: 6 },   // 5: 6 of hearts (discard this)

  // Player 2's hand (indices 6-11) - chris+two
  { suit: '♣', rank: '10', value: 10 }, // 6: 10 of clubs
  { suit: '♦', rank: '10', value: 10 }, // 7: 10 of diamonds
  { suit: '♣', rank: '6', value: 6 },   // 8: 6 of clubs
  { suit: '♠', rank: 'K', value: 10 },  // 9: King of spades (discard)
  { suit: '♦', rank: 'Q', value: 10 },  // 10: Queen of diamonds (discard)
  { suit: '♥', rank: '9', value: 9 },   // 11: 9 of hearts

  // Remaining deck for cut (index 12+)
  { suit: '♣', rank: '5', value: 5 },   // 12: 5 of clubs - IDEAL CUT for player 1!
  { suit: '♠', rank: 'A', value: 1 },   // 13
  { suit: '♦', rank: 'A', value: 1 },   // 14
  { suit: '♥', rank: 'A', value: 1 },   // 15
  { suit: '♣', rank: 'A', value: 1 },   // 16
  { suit: '♠', rank: '2', value: 2 },   // 17
  { suit: '♦', rank: '2', value: 2 },   // 18
  { suit: '♥', rank: '2', value: 2 },   // 19
  { suit: '♣', rank: '2', value: 2 },   // 20
  { suit: '♠', rank: '3', value: 3 },   // 21
  { suit: '♦', rank: '3', value: 3 },   // 22
  { suit: '♥', rank: '3', value: 3 },   // 23
  { suit: '♣', rank: '3', value: 3 },   // 24
  { suit: '♠', rank: '4', value: 4 },   // 25
  { suit: '♦', rank: '4', value: 4 },   // 26
  { suit: '♣', rank: '4', value: 4 },   // 27
  { suit: '♠', rank: '6', value: 6 },   // 28
  { suit: '♦', rank: '6', value: 6 },   // 29
  { suit: '♠', rank: '7', value: 7 },   // 30
  { suit: '♦', rank: '7', value: 7 },   // 31
  { suit: '♥', rank: '7', value: 7 },   // 32
  { suit: '♣', rank: '7', value: 7 },   // 33
  { suit: '♠', rank: '8', value: 8 },   // 34
  { suit: '♦', rank: '8', value: 8 },   // 35
  { suit: '♥', rank: '8', value: 8 },   // 36
  { suit: '♣', rank: '8', value: 8 },   // 37
  { suit: '♠', rank: '9', value: 9 },   // 38
  { suit: '♦', rank: '9', value: 9 },   // 39
  { suit: '♣', rank: '9', value: 9 },   // 40
  { suit: '♠', rank: '10', value: 10 }, // 41
  { suit: '♥', rank: '10', value: 10 }, // 42
  { suit: '♠', rank: 'J', value: 10 },  // 43
  { suit: '♦', rank: 'J', value: 10 },  // 44
  { suit: '♣', rank: 'J', value: 10 },  // 45
  { suit: '♠', rank: 'Q', value: 10 },  // 46
  { suit: '♥', rank: 'Q', value: 10 },  // 47
  { suit: '♣', rank: 'Q', value: 10 },  // 48
  { suit: '♠', rank: 'K', value: 10 },  // 49
  { suit: '♦', rank: 'K', value: 10 },  // 50
  { suit: '♣', rank: 'K', value: 10 },  // 51
];

/**
 * Helper: Login using shared auth helper
 */
async function login(page, userKey) {
  await authLogin(page, userKey);
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
    await login(page1, 'player1');
    await login(page2, 'player2');

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

    // ========== STEP 5: Accept invitation with TEST DECK ==========
    console.log('\n========== STEP 5: Accepting invitation with TEST DECK ==========');

    // Wait a moment for invitation to be visible
    await page2.waitForTimeout(1000);

    // Pass the TEST_DECK for deterministic card dealing
    const acceptResponse = await page2.request.post(`${BASE_URL}/api/multiplayer/invitations/${invitationId}`, {
      data: { action: 'accept', testDeck: TEST_DECK }
    });
    const acceptData = await acceptResponse.json();

    if (!acceptData.success) {
      throw new Error(`Failed to accept invitation: ${acceptData.error}`);
    }

    const gameId = acceptData.gameId;
    console.log(`✓ Accepted invitation - Game ID: ${gameId}`);
    console.log(`✓ Using TEST DECK - Player 1 has: 5♥, 5♦, 5♠, J♥, 4♥, 6♥`);

    // ========== STEP 6: Verify game state and TEST DECK ==========
    console.log('\n========== STEP 6: Verifying game state and TEST DECK ==========');

    const gameResponse = await page1.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
    const gameData = await gameResponse.json();

    if (!gameData.success) {
      throw new Error(`Failed to fetch game: ${gameData.error}`);
    }

    const phase = gameData.game?.gameState?.phase;
    const dealer = gameData.game?.gameState?.dealer;
    const p1Hand = gameData.game?.gameState?.player1Hand || [];
    const p2Hand = gameData.game?.gameState?.player2Hand || [];

    console.log(`  Game ID: ${gameId}`);
    console.log(`  Phase: ${phase}`);
    console.log(`  Dealer: ${dealer} (always player1 with test deck)`);
    console.log(`  Player 1 hand: ${p1Hand.map(c => c.rank + c.suit).join(', ')}`);
    console.log(`  Player 2 hand: ${p2Hand.map(c => c.rank + c.suit).join(', ')}`);

    // Verify phase and hand sizes
    expect(phase).toBe('discarding');
    expect(p1Hand.length).toBe(6);
    expect(p2Hand.length).toBe(6);

    // Verify TEST DECK was used - Player 1 should have 5♥ as first card
    expect(p1Hand[0].rank).toBe('5');
    expect(p1Hand[0].suit).toBe('♥');
    console.log(`  ✓ TEST DECK verified - Player 1's first card is 5♥`);

    // Verify dealer is player1 (test mode always uses player1 as dealer)
    expect(dealer).toBe('player1');
    console.log(`  ✓ Dealer is player1 (as expected in test mode)`);

    console.log('\n========================================');
    console.log('✓ RESET COMPLETE - Fresh game with TEST DECK ready!');
    console.log('========================================');
    console.log(`  Game ID: ${gameId}`);
    console.log(`  Phase: discarding`);
    console.log(`  Dealer: player1 (chris+one)`);
    console.log(`  Player 1 (chris+one): 5♥, 5♦, 5♠, J♥, 4♥, 6♥`);
    console.log(`  Player 2 (chris+two): 10♣, 10♦, 6♣, K♠, Q♦, 9♥`);
    console.log(`  Cut card (after cut): 5♣`);
    console.log('========================================\n');

  } finally {
    await context1.close();
    await context2.close();
  }
});
