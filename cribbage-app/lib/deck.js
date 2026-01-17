// Deck utility functions for Cribbage game

import { suits, ranks, rankValues } from './constants';
import { seededShuffle, getTestDeckSeed } from './seeded-random';

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
 * When TEST_DECK_SEED is set, uses seeded shuffle for deterministic results
 * @param {Array} deck - The deck to shuffle
 * @param {number} [seed] - Optional seed (overrides TEST_DECK_SEED)
 * @returns {Array} New shuffled deck (does not modify original)
 */
export const shuffleDeck = (deck, seed = null) => {
  // Check for deterministic test mode
  const testSeed = seed ?? getTestDeckSeed();

  if (testSeed !== null) {
    console.log(`[TEST MODE] Using deterministic shuffle with seed: ${testSeed}`);
    return seededShuffle(deck, testSeed);
  }

  // Normal random shuffle for production
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

/**
 * Create and shuffle a new deck
 * @param {number} [seed] - Optional seed for deterministic shuffle
 * @returns {Array} Shuffled deck
 */
export const createShuffledDeck = (seed = null) => {
  return shuffleDeck(createDeck(), seed);
};
