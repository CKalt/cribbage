/**
 * Game synchronization utilities for multiplayer tests
 */

const { expect } = require('@playwright/test');
const config = require('../test-config');
const { getBaseUrl } = require('./auth');

/**
 * Wait for game state to update after an action
 * @param {Page} page - Playwright page
 * @param {string} expectedText - Expected text to appear
 * @param {number} timeout - Timeout in ms
 */
async function waitForGameUpdate(page, expectedText, timeout = 10000) {
  await page.waitForFunction(
    (text) => document.body.innerText.includes(text),
    expectedText,
    { timeout }
  );
}

/**
 * Wait for it to be this player's turn
 * @param {Page} page - Playwright page
 * @param {number} timeout - Timeout in ms
 */
async function waitForMyTurn(page, timeout = 30000) {
  await expect(
    page.locator('text=Your Turn').or(page.locator('[data-testid="my-turn"]'))
  ).toBeVisible({ timeout });
}

/**
 * Wait for opponent's turn (waiting state)
 * @param {Page} page - Playwright page
 * @param {number} timeout - Timeout in ms
 */
async function waitForOpponentTurn(page, timeout = 30000) {
  await expect(
    page.locator('text=Waiting for').or(page.locator('[data-testid="opponent-turn"]'))
  ).toBeVisible({ timeout });
}

/**
 * Get current game phase
 * @param {Page} page - Playwright page
 * @returns {Promise<string>} - 'discarding', 'cutting', 'pegging', 'counting', 'unknown'
 */
async function getGamePhase(page) {
  const phaseIndicators = {
    discarding: ['Select 2 cards', 'discard'],
    cutting: ['Cut', 'cut the deck'],
    pegging: ['Count:', 'play a card'],
    counting: ['Count your hand', 'score']
  };

  for (const [phase, indicators] of Object.entries(phaseIndicators)) {
    for (const indicator of indicators) {
      if (await page.locator(`text=${indicator}`).first().isVisible().catch(() => false)) {
        return phase;
      }
    }
  }

  return 'unknown';
}

/**
 * Synchronize both players by refreshing pages
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 */
async function syncPlayers(page1, page2) {
  // Refresh both pages
  await Promise.all([
    page1.reload(),
    page2.reload()
  ]);

  // Wait for pages to load
  await Promise.all([
    page1.waitForLoadState('networkidle'),
    page2.waitForLoadState('networkidle')
  ]);
}

/**
 * Set deterministic deck seed via API
 * @param {Page} page - Any page (just needs to make API call)
 * @param {number} seed - Deck seed
 */
async function setDeckSeed(page, seed) {
  const baseUrl = getBaseUrl();

  const response = await page.request.post(`${baseUrl}/api/test/set-deck`, {
    data: { seed }
  });

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to set deck seed: ${response.status()} - ${text}`);
  }

  console.log(`[TEST] Deck seed set to ${seed}`);
  return await response.json();
}

/**
 * Clear deck seed (return to random mode)
 * @param {Page} page - Any page
 */
async function clearDeckSeed(page) {
  const baseUrl = getBaseUrl();

  const response = await page.request.delete(`${baseUrl}/api/test/set-deck`);

  if (!response.ok()) {
    console.warn(`[TEST] Warning: Failed to clear deck seed: ${response.status()}`);
  } else {
    console.log('[TEST] Deck seed cleared - returning to random mode');
  }
}

/**
 * Get current test state
 * @param {Page} page - Any page
 * @returns {Promise<Object|null>}
 */
async function getTestState(page) {
  const baseUrl = getBaseUrl();

  const response = await page.request.get(`${baseUrl}/api/test/set-deck`);

  if (!response.ok()) {
    return null;
  }

  const data = await response.json();
  return data.testState;
}

/**
 * Open the Game Lobby
 * @param {Page} page - Playwright page
 */
async function openGameLobby(page) {
  // Click the three-dot menu
  await page.click('button:has-text("⋮")');
  await page.waitForTimeout(500);

  // Click "Play vs Friend"
  await page.click('text=Play vs Friend');
  await page.waitForTimeout(500);

  // Verify lobby is open
  await expect(page.locator('text=Find Players')).toBeVisible({ timeout: 5000 });
  console.log('[LOBBY] Game Lobby opened');
}

/**
 * Close the Game Lobby
 * @param {Page} page - Playwright page
 */
async function closeGameLobby(page) {
  await page.click('button:has-text("Close")');
  await page.waitForTimeout(300);
}

/**
 * Search for a player in the lobby
 * @param {Page} page - Playwright page
 * @param {string} searchTerm - Email or username to search
 */
async function searchForPlayer(page, searchTerm) {
  await page.fill('input[placeholder*="Search"]', searchTerm);
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(2000);
}

/**
 * Send game invitation to a player
 * @param {Page} page - Playwright page
 * @param {string} playerEmail - Email to invite
 * @returns {Promise<boolean>} True if invitation sent
 */
async function sendInvitation(page, playerEmail) {
  await searchForPlayer(page, playerEmail);

  const inviteButton = page.locator('button:has-text("Invite")').first();
  if (await inviteButton.isVisible()) {
    await inviteButton.click();
    await page.waitForTimeout(1000);

    // Check for success
    const success = await page.locator('text=Invitation sent').isVisible().catch(() => false);
    if (success) {
      console.log(`[INVITE] Invitation sent to ${playerEmail}`);
      return true;
    }
  }

  console.log(`[INVITE] Could not send invitation to ${playerEmail}`);
  return false;
}

/**
 * Accept a pending invitation
 * @param {Page} page - Playwright page
 * @returns {Promise<boolean>} True if accepted
 */
async function acceptInvitation(page) {
  // Go to Invitations tab
  await page.click('text=Invitations');
  await page.waitForTimeout(1000);

  const acceptButton = page.locator('button:has-text("Accept")').first();
  if (await acceptButton.isVisible()) {
    await acceptButton.click();
    await page.waitForTimeout(2000);
    console.log('[INVITE] Invitation accepted');
    return true;
  }

  console.log('[INVITE] No invitation to accept');
  return false;
}

module.exports = {
  waitForGameUpdate,
  waitForMyTurn,
  waitForOpponentTurn,
  getGamePhase,
  syncPlayers,
  setDeckSeed,
  clearDeckSeed,
  getTestState,
  openGameLobby,
  closeGameLobby,
  searchForPlayer,
  sendInvitation,
  acceptInvitation
};
