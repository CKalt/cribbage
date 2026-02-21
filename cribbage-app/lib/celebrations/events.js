// Event detection for the celebration system
// Detects notable cribbage moments from scoring data

/**
 * Detect hand-score events from a counted hand.
 * @param {number} score - The hand score
 * @param {string[]} breakdown - Score breakdown strings from calculateHandScore
 * @param {number|null} prevHandScore - Previous hand score (for streak detection)
 * @param {boolean} isCrib - Whether this is a crib count
 * @returns {string[]} Array of event type strings
 */
export function detectHandEvents(score, breakdown, prevHandScore, isCrib = false) {
  const events = [];

  // Score magnitude events (mutually exclusive tiers)
  if (score === 29) events.push('PERFECT_29');
  else if (score === 28) events.push('NEAR_PERFECT_28');
  else if (score >= 24) events.push('MONSTER_HAND_24');
  else if (score >= 20) events.push('BIG_HAND_20_PLUS');

  if (score === 0) events.push('ZERO_HAND');

  // Crib-specific
  if (isCrib && score >= 16) events.push('HUGE_CRIB');

  // Pattern detection from breakdown strings
  if (breakdown && breakdown.length > 0) {
    const pairCount = breakdown.filter(b => b.startsWith('Pair')).length;
    const runEntries = breakdown.filter(b => b.startsWith('Run'));

    if (pairCount >= 6) events.push('FOUR_OF_A_KIND');
    if (runEntries.length >= 3) events.push('TRIPLE_RUN');
    else if (runEntries.length === 2) events.push('DOUBLE_RUN');
  }

  // Streak detection
  if (score >= 16 && prevHandScore != null && prevHandScore >= 16) {
    events.push('BACK_TO_BACK_BIG_HANDS');
  }

  return events;
}

/**
 * Detect pegging events from a play.
 * @param {number} pegScore - Points scored on this play
 * @param {number} newCount - The pegging count after this play
 * @param {string} reason - Reason string from calculatePeggingScore
 * @param {boolean} isGoPoint - Whether this is a Go/last-card point
 * @returns {string[]} Array of event type strings
 */
export function detectPeggingEvents(pegScore, newCount, reason, isGoPoint) {
  const events = [];

  if (newCount === 31) events.push('PEG_31');
  if (isGoPoint) events.push('PEG_GO_STEAL');
  if (pegScore >= 4 && !isGoPoint) events.push('PEG_TRAP');

  return events;
}

/**
 * Detect game-over events.
 * @param {boolean} playerWon - Whether the player won
 * @param {number} playerScore - Final player score
 * @param {number} computerScore - Final computer score
 * @param {number} maxDeficit - Largest deficit the winner overcame
 * @returns {string[]} Array of event type strings
 */
export function detectGameEvents(playerWon, playerScore, computerScore, maxDeficit) {
  const events = [];
  const winnerScore = playerWon ? playerScore : computerScore;
  const loserScore = playerWon ? computerScore : playerScore;
  const margin = winnerScore - loserScore;

  if (loserScore < 61) events.push('DOUBLE_SKUNK');
  else if (loserScore < 91) events.push('SKUNK');

  if (margin <= 5) events.push('CLOSE_GAME_WIN');
  if (maxDeficit >= 30) events.push('COMEBACK_WIN');

  return events;
}

/**
 * Detect cut card events.
 * @param {Object} cutCard - The cut card object
 * @returns {string[]} Array of event type strings
 */
export function detectCutEvents(cutCard) {
  if (cutCard && cutCard.rank === 'J') return ['CUT_JACK'];
  return [];
}

/**
 * Map event type to base intensity level.
 */
export const EVENT_INTENSITY = {
  PERFECT_29: 'legendary',
  NEAR_PERFECT_28: 'epic',
  MONSTER_HAND_24: 'high',
  BIG_HAND_20_PLUS: 'medium',
  DOUBLE_RUN: 'medium',
  TRIPLE_RUN: 'high',
  FOUR_OF_A_KIND: 'high',
  HUGE_CRIB: 'medium',
  PEG_31: 'medium',
  PEG_GO_STEAL: 'low',
  PEG_TRAP: 'medium',
  SKUNK: 'high',
  DOUBLE_SKUNK: 'epic',
  COMEBACK_WIN: 'high',
  CLOSE_GAME_WIN: 'medium',
  CUT_JACK: 'low',
  ZERO_HAND: 'low',
  BACK_TO_BACK_BIG_HANDS: 'high',
};
