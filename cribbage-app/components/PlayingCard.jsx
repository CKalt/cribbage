// Playing Card Component

/**
 * Renders a playing card with proper styling
 * @param {Object} card - Card object { rank, suit, value }
 * @param {boolean} selected - Whether card is selected (yellow ring)
 * @param {boolean} disabled - Whether card is disabled (grayed out)
 * @param {boolean} faceDown - Whether to show card back
 * @param {boolean} revealed - Show face-up (for computer's cards during counting)
 * @param {boolean} highlighted - Whether card is highlighted (golden glow for counting)
 * @param {function} onClick - Click handler
 * @param {string} size - Card size ('sm' | 'md' | 'lg')
 */
export default function PlayingCard({
  card,
  selected = false,
  disabled = false,
  faceDown = false,
  revealed = false,
  highlighted = false,
  onClick,
  size = 'md'
}) {
  if (!card) return null;

  const isRed = card.suit === '♥' || card.suit === '♦';

  // Size classes
  const sizeClasses = {
    sm: 'px-1 py-0.5 text-xs',
    md: 'px-1.5 py-1 text-base',
    lg: 'px-2 py-1.5 text-xl'
  };

  // Face-down card (unknown) - slightly narrower than original w-12 to fit 6 on mobile
  if (faceDown) {
    return (
      <div className={`bg-blue-900 border-2 border-blue-700 text-blue-300 rounded p-2 w-10 h-14 flex items-center justify-center font-bold text-lg`}>
        ?
      </div>
    );
  }

  // Revealed card (computer's cards during counting - white bg like player cards)
  if (revealed) {
    return (
      <div className={`bg-white rounded border border-gray-300 shadow-sm ${sizeClasses[size]} font-bold flex flex-col items-center leading-tight ${
        isRed ? 'text-red-600' : 'text-black'
      } ${highlighted ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50' : ''}`}>
        <span>{card.rank}</span>
        <span>{card.suit}</span>
      </div>
    );
  }

  // Regular face-up card
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        bg-white rounded border border-gray-300 shadow-sm ${sizeClasses[size]} font-bold flex flex-col items-center leading-tight cursor-pointer transition-all
        ${selected ? 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-400/50 -translate-y-2 scale-110' : ''}
        ${highlighted && !selected ? 'ring-2 ring-yellow-400/50' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${isRed ? 'text-red-600' : 'text-black'}
      `}
    >
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
}

/**
 * Renders a small played card (for play area)
 */
export function PlayedCard({ card }) {
  if (!card) return null;

  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div className={`bg-white rounded border border-gray-300 shadow-sm px-1 py-0.5 text-xs font-bold flex flex-col items-center leading-tight ${
      isRed ? 'text-red-600' : 'text-black'
    }`}>
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
}

/**
 * Renders a large card (for cut cards during cutting phase)
 */
export function LargeCard({ card, placeholder = false }) {
  if (placeholder || !card) {
    return (
      <div className="inline-block bg-gray-600 rounded p-3 w-16 h-20 flex items-center justify-center text-white font-bold">
        ?
      </div>
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div className={`inline-block bg-white rounded px-3 py-2 text-2xl font-bold flex flex-col items-center leading-tight ${
      isRed ? 'text-red-600' : 'text-black'
    }`}>
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
}

/**
 * Renders a medium card (for cut card display)
 */
export function CutCard({ card }) {
  if (!card) return null;

  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div className={`inline-block bg-white rounded px-2 py-1 text-xl font-bold flex flex-col items-center leading-tight ${
      isRed ? 'text-red-600' : 'text-black'
    }`}>
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
}
