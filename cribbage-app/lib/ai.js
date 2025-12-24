// AI logic functions for Cribbage computer opponent

import { rankOrder } from './constants';
import { calculatePeggingScore } from './scoring';

/**
 * Computer AI - select which 4 cards to keep (discard 2 to crib)
 * Evaluates all possible 4-card combinations and picks the best
 * @param {Array} hand - 6-card hand
 * @param {boolean} isDealer - Whether computer is dealer (owns crib)
 * @returns {Array} 4 cards to keep
 */
export const computerSelectCrib = (hand, isDealer) => {
  if (hand.length !== 6) {
    console.error('computerSelectCrib called with wrong number of cards:', hand.length);
    return hand.slice(0, 4); // Fallback
  }

  let bestCards = [];
  let bestScore = -1000;

  // Try all combinations of 4 cards to keep
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const kept = hand.filter((_, idx) => idx !== i && idx !== j);

      if (kept.length !== 4) {
        console.error('Kept cards should be 4 but is', kept.length);
        continue;
      }

      const discarded = [hand[i], hand[j]];

      // Estimate potential score
      let score = 0;

      // Count guaranteed points in kept cards
      // Fifteens
      for (let a = 0; a < kept.length; a++) {
        for (let b = a + 1; b < kept.length; b++) {
          if (kept[a].value + kept[b].value === 15) score += 2;
        }
      }

      // Pairs
      for (let a = 0; a < kept.length; a++) {
        for (let b = a + 1; b < kept.length; b++) {
          if (kept[a].rank === kept[b].rank) score += 2;
        }
      }

      // Potential for runs
      const keptRanks = kept.map(c => rankOrder[c.rank]).sort((a, b) => a - b);
      for (let a = 0; a < keptRanks.length - 2; a++) {
        if (keptRanks[a + 2] - keptRanks[a] <= 2) score += 1; // Close to a run
      }

      // Prefer to keep 5s (good for 15s)
      kept.forEach(card => {
        if (card.rank === '5') score += 2;
      });

      // If dealer, slightly penalize good cards going to our crib
      // If not dealer, heavily penalize good cards going to opponent's crib
      const cribPenalty = isDealer ? 0.3 : 1;
      discarded.forEach(card => {
        if (card.rank === '5') score -= 2 * cribPenalty;
        if (['J', 'Q', 'K'].includes(card.rank) && card.value === 10) score -= 1 * cribPenalty;
      });

      if (score > bestScore) {
        bestScore = score;
        bestCards = kept;
      }
    }
  }

  // Final safety check
  if (bestCards.length !== 4) {
    console.error('computerSelectCrib returning wrong number of cards:', bestCards.length);
    return hand.slice(0, 4);
  }

  return bestCards;
};

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
    score += Math.random() * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  });

  return bestCard;
};
