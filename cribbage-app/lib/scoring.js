// Scoring utility functions for Cribbage game

import { rankOrder } from './constants';

/**
 * Calculate the score for a hand (or crib) with a cut card
 * Includes fifteens, pairs, runs, flushes, and nobs
 * @param {Array} hand - Array of 4 cards
 * @param {Object} cutCard - The cut card
 * @param {boolean} isCrib - Whether this is a crib (affects flush rules)
 * @returns {Object} { score, breakdown }
 */
export const calculateHandScore = (hand, cutCard, isCrib = false) => {
  let score = 0;
  let breakdown = [];
  const allCards = [...hand, cutCard];

  // Fifteens - find all combinations that sum to 15
  for (let i = 0; i < (1 << allCards.length); i++) {
    let sum = 0;
    let combo = [];
    for (let j = 0; j < allCards.length; j++) {
      if (i & (1 << j)) {
        sum += allCards[j].value;
        combo.push(`${allCards[j].rank}${allCards[j].suit}`);
      }
    }
    if (sum === 15 && combo.length >= 2) {
      score += 2;
      breakdown.push(`Fifteen (${combo.join('+')}): 2`);
    }
  }

  // Pairs
  for (let i = 0; i < allCards.length; i++) {
    for (let j = i + 1; j < allCards.length; j++) {
      if (allCards[i].rank === allCards[j].rank) {
        score += 2;
        breakdown.push(`Pair (${allCards[i].rank}${allCards[i].suit}-${allCards[j].rank}${allCards[j].suit}): 2`);
      }
    }
  }

  // Runs - check for sequences of 3, 4, or 5 cards
  let maxRunLength = 0;
  let runCombinations = [];

  for (let size = 5; size >= 3; size--) {
    for (let i = 0; i < (1 << allCards.length); i++) {
      let selectedCards = [];
      for (let j = 0; j < allCards.length; j++) {
        if (i & (1 << j)) selectedCards.push(allCards[j]);
      }

      if (selectedCards.length === size) {
        const sorted = selectedCards.map(c => ({ ...c, order: rankOrder[c.rank] })).sort((a, b) => a.order - b.order);
        let isRun = true;
        for (let k = 1; k < sorted.length; k++) {
          if (sorted[k].order !== sorted[k - 1].order + 1) {
            isRun = false;
            break;
          }
        }

        if (isRun && size >= maxRunLength) {
          if (size > maxRunLength) {
            maxRunLength = size;
            runCombinations = [sorted.map(c => `${c.rank}${c.suit}`).join('-')];
          } else if (size === maxRunLength) {
            const runStr = sorted.map(c => `${c.rank}${c.suit}`).join('-');
            if (!runCombinations.includes(runStr)) {
              runCombinations.push(runStr);
            }
          }
        }
      }
    }
    if (runCombinations.length > 0) break;
  }

  runCombinations.forEach(run => {
    score += maxRunLength;
    breakdown.push(`Run of ${maxRunLength} (${run}): ${maxRunLength}`);
  });

  // Flush - only count cards in hand (not cut card initially)
  const handSuits = {};
  hand.forEach(card => {
    handSuits[card.suit] = (handSuits[card.suit] || 0) + 1;
  });

  for (const suit in handSuits) {
    if (handSuits[suit] === 4) {
      score += 4;
      breakdown.push(`Flush (4 ${suit}): 4`);
      if (cutCard.suit === suit) {
        score += 1;
        breakdown.push(`Flush with cut (5 ${suit}): 1`);
      }
    }
  }

  // Nobs (Jack of same suit as cut card in hand) - only check cards in hand, not cut card
  hand.forEach(card => {
    if (card.rank === 'J' && card.suit === cutCard.suit) {
      score += 1;
      breakdown.push(`Nobs (J${card.suit} matches cut card ${cutCard.rank}${cutCard.suit}): 1`);
    }
  });

  return { score, breakdown };
};

/**
 * Calculate pegging score for the last played card
 * Includes fifteens, thirty-ones, pairs, and runs
 * @param {Array} playedCards - Cards played in current round
 * @param {number} currentCount - Current count (sum of card values)
 * @returns {Object} { score, reason }
 */
export const calculatePeggingScore = (playedCards, currentCount) => {
  if (playedCards.length === 0) return { score: 0, reason: '' };

  let score = 0;
  let reasons = [];

  // Check for 15
  if (currentCount === 15) {
    score += 2;
    reasons.push('fifteen for 2');
  }

  // Check for 31
  if (currentCount === 31) {
    score += 2;
    reasons.push('thirty-one for 2');
  }

  // Check for pairs/trips/quads
  if (playedCards.length >= 2) {
    let matchCount = 1;
    const lastRank = playedCards[playedCards.length - 1].rank;

    for (let i = playedCards.length - 2; i >= 0; i--) {
      if (playedCards[i].rank === lastRank) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount === 2) {
      score += 2;
      reasons.push('pair for 2');
    } else if (matchCount === 3) {
      score += 6;
      reasons.push('three of a kind for 6');
    } else if (matchCount === 4) {
      score += 12;
      reasons.push('four of a kind for 12');
    }
  }

  // Check for runs (must be at least 3 cards and check only the most recent cards)
  if (playedCards.length >= 3) {
    // Try different run lengths starting from the longest possible
    for (let runLength = Math.min(7, playedCards.length); runLength >= 3; runLength--) {
      const recentCards = playedCards.slice(-runLength);
      const sortedRanks = recentCards.map(c => rankOrder[c.rank]).sort((a, b) => a - b);

      let isRun = true;
      for (let i = 1; i < sortedRanks.length; i++) {
        if (sortedRanks[i] !== sortedRanks[i - 1] + 1) {
          isRun = false;
          break;
        }
      }

      if (isRun) {
        score += runLength;
        reasons.push(`run of ${runLength} for ${runLength}`);
        break; // Only count the longest run
      }
    }
  }

  return { score, reason: reasons.join(' and ') };
};
