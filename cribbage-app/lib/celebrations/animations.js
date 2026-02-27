// Micro-animation pool — 30 animations across 4 intensity levels
// Each animation is a CSS class applied to an anchor element

import { aiRandom } from '../ai/rng';

export const ANIMATION_POOL = [
  // Low Intensity (8)
  { id: 'score_glow', name: 'Score Glow', intensity: 'low', compatibleEvents: ['BIG_HAND_20_PLUS', 'DOUBLE_RUN', 'CUT_JACK', 'PEG_GO_STEAL'], durationMs: 800, cooldownMs: 4000, anchor: 'scorePanel', cssClass: 'anim-score-glow', reducedMotionFallback: 'none' },
  { id: 'peg_nudge', name: 'Peg Nudge', intensity: 'low', compatibleEvents: ['PEG_31', 'PEG_GO_STEAL', 'PEG_TRAP', 'CUT_JACK'], durationMs: 400, cooldownMs: 3000, anchor: 'scorePanel', cssClass: 'anim-peg-nudge', reducedMotionFallback: 'none' },
  { id: 'card_wink', name: 'Card Wink', intensity: 'low', compatibleEvents: ['PEG_31', 'BIG_HAND_20_PLUS', 'DOUBLE_RUN'], durationMs: 500, cooldownMs: 3000, anchor: 'handCards', cssClass: 'anim-card-wink', reducedMotionFallback: 'none' },
  { id: 'text_fade_up', name: 'Text Float', intensity: 'low', compatibleEvents: ['ZERO_HAND', 'PEG_GO_STEAL', 'CUT_JACK'], durationMs: 600, cooldownMs: 2000, anchor: 'toast', cssClass: 'anim-text-fade-up', reducedMotionFallback: 'simpleFade' },
  { id: 'subtle_flash', name: 'Subtle Flash', intensity: 'low', compatibleEvents: ['BIG_HAND_20_PLUS', 'PEG_31', 'DOUBLE_RUN'], durationMs: 300, cooldownMs: 3000, anchor: 'scorePanel', cssClass: 'anim-subtle-flash', reducedMotionFallback: 'none' },
  { id: 'dot_pulse', name: 'Dot Pulse', intensity: 'low', compatibleEvents: ['PEG_GO_STEAL', 'PEG_31', 'CUT_JACK'], durationMs: 700, cooldownMs: 4000, anchor: 'scorePanel', cssClass: 'anim-dot-pulse', reducedMotionFallback: 'none' },
  { id: 'underline_draw', name: 'Underline Draw', intensity: 'low', compatibleEvents: ['BIG_HAND_20_PLUS', 'DOUBLE_RUN', 'HUGE_CRIB'], durationMs: 500, cooldownMs: 3000, anchor: 'toast', cssClass: 'anim-underline-draw', reducedMotionFallback: 'none' },
  { id: 'checkmark_pop', name: 'Checkmark Pop', intensity: 'low', compatibleEvents: ['BIG_HAND_20_PLUS', 'PEG_31', 'DOUBLE_RUN', 'HUGE_CRIB'], durationMs: 400, cooldownMs: 3000, anchor: 'toast', cssClass: 'anim-checkmark-pop', reducedMotionFallback: 'staticIcon' },

  // Medium Intensity (12)
  { id: 'score_sparkle', name: 'Score Sparkle', intensity: 'medium', compatibleEvents: ['BIG_HAND_20_PLUS', 'MONSTER_HAND_24', 'PEG_31', 'TRIPLE_RUN', 'FOUR_OF_A_KIND'], durationMs: 700, cooldownMs: 5000, anchor: 'scorePanel', cssClass: 'anim-score-sparkle', reducedMotionFallback: 'staticIcon' },
  { id: 'stamp_effect', name: 'Ink Stamp', intensity: 'medium', compatibleEvents: ['BIG_HAND_20_PLUS', 'MONSTER_HAND_24', 'PEG_31'], durationMs: 600, cooldownMs: 5000, anchor: 'toast', cssClass: 'anim-stamp-effect', reducedMotionFallback: 'simpleFade' },
  { id: 'ribbon_unfurl', name: 'Ribbon Unfurl', intensity: 'medium', compatibleEvents: ['MONSTER_HAND_24', 'CLOSE_GAME_WIN', 'COMEBACK_WIN', 'HUGE_CRIB'], durationMs: 800, cooldownMs: 6000, anchor: 'toast', cssClass: 'anim-ribbon-unfurl', reducedMotionFallback: 'simpleFade' },
  { id: 'card_fan_glow', name: 'Card Fan Glow', intensity: 'medium', compatibleEvents: ['MONSTER_HAND_24', 'NEAR_PERFECT_28', 'FOUR_OF_A_KIND', 'TRIPLE_RUN'], durationMs: 900, cooldownMs: 6000, anchor: 'handCards', cssClass: 'anim-card-fan-glow', reducedMotionFallback: 'none' },
  { id: 'peg_trail', name: 'Peg Trail', intensity: 'medium', compatibleEvents: ['PEG_31', 'PEG_TRAP', 'BIG_HAND_20_PLUS'], durationMs: 800, cooldownMs: 5000, anchor: 'scorePanel', cssClass: 'anim-peg-trail', reducedMotionFallback: 'none' },
  { id: 'bounce_number', name: 'Bounce Number', intensity: 'medium', compatibleEvents: ['BIG_HAND_20_PLUS', 'MONSTER_HAND_24', 'HUGE_CRIB', 'PEG_TRAP'], durationMs: 500, cooldownMs: 4000, anchor: 'scorePanel', cssClass: 'anim-bounce-number', reducedMotionFallback: 'none' },
  { id: 'speech_bubble', name: 'Speech Bubble', intensity: 'medium', compatibleEvents: ['MONSTER_HAND_24', 'SKUNK', 'COMEBACK_WIN', 'CLOSE_GAME_WIN', 'BACK_TO_BACK_BIG_HANDS'], durationMs: 1000, cooldownMs: 6000, anchor: 'toast', cssClass: 'anim-speech-bubble', reducedMotionFallback: 'simpleFade' },
  { id: 'star_burst', name: 'Star Burst', intensity: 'medium', compatibleEvents: ['MONSTER_HAND_24', 'TRIPLE_RUN', 'FOUR_OF_A_KIND', 'PEG_TRAP'], durationMs: 600, cooldownMs: 5000, anchor: 'scorePanel', cssClass: 'anim-star-burst', reducedMotionFallback: 'staticIcon' },
  { id: 'wave_underline', name: 'Wave Line', intensity: 'medium', compatibleEvents: ['BIG_HAND_20_PLUS', 'DOUBLE_RUN', 'HUGE_CRIB', 'COMEBACK_WIN'], durationMs: 700, cooldownMs: 4000, anchor: 'toast', cssClass: 'anim-wave-underline', reducedMotionFallback: 'none' },
  { id: 'score_ring', name: 'Score Ring', intensity: 'medium', compatibleEvents: ['MONSTER_HAND_24', 'BIG_HAND_20_PLUS', 'FOUR_OF_A_KIND'], durationMs: 800, cooldownMs: 5000, anchor: 'scorePanel', cssClass: 'anim-score-ring', reducedMotionFallback: 'none' },
  { id: 'card_shine', name: 'Card Shine', intensity: 'medium', compatibleEvents: ['MONSTER_HAND_24', 'NEAR_PERFECT_28', 'TRIPLE_RUN', 'BACK_TO_BACK_BIG_HANDS'], durationMs: 600, cooldownMs: 5000, anchor: 'handCards', cssClass: 'anim-card-shine', reducedMotionFallback: 'none' },
  { id: 'wobble_text', name: 'Wobble Text', intensity: 'medium', compatibleEvents: ['SKUNK', 'ZERO_HAND', 'PEG_TRAP', 'BACK_TO_BACK_BIG_HANDS'], durationMs: 500, cooldownMs: 4000, anchor: 'toast', cssClass: 'anim-wobble-text', reducedMotionFallback: 'none' },

  // High Intensity (7)
  { id: 'mini_confetti', name: 'Mini Confetti', intensity: 'high', compatibleEvents: ['MONSTER_HAND_24', 'NEAR_PERFECT_28', 'PERFECT_29', 'COMEBACK_WIN', 'CLOSE_GAME_WIN'], durationMs: 1200, cooldownMs: 8000, anchor: 'scorePanel', cssClass: 'anim-mini-confetti', reducedMotionFallback: 'staticIcon' },
  { id: 'gold_rain', name: 'Gold Rain', intensity: 'high', compatibleEvents: ['MONSTER_HAND_24', 'NEAR_PERFECT_28', 'PERFECT_29', 'FOUR_OF_A_KIND'], durationMs: 1000, cooldownMs: 8000, anchor: 'handCards', cssClass: 'anim-gold-rain', reducedMotionFallback: 'simpleFade' },
  { id: 'firework_pop', name: 'Firework Pop', intensity: 'high', compatibleEvents: ['NEAR_PERFECT_28', 'PERFECT_29', 'SKUNK', 'DOUBLE_SKUNK'], durationMs: 800, cooldownMs: 8000, anchor: 'scorePanel', cssClass: 'anim-firework-pop', reducedMotionFallback: 'staticIcon' },
  { id: 'trophy_bounce', name: 'Trophy Bounce', intensity: 'high', compatibleEvents: ['COMEBACK_WIN', 'CLOSE_GAME_WIN', 'SKUNK'], durationMs: 900, cooldownMs: 8000, anchor: 'toast', cssClass: 'anim-trophy-bounce', reducedMotionFallback: 'staticIcon' },
  { id: 'double_sparkle', name: 'Double Sparkle', intensity: 'high', compatibleEvents: ['NEAR_PERFECT_28', 'PERFECT_29', 'BACK_TO_BACK_BIG_HANDS', 'TRIPLE_RUN'], durationMs: 1000, cooldownMs: 8000, anchor: 'scorePanel', cssClass: 'anim-double-sparkle', reducedMotionFallback: 'staticIcon' },
  { id: 'score_zoom', name: 'Score Zoom', intensity: 'high', compatibleEvents: ['MONSTER_HAND_24', 'NEAR_PERFECT_28', 'PERFECT_29', 'FOUR_OF_A_KIND'], durationMs: 700, cooldownMs: 6000, anchor: 'scorePanel', cssClass: 'anim-score-zoom', reducedMotionFallback: 'none' },
  { id: 'glow_cascade', name: 'Glow Cascade', intensity: 'high', compatibleEvents: ['NEAR_PERFECT_28', 'PERFECT_29', 'TRIPLE_RUN', 'FOUR_OF_A_KIND'], durationMs: 1100, cooldownMs: 8000, anchor: 'handCards', cssClass: 'anim-glow-cascade', reducedMotionFallback: 'simpleFade' },

  // Legendary Intensity (3)
  { id: 'full_confetti', name: 'Full Confetti', intensity: 'legendary', compatibleEvents: ['PERFECT_29', 'NEAR_PERFECT_28'], durationMs: 2000, cooldownMs: 15000, anchor: 'fullscreen', cssClass: 'anim-full-confetti', reducedMotionFallback: 'staticIcon' },
  { id: 'golden_frame', name: 'Golden Frame', intensity: 'legendary', compatibleEvents: ['PERFECT_29', 'NEAR_PERFECT_28'], durationMs: 1500, cooldownMs: 15000, anchor: 'handCards', cssClass: 'anim-golden-frame', reducedMotionFallback: 'simpleFade' },
  { id: 'crown_drop', name: 'Crown Drop', intensity: 'legendary', compatibleEvents: ['PERFECT_29'], durationMs: 1200, cooldownMs: 15000, anchor: 'toast', cssClass: 'anim-crown-drop', reducedMotionFallback: 'staticIcon' },
];

// Intensity hierarchy for matching
const INTENSITY_LEVELS = { low: 1, medium: 2, high: 3, legendary: 4 };
const MOTION_MAX_INTENSITY = {
  off: 0,
  subtle: 2,    // low + medium
  standard: 3,  // up to high
  extra: 4,     // everything
};

const ANIMATION_HISTORY_SIZE = 8;
let recentAnimations = [];
let cooldowns = {};

/**
 * Select an animation for an event.
 * @param {string} eventType - Event type string
 * @param {string} eventIntensity - Event's base intensity
 * @param {string} motionLevel - User's motion level setting
 * @returns {Object|null} Animation metadata object, or null
 */
export function selectAnimation(eventType, eventIntensity, motionLevel) {
  if (motionLevel === 'off') return null;

  const maxIntensity = MOTION_MAX_INTENSITY[motionLevel] || 3;
  const now = Date.now();

  const compatible = ANIMATION_POOL
    .filter(a => a.compatibleEvents.includes(eventType))
    .filter(a => INTENSITY_LEVELS[a.intensity] <= maxIntensity)
    .filter(a => !recentAnimations.includes(a.id))
    .filter(a => !cooldowns[a.id] || (now - cooldowns[a.id]) >= a.cooldownMs);

  if (compatible.length === 0) return null;

  // Weighted: prefer higher-intensity animations for higher-intensity events
  const eventLevel = INTENSITY_LEVELS[eventIntensity] || 2;
  const weights = compatible.map(a => {
    const animLevel = INTENSITY_LEVELS[a.intensity] || 2;
    // Closer intensity match gets higher weight
    const diff = Math.abs(animLevel - eventLevel);
    return Math.max(1, 4 - diff);
  });

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  let roll = aiRandom() * totalWeight;
  let chosen = compatible[compatible.length - 1];
  for (let i = 0; i < compatible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      chosen = compatible[i];
      break;
    }
  }

  // Record in history
  recentAnimations.push(chosen.id);
  if (recentAnimations.length > ANIMATION_HISTORY_SIZE) recentAnimations.shift();
  cooldowns[chosen.id] = now;

  return chosen;
}

/**
 * Reset animation history (for testing).
 */
export function resetAnimationHistory() {
  recentAnimations = [];
  cooldowns = {};
}
