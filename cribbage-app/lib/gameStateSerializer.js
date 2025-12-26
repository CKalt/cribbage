/**
 * Game State Serialization Utilities
 *
 * Handles serializing and deserializing game state for persistence.
 */

/**
 * List of state variable names that should be persisted.
 * These represent the core game state needed to resume a game.
 */
export const PERSISTED_STATE_KEYS = [
  // Game flow
  'gameState',
  'dealer',
  'currentPlayer',
  'message',

  // Cards
  'deck',
  'playerHand',
  'computerHand',
  'crib',
  'cutCard',

  // Scores
  'playerScore',
  'computerScore',

  // Selection
  'selectedCards',

  // Play phase
  'playerPlayHand',
  'computerPlayHand',
  'playerPlayedCards',
  'computerPlayedCards',
  'allPlayedCards',
  'currentCount',
  'lastPlayedBy',
  'lastGoPlayer',
  'peggingHistory',
  'countingHistory',
  'computerCountingHand',

  // Counting phase
  'countingTurn',
  'handsCountedThisRound',
  'counterIsComputer',

  // Cutting phase
  'playerCutCard',
  'computerCutCard',
  'cutResultReady',

  // Scoring
  'pendingScore',
];

/**
 * State variables that should NOT be persisted (UI-only state).
 * These are reset to defaults when loading a saved game.
 */
export const UI_ONLY_STATE_KEYS = [
  'showPeggingSummary',
  'showCountingHistory',
  'showBreakdown',
  'isProcessingCount',
  'pendingCountContinue',
  'playerMadeCountDecision',
  'showMugginsPreferenceDialog',
  'pendingWrongMugginsResult',
  'debugLog',
  'gameLog',
  'playerCountInput',
  'computerClaimedScore',
  'actualScore',
  // Note: counterIsComputer is now in PERSISTED_STATE_KEYS for proper resume in counting phase
];

/**
 * Serialize game state variables to a JSON-compatible object.
 *
 * @param {Object} stateGetters - Object with getter functions for each state variable
 *                                e.g., { gameState: () => gameState, dealer: () => dealer, ... }
 * @returns {Object} Serialized game state
 */
export function serializeGameState(stateGetters) {
  const serialized = {};

  for (const key of PERSISTED_STATE_KEYS) {
    if (key in stateGetters) {
      serialized[key] = stateGetters[key];
    }
  }

  return serialized;
}

/**
 * Create a state object from current React state values.
 * This is a convenience function that takes the actual state values directly.
 *
 * @param {Object} stateValues - Object with current state values
 * @returns {Object} Serialized game state (only persisted keys)
 */
export function createGameStateSnapshot(stateValues) {
  const snapshot = {};

  for (const key of PERSISTED_STATE_KEYS) {
    if (key in stateValues) {
      snapshot[key] = stateValues[key];
    }
  }

  return snapshot;
}

/**
 * Deserialize saved game state back to individual state values.
 *
 * @param {Object} savedState - The saved game state object
 * @returns {Object} Object with state values to restore
 */
export function deserializeGameState(savedState) {
  if (!savedState) return null;

  const restored = {};

  for (const key of PERSISTED_STATE_KEYS) {
    if (key in savedState) {
      restored[key] = savedState[key];
    }
  }

  return restored;
}

/**
 * Get default values for UI-only state that gets reset when loading.
 *
 * @returns {Object} Default values for UI state
 */
export function getDefaultUIState() {
  return {
    showPeggingSummary: false,
    showCountingHistory: false,
    showBreakdown: false,
    isProcessingCount: false,
    pendingCountContinue: null,
    playerMadeCountDecision: false,
    showMugginsPreferenceDialog: false,
    pendingWrongMugginsResult: null,
    debugLog: [],
    gameLog: [],
    playerCountInput: '',
    computerClaimedScore: null,
    actualScore: null,
    counterIsComputer: null,
  };
}

/**
 * Check if the game is in a state that should be saved.
 * Don't save when in menu or game over states.
 *
 * @param {string} gameState - Current game state
 * @returns {boolean} True if game should be saved
 */
export function shouldSaveGame(gameState) {
  return gameState !== 'menu' && gameState !== 'gameOver';
}

/**
 * Check if two game states are meaningfully different (worth saving).
 * This helps avoid excessive saves for minor UI changes.
 *
 * @param {Object} prevState - Previous state snapshot
 * @param {Object} nextState - Current state snapshot
 * @returns {boolean} True if states are different enough to warrant saving
 */
export function hasSignificantChange(prevState, nextState) {
  if (!prevState || !nextState) return true;

  // Key fields that indicate meaningful game progress
  const significantKeys = [
    'gameState',
    'playerScore',
    'computerScore',
    'playerHand',
    'computerHand',
    'crib',
    'cutCard',
    'allPlayedCards',
    'handsCountedThisRound',
    'dealer',
  ];

  for (const key of significantKeys) {
    const prev = JSON.stringify(prevState[key]);
    const next = JSON.stringify(nextState[key]);
    if (prev !== next) {
      return true;
    }
  }

  return false;
}
