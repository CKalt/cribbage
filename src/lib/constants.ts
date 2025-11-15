/**
 * Game constants and configuration
 */

import { GameState } from '@/types/game';

/**
 * Card suits
 */
export const SUITS = ['♠', '♥', '♦', '♣'] as const;

/**
 * Card ranks
 */
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

/**
 * Winning score for a game of cribbage
 */
export const WINNING_SCORE = 121;

/**
 * Maximum count during pegging phase
 */
export const MAX_PEGGING_COUNT = 31;

/**
 * Number of cards dealt to each player
 */
export const CARDS_PER_HAND = 6;

/**
 * Number of cards to keep after discarding to crib
 */
export const CARDS_TO_KEEP = 4;

/**
 * Number of cards to discard to crib
 */
export const CARDS_TO_DISCARD = 2;

/**
 * Initial game state
 */
export const INITIAL_GAME_STATE: GameState = {
  gamePhase: 'initial',
  deck: [],
  playerHand: [],
  computerHand: [],
  crib: [],
  starterCard: null,
  playerScore: 0,
  computerScore: 0,
  dealer: null,
  message: 'Click "Cut for Deal" to determine who deals first',
  selectedCards: [],
  peggingPile: [],
  peggingCount: 0,
  peggingTurn: null,
  playerPeggingHand: [],
  computerPeggingHand: [],
  playerPassedGo: false,
  computerPassedGo: false,
  lastPegger: null,
  playerCutCard: null,
  computerCutCard: null,
  deckForCutting: [],
  cutPosition: null,
};
