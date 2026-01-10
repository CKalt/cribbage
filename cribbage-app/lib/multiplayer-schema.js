/**
 * Multiplayer Game Schema
 * Defines data structures for user vs user games
 */

// Game statuses
export const GAME_STATUS = {
  WAITING: 'waiting',      // Waiting for opponent to join
  ACTIVE: 'active',        // Game in progress
  COMPLETED: 'completed',  // Game finished
  ABANDONED: 'abandoned'   // Player left/timed out
};

// Invitation statuses
export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired'
};

/**
 * Generate a unique game ID
 */
export const generateGameId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `game-${timestamp}-${random}`;
};

/**
 * Generate a unique invitation ID
 */
export const generateInviteId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `inv-${timestamp}-${random}`;
};

/**
 * Create a new multiplayer game
 * @param {string} gameId - Unique game ID
 * @param {string} player1Id - Creator's user ID
 * @param {string} player1Email - Creator's email
 * @returns {Object} New game object
 */
export const createMultiplayerGame = (gameId, player1Id, player1Email) => ({
  id: gameId,
  status: GAME_STATUS.WAITING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // Players
  player1: {
    id: player1Id,
    email: player1Email,
    connected: true,
    lastSeen: new Date().toISOString()
  },
  player2: null,

  // Game state (same structure as single-player, set when game starts)
  gameState: null,

  // Turn management
  currentTurn: null,  // 'player1' or 'player2'
  turnStartedAt: null,

  // Last move info - shown to returning player who was offline
  lastMove: {
    by: null,           // 'player1' or 'player2'
    type: null,         // 'discard', 'play', 'go', 'count', etc.
    description: null,  // Human-readable: "Played 5♠ (count: 15 for 2)"
    timestamp: null
  },

  // Scores (duplicated for quick access without parsing gameState)
  scores: {
    player1: 0,
    player2: 0
  },

  // Winner (set when game completes)
  winner: null,  // 'player1', 'player2', or null

  // History for replay/debugging
  moveHistory: []
});

/**
 * Create a game invitation
 * @param {string} inviteId - Unique invitation ID
 * @param {Object} fromUser - Sender {id, email}
 * @param {string} toEmail - Recipient email
 * @returns {Object} New invitation object
 */
export const createInvitation = (inviteId, fromUser, toEmail) => ({
  id: inviteId,
  status: INVITE_STATUS.PENDING,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours

  from: {
    id: fromUser.id,
    email: fromUser.email
  },
  toEmail: toEmail.toLowerCase(),

  // Set when accepted
  gameId: null,
  acceptedAt: null,

  // Set if declined
  declinedAt: null
});

/**
 * Check if an invitation has expired
 * @param {Object} invitation - Invitation object
 * @returns {boolean}
 */
export const isInvitationExpired = (invitation) => {
  return new Date(invitation.expiresAt) < new Date();
};

/**
 * Check if a game is active (not completed or abandoned)
 * @param {Object} game - Game object
 * @returns {boolean}
 */
export const isGameActive = (game) => {
  return game.status === GAME_STATUS.WAITING || game.status === GAME_STATUS.ACTIVE;
};

/**
 * Get the opponent's player key
 * @param {string} myPlayerKey - 'player1' or 'player2'
 * @returns {string} 'player2' or 'player1'
 */
export const getOpponentKey = (myPlayerKey) => {
  return myPlayerKey === 'player1' ? 'player2' : 'player1';
};

/**
 * Determine which player key a user is in a game
 * @param {Object} game - Game object
 * @param {string} odersId - User ID to find
 * @returns {string|null} 'player1', 'player2', or null if not in game
 */
export const getPlayerKey = (game, userId) => {
  if (game.player1?.id === userId) return 'player1';
  if (game.player2?.id === userId) return 'player2';
  return null;
};
