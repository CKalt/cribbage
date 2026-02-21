// Deck utility functions for Cribbage game

import { suits, ranks, rankValues } from './constants';
import { aiRandom } from './ai/rng';

/**
 * Create a standard 52-card deck
 * @returns {Array} Array of card objects with suit, rank, and value
 */
export const createDeck = () => {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, value: rankValues[rank] });
    }
  }
  return deck;
};

/**
 * Shuffle a deck using Fisher-Yates algorithm
 * @param {Array} deck - The deck to shuffle
 * @returns {Array} New shuffled deck (does not modify original)
 */
export const shuffleDeck = (deck) => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(aiRandom() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};
