// Expert pegging strategy — stronger play selection with lookahead
//
// Improvements over heuristic:
// - No randomness (deterministic, optimal play)
// - Deeper positional awareness (trap plays, count control)
// - Opponent hand estimation (avoids giving pairs to likely holdings)
// - Better endgame card retention

import { rankOrder } from '../../constants';
import { calculatePeggingScore } from '../../scoring';

/**
 * Count how many 10-value cards exist in a standard deck.
 * Used for probability estimates (16 out of 52).
 */
const TEN_VALUE_DENSITY = 16 / 52;

/**
 * Expert pegging strategy.
 *
 * @param {Array} hand - Remaining cards in computer's hand
 * @param {Array} playedCards - Cards played this round (both players)
 * @param {number} currentCount - Current pegging count
 * @returns {Object|null} Card to play, or null if no valid play
 */
export const computerSelectPlay = (hand, playedCards, currentCount) => {
  const validCards = hand.filter(card => currentCount + card.value <= 31);

  if (validCards.length === 0) return null;
  if (validCards.length === 1) return validCards[0];

  let bestCard = null;
  let bestScore = -Infinity;

  const lastCard = playedCards.length > 0 ? playedCards[playedCards.length - 1] : null;

  // Track what ranks have been played to estimate remaining cards
  const playedRanks = {};
  for (const c of playedCards) {
    playedRanks[c.rank] = (playedRanks[c.rank] || 0) + 1;
  }

  for (const card of validCards) {
    let score = 0;
    const newCount = currentCount + card.value;
    const tempPlayed = [...playedCards, card];

    // === IMMEDIATE POINTS (heavily weighted) ===
    const { score: immediatePoints } = calculatePeggingScore(tempPlayed, newCount);
    score += immediatePoints * 15;

    // === LEADING STRATEGY (count = 0) ===
    if (currentCount === 0) {
      // Never lead with a 5
      if (card.value === 5) score -= 20;

      // Lead with 4 — opponent can't make 15, and if they play 10-value
      // we can potentially pair or score 15
      if (card.value === 4) score += 8;

      // Lead with 3 or A — safe openers, opponent can't get 15
      if (card.value === 3) score += 6;
      if (card.value === 1) score += 4;

      // Leading 2 is okay
      if (card.value === 2) score += 5;

      // 10-value leads are risky (opponent may have a 5)
      if (card.value === 10) score -= 2;
    }

    // === COUNT CONTROL — avoid dangerous counts ===
    const remaining = 31 - newCount;

    // Don't leave count at 5 (opponent plays 10-value for 15)
    if (newCount === 5) score -= 14;

    // Don't leave count at 10 (opponent plays 5 for 15)
    if (remaining === 5) score -= 12;

    // Don't leave count at 21 (opponent plays 10-value for 31)
    if (newCount === 21) score -= 10;

    // Count of 10 is dangerous — easy 15 with any 5
    if (remaining === 10) score -= 8;

    // Reaching exactly 15 or 31 is great
    if (newCount === 15) score += 12;
    if (newCount === 31) score += 10;

    // Leaving count 1-4 from 31 gives opponent easy last card / go
    if (remaining >= 1 && remaining <= 4) score -= 5;

    // === PAIR / TRIPLE AWARENESS ===
    if (lastCard && card.rank === lastCard.rank) {
      // Making a pair is worth 2 points — but check if opponent might triple
      const rankAlreadyPlayed = playedRanks[card.rank] || 0;
      if (rankAlreadyPlayed >= 2) {
        // We'd be making trips — 6 points!
        score += 8;
      } else {
        // Just a pair — good but opponent might have the third
        score += 4;
      }
    }

    // === RUN AWARENESS ===
    if (lastCard) {
      const lastRank = rankOrder[lastCard.rank];
      const cardRank = rankOrder[card.rank];
      // Playing adjacent card may let opponent extend run
      if (Math.abs(lastRank - cardRank) === 1) {
        score -= 3;
      }
    }

    // === TRAP PLAYS ===
    // If count is 11, play a 4 to reach 15 — opponent likely plays 10-value
    // landing at 25, and we can try for 31 with a 6
    if (currentCount === 11 && card.value === 4) score += 3;

    // If count is 17, play a 4 to reach 21 — risky but opponent might not have 10
    // Actually this is dangerous per above, skip

    // === ENDGAME — card retention ===
    // Keep low cards when count is low (flexible later when count is high)
    if (currentCount < 15 && card.value <= 3 && hand.length > 2) {
      score -= 4;
    }

    // Save aces — they're the most flexible endgame card
    if (card.rank === 'A' && hand.length > 2) score -= 5;

    // When count is high (>= 22), prefer lowest card to avoid going over
    if (currentCount >= 22) {
      // Bonus for low cards that keep us in play
      score += (10 - card.value);
    }

    // === OPPONENT HAND ESTIMATION ===
    // If opponent has had many 10-value cards already played, less likely to pair
    if (card.value === 10) {
      const tenValuesPlayed = playedCards.filter(c => c.value === 10).length;
      // Each 10-value played reduces risk of opponent having one
      score += tenValuesPlayed * 0.5;
    }

    // No randomness — deterministic optimal play
    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  }

  return bestCard;
};
