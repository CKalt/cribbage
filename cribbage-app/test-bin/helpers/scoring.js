/**
 * Scoring validation helpers for cribbage tests
 *
 * These helpers verify that scores are calculated correctly
 * based on known card combinations.
 */

const { expect } = require('@playwright/test');

// Card value mapping for counting
const cardValues = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10, 'Q': 10, 'K': 10
};

// Rank order for runs
const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Parse a card string like "5♠" into { rank, suit, value }
 * @param {string} cardStr
 * @returns {Object}
 */
function parseCard(cardStr) {
  const suit = cardStr.slice(-1);
  const rank = cardStr.slice(0, -1);
  return {
    rank,
    suit,
    value: cardValues[rank]
  };
}

/**
 * Calculate points for fifteens in a hand
 * @param {Array} cards - Array of card objects
 * @returns {number} Points from fifteens (2 per fifteen)
 */
function countFifteens(cards) {
  let count = 0;
  const values = cards.map(c => c.value);

  // Check all combinations
  const n = values.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += values[i];
      }
    }
    if (sum === 15) count++;
  }

  return count * 2;
}

/**
 * Calculate points for pairs in a hand
 * @param {Array} cards - Array of card objects
 * @returns {number} Points from pairs (2 per pair)
 */
function countPairs(cards) {
  let count = 0;
  const ranks = cards.map(c => c.rank);

  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      if (ranks[i] === ranks[j]) count++;
    }
  }

  return count * 2;
}

/**
 * Calculate points for runs in a hand
 * @param {Array} cards - Array of card objects
 * @returns {number} Points from runs
 */
function countRuns(cards) {
  const ranks = cards.map(c => rankOrder.indexOf(c.rank));
  const sorted = [...new Set(ranks)].sort((a, b) => a - b);

  let maxRun = 0;
  let currentRun = 1;
  let runMultiplier = 1;

  // Find the longest run
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentRun++;
    } else {
      if (currentRun >= 3) maxRun = Math.max(maxRun, currentRun);
      currentRun = 1;
    }
  }
  if (currentRun >= 3) maxRun = Math.max(maxRun, currentRun);

  if (maxRun < 3) return 0;

  // Count multiplier for duplicate ranks in the run
  const rankCounts = {};
  for (const r of ranks) {
    rankCounts[r] = (rankCounts[r] || 0) + 1;
  }

  // If we have a run, multiply by duplicate cards
  for (const count of Object.values(rankCounts)) {
    if (count > 1) runMultiplier *= count;
  }

  return maxRun * runMultiplier;
}

/**
 * Check for flush (all same suit)
 * @param {Array} handCards - 4 cards in hand
 * @param {Object} cutCard - The cut card
 * @param {boolean} isCrib - Whether this is a crib (flush rules differ)
 * @returns {number} Points from flush
 */
function countFlush(handCards, cutCard, isCrib = false) {
  const handSuits = handCards.map(c => c.suit);
  const allSameSuit = handSuits.every(s => s === handSuits[0]);

  if (!allSameSuit) return 0;

  // In crib, cut must also match
  if (isCrib) {
    return cutCard.suit === handSuits[0] ? 5 : 0;
  }

  // In hand, 4 flush or 5 flush
  return cutCard.suit === handSuits[0] ? 5 : 4;
}

/**
 * Check for nobs (Jack of same suit as cut card)
 * @param {Array} handCards - Cards in hand
 * @param {Object} cutCard - The cut card
 * @returns {number} 1 if nobs, 0 otherwise
 */
function countNobs(handCards, cutCard) {
  return handCards.some(c => c.rank === 'J' && c.suit === cutCard.suit) ? 1 : 0;
}

/**
 * Calculate total hand score
 * @param {Array} handCards - 4 cards in hand (as strings like "5♠")
 * @param {string} cutCard - The cut card (as string)
 * @param {boolean} isCrib - Whether this is a crib
 * @returns {Object} { total, fifteens, pairs, runs, flush, nobs }
 */
function calculateHandScore(handCards, cutCard, isCrib = false) {
  const hand = handCards.map(parseCard);
  const cut = parseCard(cutCard);
  const allCards = [...hand, cut];

  const fifteens = countFifteens(allCards);
  const pairs = countPairs(allCards);
  const runs = countRuns(allCards);
  const flush = countFlush(hand, cut, isCrib);
  const nobs = countNobs(hand, cut);

  return {
    total: fifteens + pairs + runs + flush + nobs,
    fifteens,
    pairs,
    runs,
    flush,
    nobs
  };
}

/**
 * Verify a score on the page matches expected
 * @param {Page} page - Playwright page
 * @param {number} expectedScore - Expected score value
 * @param {string} scoreType - 'hand', 'crib', 'total'
 */
async function verifyScore(page, expectedScore, scoreType = 'total') {
  const selector = `[data-testid="${scoreType}-score"], text=${expectedScore}`;
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
}

/**
 * Get displayed score from page
 * @param {Page} page - Playwright page
 * @param {string} player - 'player' or 'computer'
 * @returns {Promise<number|null>}
 */
async function getDisplayedScore(page, player) {
  try {
    const scoreText = await page.locator(`[data-testid="${player}-score"]`).textContent();
    return parseInt(scoreText, 10);
  } catch {
    return null;
  }
}

module.exports = {
  parseCard,
  countFifteens,
  countPairs,
  countRuns,
  countFlush,
  countNobs,
  calculateHandScore,
  verifyScore,
  getDisplayedScore,
  cardValues,
  rankOrder
};
