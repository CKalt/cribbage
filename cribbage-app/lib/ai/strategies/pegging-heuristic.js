// Heuristic pegging strategy — used by all difficulty modes in Phase 1

import { rankOrder } from '../../constants';
import { calculatePeggingScore } from '../../scoring';
import { aiRandom } from '../rng';

/**
 * Computer AI - select which card to play during pegging
 * Considers immediate points and avoiding giving opponent easy points
 * @param {Array} hand - Remaining cards in hand
 * @param {Array} playedCards - Cards already played this round
 * @param {number} currentCount - Current count
 * @returns {Object|null} Card to play, or null if no valid play
 */
export const computerSelectPlay = (hand, playedCards, currentCount) => {
  const validCards = hand.filter(card => currentCount + card.value <= 31);

  if (validCards.length === 0) return null;
  if (validCards.length === 1) return validCards[0];

  let bestCard = null;
  let bestScore = -1000;

  // Get the last played card (opponent's last play) if any
  const lastCard = playedCards.length > 0 ? playedCards[playedCards.length - 1] : null;

  validCards.forEach(card => {
    let score = 0;
    const newCount = currentCount + card.value;
    const tempPlayed = [...playedCards, card];

    // Calculate immediate points
    const { score: immediatePoints } = calculatePeggingScore(tempPlayed, newCount);
    score += immediatePoints * 10;

    // === LEADING STRATEGY (first card of a round) ===
    if (currentCount === 0) {
      // Never lead with a 5 - too easy for opponent to get 15
      if (card.value === 5) score -= 15;

      // Prefer leading with cards < 5 - opponent cannot make 15
      if (card.value < 5) score += 5;

      // Leading with a 4 is ideal - opponent can't make 15, and if they play 10-value
      // the count is 14, giving us a chance to make 15
      if (card.value === 4) score += 3;

      // Leading with face cards (10-value) is okay but not great
      // Opponent might pair it or have a 5
      if (card.value === 10) score += 1;
    }

    // === RESPONSE STRATEGY ===
    // Prefer to play cards that don't give opponent easy 15s
    const remaining = 31 - newCount;
    if (remaining === 10) score -= 8; // Easy 15 with any face card
    if (remaining === 5) score -= 10; // Easy 15 with a 5

    // Avoid leaving count at 21 (easy 10 for 31)
    if (newCount === 21) score -= 6;

    // Prefer hitting 31 exactly or getting close
    if (newCount === 31) score += 5;
    if (remaining >= 1 && remaining <= 4) score -= 3; // Opponent might get 31

    // === PAIR/RUN AWARENESS ===
    // If we just got paired, be cautious - opponent might have third card
    if (lastCard && card.rank === lastCard.rank) {
      // We'd be making a pair - good for us
      score += 5;
    }

    // Check for potential run extensions by opponent
    if (lastCard) {
      const lastRank = rankOrder[lastCard.rank];
      const cardRank = rankOrder[card.rank];
      // If we play adjacent to their card, they might extend the run
      if (Math.abs(lastRank - cardRank) === 1) {
        score -= 2; // Slight penalty - they might have connecting cards
      }
    }

    // === ENDGAME STRATEGY ===
    // Keep low cards for later when count is high
    if (card.value <= 4 && currentCount < 20) score -= 2;

    // Save aces for last - they're very flexible
    if (card.rank === 'A' && hand.length > 2) score -= 3;

    // Random factor to make AI less predictable
    score += aiRandom() * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  });

  return bestCard;
};
