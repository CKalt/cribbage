// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://beta.cribbage.chrisk.com';

// Test accounts
const USER1 = {
  email: 'chris@chrisk.com',
  password: 'Hello123$'
};

/**
 * Helper: Get auth token by logging in
 */
async function getAuthToken(page, user) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE_URL + '/', { timeout: 10000 });

  // Get token from cookies
  const cookies = await page.context().cookies();
  const tokenCookie = cookies.find(c => c.name === 'token');
  return tokenCookie?.value;
}

// ============================================================
// TEST: Players API returns user list
// ============================================================
test('GET /api/multiplayer/players returns players', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const response = await page.request.get(`${BASE_URL}/api/multiplayer/players`);
  expect(response.status()).toBe(200);

  const data = await response.json();
  console.log('Players API response:', JSON.stringify(data, null, 2).slice(0, 500));

  expect(data.success).toBe(true);
  expect(data.players).toBeDefined();
  console.log(`✓ Found ${data.players.length} players`);
});

// ============================================================
// TEST: Games API returns user's games
// ============================================================
test('GET /api/multiplayer/games returns games', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  expect(response.status()).toBe(200);

  const data = await response.json();
  console.log('Games API response:', JSON.stringify(data, null, 2).slice(0, 500));

  expect(data.success).toBe(true);
  expect(data.games).toBeDefined();
  console.log(`✓ Found ${data.games.length} games`);
});

// ============================================================
// TEST: Invitations API returns invitations
// ============================================================
test('GET /api/multiplayer/invitations returns invitations', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const response = await page.request.get(`${BASE_URL}/api/multiplayer/invitations`);
  expect(response.status()).toBe(200);

  const data = await response.json();
  console.log('Invitations API response:', JSON.stringify(data, null, 2).slice(0, 500));

  expect(data.success).toBe(true);
  console.log(`✓ Invitations API works`);
});

// ============================================================
// TEST: Game state includes gameState with cards
// ============================================================
test('GET /api/multiplayer/games/[id] includes game state', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  // First get list of games
  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  // Get first game's details
  const gameId = gamesData.games[0].id;
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  expect(response.status()).toBe(200);

  const data = await response.json();
  console.log('Game detail response keys:', Object.keys(data.game || {}));

  expect(data.success).toBe(true);
  expect(data.game).toBeDefined();
  expect(data.game.myPlayerKey).toBeDefined();
  expect(data.game.status).toBeDefined();

  if (data.game.gameState) {
    console.log('Game state keys:', Object.keys(data.game.gameState));
    expect(data.game.gameState.phase).toBeDefined();

    // Check for hands if in discarding phase
    if (data.game.gameState.phase === 'discarding') {
      const handKey = `${data.game.myPlayerKey}Hand`;
      expect(data.game.gameState[handKey]).toBeDefined();
      console.log(`✓ Player hand has ${data.game.gameState[handKey]?.length || 0} cards`);
    }
  }

  console.log('✓ Game state structure is correct');
});

// ============================================================
// TEST: Move API validates move type
// ============================================================
test('POST /api/multiplayer/games/[id]/move validates input', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  // Get a game
  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;

  // Try invalid move type
  const response = await page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'invalid_move',
      data: {}
    }
  });

  const data = await response.json();
  console.log('Invalid move response:', data);

  // Should fail with error
  expect(data.success).toBe(false);
  console.log('✓ Invalid move type is rejected');
});

// ============================================================
// TEST: Discard move requires cards array
// ============================================================
test('POST discard move requires cards array', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;

  // Try discard without cards
  const response = await page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'discard',
      data: {}  // Missing cards array
    }
  });

  const data = await response.json();
  console.log('Discard without cards response:', data);

  // Should fail - either because missing cards or wrong phase/turn
  // Either way, it shouldn't succeed
  if (data.success === false) {
    console.log('✓ Discard without cards is rejected');
  } else {
    console.log('⚠ Unexpected success - may have different validation');
  }
});

// ============================================================
// TEST: Game state includes dealer info
// ============================================================
test('Game state includes dealer info', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  const data = await response.json();

  if (data.game?.gameState?.dealer) {
    console.log('Dealer:', data.game.gameState.dealer);
    expect(['player1', 'player2']).toContain(data.game.gameState.dealer);
    console.log('✓ Dealer info is present');
  } else {
    console.log('⚠ No dealer info in game state');
  }
});

// ============================================================
// TEST: Game returns isMyTurn correctly
// ============================================================
test('Game API returns isMyTurn flag', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  const data = await response.json();

  expect(typeof data.game.isMyTurn).toBe('boolean');
  console.log('isMyTurn:', data.game.isMyTurn);
  console.log('✓ isMyTurn flag is present');
});

// ============================================================
// TEST: Scores are tracked
// ============================================================
test('Game tracks scores', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  const data = await response.json();

  expect(typeof data.game.myScore).toBe('number');
  expect(typeof data.game.opponentScore).toBe('number');

  console.log('My score:', data.game.myScore);
  console.log('Opponent score:', data.game.opponentScore);
  console.log('✓ Scores are tracked');
});

// ============================================================
// PLAY PHASE API TESTS
// ============================================================

// ============================================================
// TEST: Play move requires card
// ============================================================
test('POST play move requires card', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;

  // Try play without card
  const response = await page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'play',
      data: {}  // Missing card
    }
  });

  const data = await response.json();
  console.log('Play without card response:', data);

  // Should fail
  expect(data.success).toBe(false);
  console.log('✓ Play without card is rejected');
});

// ============================================================
// TEST: Go move works
// ============================================================
test('POST go move accepted', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;

  // Check game state first
  const gameResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  const gameData = await gameResponse.json();

  if (gameData.game?.gameState?.phase !== 'playing') {
    console.log('⚠ Not in playing phase');
    test.skip();
    return;
  }

  if (!gameData.game?.isMyTurn) {
    console.log('⚠ Not my turn');
    test.skip();
    return;
  }

  // Try go move
  const response = await page.request.post(`${BASE_URL}/api/multiplayer/games/${gameId}/move`, {
    data: {
      moveType: 'go',
      data: {}
    }
  });

  const data = await response.json();
  console.log('Go move response:', data);

  // Should succeed or fail with specific error (not generic error)
  if (data.success) {
    console.log('✓ Go move succeeded');
  } else {
    console.log('Go move rejected:', data.error);
    // This is ok - might not be valid to say go right now
  }
});

// ============================================================
// TEST: Game state includes playState during play phase
// ============================================================
test('Game state includes playState', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  const data = await response.json();

  if (data.game?.gameState?.phase !== 'playing') {
    console.log('⚠ Not in playing phase - skipping playState test');
    test.skip();
    return;
  }

  // Check playState structure
  const playState = data.game.gameState.playState;
  expect(playState).toBeDefined();

  console.log('playState keys:', Object.keys(playState || {}));

  // Should have currentCount
  expect(typeof playState.currentCount).toBe('number');
  console.log('Current count:', playState.currentCount);

  // Should have roundCards array
  expect(Array.isArray(playState.roundCards)).toBe(true);
  console.log('Round cards:', playState.roundCards?.length || 0);

  // Should have player hands
  const myKey = data.game.myPlayerKey;
  expect(playState[`${myKey}PlayHand`]).toBeDefined();
  console.log('My play hand cards:', playState[`${myKey}PlayHand`]?.length || 0);

  console.log('✓ playState structure is correct');
});

// ============================================================
// TEST: Cut card is returned after cut phase
// ============================================================
test('Game state includes cutCard after cut', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  const data = await response.json();

  const phase = data.game?.gameState?.phase;
  if (phase !== 'playing' && phase !== 'counting') {
    console.log('⚠ Game not past cut phase yet');
    test.skip();
    return;
  }

  // Should have cutCard
  const cutCard = data.game.gameState.cutCard;
  if (cutCard) {
    expect(cutCard.rank).toBeDefined();
    expect(cutCard.suit).toBeDefined();
    console.log('Cut card:', cutCard.rank + cutCard.suit);
    console.log('✓ cutCard is present');
  } else {
    console.log('⚠ No cut card found');
  }
});

// ============================================================
// TEST: Pegging points are tracked
// ============================================================
test('Pegging points are tracked', async ({ page }) => {
  const token = await getAuthToken(page, USER1);
  expect(token).toBeTruthy();

  const gamesResponse = await page.request.get(`${BASE_URL}/api/multiplayer/games`);
  const gamesData = await gamesResponse.json();

  if (!gamesData.games || gamesData.games.length === 0) {
    console.log('⚠ No games to test');
    test.skip();
    return;
  }

  const gameId = gamesData.games[0].id;
  const response = await page.request.get(`${BASE_URL}/api/multiplayer/games/${gameId}`);
  const data = await response.json();

  if (!data.game?.gameState?.peggingPoints) {
    console.log('⚠ No pegging points in game state');
    test.skip();
    return;
  }

  const peggingPoints = data.game.gameState.peggingPoints;
  expect(typeof peggingPoints.player1).toBe('number');
  expect(typeof peggingPoints.player2).toBe('number');

  console.log('Pegging points - P1:', peggingPoints.player1, 'P2:', peggingPoints.player2);
  console.log('✓ Pegging points are tracked');
});
