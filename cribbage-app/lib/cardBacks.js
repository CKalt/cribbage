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
    type: 'fullcard',
    name: 'Pyramids',
    bg: 'bg-amber-200',
    border: 'border-amber-500',
    bgHex: '#fde68a', borderHex: '#f59e0b',
    pattern: 'none',
    centerIcon: '\u25B3',
    iconColor: 'text-yellow-300',
    accentColor: 'rgba(245,158,11,0.25)',
    sceneSvg: '<svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="sky-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#bae6fd"/></linearGradient><linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs><rect width="80" height="112" fill="url(#sky-p)"/><rect y="70" width="80" height="42" fill="url(#sand)"/><circle cx="65" cy="18" r="10" fill="#facc15"/><polygon points="15,72 30,40 45,72" fill="#d4a017" stroke="#b8860b" stroke-width="0.5"/><polygon points="30,72 30,40 45,72" fill="#b8960f"/><polygon points="35,72 55,28 75,72" fill="#d4a017" stroke="#b8860b" stroke-width="0.5"/><polygon points="55,72 55,28 75,72" fill="#b8960f"/><polygon points="2,72 12,50 22,72" fill="#c49a12" stroke="#a07d0e" stroke-width="0.5"/><polygon points="12,72 12,50 22,72" fill="#a88c10"/><line x1="8" y1="72" x2="8" y2="48" stroke="#2d6b22" stroke-width="1.5"/><ellipse cx="8" cy="46" rx="5" ry="3" fill="#16a34a"/><ellipse cx="5" cy="48" rx="4" ry="2.5" fill="#22c55e"/><ellipse cx="11" cy="48" rx="4" ry="2.5" fill="#15803d"/></svg>',
  },

  // ── Full-Card Scenes ──
  {
    id: 'seashells',
    type: 'fullcard',
    name: 'Seashells',
    bg: 'bg-cyan-50',
    border: 'border-cyan-400',
    bgHex: '#ecfeff', borderHex: '#22d3ee',
    pattern: 'none',
    centerIcon: '\uD83D\uDC1A',
    iconColor: 'text-amber-600',
    accentColor: 'rgba(34,211,238,0.3)',
    sceneSvg: '<svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="sea-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#67e8f9"/><stop offset="40%" stop-color="#a5f3fc"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs><rect width="80" height="112" fill="url(#sea-bg)"/><ellipse cx="40" cy="58" rx="14" ry="13" fill="#fb923c" opacity="0.9"/><line x1="40" y1="45" x2="35" y2="58" stroke="#ea580c" stroke-width="0.7"/><line x1="40" y1="45" x2="40" y2="60" stroke="#ea580c" stroke-width="0.7"/><line x1="40" y1="45" x2="45" y2="58" stroke="#ea580c" stroke-width="0.7"/><line x1="40" y1="45" x2="30" y2="55" stroke="#ea580c" stroke-width="0.7"/><line x1="40" y1="45" x2="50" y2="55" stroke="#ea580c" stroke-width="0.7"/><ellipse cx="18" cy="82" rx="10" ry="7" fill="#fcd34d" transform="rotate(-20,18,82)"/><path d="M10,82 Q14,75 18,82 Q22,75 26,82" fill="none" stroke="#d97706" stroke-width="0.8"/><path d="M12,82 Q14,78 18,82 Q22,78 24,82" fill="none" stroke="#d97706" stroke-width="0.6"/><ellipse cx="60" cy="88" rx="9" ry="6" fill="#fda4af" transform="rotate(15,60,88)"/><path d="M53,88 Q56,82 60,88 Q64,82 67,88" fill="none" stroke="#e11d48" stroke-width="0.7"/><path d="M55,88 Q57,84 60,88 Q63,84 65,88" fill="none" stroke="#e11d48" stroke-width="0.5"/><circle cx="12" cy="100" r="2" fill="#d6d3d1" opacity="0.5"/><circle cx="55" cy="102" r="1.5" fill="#d6d3d1" opacity="0.4"/><circle cx="35" cy="105" r="1" fill="#d6d3d1" opacity="0.3"/></svg>',
  },
  {
    id: 'mona-lisa',
    type: 'fullcard',
    name: 'Mona Lisa',
    bg: 'bg-amber-950',
    border: 'border-yellow-600',
    bgHex: '#451a03', borderHex: '#ca8a04',
    pattern: 'none',
    centerIcon: '\uD83D\uDDBC\uFE0F',
    iconColor: 'text-yellow-500',
    accentColor: 'rgba(202,138,4,0.2)',
    sceneSvg: '<svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none"><rect width="80" height="112" fill="#3d2b1f"/><rect x="6" y="6" width="68" height="100" rx="2" fill="#5c4a3a" stroke="#ca8a04" stroke-width="1.5"/><rect x="10" y="10" width="60" height="92" fill="#4a6741"/><path d="M20,95 Q30,80 40,85 Q50,80 60,90 Q65,95 70,92 L70,102 L10,102 Z" fill="#5a7d4f"/><path d="M10,95 Q20,88 30,92 Q40,85 50,90 Q60,86 70,92 L70,102 L10,102 Z" fill="#3d6b2e" opacity="0.7"/><ellipse cx="40" cy="42" rx="10" ry="12" fill="#deb887"/><ellipse cx="40" cy="38" rx="12" ry="10" fill="#4a3728"/><path d="M30,35 Q32,28 40,26 Q48,28 50,35" fill="#3d2b1f"/><circle cx="37" cy="40" r="1.2" fill="#2d1f14"/><circle cx="43" cy="40" r="1.2" fill="#2d1f14"/><path d="M37,47 Q40,49 43,47" fill="none" stroke="#8b6914" stroke-width="0.8"/><path d="M28,50 L28,75 Q28,82 34,85 L46,85 Q52,82 52,75 L52,50" fill="#5b3a29"/><path d="M32,50 L32,72 Q32,78 36,80 L44,80 Q48,78 48,72 L48,50" fill="#deb887"/><rect x="32" y="50" width="16" height="6" fill="#4a6741" opacity="0.5"/></svg>',
  },
  {
    id: 'beach',
    type: 'fullcard',
    name: 'Beach',
    bg: 'bg-cyan-100',
    border: 'border-cyan-500',
    bgHex: '#cffafe', borderHex: '#06b6d4',
    pattern: 'linear-gradient(180deg, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.2) 100%)',
    centerIcon: '\uD83C\uDFD6\uFE0F',
    iconColor: 'text-cyan-600',
    accentColor: 'rgba(6,182,212,0.3)',
  },
  {
    id: 'tractor',
    type: 'fullcard',
    name: 'Tractor',
    bg: 'bg-green-100',
    border: 'border-green-600',
    bgHex: '#dcfce7', borderHex: '#16a34a',
    pattern: 'linear-gradient(180deg, rgba(22,163,74,0.08) 0%, rgba(22,163,74,0.15) 100%)',
    centerIcon: '\uD83D\uDE9C',
    iconColor: 'text-green-700',
    accentColor: 'rgba(22,163,74,0.2)',
  },
  {
    id: 'volcano',
    type: 'fullcard',
    name: 'Volcano',
    bg: 'bg-red-950',
    border: 'border-orange-500',
    bgHex: '#450a0a', borderHex: '#f97316',
    pattern: 'linear-gradient(180deg, rgba(249,115,22,0.15) 0%, rgba(239,68,68,0.1) 50%, transparent 100%)',
    centerIcon: '\uD83C\uDF0B',
    iconColor: 'text-orange-400',
    accentColor: 'rgba(249,115,22,0.3)',
  },
  {
    id: 'castle',
    type: 'fullcard',
    name: 'Castle',
    bg: 'bg-stone-200',
    border: 'border-stone-500',
    bgHex: '#e7e5e4', borderHex: '#78716c',
    pattern: 'linear-gradient(180deg, rgba(120,113,108,0.08) 0%, rgba(120,113,108,0.12) 100%)',
    centerIcon: '\uD83C\uDFF0',
    iconColor: 'text-stone-600',
    accentColor: 'rgba(120,113,108,0.2)',
  },
  {
    id: 'camping',
    type: 'fullcard',
    name: 'Camping',
    bg: 'bg-emerald-900',
    border: 'border-emerald-500',
    bgHex: '#064e3b', borderHex: '#10b981',
    pattern: 'linear-gradient(180deg, rgba(16,185,129,0.1) 0%, transparent 100%)',
    centerIcon: '\uD83C\uDFD5\uFE0F',
    iconColor: 'text-emerald-400',
    accentColor: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'sunrise',
    type: 'fullcard',
    name: 'Sunrise',
    bg: 'bg-orange-100',
    border: 'border-orange-400',
    bgHex: '#ffedd5', borderHex: '#fb923c',
    pattern: 'linear-gradient(180deg, rgba(251,146,60,0.15) 0%, rgba(251,146,60,0.05) 100%)',
    centerIcon: '\uD83C\uDF04',
    iconColor: 'text-orange-500',
    accentColor: 'rgba(251,146,60,0.3)',
  },
  {
    id: 'farm',
    type: 'fullcard',
    name: 'Farm',
    bg: 'bg-green-100',
    border: 'border-red-500',
    bgHex: '#dcfce7', borderHex: '#ef4444',
    pattern: 'none',
    centerIcon: '\uD83D\uDE9C',
    iconColor: 'text-green-700',
    accentColor: 'rgba(239,68,68,0.2)',
    sceneSvg: '<svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="sky-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#bae6fd"/></linearGradient></defs><rect width="80" height="112" fill="url(#sky-f)"/><rect y="60" width="80" height="52" fill="#4ade80"/><rect y="90" width="80" height="22" fill="#22c55e"/><circle cx="62" cy="16" r="8" fill="#facc15"/><rect x="20" y="38" width="28" height="30" fill="#dc2626"/><polygon points="18,38 34,20 50,38" fill="#991b1b"/><rect x="30" y="52" width="8" height="16" fill="#7f1d1d"/><rect x="22" y="44" width="6" height="5" fill="#fef3c7" opacity="0.8"/><rect x="40" y="44" width="6" height="5" fill="#fef3c7" opacity="0.8"/><rect x="52" y="35" width="10" height="33" rx="5" fill="#d1d5db"/><rect x="54" y="30" width="6" height="5" rx="3" fill="#9ca3af"/><ellipse cx="15" cy="78" rx="5" ry="4" fill="white"/><ellipse cx="13" cy="76" rx="2" ry="1.5" fill="white"/><circle cx="11" cy="77.5" r="0.5" fill="#1f2937"/><ellipse cx="65" cy="82" rx="4" ry="3.5" fill="white"/><ellipse cx="63" cy="80" rx="1.8" ry="1.3" fill="white"/><circle cx="61.5" cy="80" r="0.4" fill="#1f2937"/><ellipse cx="40" cy="95" rx="3.5" ry="3" fill="#92400e"/><ellipse cx="38" cy="93" rx="1.5" ry="1" fill="#92400e"/><circle cx="37" cy="93" r="0.4" fill="#1f2937"/><line x1="70" y1="60" x2="70" y2="72" stroke="#854d0e" stroke-width="0.8"/><ellipse cx="70" cy="58" rx="4" ry="3" fill="#16a34a"/></svg>',
  },
  {
    id: 'fireworks',
    type: 'fullcard',
    name: 'Fireworks',
    bg: 'bg-gray-950',
    border: 'border-yellow-400',
    bgHex: '#030712', borderHex: '#facc15',
    pattern: 'radial-gradient(circle, rgba(250,204,21,0.08) 0.5px, transparent 0.5px) 0 0 / 7px 7px',
    centerIcon: '\uD83C\uDF86',
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
