// Playing Card Component
// Will be populated in Phase 4.2

/**
 * Renders a playing card with proper styling
 * @param {Object} card - Card object { rank, suit, value }
 * @param {boolean} selected - Whether card is selected
 * @param {boolean} disabled - Whether card is disabled
 * @param {boolean} faceDown - Whether to show card back
 * @param {function} onClick - Click handler
 * @param {string} size - Card size ('sm' | 'md' | 'lg')
 */
export default function PlayingCard({
  card,
  selected = false,
  disabled = false,
  faceDown = false,
  onClick,
  size = 'md'
}) {
  if (!card) return null;

  const isRed = card.suit === '♥' || card.suit === '♦';

  if (faceDown) {
    return (
      <div className="bg-gray-600 text-white rounded p-2 w-12 h-16 flex items-center justify-center">
        ?
      </div>
    );
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        bg-white rounded p-2 text-xl font-bold cursor-pointer transition-all
        ${selected ? 'ring-4 ring-yellow-400' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${isRed ? 'text-red-600' : 'text-black'}
      `}
    >
      {card.rank}{card.suit}
    </div>
  );
}
