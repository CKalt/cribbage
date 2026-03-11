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
    id: 'american-gothic',
    type: 'fullcard',
    name: 'American Gothic',
    bg: 'bg-amber-950',
    border: 'border-yellow-700',
    bgHex: '#451a03', borderHex: '#a16207',
    pattern: 'none',
    centerIcon: '\uD83C\uDFE1',
    iconColor: 'text-yellow-500',
    accentColor: 'rgba(161,98,7,0.2)',
    sceneImage: '/card-backs/american-gothic.png',
    artistName: 'Grant Wood',
    artistBio: 'Grant Wood (1891\u20131942) was an American painter best known for his paintings depicting the rural American Midwest. "American Gothic" (1930), showing a farmer and his daughter before a house with a Gothic window, became one of the most iconic images in American art. Wood was a leading figure in the Regionalism movement, celebrating heartland values and small-town life.',
  },
  {
    id: 'the-scream',
    type: 'fullcard',
    name: 'The Scream',
    bg: 'bg-orange-950',
    border: 'border-orange-600',
    bgHex: '#431407', borderHex: '#ea580c',
    pattern: 'none',
    centerIcon: '\uD83D\uDE31',
    iconColor: 'text-orange-500',
    accentColor: 'rgba(234,88,12,0.2)',
    sceneImage: '/card-backs/the-scream.png',
    artistName: 'Edvard Munch',
    artistBio: 'Edvard Munch (1863\u20131944) was a Norwegian painter and printmaker whose intensely personal art laid the groundwork for Expressionism. "The Scream" (1893) depicts an agonized figure against a blood-red sky and has become one of the most recognizable images in art history. Munch explored themes of anxiety, illness, and emotional turbulence throughout his career.',
  },
  {
    id: 'mona-lisa',
    type: 'fullcard',
    name: 'Mona Lisa',
    bg: 'bg-amber-950',
    border: 'border-yellow-700',
    bgHex: '#451a03', borderHex: '#a16207',
    pattern: 'none',
    centerIcon: '\uD83D\uDDBC\uFE0F',
    iconColor: 'text-yellow-500',
    accentColor: 'rgba(161,98,7,0.2)',
    sceneImage: '/card-backs/mona-lisa.png',
    artistName: 'Leonardo da Vinci',
    artistBio: 'Leonardo da Vinci (1452\u20131519) was an Italian polymath of the Renaissance\u2014painter, sculptor, architect, scientist, and inventor. The "Mona Lisa" (c. 1503\u20131519), with its enigmatic smile and pioneering sfumato technique, is the most famous painting in the world, housed in the Louvre in Paris. Leonardo\'s notebooks reveal a mind centuries ahead of his time.',
  },
  {
    id: 'lighthouse',
    type: 'fullcard',
    name: 'Lighthouse',
    bg: 'bg-slate-800',
    border: 'border-amber-500',
    bgHex: '#1e293b', borderHex: '#f59e0b',
    pattern: 'none',
    centerIcon: '\uD83C\uDF1F',
    iconColor: 'text-amber-400',
    accentColor: 'rgba(245,158,11,0.2)',
    sceneSvg: '<svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="lh-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="35%" stop-color="#312e81"/><stop offset="60%" stop-color="#4338ca"/><stop offset="80%" stop-color="#f97316"/><stop offset="90%" stop-color="#fb923c"/><stop offset="100%" stop-color="#fdba74"/></linearGradient><linearGradient id="lh-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0c1929"/></linearGradient><radialGradient id="lh-beam" cx="0.5" cy="0" r="0.8"><stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/><stop offset="40%" stop-color="#fde047" stop-opacity="0.3"/><stop offset="100%" stop-color="#fde047" stop-opacity="0"/></radialGradient></defs><rect width="80" height="112" fill="url(#lh-sky)"/><rect x="0" y="68" width="80" height="44" fill="url(#lh-sea)"/><path d="M0,70 Q10,67 20,70 Q30,73 40,70 Q50,67 60,70 Q70,73 80,70 L80,74 Q70,77 60,74 Q50,71 40,74 Q30,77 20,74 Q10,71 0,74 Z" fill="#2563eb" opacity="0.3"/><path d="M0,78 Q15,75 30,78 Q45,81 60,78 Q70,76 80,78 L80,82 Q70,80 60,82 Q45,85 30,82 Q15,79 0,82 Z" fill="#1d4ed8" opacity="0.2"/><path d="M0,88 Q20,85 40,88 Q60,91 80,88 L80,92 Q60,95 40,92 Q20,89 0,92 Z" fill="#1e40af" opacity="0.15"/><path d="M0,80 Q8,90 20,95 L20,112 L0,112 Z" fill="#4a3728"/><path d="M20,95 Q30,88 45,92 L45,112 L20,112 Z" fill="#3d2b1f"/><path d="M0,85 Q10,92 20,97 L20,112 L0,112 Z" fill="#5a7d4f" opacity="0.4"/><path d="M20,97 Q30,93 40,96 L40,112 L20,112 Z" fill="#4a6741" opacity="0.3"/><rect x="30" y="30" width="12" height="62" fill="#e2e8f0"/><rect x="30" y="30" width="12" height="10" fill="#dc2626"/><rect x="30" y="50" width="12" height="10" fill="#dc2626"/><rect x="30" y="70" width="12" height="10" fill="#dc2626"/><rect x="28" y="28" width="16" height="4" fill="#94a3b8"/><rect x="28" y="88" width="16" height="4" fill="#94a3b8"/><rect x="27" y="24" width="18" height="6" rx="1" fill="#475569"/><rect x="29" y="22" width="14" height="4" rx="1" fill="#64748b"/><path d="M33,22 L36,14 L36,22" fill="#94a3b8"/><path d="M39,22 L36,14 L36,22" fill="#64748b"/><circle cx="36" cy="18" r="3" fill="#fef08a" opacity="0.9"/><circle cx="36" cy="18" r="2" fill="#fff" opacity="0.8"/><path d="M36,18 L10,5" stroke="#fef08a" stroke-width="1.5" opacity="0.15"/><path d="M36,18 L0,12" stroke="#fef08a" stroke-width="1" opacity="0.1"/><path d="M36,18 L62,5" stroke="#fef08a" stroke-width="1.5" opacity="0.15"/><path d="M36,18 L80,12" stroke="#fef08a" stroke-width="1" opacity="0.1"/><path d="M36,15 L20,2 L52,2 Z" fill="url(#lh-beam)" opacity="0.4"/><rect x="34" y="40" width="4" height="5" rx="0.5" fill="#93c5fd" opacity="0.5"/><rect x="34" y="60" width="4" height="5" rx="0.5" fill="#93c5fd" opacity="0.5"/><rect x="33" y="80" width="6" height="8" rx="0.5" fill="#78350f"/><circle cx="60" cy="12" r="1" fill="#fff" opacity="0.8"/><circle cx="15" cy="8" r="0.7" fill="#fff" opacity="0.6"/><circle cx="70" cy="6" r="0.8" fill="#fff" opacity="0.7"/><circle cx="50" cy="15" r="0.5" fill="#fff" opacity="0.5"/><circle cx="25" cy="18" r="0.6" fill="#fff" opacity="0.4"/><circle cx="68" cy="22" r="0.5" fill="#fff" opacity="0.3"/></svg>',
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

  // ── Paintings (image-based, borderless) ──
  {
    id: 'lighthouse-painting',
    type: 'fullcard',
    name: 'Lighthouse (Munch)',
    bg: 'bg-slate-800',
    border: 'border-amber-500',
    bgHex: '#1e293b', borderHex: '#f59e0b',
    pattern: 'none',
    centerIcon: '\uD83C\uDF1F',
    iconColor: 'text-amber-400',
    accentColor: 'rgba(245,158,11,0.2)',
    sceneImage: '/card-backs/lighthouse-painting-munch.png',
    artistName: 'Edvard Munch',
    artistBio: 'Edvard Munch (1863\u20131944) was a Norwegian painter and printmaker whose intensely personal art laid the groundwork for Expressionism. Best known for "The Scream," Munch explored themes of anxiety, illness, and emotional turbulence throughout his prolific career spanning over 60 years.',
  },
  {
    id: 'skyscraper-painting',
    type: 'fullcard',
    name: "Skyscraper (O'Keeffe)",
    bg: 'bg-gray-900',
    border: 'border-sky-400',
    bgHex: '#111827', borderHex: '#38bdf8',
    pattern: 'none',
    centerIcon: '\uD83C\uDFD9\uFE0F',
    iconColor: 'text-sky-300',
    accentColor: 'rgba(56,189,248,0.2)',
    sceneImage: '/card-backs/skyscraper-paiting-okeeffe.png',
    artistName: "Georgia O'Keeffe",
    artistBio: "Georgia O'Keeffe (1887\u20131986) was an American modernist artist known as the \"Mother of American Modernism.\" Famous for her large-scale flower paintings, New York skyscrapers, and New Mexico landscapes, she was one of the most significant artists of the 20th century. Her bold, abstract style transformed how Americans saw their own landscape.",
  },
  {
    id: 'desert-painting',
    type: 'fullcard',
    name: 'Desert (Dali)',
    bg: 'bg-yellow-900',
    border: 'border-yellow-500',
    bgHex: '#713f12', borderHex: '#eab308',
    pattern: 'none',
    centerIcon: '\uD83C\uDFDC\uFE0F',
    iconColor: 'text-yellow-300',
    accentColor: 'rgba(234,179,8,0.3)',
    sceneImage: '/card-backs/desert-painting-dali.png',
    artistName: 'Salvador Dal\u00ed',
    artistBio: 'Salvador Dal\u00ed (1904\u20131989) was a Spanish Surrealist artist renowned for his striking and bizarre imagery. His most famous work, "The Persistence of Memory" with its melting clocks, epitomizes the Surrealist movement. An eccentric showman with his trademark upturned mustache, Dal\u00ed worked across painting, sculpture, film, and photography.',
  },
  {
    id: 'farm-painting',
    type: 'fullcard',
    name: 'Farm (Benton)',
    bg: 'bg-green-100',
    border: 'border-red-500',
    bgHex: '#dcfce7', borderHex: '#ef4444',
    pattern: 'none',
    centerIcon: '\uD83D\uDE9C',
    iconColor: 'text-green-700',
    accentColor: 'rgba(239,68,68,0.2)',
    sceneImage: '/card-backs/farm-painting-th-benton.png',
    artistName: 'Thomas Hart Benton',
    artistBio: 'Thomas Hart Benton (1889\u20131975) was an American painter and muralist, a leader of the Regionalism art movement. His dynamic, rolling compositions depicted everyday life in the American heartland\u2014farmers, laborers, and small-town scenes rendered with muscular, rhythmic forms. He was a mentor to the young Jackson Pollock.',
  },
  {
    id: 'pyramids-painting',
    type: 'fullcard',
    name: 'Pyramids (G\u00e9r\u00f4me)',
    bg: 'bg-amber-200',
    border: 'border-amber-500',
    bgHex: '#fde68a', borderHex: '#f59e0b',
    pattern: 'none',
    centerIcon: '\u25B3',
    iconColor: 'text-yellow-300',
    accentColor: 'rgba(245,158,11,0.25)',
    sceneImage: '/card-backs/pyramids-painting-jl-gerome.png',
    artistName: 'Jean-L\u00e9on G\u00e9r\u00f4me',
    artistBio: 'Jean-L\u00e9on G\u00e9r\u00f4me (1824\u20131904) was a French Academic painter and sculptor known for his vivid historical and Orientalist scenes. His meticulously detailed works transported viewers to ancient Rome, Egypt, and the Middle East. One of the most celebrated artists of his era, he trained many students at the \u00c9cole des Beaux-Arts in Paris.',
  },
  {
    id: 'castle-painting',
    type: 'fullcard',
    name: 'Castle (Kinkade)',
    bg: 'bg-stone-200',
    border: 'border-stone-500',
    bgHex: '#e7e5e4', borderHex: '#78716c',
    pattern: 'none',
    centerIcon: '\uD83C\uDFF0',
    iconColor: 'text-stone-600',
    accentColor: 'rgba(120,113,108,0.2)',
    sceneImage: '/card-backs/castle-painting-t-kincade.png',
    artistName: 'Thomas Kinkade',
    artistBio: 'Thomas Kinkade (1958\u20132012) was an American painter of popular realistic and pastoral scenes, self-described as the "Painter of Light." His luminous cottages, gardens, and landscapes became some of the most widely collected art in America. His work emphasized warmth, nostalgia, and an idealized vision of the world.',
  },
  {
    id: 'sunrise-painting',
    type: 'fullcard',
    name: 'Sunrise (Shan Shui)',
    bg: 'bg-orange-100',
    border: 'border-orange-400',
    bgHex: '#ffedd5', borderHex: '#fb923c',
    pattern: 'none',
    centerIcon: '\uD83C\uDF04',
    iconColor: 'text-orange-500',
    accentColor: 'rgba(251,146,60,0.3)',
    sceneImage: '/card-backs/sunrise-painting-shan-shui.png',
    artistName: 'Shan Shui Tradition',
    artistBio: 'Shan Shui (\u5c71\u6c34, "mountain-water") is a style of Chinese landscape painting dating back over a thousand years. Rather than depicting a specific scene, Shan Shui paintings capture the spiritual essence of nature\u2014misty mountains, flowing water, and tiny human figures dwarfed by the grandeur of the landscape. It remains one of the highest forms of Chinese art.',
  },
  {
    id: 'beach-painting',
    type: 'fullcard',
    name: 'Beach (Gauguin)',
    bg: 'bg-cyan-100',
    border: 'border-cyan-500',
    bgHex: '#cffafe', borderHex: '#06b6d4',
    pattern: 'none',
    centerIcon: '\uD83C\uDFD6\uFE0F',
    iconColor: 'text-cyan-600',
    accentColor: 'rgba(6,182,212,0.3)',
    sceneImage: '/card-backs/beach-painting-gauguin.png',
    artistName: 'Paul Gauguin',
    artistBio: 'Paul Gauguin (1848\u20131903) was a French Post-Impressionist artist who famously left Europe for Tahiti seeking a more primitive and authentic life. His bold use of color, simplified forms, and exotic subject matter profoundly influenced modern art. His Tahitian paintings, with their vivid tropical hues, are among the most beloved works of the Post-Impressionist era.',
  },
];

/**
 * Card back types for weighted selection:
 *   'icon'      — emoji center + pattern + corner accents (no sceneImage/sceneSvg)
 *   'svg'       — fullcard with inline SVG scene (sceneSvg field)
 *   'painting'  — fullcard with image file (sceneImage field)
 */
function getCardType(cb) {
  if (cb.sceneImage) return 'painting';
  if (cb.sceneSvg) return 'svg';
  return 'icon';
}

/**
 * Pick a random card back design using a seed value.
 * Algorithm: first pick one of the 3 types (icon/svg/painting) at random,
 * then pick a random card within that type. This ensures each type appears
 * roughly every 3 games regardless of how many designs each type has.
 * @param {number} seed - Numeric seed (e.g., Date.now() at game start)
 * @param {string[]} disabledIds - Array of disabled card back IDs to exclude
 * @returns {Object} Card back design object
 */
export function pickCardBack(seed, disabledIds = []) {
  const available = disabledIds.length > 0
    ? CARD_BACKS.filter(cb => !disabledIds.includes(cb.id))
    : CARD_BACKS;
  const pool = available.length > 0 ? available : CARD_BACKS;

  // Group by type
  const icons = pool.filter(cb => getCardType(cb) === 'icon');
  const svgs = pool.filter(cb => getCardType(cb) === 'svg');
  const paintings = pool.filter(cb => getCardType(cb) === 'painting');

  // Build list of non-empty type buckets
  const buckets = [];
  if (icons.length > 0) buckets.push(icons);
  if (svgs.length > 0) buckets.push(svgs);
  if (paintings.length > 0) buckets.push(paintings);

  // Use seed to pick type, then pick within type
  const s = Math.abs(seed);
  const bucket = buckets[s % buckets.length];
  const index = Math.floor(s / buckets.length) % bucket.length;
  return bucket[index];
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
