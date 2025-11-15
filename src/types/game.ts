/**
 * Type definitions for the Cribbage game
 */

/**
 * Represents a playing card
 */
export interface Card {
  suit: string;
  rank: string;
  value: number;
}

/**
 * All possible game phases
 */
export type GamePhase =
  | 'initial'      // Start of game - cut for dealer
  | 'cutting'      // Player is cutting the deck for dealer
  | 'cut'          // Cut complete, dealer determined
  | 'deal'         // Ready to deal cards
  | 'discard'      // Players selecting cards to discard to crib
  | 'cut-starter'  // Ready to cut the starter card
  | 'pegging'      // Pegging (play) phase
  | 'counting'     // Counting hands and crib
  | 'round-end'    // Round complete
  | 'game-over';   // Game won

/**
 * Player identifier
 */
export type Player = 'player' | 'computer';

/**
 * Represents a card played during pegging
 */
export interface PeggingPlay {
  card: Card;
  player: Player;
}

/**
 * Complete game state interface
 */
export interface GameState {
  gamePhase: GamePhase;
  deck: Card[];
  playerHand: Card[];
  computerHand: Card[];
  crib: Card[];
  starterCard: Card | null;
  playerScore: number;
  computerScore: number;
  dealer: Player | null;
  message: string;
  selectedCards: Card[];
  peggingPile: PeggingPlay[];
  peggingCount: number;
  peggingTurn: Player | null;
  playerPeggingHand: Card[];
  computerPeggingHand: Card[];
  playerPassedGo: boolean;
  computerPassedGo: boolean;
  lastPegger: Player | null;
  playerCutCard: Card | null;
  computerCutCard: Card | null;
  deckForCutting: Card[];
  cutPosition: number | null;
}
