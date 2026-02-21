// Celebration engine — main entry point
// Detects events, selects phrases + animations, returns celebration data

import { detectHandEvents, detectPeggingEvents, detectGameEvents, detectCutEvents, EVENT_INTENSITY } from './events';
import { selectPhrase, resetPhraseHistory } from './selector';
import { selectAnimation, resetAnimationHistory } from './animations';

/**
 * @typedef {Object} CelebrationResult
 * @property {string|null} phrase - Selected phrase text
 * @property {Object|null} animation - Animation metadata object
 * @property {string[]} events - Detected event types
 * @property {string} topEvent - Highest-priority event
 * @property {string} intensity - Event intensity level
 */

/**
 * Process a hand-score event and return celebration data.
 * @param {number} score - Hand score
 * @param {string[]} breakdown - Score breakdown strings
 * @param {Object} context - { scorer, celebrationLevel, motionLevel, prevHandScore, isCrib }
 * @returns {CelebrationResult}
 */
export function celebrateHand(score, breakdown, context) {
  const {
    scorer = 'player',
    celebrationLevel = 'classic',
    motionLevel = 'standard',
    prevHandScore = null,
    isCrib = false,
  } = context || {};

  if (celebrationLevel === 'off') return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  const events = detectHandEvents(score, breakdown, prevHandScore, isCrib);
  if (events.length === 0) return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  // Pick the highest-priority event (first one is usually the best match)
  const topEvent = pickTopEvent(events);
  const intensity = EVENT_INTENSITY[topEvent] || 'medium';
  const useMaineLodge = celebrationLevel === 'fullBanter';

  const phrase = selectPhrase(topEvent, celebrationLevel, scorer, useMaineLodge);
  const animation = selectAnimation(topEvent, intensity, motionLevel);

  return { phrase, animation, events, topEvent, intensity };
}

/**
 * Process a pegging event and return celebration data.
 * @param {number} pegScore - Points scored on this play
 * @param {number} newCount - Pegging count after play
 * @param {string} reason - Score reason
 * @param {boolean} isGoPoint - Whether this is a Go/last card
 * @param {Object} context - { scorer, celebrationLevel, motionLevel }
 * @returns {CelebrationResult}
 */
export function celebratePegging(pegScore, newCount, reason, isGoPoint, context) {
  const {
    scorer = 'player',
    celebrationLevel = 'classic',
    motionLevel = 'standard',
  } = context || {};

  if (celebrationLevel === 'off') return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  const events = detectPeggingEvents(pegScore, newCount, reason, isGoPoint);
  if (events.length === 0) return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  const topEvent = pickTopEvent(events);
  const intensity = EVENT_INTENSITY[topEvent] || 'low';
  const useMaineLodge = celebrationLevel === 'fullBanter';

  const phrase = selectPhrase(topEvent, celebrationLevel, scorer, useMaineLodge);
  const animation = selectAnimation(topEvent, intensity, motionLevel);

  return { phrase, animation, events, topEvent, intensity };
}

/**
 * Process a game-over event and return celebration data.
 * @param {boolean} playerWon
 * @param {number} playerScore
 * @param {number} computerScore
 * @param {number} maxDeficit
 * @param {Object} context - { celebrationLevel, motionLevel }
 * @returns {CelebrationResult}
 */
export function celebrateGameEnd(playerWon, playerScore, computerScore, maxDeficit, context) {
  const {
    celebrationLevel = 'classic',
    motionLevel = 'standard',
  } = context || {};

  if (celebrationLevel === 'off') return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  const events = detectGameEvents(playerWon, playerScore, computerScore, maxDeficit || 0);
  if (events.length === 0) return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  const topEvent = pickTopEvent(events);
  const intensity = EVENT_INTENSITY[topEvent] || 'medium';
  const scorer = playerWon ? 'player' : 'computer';
  const useMaineLodge = celebrationLevel === 'fullBanter';

  const phrase = selectPhrase(topEvent, celebrationLevel, scorer, useMaineLodge);
  const animation = selectAnimation(topEvent, intensity, motionLevel);

  return { phrase, animation, events, topEvent, intensity };
}

/**
 * Process a cut card event and return celebration data.
 * @param {Object} cutCard - The cut card
 * @param {Object} context - { scorer (dealer), celebrationLevel, motionLevel }
 * @returns {CelebrationResult}
 */
export function celebrateCut(cutCard, context) {
  const {
    scorer = 'player',
    celebrationLevel = 'classic',
    motionLevel = 'standard',
  } = context || {};

  if (celebrationLevel === 'off') return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  const events = detectCutEvents(cutCard);
  if (events.length === 0) return { phrase: null, animation: null, events: [], topEvent: null, intensity: null };

  const topEvent = events[0];
  const intensity = EVENT_INTENSITY[topEvent] || 'low';
  const useMaineLodge = celebrationLevel === 'fullBanter';

  const phrase = selectPhrase(topEvent, celebrationLevel, scorer, useMaineLodge);
  const animation = selectAnimation(topEvent, intensity, motionLevel);

  return { phrase, animation, events, topEvent, intensity };
}

/**
 * Pick the highest-priority event from a list.
 * Priority order: legendary > epic > high > medium > low
 */
function pickTopEvent(events) {
  const priority = { legendary: 5, epic: 4, high: 3, medium: 2, low: 1 };
  let best = events[0];
  let bestPriority = priority[EVENT_INTENSITY[best]] || 0;

  for (let i = 1; i < events.length; i++) {
    const p = priority[EVENT_INTENSITY[events[i]]] || 0;
    if (p > bestPriority) {
      best = events[i];
      bestPriority = p;
    }
  }
  return best;
}

/**
 * Reset all celebration state (for testing).
 */
export function resetCelebrations() {
  resetPhraseHistory();
  resetAnimationHistory();
}
