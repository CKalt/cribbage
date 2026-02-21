// Phrase selection with anti-repetition and tone awareness
// Uses aiRandom() for deterministic seeded mode

import { aiRandom } from '../ai/rng';
import { PHRASE_LIBRARY } from './phrases';
import { MAINE_LODGE_PHRASES } from './tones/maine-lodge';

const PHRASE_HISTORY_SIZE = 10;
let recentPhrases = [];

/**
 * Select a tone variant based on celebration level and context.
 * @param {Object} toneVariants - { classic, playful, competitive, understated, easterEgg }
 * @param {string} celebrationLevel - 'off'|'minimal'|'classic'|'lively'|'fullBanter'
 * @param {string} scorer - 'player' or 'computer'
 * @returns {string} tone key
 */
function selectTone(toneVariants, celebrationLevel, scorer) {
  // Computer scoring uses competitive tone
  if (scorer === 'computer' && toneVariants.competitive) {
    return 'competitive';
  }

  const availableTones = Object.keys(toneVariants).filter(t => t !== 'easterEgg');

  switch (celebrationLevel) {
    case 'minimal':
      return 'understated';
    case 'classic':
      // Weighted toward classic + understated
      return pickWeighted(availableTones, {
        classic: 5, understated: 3, playful: 1, competitive: 1,
      });
    case 'lively':
      // All tones roughly equal
      return pickWeighted(availableTones, {
        classic: 3, playful: 3, competitive: 2, understated: 1,
      });
    case 'fullBanter':
      // Playful and classic dominate
      return pickWeighted(availableTones, {
        classic: 3, playful: 4, competitive: 2, understated: 1,
      });
    default:
      return 'classic';
  }
}

/**
 * Pick from a list with weights.
 */
function pickWeighted(items, weights) {
  const totalWeight = items.reduce((sum, item) => sum + (weights[item] || 1), 0);
  let roll = aiRandom() * totalWeight;
  for (const item of items) {
    roll -= (weights[item] || 1);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Select a phrase for an event, with anti-repetition.
 * @param {string} eventType - Event type string (e.g. 'MONSTER_HAND_24')
 * @param {string} celebrationLevel - Celebration level setting
 * @param {string} scorer - 'player' or 'computer'
 * @param {boolean} useMaineLodge - Whether to use Maine Lodge tone pack
 * @returns {string|null} Selected phrase, or null if celebrations are off
 */
export function selectPhrase(eventType, celebrationLevel, scorer, useMaineLodge = false) {
  if (celebrationLevel === 'off') return null;

  // Check event threshold for celebration level
  if (!shouldFireForLevel(eventType, celebrationLevel)) return null;

  // Try Maine Lodge pack first when in Full Banter mode
  if (useMaineLodge && celebrationLevel === 'fullBanter') {
    const mainPhrase = selectMaineLodgePhrase(eventType);
    if (mainPhrase) return mainPhrase;
  }

  const pool = PHRASE_LIBRARY[eventType];
  if (!pool) return null;

  // Easter egg check: <1% chance
  if (pool.toneVariants.easterEgg && aiRandom() < 0.008) {
    const eggs = pool.toneVariants.easterEgg;
    const key = `${eventType}:easterEgg:0`;
    if (!recentPhrases.includes(key)) {
      pushToHistory(key);
      return eggs[0];
    }
  }

  // Pick tone
  const tone = selectTone(pool.toneVariants, celebrationLevel, scorer);
  const phrases = pool.toneVariants[tone];
  if (!phrases || phrases.length === 0) return null;

  // Filter out recently used
  const available = phrases
    .map((p, i) => ({ phrase: p, key: `${eventType}:${tone}:${i}` }))
    .filter(p => !recentPhrases.includes(p.key));

  // If all filtered out, clear history for this event
  if (available.length === 0) {
    recentPhrases = recentPhrases.filter(k => !k.startsWith(eventType));
    const idx = Math.floor(aiRandom() * phrases.length);
    pushToHistory(`${eventType}:${tone}:${idx}`);
    return phrases[idx];
  }

  // Uniform random from available
  const chosen = available[Math.floor(aiRandom() * available.length)];
  pushToHistory(chosen.key);
  return chosen.phrase;
}

/**
 * Select a phrase from the Maine Lodge tone pack.
 */
function selectMaineLodgePhrase(eventType) {
  const category = mapEventToMaineCategory(eventType);
  if (!category) return null;

  const phrases = MAINE_LODGE_PHRASES[category];
  if (!phrases || phrases.length === 0) return null;

  // 60% chance to use Maine Lodge when eligible
  if (aiRandom() > 0.6) return null;

  const available = phrases
    .map((p, i) => ({ phrase: p, key: `maine:${category}:${i}` }))
    .filter(p => !recentPhrases.includes(p.key));

  if (available.length === 0) return null;

  const chosen = available[Math.floor(aiRandom() * available.length)];
  pushToHistory(chosen.key);
  return chosen.phrase;
}

/**
 * Map event types to Maine Lodge categories.
 */
function mapEventToMaineCategory(eventType) {
  switch (eventType) {
    case 'PERFECT_29':
    case 'NEAR_PERFECT_28':
    case 'MONSTER_HAND_24':
    case 'BIG_HAND_20_PLUS':
    case 'BACK_TO_BACK_BIG_HANDS':
    case 'DOUBLE_RUN':
    case 'TRIPLE_RUN':
    case 'FOUR_OF_A_KIND':
      return 'bigHands';
    case 'PEG_31':
    case 'PEG_GO_STEAL':
    case 'PEG_TRAP':
      return 'pegging';
    case 'ZERO_HAND':
      return 'zeroHands';
    case 'SKUNK':
    case 'DOUBLE_SKUNK':
    case 'COMEBACK_WIN':
    case 'CLOSE_GAME_WIN':
      return 'gameEvents';
    case 'HUGE_CRIB':
      return 'crib';
    case 'CUT_JACK':
      return 'cutCard';
    default:
      return null;
  }
}

/**
 * Whether an event type should fire at a given celebration level.
 */
function shouldFireForLevel(eventType, level) {
  const alwaysFire = ['PERFECT_29', 'NEAR_PERFECT_28', 'SKUNK', 'DOUBLE_SKUNK'];
  if (alwaysFire.includes(eventType)) return true;

  switch (level) {
    case 'minimal':
      return ['MONSTER_HAND_24', 'COMEBACK_WIN'].includes(eventType);
    case 'classic':
      return ['MONSTER_HAND_24', 'BIG_HAND_20_PLUS', 'PEG_31', 'CUT_JACK',
              'CLOSE_GAME_WIN', 'COMEBACK_WIN', 'HUGE_CRIB', 'ZERO_HAND',
              'FOUR_OF_A_KIND', 'TRIPLE_RUN', 'DOUBLE_RUN',
              'BACK_TO_BACK_BIG_HANDS'].includes(eventType);
    case 'lively':
    case 'fullBanter':
      return true; // all events fire
    default:
      return false;
  }
}

function pushToHistory(key) {
  recentPhrases.push(key);
  if (recentPhrases.length > PHRASE_HISTORY_SIZE) recentPhrases.shift();
}

/**
 * Reset phrase history (for testing).
 */
export function resetPhraseHistory() {
  recentPhrases = [];
}
