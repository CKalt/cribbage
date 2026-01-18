// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Reset Game Script - Creates games at multiple phases for comprehensive testing
 *
 * Creates 3 games using different player pairs (to avoid "already have active game" error):
 * 1. discardingGame: player1 vs player2 - Stops at discarding phase
 * 2. playingGame:    player1 vs player3 - Progresses to playing phase
 * 3. countingGame:   player1 vs player4 - Progresses to counting phase
 *
 * Game IDs are saved to test-state.json for other tests to use.
 */

const { login: authLogin, getBaseUrl } = require('./helpers/auth');
const config = require('./test-config');

const BASE_URL = getBaseUrl();
const TEST_STATE_PATH = path.join(__dirname, 'test-state.json');

/**
 * Known test deck for deterministic testing
 */
const TEST_DECK = [
  // Player 1's hand (indices 0-5)
  { suit: '♥', rank: '5', value: 5 },
  { suit: '♦', rank: '5', value: 5 },
  { suit: '♠', rank: '5', value: 5 },
  { suit: '♥', rank: 'J', value: 10 },
  { suit: '♥', rank: '4', value: 4 },
  { suit: '♥', rank: '6', value: 6 },
  // Player 2's hand (indices 6-11)
  { suit: '♣', rank: '10', value: 10 },
  { suit: '♦', rank: '10', value: 10 },
  { suit: '♣', rank: '6', value: 6 },
  { suit: '♠', rank: 'K', value: 10 },
  { suit: '♦', rank: 'Q', value: 10 },
  { suit: '♥', rank: '9', value: 9 },
  // Cut card at index 12
  { suit: '♣', rank: '5', value: 5 },
  // Rest of deck...
  { suit: '♠', rank: 'A', value: 1 },
  { suit: '♦', rank: 'A', value: 1 },
];

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
 */
async function createGameAtPhase(page1, page2, inviteeEmail, targetPhase, gameName) {
  console.log(`\n  Creating ${gameName} (target: ${targetPhase})...`);

  // Create invitation
  const inviteResponse = await page1.request.post(`${BASE_URL}/api/multiplayer/invitations`, {
    data: { toEmail: inviteeEmail }
  });
  const inviteData = await inviteResponse.json();
  if (!inviteData.success) throw new Error(`Invite failed: ${inviteData.error}`);
  const invitationId = inviteData.invitation.id;

  // Accept invitation with TEST DECK
  const acceptResponse = await page2.request.post(`${BASE_URL}/api/multiplayer/invitations/${invitationId}`, {
    data: {
      action: 'accept',
      useTestDeck: true,
      testDeck: TEST_DECK
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

  // Progress to playing phase: both players discard, then cut
  await page1.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'discard',
      data: { cards: [{ suit: '♥', rank: '4' }, { suit: '♥', rank: '6' }] }
    }
  });

  await page2.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'discard',
      data: { cards: [{ suit: '♠', rank: 'K' }, { suit: '♦', rank: 'Q' }] }
    }
  });

  // Player 2 (non-dealer) cuts
  await page2.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: { moveType: 'cut', data: { cutIndex: 0 } }
  });

  if (targetPhase === 'playing') {
    console.log(`    ✓ ${gameName} ready at playing phase`);
    return gameId;
  }

  // Progress to counting phase: play through pegging
  async function playCard(page, card) {
    await page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
      data: { moveType: 'play', data: { card } }
    });
  }

  async function sayGo(page) {
    await page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
      data: { moveType: 'go' }
    });
  }

  // Round 1: P2→10♣, P1→5♥, P2→10♦, P1→5♦, both Go
  await playCard(page2, { suit: '♣', rank: '10' });
  await playCard(page1, { suit: '♥', rank: '5' });
  await playCard(page2, { suit: '♦', rank: '10' });
  await playCard(page1, { suit: '♦', rank: '5' });
  await sayGo(page2);
  await sayGo(page1);

  // Round 2: P2→6♣, P1→5♠, P2→9♥, P1→J♥
  await playCard(page2, { suit: '♣', rank: '6' });
  await playCard(page1, { suit: '♠', rank: '5' });
  await playCard(page2, { suit: '♥', rank: '9' });
  await playCard(page1, { suit: '♥', rank: 'J' });

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

  // Create contexts for all 4 players
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const context3 = await browser.newContext();
  const context4 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  const page3 = await context3.newPage();
  const page4 = await context4.newPage();

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

    // ========== STEP 2: Clean up existing games ==========
    console.log('\n========== STEP 2: Cleaning up existing games ==========');
    let totalForfeited = 0;
    totalForfeited += await forfeitAllGames(page1);
    totalForfeited += await forfeitAllGames(page2);
    totalForfeited += await forfeitAllGames(page3);
    totalForfeited += await forfeitAllGames(page4);
    console.log(`  Forfeited ${totalForfeited} games total`);

    // ========== STEP 3: Clean up invitations ==========
    console.log('\n========== STEP 3: Cleaning up invitations ==========');
    let totalDeclined = 0;
    totalDeclined += await declineAllInvitations(page1);
    totalDeclined += await declineAllInvitations(page2);
    totalDeclined += await declineAllInvitations(page3);
    totalDeclined += await declineAllInvitations(page4);
    console.log(`  Declined/canceled ${totalDeclined} invitations total`);

    // ========== STEP 4: Create games at each phase ==========
    console.log('\n========== STEP 4: Creating games at each phase ==========');

    // Game 1: player1 vs player2 - discarding phase
    const discardingGameId = await createGameAtPhase(
      page1, page2, config.users.player2.email, 'discarding', 'discardingGame'
    );

    // Game 2: player1 vs player3 - playing phase
    const playingGameId = await createGameAtPhase(
      page1, page3, config.users.player3.email, 'playing', 'playingGame'
    );

    // Game 3: player1 vs player4 - counting phase
    const countingGameId = await createGameAtPhase(
      page1, page4, config.users.player4.email, 'counting', 'countingGame'
    );

    // ========== STEP 5: Save game IDs ==========
    console.log('\n========== STEP 5: Saving game state ==========');
    saveTestState({
      discarding: discardingGameId,
      playing: playingGameId,
      counting: countingGameId
    });

    // ========== STEP 6: Verify all games ==========
    console.log('\n========== STEP 6: Verifying games ==========');

    const gameIds = {
      discarding: discardingGameId,
      playing: playingGameId,
      counting: countingGameId
    };

    for (const [phase, gameId] of Object.entries(gameIds)) {
      const resp = await page1.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
      const data = await resp.json();
      const actualPhase = data.game?.gameState?.phase;
      console.log(`  ${phase}Game (${gameId}): phase=${actualPhase}`);
      expect(actualPhase).toBe(phase);
    }

    console.log('\n========================================');
    console.log('✓ RESET COMPLETE - 3 games ready!');
    console.log('========================================');
    console.log(`  discardingGame: ${discardingGameId} (player1 vs player2)`);
    console.log(`  playingGame:    ${playingGameId} (player1 vs player3)`);
    console.log(`  countingGame:   ${countingGameId} (player1 vs player4)`);
    console.log('========================================\n');

  } finally {
    await context1.close();
    await context2.close();
    await context3.close();
    await context4.close();
  }
});
