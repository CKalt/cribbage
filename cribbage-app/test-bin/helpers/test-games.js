/**
 * Helper functions for accessing test games at different phases
 */
const fs = require('fs');
const path = require('path');

const TEST_STATE_PATH = path.join(__dirname, '..', 'test-state.json');

/**
 * Get game IDs for each phase from test-state.json
 * @returns {{ discarding: string, cut: string, playing: string, counting: string } | null}
 */
function getTestGames() {
  try {
    if (!fs.existsSync(TEST_STATE_PATH)) {
      console.log('⚠ test-state.json not found - run reset-game first');
      return null;
    }
    const state = JSON.parse(fs.readFileSync(TEST_STATE_PATH, 'utf8'));
    return state.games;
  } catch (error) {
    console.log('⚠ Error reading test-state.json:', error.message);
    return null;
  }
}

/**
 * Get the game ID for a specific phase
 * @param {'discarding' | 'cut' | 'playing' | 'counting' | 'waitingCounting'} phase
 * @returns {string | null}
 */
function getGameIdForPhase(phase) {
  const games = getTestGames();
  if (!games) return null;
  return games[phase] || null;
}

/**
 * Find and join a game at a specific phase using API
 * @param {Page} page - Playwright page (must be logged in)
 * @param {'discarding' | 'cut' | 'playing' | 'counting' | 'waitingCounting'} targetPhase - Which phase to look for
 * @param {string} baseUrl - Base URL for the app
 * @returns {Promise<{success: boolean, gameId: string | null, phase: string | null}>}
 */
async function findAndJoinGameAtPhase(page, targetPhase, baseUrl) {
  try {
    // Get all games via API
    const response = await page.request.get(`${baseUrl}/api/multiplayer/games`);
    const data = await response.json();

    if (!data.success || !data.games || data.games.length === 0) {
      console.log('⚠ No games found');
      return { success: false, gameId: null, phase: null };
    }

    // Handle special 'waitingCounting' phase - it's a counting game where it's NOT player's turn
    const actualPhase = targetPhase === 'waitingCounting' ? 'counting' : targetPhase;
    const requireWaiting = targetPhase === 'waitingCounting';

    // Find a game at the target phase
    for (const game of data.games) {
      // Get full game details to check phase
      const gameResponse = await page.request.get(`${baseUrl}/api/multiplayer/games/${game.id}`);
      const gameData = await gameResponse.json();
      const phase = gameData.game?.gameState?.phase;
      const isMyTurn = gameData.game?.isMyTurn;

      // For waitingCounting, we need counting phase AND NOT my turn
      if (requireWaiting && (phase !== 'counting' || isMyTurn)) {
        continue;
      }

      if (phase === actualPhase) {
        console.log(`Found ${targetPhase} game: ${game.id}`);

        // Get opponent info for finding the correct game in UI
        const opponentName = game.opponent?.username || game.opponent?.email?.split('@')[0];
        console.log(`Looking for game with opponent: ${opponentName}`);

        // Now open the game via UI
        await page.click('button:has-text("⋮")');
        await page.waitForTimeout(500);
        await page.click('text=Play vs Friend');
        await page.waitForTimeout(500);
        await page.click('text=My Games');
        await page.waitForTimeout(1000);

        // Find the game card/row that contains the opponent name and click its button
        // The game list shows opponent as "vs {username}" - be very specific
        const vsText = `vs ${opponentName}`;
        console.log(`Looking for: "${vsText}"`);

        // Find the specific game row - it's a div with p-3 class containing the opponent name
        // Use a more specific selector to find just the game row, not the entire modal
        const gameRow = page.locator('.p-3.rounded').filter({
          hasText: vsText
        }).first();

        if (await gameRow.isVisible({ timeout: 3000 })) {
          console.log('Found game row, clicking button...');
          // Click the action button within this game row (View or Your Turn)
          const actionButton = gameRow.locator('button').first();
          await actionButton.click();
          await page.waitForTimeout(2000);

          // Verify we're in the right phase by checking the UI
          const phaseText = await page.locator('text=Phase:').textContent().catch(() => '');
          console.log(`Joined game, phase text: ${phaseText}`);
          if (phaseText.includes(targetPhase)) {
            return { success: true, gameId: game.id, phase: targetPhase };
          }

          // Wrong phase, but we still joined a game
          console.log(`Warning: Expected ${targetPhase} but got ${phaseText}`);
          return { success: true, gameId: game.id, phase };
        } else {
          console.log(`⚠ Could not find game row for opponent ${opponentName}`);
        }
      }
    }

    console.log(`⚠ No game found at ${targetPhase} phase`);
    return { success: false, gameId: null, phase: null };
  } catch (error) {
    console.log('⚠ Error finding game:', error.message);
    return { success: false, gameId: null, phase: null };
  }
}

/**
 * Join a game at a specific phase
 * @param {Page} page - Playwright page (must be logged in)
 * @param {'discarding' | 'playing' | 'counting'} phase - Which phase game to join
 * @param {string} baseUrl - Base URL for the app
 * @returns {Promise<{success: boolean, gameId: string | null}>}
 */
async function joinGameForPhase(page, phase, baseUrl) {
  const gameId = getGameIdForPhase(phase);
  if (!gameId) {
    console.log(`⚠ No ${phase} game found in test-state.json`);
    return { success: false, gameId: null };
  }

  const joined = await joinGameById(page, gameId, baseUrl);
  return { success: joined, gameId };
}

module.exports = {
  getTestGames,
  getGameIdForPhase,
  findAndJoinGameAtPhase,
  TEST_STATE_PATH
};
