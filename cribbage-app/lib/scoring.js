// Scoring utility functions for Cribbage game
// Will be populated in Phase 3.2

/**
 * Calculate the score for a hand (or crib) with a cut card
 * @param {Array} hand - Array of 4 cards
 * @param {Object} cutCard - The cut card
 * @param {boolean} isCrib - Whether this is a crib (affects flush rules)
 * @returns {Object} { score, breakdown }
 */
export const calculateHandScore = (hand, cutCard, isCrib = false) => {
  return { score: 0, breakdown: [] };
};

/**
 * Calculate pegging score for the last played card
 * @param {Array} playedCards - Cards played in current round
 * @param {number} currentCount - Current count (sum of card values)
 * @returns {Object} { score, reason }
 */
export const calculatePeggingScore = (playedCards, currentCount) => {
  return { score: 0, reason: '' };
};
