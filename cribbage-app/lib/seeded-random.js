/**
 * Seeded Random Number Generator
 * Uses Mulberry32 algorithm for fast, reproducible randomness
 *
 * When TEST_DECK_SEED is set, the same seed will always produce
 * the same sequence of random numbers, enabling deterministic testing.
 */

/**
 * Create a seeded random number generator
 * @param {number} seed - The seed value
 * @returns {Function} A function that returns random numbers 0-1
 */
export function createSeededRandom(seed) {
  let state = seed;

  return function() {
    // Mulberry32 algorithm
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle array using seeded random (Fisher-Yates)
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Random seed
 * @returns {Array} - Shuffled array (new array, original unchanged)
 */
export function seededShuffle(array, seed) {
  const random = createSeededRandom(seed);
  const shuffled = [...array];

  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Get the current test deck seed from environment or test state
 * @returns {number|null} The seed, or null if not in test mode
 */
export function getTestDeckSeed() {
  // Check environment variable first
  if (typeof process !== 'undefined' && process.env?.TEST_DECK_SEED) {
    return parseInt(process.env.TEST_DECK_SEED, 10);
  }
  return null;
}

/**
 * Check if we're in test mode (deterministic deck enabled)
 * @returns {boolean}
 */
export function isTestMode() {
  return getTestDeckSeed() !== null;
}
