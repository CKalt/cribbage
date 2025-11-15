/**
 * Card utility functions for the Cribbage game
 */

import { Card } from '@/types/game';

/**
 * Get the point value of a card rank for pegging/counting (A=1, face cards=10)
 */
export const getCardValue = (rank: string): number => {
  if (rank === 'A') return 1;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
};

/**
 * Get the rank value of a card for comparison purposes (A=1, J=11, Q=12, K=13)
 */
export const getRankValue = (rank: string): number => {
  const rankMap: { [key: string]: number } = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return rankMap[rank];
};

/**
 * Create a standard 52-card deck
 */
export const createDeck = (): Card[] => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const deck: Card[] = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank, value: getCardValue(rank) });
    }
  }
  return deck;
};

/**
 * Shuffle a deck of cards using Fisher-Yates algorithm
 */
export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

/**
 * Check if a set of cards forms a run (sequential ranks)
 */
export const isRun = (cards: Card[]): boolean => {
  const values = cards.map(c => getRankValue(c.rank)).sort((a, b) => a - b);
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) return false;
  }
  return true;
};

/**
 * Get all combinations of a specific length from an array
 */
export const getCombinations = <T>(arr: T[], len: number): T[][] => {
  if (len === 1) return arr.map(item => [item]);

  const result: T[][] = [];
  for (let i = 0; i <= arr.length - len; i++) {
    const head = arr[i];
    const tailCombos = getCombinations(arr.slice(i + 1), len - 1);
    for (let tail of tailCombos) {
      result.push([head, ...tail]);
    }
  }
  return result;
};
