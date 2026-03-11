// Card Back Designs — randomly selected per game
// Each design defines Tailwind classes and an optional SVG pattern overlay

const CARD_BACKS = [
  // ── Animals ──
  {
    id: 'leopard',
    name: 'Leopard',
    bg: 'bg-amber-900',
    border: 'border-amber-500',
    bgHex: '#78350f', borderHex: '#f59e0b',
    pattern: 'radial-gradient(ellipse 4px 5px, rgba(0,0,0,0.35) 50%, transparent 50%) 0 0 / 10px 10px, radial-gradient(ellipse 4px 5px, rgba(0,0,0,0.35) 50%, transparent 50%) 5px 5px / 10px 10px',
    centerIcon: '\uD83D\uDC06',
    iconColor: 'text-amber-200',
    accentColor: 'rgba(217,119,6,0.3)',
  },
  {
    id: 'tiger',
    name: 'Tiger',
    bg: 'bg-orange-800',
    border: 'border-orange-400',
    bgHex: '#9a3412', borderHex: '#fb923c',
    pattern: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 5px, transparent 5px, transparent 8px)',
    centerIcon: '\uD83D\uDC2F',
    iconColor: 'text-orange-200',
    accentColor: 'rgba(0,0,0,0.15)',
  },
  {
    id: 'peacock',
    name: 'Peacock',
    bg: 'bg-teal-900',
    border: 'border-teal-300',
    bgHex: '#134e4a', borderHex: '#5eead4',
    pattern: 'radial-gradient(circle 4px, rgba(94,234,212,0.15) 50%, transparent 50%) 0 0 / 9px 9px, radial-gradient(circle 2px, rgba(45,212,191,0.2) 50%, transparent 50%) 4.5px 4.5px / 9px 9px',
    centerIcon: '\uD83E\uDDA2',
    iconColor: 'text-teal-200',
    accentColor: 'rgba(94,234,212,0.25)',
  },
  {
    id: 'wolf',
    name: 'Wolf',
    bg: 'bg-slate-800',
    border: 'border-slate-400',
    bgHex: '#1e293b', borderHex: '#94a3b8',
    pattern: 'linear-gradient(160deg, rgba(148,163,184,0.15) 25%, transparent 25%, transparent 50%, rgba(148,163,184,0.15) 50%, rgba(148,163,184,0.15) 75%, transparent 75%) 0 0 / 10px 10px',
    centerIcon: '\uD83D\uDC3A',
    iconColor: 'text-slate-300',
    accentColor: 'rgba(148,163,184,0.2)',
  },
  {
    id: 'shark',
    name: 'Shark',
    bg: 'bg-slate-900',
    border: 'border-cyan-500',
    bgHex: '#0f172a', borderHex: '#06b6d4',
    pattern: 'linear-gradient(180deg, rgba(6,182,212,0.15) 0%, transparent 40%, rgba(6,182,212,0.08) 100%), repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(6,182,212,0.06) 4px, rgba(6,182,212,0.06) 5px)',
    centerIcon: '\uD83E\uDD88',
    iconColor: 'text-cyan-300',
    accentColor: 'rgba(6,182,212,0.3)',
  },
  {
    id: 'whale',
    name: 'Whale',
    bg: 'bg-blue-950',
    border: 'border-blue-400',
    bgHex: '#172554', borderHex: '#60a5fa',
    pattern: 'radial-gradient(ellipse 12px 4px, rgba(96,165,250,0.1) 50%, transparent 50%) 0 0 / 14px 8px, radial-gradient(ellipse 12px 4px, rgba(96,165,250,0.1) 50%, transparent 50%) 7px 4px / 14px 8px',
    centerIcon: '\uD83D\uDC33',
    iconColor: 'text-blue-300',
    accentColor: 'rgba(96,165,250,0.25)',
  },

  // ── Tropical & Nature ──
  {
    id: 'palm-trees',
    name: 'Palm Trees',
    bg: 'bg-emerald-900',
    border: 'border-lime-400',
    bgHex: '#064e3b', borderHex: '#a3e635',
    pattern: 'linear-gradient(180deg, rgba(163,230,53,0.12) 0%, rgba(34,197,94,0.15) 50%, rgba(6,78,59,0.3) 100%), repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(163,230,53,0.06) 6px, rgba(163,230,53,0.06) 7px)',
    centerIcon: '\uD83C\uDF34',
    iconColor: 'text-lime-300',
    accentColor: 'rgba(163,230,53,0.25)',
  },
  {
    id: 'mountains',
    name: 'Mountains',
    bg: 'bg-stone-800',
    border: 'border-sky-400',
    bgHex: '#292524', borderHex: '#38bdf8',
    pattern: 'linear-gradient(135deg, rgba(56,189,248,0.08) 25%, transparent 25%), linear-gradient(225deg, rgba(56,189,248,0.08) 25%, transparent 25%), linear-gradient(315deg, rgba(120,113,108,0.15) 25%, transparent 25%), linear-gradient(45deg, rgba(120,113,108,0.15) 25%, transparent 25%)',
    centerIcon: '\uD83C\uDFD4\uFE0F',
    iconColor: 'text-sky-300',
    accentColor: 'rgba(56,189,248,0.2)',
  },

  // ── Space ──
  {
    id: 'spaceship',
    name: 'Spaceship',
    bg: 'bg-gray-950',
    border: 'border-violet-400',
    bgHex: '#030712', borderHex: '#a78bfa',
    pattern: 'radial-gradient(circle, rgba(167,139,250,0.25) 0.5px, transparent 0.5px) 0 0 / 8px 8px, radial-gradient(circle, rgba(167,139,250,0.12) 0.5px, transparent 0.5px) 4px 4px / 8px 8px, linear-gradient(180deg, rgba(167,139,250,0.05) 0%, transparent 100%)',
    centerIcon: '\uD83D\uDE80',
    iconColor: 'text-violet-300',
    accentColor: 'rgba(167,139,250,0.3)',
  },
  {
    id: 'alien',
    name: 'Alien',
    bg: 'bg-green-950',
    border: 'border-green-400',
    bgHex: '#052e16', borderHex: '#4ade80',
    pattern: 'radial-gradient(circle 2px, rgba(74,222,128,0.2) 50%, transparent 50%) 0 0 / 7px 7px, radial-gradient(circle 1px, rgba(74,222,128,0.15) 50%, transparent 50%) 3.5px 3.5px / 7px 7px, linear-gradient(180deg, rgba(74,222,128,0.08) 0%, transparent 60%)',
    centerIcon: '\uD83D\uDC7D',
    iconColor: 'text-green-300',
    accentColor: 'rgba(74,222,128,0.3)',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    bg: 'bg-amber-950',
    border: 'border-amber-400',
    bgHex: '#451a03', borderHex: '#fbbf24',
    pattern: 'radial-gradient(ellipse 20px 3px, rgba(251,191,36,0.15) 50%, transparent 50%) center center / 24px 6px no-repeat, radial-gradient(circle, rgba(251,191,36,0.2) 0.5px, transparent 0.5px) 0 0 / 9px 9px',
    centerIcon: '\uD83E\uDE90',
    iconColor: 'text-amber-300',
    accentColor: 'rgba(251,191,36,0.25)',
  },

  // ── Vehicles ──
  {
    id: 'fancy-car',
    name: 'Fancy Car',
    bg: 'bg-red-950',
    border: 'border-red-400',
    bgHex: '#450a0a', borderHex: '#f87171',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(248,113,113,0.08) 5px, rgba(248,113,113,0.08) 6px), linear-gradient(135deg, rgba(248,113,113,0.1) 0%, transparent 50%, rgba(248,113,113,0.05) 100%)',
    centerIcon: '\uD83C\uDFCE\uFE0F',
    iconColor: 'text-red-300',
    accentColor: 'rgba(248,113,113,0.25)',
  },
  {
    id: 'train',
    name: 'Train',
    bg: 'bg-zinc-900',
    border: 'border-orange-400',
    bgHex: '#18181b', borderHex: '#fb923c',
    pattern: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(251,146,60,0.08) 8px, rgba(251,146,60,0.08) 9px), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(251,146,60,0.05) 3px, rgba(251,146,60,0.05) 4px)',
    centerIcon: '\uD83D\uDE82',
    iconColor: 'text-orange-300',
    accentColor: 'rgba(251,146,60,0.25)',
  },

  // ── Sports ──
  {
    id: 'football',
    name: 'Football',
    bg: 'bg-green-900',
    border: 'border-green-400',
    bgHex: '#14532d', borderHex: '#4ade80',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(74,222,128,0.1) 7px, rgba(74,222,128,0.1) 8px), repeating-linear-gradient(90deg, transparent, transparent 14px, rgba(255,255,255,0.04) 14px, rgba(255,255,255,0.04) 15px)',
    centerIcon: '\uD83C\uDFC8',
    iconColor: 'text-green-300',
    accentColor: 'rgba(74,222,128,0.2)',
  },
  {
    id: 'soccer',
    name: 'Soccer',
    bg: 'bg-emerald-950',
    border: 'border-emerald-400',
    bgHex: '#022c22', borderHex: '#34d399',
    pattern: 'linear-gradient(60deg, rgba(52,211,153,0.08) 25%, transparent 25%, transparent 75%, rgba(52,211,153,0.08) 75%) 0 0 / 12px 12px, linear-gradient(120deg, rgba(52,211,153,0.08) 25%, transparent 25%, transparent 75%, rgba(52,211,153,0.08) 75%) 0 0 / 12px 12px',
    centerIcon: '\u26BD',
    iconColor: 'text-emerald-300',
    accentColor: 'rgba(52,211,153,0.25)',
  },
  {
    id: 'hockey',
    name: 'Hockey',
    bg: 'bg-sky-950',
    border: 'border-sky-400',
    bgHex: '#082f49', borderHex: '#38bdf8',
    pattern: 'repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(56,189,248,0.06) 5px, rgba(56,189,248,0.06) 6px), linear-gradient(0deg, rgba(186,230,253,0.08) 0%, transparent 30%, transparent 70%, rgba(186,230,253,0.08) 100%)',
    centerIcon: '\uD83C\uDFD2',
    iconColor: 'text-sky-300',
    accentColor: 'rgba(56,189,248,0.25)',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    bg: 'bg-orange-950',
    border: 'border-orange-500',
    bgHex: '#431407', borderHex: '#f97316',
    pattern: 'radial-gradient(circle 20px, rgba(249,115,22,0.1) 50%, transparent 50%) center / 24px 24px no-repeat, repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(249,115,22,0.06) 10px, rgba(249,115,22,0.06) 11px)',
    centerIcon: '\uD83C\uDFC0',
    iconColor: 'text-orange-300',
    accentColor: 'rgba(249,115,22,0.25)',
  },

  // ── More Animals ──
  {
    id: 'octopus',
    name: 'Octopus',
    bg: 'bg-purple-950',
    border: 'border-purple-400',
    bgHex: '#3b0764', borderHex: '#c084fc',
    pattern: 'radial-gradient(circle 3px, rgba(192,132,252,0.15) 50%, transparent 50%) 0 0 / 8px 8px, radial-gradient(circle 2px, rgba(192,132,252,0.1) 50%, transparent 50%) 4px 4px / 8px 8px, linear-gradient(180deg, rgba(192,132,252,0.08) 0%, transparent 100%)',
    centerIcon: '\uD83D\uDC19',
    iconColor: 'text-purple-300',
    accentColor: 'rgba(192,132,252,0.3)',
  },

  // ── More Vehicles ──
  {
    id: 'tug-boat',
    name: 'Tug Boat',
    bg: 'bg-blue-900',
    border: 'border-blue-400',
    bgHex: '#1e3a5f', borderHex: '#60a5fa',
    pattern: 'linear-gradient(180deg, transparent 60%, rgba(96,165,250,0.12) 100%), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(96,165,250,0.05) 3px, rgba(96,165,250,0.05) 4px)',
    centerIcon: '\u26F4\uFE0F',
    iconColor: 'text-blue-300',
    accentColor: 'rgba(96,165,250,0.25)',
  },

  // ── Landmarks & Scenes ──
  {
    id: 'desert',
    type: 'fullcard',
    name: 'Desert',
    bg: 'bg-yellow-900',
    border: 'border-yellow-500',
    bgHex: '#713f12', borderHex: '#eab308',
    pattern: 'linear-gradient(180deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 40%, rgba(161,98,7,0.15) 100%), radial-gradient(circle, rgba(234,179,8,0.12) 0.5px, transparent 0.5px) 0 0 / 6px 6px',
    centerIcon: '\uD83C\uDFDC\uFE0F',
    iconColor: 'text-yellow-300',
    accentColor: 'rgba(234,179,8,0.3)',
  },
  {
    id: 'skyscraper',
    type: 'fullcard',
    name: 'Skyscraper',
    bg: 'bg-gray-900',
    border: 'border-sky-400',
    bgHex: '#111827', borderHex: '#38bdf8',
    pattern: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(56,189,248,0.06) 4px, rgba(56,189,248,0.06) 5px), repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(56,189,248,0.04) 6px, rgba(56,189,248,0.04) 7px)',
    centerIcon: '\uD83C\uDFD9\uFE0F',
    iconColor: 'text-sky-300',
    accentColor: 'rgba(56,189,248,0.2)',
  },
  {
    id: 'statue-of-liberty',
    name: 'Lady Liberty',
    bg: 'bg-cyan-950',
    border: 'border-emerald-400',
    bgHex: '#083344', borderHex: '#34d399',
    pattern: 'linear-gradient(180deg, rgba(52,211,153,0.1) 0%, transparent 50%, rgba(52,211,153,0.06) 100%), repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(52,211,153,0.05) 6px, rgba(52,211,153,0.05) 7px)',
    centerIcon: '\uD83D\uDDFD',
    iconColor: 'text-emerald-300',
    accentColor: 'rgba(52,211,153,0.25)',
  },
  {
    id: 'pyramids',
    name: 'Pyramids',
    bg: 'bg-amber-900',
    border: 'border-yellow-400',
    bgHex: '#78350f', borderHex: '#facc15',
    pattern: 'linear-gradient(135deg, rgba(250,204,21,0.1) 25%, transparent 25%), linear-gradient(225deg, rgba(250,204,21,0.1) 25%, transparent 25%), linear-gradient(180deg, rgba(250,204,21,0.06) 0%, transparent 100%)',
    centerIcon: '\u25B3',
    iconColor: 'text-yellow-300',
    accentColor: 'rgba(250,204,21,0.25)',
  },
];

/**
 * Pick a random card back design using a seed value.
 * Uses the seed to deterministically select a design so it stays
 * consistent for the duration of a game.
 * @param {number} seed - Numeric seed (e.g., Date.now() at game start)
 * @param {string[]} disabledIds - Array of disabled card back IDs to exclude
 * @returns {Object} Card back design object
 */
export function pickCardBack(seed, disabledIds = []) {
  const available = disabledIds.length > 0
    ? CARD_BACKS.filter(cb => !disabledIds.includes(cb.id))
    : CARD_BACKS;
  // Fallback to all designs if everything is disabled
  const pool = available.length > 0 ? available : CARD_BACKS;
  const index = Math.abs(seed) % pool.length;
  return pool[index];
}

/**
 * Get a card back design by its ID.
 * @param {string} id - Card back ID
 * @returns {Object|undefined} Card back design object
 */
export function getCardBackById(id) {
  return CARD_BACKS.find(cb => cb.id === id);
}

/**
 * Get all available card back designs.
 * @returns {Object[]} Array of card back design objects
 */
export function getAllCardBacks() {
  return CARD_BACKS;
}

export default CARD_BACKS;
