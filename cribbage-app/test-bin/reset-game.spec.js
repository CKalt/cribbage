// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Reset Game Script - Creates games at multiple phases for comprehensive testing
 *
 * Creates 5 games for testing various game states:
 * 1. discardingGame:       player1 vs player2 - Stops at discarding phase
 * 2. cutGame:              player5 vs player1 - Cut phase, player1's turn to cut
 * 3. playingGame:          player3 vs player1 - Playing phase, player1's turn to play
 * 4. countingGame:         player4 vs player1 - Counting phase, player1's turn to count
 * 5. waitingCountingGame:  player1 vs player6 - Counting phase, player1 WAITS (not their turn)
 *
 * Note: Opponent invites player1 for games 2-4 so player1 is non-dealer
 * (non-dealer cuts, plays first, and counts first in cribbage).
 * Game 5 has player1 as inviter (dealer) so opponent counts first.
 *
 * Game IDs are saved to test-state.json for other tests to use.
 */

const { login: authLogin, getBaseUrl } = require('./helpers/auth');
const config = require('./test-config');

const BASE_URL = getBaseUrl();
const TEST_STATE_PATH = path.join(__dirname, 'test-state.json');

/**
 * Test decks for deterministic testing
 * When inviter invites accepter:
 * - Indices 0-5: Inviter (dealer) hand
 * - Indices 6-11: Accepter (non-dealer) hand
 * - Index 12: Cut card
 */

// Deck for discarding game: player1 invites player2
// Player1 (dealer) gets indices 0-5, Player2 gets indices 6-11
const DISCARD_DECK = [
  // Player1 (dealer)'s hand
  { suit: '♥', rank: '5', value: 5 },
  { suit: '♦', rank: '5', value: 5 },
  { suit: '♠', rank: '5', value: 5 },
  { suit: '♥', rank: 'J', value: 10 },
  { suit: '♥', rank: '4', value: 4 },
  { suit: '♥', rank: '6', value: 6 },
  // Player2 (non-dealer)'s hand
  { suit: '♣', rank: '10', value: 10 },
  { suit: '♦', rank: '10', value: 10 },
  { suit: '♣', rank: '6', value: 6 },
  { suit: '♠', rank: 'K', value: 10 },
  { suit: '♦', rank: 'Q', value: 10 },
  { suit: '♥', rank: '9', value: 9 },
  // Cut card
  { suit: '♣', rank: '5', value: 5 },
  // Rest of deck
  { suit: '♠', rank: 'A', value: 1 },
  { suit: '♦', rank: 'A', value: 1 },
];

// Deck for cut game: player5 invites player1
// Player5 (dealer) gets indices 0-5, Player1 (non-dealer) gets indices 6-11
// Player1 will cut (non-dealer cuts)
const CUT_DECK = [
  // Player5 (dealer)'s hand - will discard 2♥, 3♥
  { suit: '♣', rank: 'K', value: 10 },
  { suit: '♦', rank: 'K', value: 10 },
  { suit: '♠', rank: 'Q', value: 10 },
  { suit: '♣', rank: 'J', value: 10 },
  { suit: '♥', rank: '2', value: 2 },
  { suit: '♥', rank: '3', value: 3 },
  // Player1 (non-dealer)'s hand - will discard 4♠, 6♠
  { suit: '♠', rank: '2', value: 2 },
  { suit: '♠', rank: '3', value: 3 },
  { suit: '♠', rank: '5', value: 5 },
  { suit: '♠', rank: '7', value: 7 },
  { suit: '♠', rank: '4', value: 4 },
  { suit: '♠', rank: '6', value: 6 },
  // Cut card
  { suit: '♥', rank: 'K', value: 10 },
  // Rest
  { suit: '♦', rank: 'A', value: 1 },
];

// Deck for playing game: player3 invites player1
// Player3 (dealer) gets indices 0-5, Player1 (non-dealer) gets indices 6-11
// Player1 plays first (non-dealer) with low-value cards so they can play at count=0
const PLAY_DECK = [
  // Player3 (dealer)'s hand - will discard K♦, Q♦
  { suit: '♣', rank: 'K', value: 10 },
  { suit: '♣', rank: 'Q', value: 10 },
  { suit: '♣', rank: 'J', value: 10 },
  { suit: '♣', rank: 'A', value: 1 },
  { suit: '♦', rank: 'K', value: 10 },
  { suit: '♦', rank: 'Q', value: 10 },
  // Player1 (non-dealer)'s hand - will discard 9♠, 8♠
  // Keeps: 2♠, 3♠, 4♠, 5♠ - all playable at count=0!
  { suit: '♠', rank: '2', value: 2 },
  { suit: '♠', rank: '3', value: 3 },
  { suit: '♠', rank: '4', value: 4 },
  { suit: '♠', rank: '5', value: 5 },
  { suit: '♠', rank: '9', value: 9 },
  { suit: '♠', rank: '8', value: 8 },
  // Cut card
  { suit: '♥', rank: '5', value: 5 },
  // Rest
  { suit: '♦', rank: 'A', value: 1 },
];

// Deck for counting game: player4 invites player1
// Player4 (dealer) gets indices 0-5, Player1 (non-dealer) gets indices 6-11
// Need to play through all pegging to reach counting phase
const COUNT_DECK = [
  // Player4 (dealer)'s hand - discard 4♥, 6♥, keep: 5♥, 5♦, 5♠, J♥
  { suit: '♥', rank: '5', value: 5 },
  { suit: '♦', rank: '5', value: 5 },
  { suit: '♠', rank: '5', value: 5 },
  { suit: '♥', rank: 'J', value: 10 },
  { suit: '♥', rank: '4', value: 4 },
  { suit: '♥', rank: '6', value: 6 },
  // Player1 (non-dealer)'s hand - discard K♠, Q♦, keep: 10♣, 10♦, 6♣, 9♥
  { suit: '♣', rank: '10', value: 10 },
  { suit: '♦', rank: '10', value: 10 },
  { suit: '♣', rank: '6', value: 6 },
  { suit: '♥', rank: '9', value: 9 },
  { suit: '♠', rank: 'K', value: 10 },
  { suit: '♦', rank: 'Q', value: 10 },
  // Cut card
  { suit: '♣', rank: '5', value: 5 },
  // Rest
  { suit: '♠', rank: 'A', value: 1 },
  { suit: '♦', rank: 'A', value: 1 },
];

// Deck for waiting counting game: player1 invites player6
// Player1 (dealer) gets indices 0-5, Player6 (non-dealer) gets indices 6-11
// Player6 counts first (non-dealer), so player1 sees "Waiting for..."
const WAITING_COUNT_DECK = [
  // Player1 (dealer)'s hand - discard 4♣, 6♣, keep: 5♣, 5♦, 5♠, J♣
  { suit: '♣', rank: '5', value: 5 },
  { suit: '♦', rank: '5', value: 5 },
  { suit: '♠', rank: '5', value: 5 },
  { suit: '♣', rank: 'J', value: 10 },
  { suit: '♣', rank: '4', value: 4 },
  { suit: '♣', rank: '6', value: 6 },
  // Player6 (non-dealer)'s hand - discard K♥, Q♥, keep: 10♥, 10♦, 6♥, 9♦
  { suit: '♥', rank: '10', value: 10 },
  { suit: '♦', rank: '10', value: 10 },
  { suit: '♥', rank: '6', value: 6 },
  { suit: '♦', rank: '9', value: 9 },
  { suit: '♥', rank: 'K', value: 10 },
  { suit: '♥', rank: 'Q', value: 10 },
  // Cut card
  { suit: '♠', rank: '5', value: 5 },
  // Rest
  { suit: '♠', rank: 'A', value: 1 },
  { suit: '♦', rank: 'A', value: 1 },
];

// Legacy alias for backward compatibility
const TEST_DECK = DISCARD_DECK;

async function login(page, userKey) {
  await authLogin(page, userKey);
}

async function forfeitAllGames(page) {
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const data = await response.json();
  if (!data.success || !data.games) return 0;

  let forfeited = 0;
  for (const game of data.games) {
    if (game.status === 'active' || game.status === 'waiting') {
      const deleteResponse = await page.request.delete(`${BASE_URL}/api/multiplayer/games/${game.id}`);
      const deleteData = await deleteResponse.json();
      if (deleteData.success) forfeited++;
    }
  }
  return forfeited;
}

async function declineAllInvitations(page) {
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/invitations`);
  const data = await response.json();
  if (!data.success) return 0;

  let declined = 0;
  if (data.received) {
    for (const inv of data.received) {
      const resp = await page.request.post(`${BASE_URL}/api/multiplayer/invitations/${inv.id}`, {
        data: { action: 'decline' }
      });
      if ((await resp.json()).success) declined++;
    }
  }
  if (data.sent) {
    for (const inv of data.sent) {
      const resp = await page.request.post(`${BASE_URL}/api/multiplayer/invitations/${inv.id}`, {
        data: { action: 'cancel' }
      });
      if ((await resp.json()).success) declined++;
    }
  }
  return declined;
}

/**
 * Create a game and progress it to the specified phase
 * @param {Object} options - Configuration options
 * @param {Page} options.inviterPage - Page of user who sends invitation (becomes dealer)
 * @param {Page} options.accepterPage - Page of user who accepts (becomes non-dealer, plays/counts first)
 * @param {string} options.accepterEmail - Email of the accepter
 * @param {string} options.targetPhase - Target phase: 'discarding', 'cut', 'playing', 'counting'
 * @param {string} options.gameName - Name for logging
 * @param {Array} options.deck - Test deck to use
 * @param {Array} options.inviterDiscards - Cards for inviter (dealer) to discard
 * @param {Array} options.accepterDiscards - Cards for accepter (non-dealer) to discard
 * @param {Array} options.playSequence - Array of play actions for counting phase [{page, card}] or [{page, go: true}]
 */
async function createGameAtPhase(options) {
  const {
    inviterPage,
    accepterPage,
    accepterEmail,
    targetPhase,
    gameName,
    deck,
    inviterDiscards,
    accepterDiscards,
    playSequence
  } = options;

  console.log(`\n  Creating ${gameName} (target: ${targetPhase})...`);

  // Create invitation
  const inviteResponse = await inviterPage.request.post(`${BASE_URL}/api/multiplayer/invitations`, {
    data: { toEmail: accepterEmail }
  });
  const inviteData = await inviteResponse.json();
  if (!inviteData.success) throw new Error(`Invite failed: ${inviteData.error}`);
  const invitationId = inviteData.invitation.id;

  // Accept invitation with specified deck
  const acceptResponse = await accepterPage.request.post(`${BASE_URL}/api/multiplayer/invitations/${invitationId}`, {
    data: {
      action: 'accept',
      useTestDeck: true,
      testDeck: deck
    }
  });
  const acceptData = await acceptResponse.json();
  if (!acceptData.success) throw new Error(`Accept failed: ${acceptData.error}`);
  const gameId = acceptData.gameId;
  console.log(`    Created game: ${gameId}`);

  if (targetPhase === 'discarding') {
    console.log(`    ✓ ${gameName} ready at discarding phase`);
    return gameId;
  }

  // Progress to cut phase: both players discard
  // Inviter (dealer) discards first, then accepter (non-dealer)
  await inviterPage.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'discard',
      data: { cards: inviterDiscards }
    }
  });

  await accepterPage.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'discard',
      data: { cards: accepterDiscards }
    }
  });

  if (targetPhase === 'cut') {
    console.log(`    ✓ ${gameName} ready at cut phase`);
    return gameId;
  }

  // Accepter (non-dealer) cuts
  await accepterPage.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: { moveType: 'cut', data: { cutIndex: 0 } }
  });

  if (targetPhase === 'playing') {
    console.log(`    ✓ ${gameName} ready at playing phase`);
    return gameId;
  }

  // Progress to counting phase: play through pegging using provided sequence
  if (!playSequence) {
    throw new Error('playSequence required for counting phase');
  }

  for (const action of playSequence) {
    if (action.go) {
      await action.page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
        data: { moveType: 'go' }
      });
    } else {
      await action.page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
        data: { moveType: 'play', data: { card: action.card } }
      });
    }
  }

  console.log(`    ✓ ${gameName} ready at counting phase`);
  return gameId;
}

function saveTestState(games) {
  const state = {
    games,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(TEST_STATE_PATH, JSON.stringify(state, null, 2));
  console.log(`\n  Saved game IDs to test-state.json`);
}

// ============================================================
// MAIN RESET TEST
// ============================================================
test('Reset game state for test users', async ({ browser }) => {
  test.setTimeout(180000); // 3 minute timeout

  // Create contexts for all 6 players
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const context3 = await browser.newContext();
  const context4 = await browser.newContext();
  const context5 = await browser.newContext();
  const context6 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  const page3 = await context3.newPage();
  const page4 = await context4.newPage();
  const page5 = await context5.newPage();
  const page6 = await context6.newPage();

  try {
    // ========== STEP 1: Login all users ==========
    console.log('\n========== STEP 1: Logging in all users ==========');
    await login(page1, 'player1');
    console.log('  ✓ Player 1 logged in');
    await login(page2, 'player2');
    console.log('  ✓ Player 2 logged in');
    await login(page3, 'player3');
    console.log('  ✓ Player 3 logged in');
    await login(page4, 'player4');
    console.log('  ✓ Player 4 logged in');
    await login(page5, 'player5');
    console.log('  ✓ Player 5 logged in');
    await login(page6, 'player6');
    console.log('  ✓ Player 6 logged in');

    // ========== STEP 2: Clean up existing games ==========
    console.log('\n========== STEP 2: Cleaning up existing games ==========');
    let totalForfeited = 0;
    totalForfeited += await forfeitAllGames(page1);
    totalForfeited += await forfeitAllGames(page2);
    totalForfeited += await forfeitAllGames(page3);
    totalForfeited += await forfeitAllGames(page4);
    totalForfeited += await forfeitAllGames(page5);
    totalForfeited += await forfeitAllGames(page6);
    console.log(`  Forfeited ${totalForfeited} games total`);

    // ========== STEP 3: Clean up invitations ==========
    console.log('\n========== STEP 3: Cleaning up invitations ==========');
    let totalDeclined = 0;
    totalDeclined += await declineAllInvitations(page1);
    totalDeclined += await declineAllInvitations(page2);
    totalDeclined += await declineAllInvitations(page3);
    totalDeclined += await declineAllInvitations(page4);
    totalDeclined += await declineAllInvitations(page5);
    totalDeclined += await declineAllInvitations(page6);
    console.log(`  Declined/canceled ${totalDeclined} invitations total`);

    // ========== STEP 4: Create games at each phase ==========
    console.log('\n========== STEP 4: Creating games at each phase ==========');

    // Game 1: player1 vs player2 - discarding phase
    // player1 invites player2, player1 is dealer
    const discardingGameId = await createGameAtPhase({
      inviterPage: page1,
      accepterPage: page2,
      accepterEmail: config.users.player2.email,
      targetPhase: 'discarding',
      gameName: 'discardingGame',
      deck: DISCARD_DECK,
      inviterDiscards: [{ suit: '♥', rank: '4' }, { suit: '♥', rank: '6' }],
      accepterDiscards: [{ suit: '♠', rank: 'K' }, { suit: '♦', rank: 'Q' }]
    });

    // Game 2: player5 vs player1 - cut phase
    // player5 invites player1, so player1 is non-dealer and cuts!
    const cutGameId = await createGameAtPhase({
      inviterPage: page5,
      accepterPage: page1,
      accepterEmail: config.users.player1.email,
      targetPhase: 'cut',
      gameName: 'cutGame',
      deck: CUT_DECK,
      inviterDiscards: [{ suit: '♥', rank: '2' }, { suit: '♥', rank: '3' }],
      accepterDiscards: [{ suit: '♠', rank: '4' }, { suit: '♠', rank: '6' }]
    });

    // Game 3: player3 vs player1 - playing phase
    // player3 invites player1, so player1 is non-dealer and plays first!
    const playingGameId = await createGameAtPhase({
      inviterPage: page3,
      accepterPage: page1,
      accepterEmail: config.users.player1.email,
      targetPhase: 'playing',
      gameName: 'playingGame',
      deck: PLAY_DECK,
      inviterDiscards: [{ suit: '♦', rank: 'K' }, { suit: '♦', rank: 'Q' }],
      accepterDiscards: [{ suit: '♠', rank: '9' }, { suit: '♠', rank: '8' }]
    });

    // Game 4: player4 vs player1 - counting phase (player1's turn)
    // player4 invites player1, so player1 is non-dealer and counts first!
    // Play sequence: Non-dealer (player1) plays first
    // Player1 keeps: 10♣, 10♦, 6♣, 9♥
    // Player4 keeps: 5♥, 5♦, 5♠, J♥
    const countingGameId = await createGameAtPhase({
      inviterPage: page4,
      accepterPage: page1,
      accepterEmail: config.users.player1.email,
      targetPhase: 'counting',
      gameName: 'countingGame',
      deck: COUNT_DECK,
      inviterDiscards: [{ suit: '♥', rank: '4' }, { suit: '♥', rank: '6' }],
      accepterDiscards: [{ suit: '♠', rank: 'K' }, { suit: '♦', rank: 'Q' }],
      playSequence: [
        // Round 1: P1→10♣(10), P4→5♥(15), P1→10♦(25), P4→5♦(30), P1 Go, P4 Go
        { page: page1, card: { suit: '♣', rank: '10' } },
        { page: page4, card: { suit: '♥', rank: '5' } },
        { page: page1, card: { suit: '♦', rank: '10' } },
        { page: page4, card: { suit: '♦', rank: '5' } },
        { page: page1, go: true },
        { page: page4, go: true },
        // Round 2: P1→6♣(6), P4→5♠(11), P1→9♥(20), P4→J♥(30)
        { page: page1, card: { suit: '♣', rank: '6' } },
        { page: page4, card: { suit: '♠', rank: '5' } },
        { page: page1, card: { suit: '♥', rank: '9' } },
        { page: page4, card: { suit: '♥', rank: 'J' } }
      ]
    });

    // Game 5: player1 vs player6 - counting phase (player1 waits)
    // player1 invites player6, so player1 is dealer and player6 counts first!
    // Player1 sees "Waiting for player6..."
    // Play sequence: Non-dealer (player6) plays first
    // Player1 keeps: 5♣, 5♦, 5♠, J♣
    // Player6 keeps: 10♥, 10♦, 6♥, 9♦
    const waitingCountingGameId = await createGameAtPhase({
      inviterPage: page1,
      accepterPage: page6,
      accepterEmail: config.users.player6.email,
      targetPhase: 'counting',
      gameName: 'waitingCountingGame',
      deck: WAITING_COUNT_DECK,
      inviterDiscards: [{ suit: '♣', rank: '4' }, { suit: '♣', rank: '6' }],
      accepterDiscards: [{ suit: '♥', rank: 'K' }, { suit: '♥', rank: 'Q' }],
      playSequence: [
        // Round 1: P6→10♥(10), P1→5♣(15), P6→10♦(25), P1→5♦(30), P6 Go, P1 Go
        { page: page6, card: { suit: '♥', rank: '10' } },
        { page: page1, card: { suit: '♣', rank: '5' } },
        { page: page6, card: { suit: '♦', rank: '10' } },
        { page: page1, card: { suit: '♦', rank: '5' } },
        { page: page6, go: true },
        { page: page1, go: true },
        // Round 2: P6→6♥(6), P1→5♠(11), P6→9♦(20), P1→J♣(30)
        { page: page6, card: { suit: '♥', rank: '6' } },
        { page: page1, card: { suit: '♠', rank: '5' } },
        { page: page6, card: { suit: '♦', rank: '9' } },
        { page: page1, card: { suit: '♣', rank: 'J' } }
      ]
    });

    // ========== STEP 5: Save game IDs ==========
    console.log('\n========== STEP 5: Saving game state ==========');
    saveTestState({
      discarding: discardingGameId,
      cut: cutGameId,
      playing: playingGameId,
      counting: countingGameId,
      waitingCounting: waitingCountingGameId
    });

    // ========== STEP 6: Verify all games ==========
    console.log('\n========== STEP 6: Verifying games ==========');

    // Verify phase-based games
    const gameIds = {
      discarding: discardingGameId,
      cut: cutGameId,
      playing: playingGameId,
      counting: countingGameId
    };

    for (const [phase, gameId] of Object.entries(gameIds)) {
      const resp = await page1.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
      const data = await resp.json();
      const actualPhase = data.game?.gameState?.phase;
      const isMyTurn = data.game?.isMyTurn;
      console.log(`  ${phase}Game (${gameId}): phase=${actualPhase}, isMyTurn=${isMyTurn}`);
      expect(actualPhase).toBe(phase);
    }

    // Verify waitingCounting game (counting phase, NOT player1's turn)
    const waitingResp = await page1.request.get(`${BASE_URL}/api/multiplayer/games/${waitingCountingGameId}`);
    const waitingData = await waitingResp.json();
    console.log(`  waitingCountingGame (${waitingCountingGameId}): phase=${waitingData.game?.gameState?.phase}, isMyTurn=${waitingData.game?.isMyTurn}`);
    expect(waitingData.game?.gameState?.phase).toBe('counting');
    expect(waitingData.game?.isMyTurn).toBe(false);

    console.log('\n========================================');
    console.log('✓ RESET COMPLETE - 5 games ready!');
    console.log('========================================');
    console.log(`  discardingGame:       ${discardingGameId} (player1 vs player2)`);
    console.log(`  cutGame:              ${cutGameId} (player1 vs player5, player1 cuts)`);
    console.log(`  playingGame:          ${playingGameId} (player1 vs player3, player1's turn)`);
    console.log(`  countingGame:         ${countingGameId} (player1 vs player4, player1 counts)`);
    console.log(`  waitingCountingGame:  ${waitingCountingGameId} (player1 vs player6, player1 waits)`);
    console.log('========================================\n');

  } finally {
    await context1.close();
    await context2.close();
    await context3.close();
    await context4.close();
    await context5.close();
    await context6.close();
  }
});
