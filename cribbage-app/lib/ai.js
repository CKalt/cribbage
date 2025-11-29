// AI logic functions for Cribbage computer opponent
// Will be populated in Phase 3.4

/**
 * Computer AI - select which 4 cards to keep (discard 2 to crib)
 * @param {Array} hand - 6-card hand
 * @param {boolean} isDealer - Whether computer is dealer (owns crib)
 * @returns {Array} 4 cards to keep
 */
export const computerSelectCrib = (hand, isDealer) => {
  return hand.slice(0, 4);
};

/**
 * Computer AI - select which card to play during pegging
 * @param {Array} hand - Remaining cards in hand
 * @param {Array} playedCards - Cards already played this round
 * @param {number} currentCount - Current count
 * @returns {Object|null} Card to play, or null if no valid play
 */
export const computerSelectPlay = (hand, playedCards, currentCount) => {
  return null;
};
