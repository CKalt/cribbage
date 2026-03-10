// Card Back Designs — randomly selected per game
// Each design defines Tailwind classes and an optional SVG pattern overlay

const CARD_BACKS = [
  // ── Classic Designs ──
  {
    id: 'classic-blue',
    name: 'Classic Blue',
    bg: 'bg-blue-900',
    border: 'border-blue-400',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(59,130,246,0.15) 3px, rgba(59,130,246,0.15) 6px)',
    centerIcon: '♠',
    iconColor: 'text-blue-300',
    accentColor: 'rgba(59,130,246,0.3)',
  },
  {
    id: 'classic-red',
    name: 'Classic Red',
    bg: 'bg-red-900',
    border: 'border-red-400',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(239,68,68,0.15) 3px, rgba(239,68,68,0.15) 6px)',
    centerIcon: '♦',
    iconColor: 'text-red-300',
    accentColor: 'rgba(239,68,68,0.3)',
  },
  {
    id: 'classic-green',
    name: 'Classic Green',
    bg: 'bg-emerald-900',
    border: 'border-emerald-400',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(52,211,153,0.15) 3px, rgba(52,211,153,0.15) 6px)',
    centerIcon: '♣',
    iconColor: 'text-emerald-300',
    accentColor: 'rgba(52,211,153,0.3)',
  },
  {
    id: 'classic-purple',
    name: 'Classic Purple',
    bg: 'bg-purple-900',
    border: 'border-purple-400',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(168,85,247,0.15) 3px, rgba(168,85,247,0.15) 6px)',
    centerIcon: '♥',
    iconColor: 'text-purple-300',
    accentColor: 'rgba(168,85,247,0.3)',
  },

  // ── Ornate Designs ──
  {
    id: 'gold-filigree',
    name: 'Gold Filigree',
    bg: 'bg-gray-900',
    border: 'border-yellow-500',
    pattern: 'repeating-conic-gradient(rgba(234,179,8,0.12) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px',
    centerIcon: '\u2726',
    iconColor: 'text-yellow-400',
    accentColor: 'rgba(234,179,8,0.25)',
  },
  {
    id: 'royal-navy',
    name: 'Royal Navy',
    bg: 'bg-slate-900',
    border: 'border-amber-400',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(251,191,36,0.08) 5px, rgba(251,191,36,0.08) 6px), repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(251,191,36,0.08) 5px, rgba(251,191,36,0.08) 6px)',
    centerIcon: '\u2655',
    iconColor: 'text-amber-300',
    accentColor: 'rgba(251,191,36,0.2)',
  },

  // ── Modern Art ──
  {
    id: 'neon-grid',
    name: 'Neon Grid',
    bg: 'bg-gray-950',
    border: 'border-cyan-400',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(34,211,238,0.12) 7px, rgba(34,211,238,0.12) 8px), repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(34,211,238,0.12) 7px, rgba(34,211,238,0.12) 8px)',
    centerIcon: '\u25C8',
    iconColor: 'text-cyan-400',
    accentColor: 'rgba(34,211,238,0.25)',
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset',
    bg: 'bg-orange-900',
    border: 'border-pink-400',
    pattern: 'linear-gradient(135deg, rgba(249,115,22,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(168,85,247,0.3) 100%)',
    centerIcon: '\u2600',
    iconColor: 'text-orange-200',
    accentColor: 'rgba(236,72,153,0.3)',
  },
  {
    id: 'abstract-dots',
    name: 'Abstract Dots',
    bg: 'bg-indigo-950',
    border: 'border-indigo-400',
    pattern: 'radial-gradient(circle, rgba(129,140,248,0.2) 1px, transparent 1px) 0 0 / 6px 6px',
    centerIcon: '\u2B22',
    iconColor: 'text-indigo-300',
    accentColor: 'rgba(129,140,248,0.3)',
  },

  // ── Sci-Fi ──
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    bg: 'bg-gray-950',
    border: 'border-fuchsia-500',
    pattern: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(217,70,239,0.1) 4px, rgba(217,70,239,0.1) 5px), repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(6,182,212,0.08) 4px, rgba(6,182,212,0.08) 5px)',
    centerIcon: '\u2B23',
    iconColor: 'text-fuchsia-400',
    accentColor: 'rgba(217,70,239,0.3)',
  },
  {
    id: 'starfield',
    name: 'Starfield',
    bg: 'bg-slate-950',
    border: 'border-sky-400',
    pattern: 'radial-gradient(circle, rgba(186,230,253,0.3) 0.5px, transparent 0.5px) 0 0 / 8px 8px, radial-gradient(circle, rgba(186,230,253,0.15) 0.5px, transparent 0.5px) 4px 4px / 8px 8px',
    centerIcon: '\u2729',
    iconColor: 'text-sky-300',
    accentColor: 'rgba(56,189,248,0.2)',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    bg: 'bg-black',
    border: 'border-green-500',
    pattern: 'repeating-linear-gradient(180deg, transparent, transparent 3px, rgba(34,197,94,0.06) 3px, rgba(34,197,94,0.06) 4px)',
    centerIcon: '\u25A0',
    iconColor: 'text-green-400',
    accentColor: 'rgba(34,197,94,0.25)',
  },

  // ── Animal Patterns ──
  {
    id: 'leopard',
    name: 'Leopard',
    bg: 'bg-amber-900',
    border: 'border-amber-500',
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
    pattern: 'linear-gradient(160deg, rgba(148,163,184,0.15) 25%, transparent 25%, transparent 50%, rgba(148,163,184,0.15) 50%, rgba(148,163,184,0.15) 75%, transparent 75%) 0 0 / 10px 10px',
    centerIcon: '\uD83D\uDC3A',
    iconColor: 'text-slate-300',
    accentColor: 'rgba(148,163,184,0.2)',
  },
];

/**
 * Pick a random card back design using a seed value.
 * Uses the seed to deterministically select a design so it stays
 * consistent for the duration of a game.
 * @param {number} seed - Numeric seed (e.g., Date.now() at game start)
 * @returns {Object} Card back design object
 */
export function pickCardBack(seed) {
  const index = Math.abs(seed) % CARD_BACKS.length;
  return CARD_BACKS[index];
}

/**
 * Get all available card back designs.
 * @returns {Object[]} Array of card back design objects
 */
export function getAllCardBacks() {
  return CARD_BACKS;
}

export default CARD_BACKS;
