'use client';

// Shared components for deck cut rendering — used by DeckCut.jsx and DeckCutVariants.jsx

import { useCardBack } from './CardBackContext';

/**
 * Renders the card back design at a custom size (larger than CardBack component supports).
 * Replicates the rendering logic from CardBack.jsx for all card types.
 */
export function DeckCardFace({ width = 120, height = 168 }) {
  const design = useCardBack();
  const isFullcard = design.type === 'fullcard' || design.type === 'painting';
  const isEmoji = design.centerIcon && design.centerIcon.length > 1;

  const baseClasses = 'rounded-lg overflow-hidden relative';

  // Painting (sceneImage)
  if (design.sceneImage) {
    return (
      <div
        className={baseClasses}
        style={{ width, height, backgroundColor: design.bgHex || '#fef3c7' }}
      >
        <img
          src={design.sceneImage}
          alt=""
          className="absolute inset-0 w-full h-full object-contain rounded-lg"
          draggable={false}
        />
      </div>
    );
  }

  // Fullcard with SVG scene
  if (isFullcard && design.sceneSvg) {
    return (
      <div
        className={baseClasses}
        style={{ width, height, backgroundColor: design.bgHex, border: `2px solid ${design.borderHex}` }}
      >
        <div className="absolute inset-0 rounded-lg" style={{ background: design.pattern }} />
        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: design.sceneSvg }} />
      </div>
    );
  }

  // Fullcard with large center icon (e.g., fireworks)
  if (isFullcard) {
    return (
      <div
        className={baseClasses}
        style={{ width, height, backgroundColor: design.bgHex, border: `2px solid ${design.borderHex}` }}
      >
        <div className="absolute inset-0 rounded-lg" style={{ background: design.pattern }} />
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{ fontSize: '72px', lineHeight: 1, transform: 'scaleY(1.3)' }}
        >
          {design.centerIcon}
        </div>
      </div>
    );
  }

  // Standard icon type — pattern + center icon + corners
  return (
    <div
      className={baseClasses}
      style={{ width, height, backgroundColor: design.bgHex, border: `2px solid ${design.borderHex}` }}
    >
      <div className="absolute inset-0 rounded-lg" style={{ background: design.pattern }} />
      <div
        className="absolute rounded-lg"
        style={{
          top: 4, left: 4, right: 4, bottom: 4,
          border: `1px solid ${design.accentColor}`,
        }}
      />
      <div
        className={`absolute inset-0 flex items-center justify-center select-none ${design.iconColor}`}
        style={{ fontSize: isEmoji ? '36px' : '28px', fontWeight: 'bold' }}
      >
        {design.centerIcon}
      </div>
      <div className="absolute top-1 left-1.5 select-none" style={{ fontSize: isEmoji ? '16px' : '10px', lineHeight: 1 }}>
        {design.centerIcon}
      </div>
      <div className="absolute bottom-1 right-1.5 select-none" style={{ fontSize: isEmoji ? '16px' : '10px', lineHeight: 1, transform: 'rotate(180deg)' }}>
        {design.centerIcon}
      </div>
    </div>
  );
}

/**
 * A revealed playing card face (rank + suit on white background)
 */
export function RevealedCard({ card, className = '' }) {
  if (!card) return null;
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      className={`rounded-lg shadow-xl flex items-center justify-center border-2 border-yellow-400 bg-white ${isRed ? 'text-red-600' : 'text-black'} ${className}`}
      style={{ width: 80, height: 112 }}
    >
      <div className="text-center">
        <div className="text-3xl font-bold">{card.rank}</div>
        <div className="text-2xl">{card.suit}</div>
      </div>
    </div>
  );
}
