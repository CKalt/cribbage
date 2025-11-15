/**
 * Scoring utility functions for the Cribbage game
 */

import { Card, PeggingPlay } from '@/types/game';
import { getRankValue, isRun, getCombinations } from './cardUtils';

/**
 * Score points during the pegging phase
 * Checks for: 15s, 31s, pairs, and runs
 */
export const scorePegging = (pile: PeggingPlay[], count: number): number => {
  let points = 0;

  // Points for reaching 15 or 31
  if (count === 15) points += 2;
  if (count === 31) points += 2;

  // Check for pairs, three of a kind, or four of a kind
  if (pile.length >= 2) {
    const last = pile[pile.length - 1].card.rank;
    const secondLast = pile[pile.length - 2].card.rank;

    if (last === secondLast) {
      // Check for three of a kind
      if (pile.length >= 3 && pile[pile.length - 3].card.rank === last) {
        // Check for four of a kind
        if (pile.length >= 4 && pile[pile.length - 4].card.rank === last) {
          points += 12; // Four of a kind
        } else {
          points += 6; // Three of a kind
        }
      } else {
        points += 2; // Pair
      }
    }
  }

  // Check for runs (3 or more cards in sequence)
  for (let len = pile.length; len >= 3; len--) {
    const recentCards = pile.slice(-len).map(p => p.card);
    if (isRun(recentCards)) {
      points += len;
      break;
    }
  }

  return points;
};

/**
 * Count all combinations that sum to 15
 */
export const count15s = (cards: Card[]): number => {
  let count = 0;
  const n = cards.length;

  // Use bit mask to generate all subsets
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += cards[i].value;
      }
    }
    if (sum === 15) count += 2;
  }

  return count;
};

/**
 * Count all pairs in a hand
 */
export const countPairs = (cards: Card[]): number => {
  let count = 0;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) {
        count += 2;
      }
    }
  }
  return count;
};

/**
 * Count all runs in a hand
 * Finds the longest run and counts all instances
 */
export const countRuns = (cards: Card[]): number => {
  // Check from longest possible run down to 3 cards
  for (let len = 5; len >= 3; len--) {
    const combos = getCombinations(cards, len);
    let runCount = 0;

    for (let combo of combos) {
      if (isRun(combo)) {
        runCount++;
      }
    }

    if (runCount > 0) {
      return runCount * len;
    }
  }

  return 0;
};

/**
 * Score a complete hand (including the starter card)
 * @param hand - The 4 cards in the player's hand
 * @param starter - The starter card
 * @param isCrib - Whether this is the crib (affects flush scoring)
 */
export const scoreHand = (hand: Card[], starter: Card, isCrib: boolean): number => {
  const allCards = [...hand, starter];
  let points = 0;

  // Count 15s
  points += count15s(allCards);

  // Count pairs
  points += countPairs(allCards);

  // Count runs
  points += countRuns(allCards);

  // Count flush
  if (isCrib) {
    // In crib, all 5 cards must be same suit for 5 points
    if (allCards.every(c => c.suit === allCards[0].suit)) {
      points += 5;
    }
  } else {
    // In hand, 4 cards same suit = 4 points, all 5 = 5 points
    if (hand.every(c => c.suit === hand[0].suit)) {
      points += 4;
      if (starter.suit === hand[0].suit) {
        points += 1;
      }
    }
  }

  // Count nobs (Jack of same suit as starter)
  const nobs = hand.find(c => c.rank === 'J' && c.suit === starter.suit);
  if (nobs) points += 1;

  return points;
};
