// Expected-value discard strategy — Expert mode
// Evaluates all 15 possible keep/discard splits against all 46 possible cut cards.
// 690 evaluations per decision, <10ms on modern hardware.

import { suits, ranks, rankValues } from '../../constants';
import { calculateHandScore } from '../../scoring';

/**
 * Average crib value for each 2-card discard pair, indexed by sorted rank pair.
 * Values from published cribbage discard tables (Colvert & others).
 * Key format: "rank1-rank2" where rank1 <= rank2 in rankOrder.
 */
const CRIB_DISCARD_VALUES = {
  'A-A': 5.4, 'A-2': 4.6, 'A-3': 4.3, 'A-4': 5.1, 'A-5': 5.9, 'A-6': 3.8,
  'A-7': 3.7, 'A-8': 3.6, 'A-9': 3.4, 'A-10': 3.6, 'A-J': 3.7, 'A-Q': 3.6, 'A-K': 3.5,
  '2-2': 5.8, '2-3': 5.1, '2-4': 4.4, '2-5': 6.0, '2-6': 4.1, '2-7': 4.0,
  '2-8': 3.9, '2-9': 3.6, '2-10': 3.7, '2-J': 3.8, '2-Q': 3.7, '2-K': 3.6,
  '3-3': 5.4, '3-4': 4.3, '3-5': 6.0, '3-6': 4.1, '3-7': 4.4, '3-8': 3.8,
  '3-9': 3.5, '3-10': 3.6, '3-J': 3.7, '3-Q': 3.6, '3-K': 3.5,
  '4-4': 5.4, '4-5': 6.3, '4-6': 4.4, '4-7': 4.0, '4-8': 3.8, '4-9': 3.5,
  '4-10': 3.6, '4-J': 3.7, '4-Q': 3.6, '4-K': 3.5,
  '5-5': 8.5, '5-6': 6.1, '5-7': 5.6, '5-8': 5.5, '5-9': 5.1, '5-10': 6.1,
  '5-J': 6.5, '5-Q': 6.1, '5-K': 6.0,
  '6-6': 5.6, '6-7': 5.5, '6-8': 4.9, '6-9': 5.2, '6-10': 3.7, '6-J': 3.8,
  '6-Q': 3.7, '6-K': 3.6,
  '7-7': 5.7, '7-8': 5.5, '7-9': 4.4, '7-10': 3.6, '7-J': 3.7, '7-Q': 3.6, '7-K': 3.5,
  '8-8': 5.5, '8-9': 4.2, '8-10': 3.5, '8-J': 3.6, '8-Q': 3.5, '8-K': 3.4,
  '9-9': 5.1, '9-10': 3.6, '9-J': 3.7, '9-Q': 3.6, '9-K': 3.5,
  '10-10': 4.0, '10-J': 4.1, '10-Q': 3.9, '10-K': 3.8,
  'J-J': 4.5, 'J-Q': 4.0, 'J-K': 3.9,
  'Q-Q': 4.4, 'Q-K': 3.8,
  'K-K': 4.3,
};

// Rank sort order for building the crib value key
const RANK_SORT = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

/**
 * Get estimated crib value for a 2-card discard pair.
 * Looks up the average contribution in CRIB_DISCARD_VALUES by sorted rank pair.
 */
function estimateCribValue(discarded) {
  const r1 = discarded[0].rank;
  const r2 = discarded[1].rank;
  // Sort by rank order
  const sorted = RANK_SORT[r1] <= RANK_SORT[r2] ? [r1, r2] : [r2, r1];
  const key = `${sorted[0]}-${sorted[1]}`;
  return CRIB_DISCARD_VALUES[key] || 3.5; // fallback to average
}

/**
 * Build a full 52-card deck for iterating over possible cut cards.
 */
function buildFullDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, value: rankValues[rank] });
    }
  }
  return deck;
}

/**
 * Check if a card is in the given hand (by suit and rank).
 */
function cardInHand(card, hand) {
  return hand.some(c => c.rank === card.rank && c.suit === card.suit);
}

/**
 * Expert discard strategy using expected value over all possible cut cards.
 *
 * For each of 15 possible keep/discard splits:
 *   - Iterate over all 46 remaining cards as potential cuts
 *   - Calculate hand score for each cut using calculateHandScore
 *   - Average to get expected hand value
 *   - Estimate crib value from static table
 *   - If dealer, add crib value; if pone, subtract it
 *   - Choose the split with highest combined score
 *
 * @param {Array} hand - 6-card hand
 * @param {boolean} isDealer - Whether computer is dealer (owns crib)
 * @returns {Array} 4 cards to keep
 */
export const computerSelectCrib = (hand, isDealer) => {
  if (hand.length !== 6) {
    console.error('[AI Expert] computerSelectCrib called with wrong number of cards:', hand.length);
    return hand.slice(0, 4);
  }

  const fullDeck = buildFullDeck();
  // Remaining cards = 52 minus the 6 in hand
  const remainingCards = fullDeck.filter(c => !cardInHand(c, hand));

  let bestCards = [];
  let bestScore = -Infinity;
  let bestDebug = null;

  // Try all 15 combinations of 2 cards to discard
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const kept = hand.filter((_, idx) => idx !== i && idx !== j);
      const discarded = [hand[i], hand[j]];

      // Calculate expected hand value over all possible cut cards
      let totalHandScore = 0;
      for (const cutCard of remainingCards) {
        const { score } = calculateHandScore(kept, cutCard, false);
        totalHandScore += score;
      }
      const expectedHandValue = totalHandScore / remainingCards.length;

      // Estimate crib value from discard table
      const expectedCribValue = estimateCribValue(discarded);

      // Combined: add crib for dealer, subtract for pone
      const combinedScore = expectedHandValue + (isDealer ? expectedCribValue : -expectedCribValue);

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestCards = kept;
        bestDebug = {
          kept: kept.map(c => `${c.rank}${c.suit}`),
          discarded: discarded.map(c => `${c.rank}${c.suit}`),
          handEV: expectedHandValue.toFixed(2),
          cribEV: expectedCribValue.toFixed(2),
          combined: combinedScore.toFixed(2),
        };
      }
    }
  }

  if (bestDebug) {
    console.log(`[AI Expert] EV discard: kept=[${bestDebug.kept}], handEV=${bestDebug.handEV}, cribEV=${bestDebug.cribEV}, combined=${bestDebug.combined}, isDealer=${isDealer}`);
  }

  if (bestCards.length !== 4) {
    console.error('[AI Expert] computerSelectCrib returning wrong number of cards:', bestCards.length);
    return hand.slice(0, 4);
  }

  return bestCards;
};
