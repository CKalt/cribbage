// Decorative Card Back — renders the face-down side of a playing card
// Uses the current game's card back design from context
// Supports three render modes:
//   'icon' (default) — center icon + pattern + corner accents
//   'fullcard' svg — inline SVG scene filling the card
//   'fullcard' image — external image filling the card (borderless)
// Tap any card back to see a full-screen preview

import { useState } from 'react';
import { useCardBack } from './CardBackContext';

/**
 * Full-screen preview overlay for card back designs
 */
function CardBackPreview({ design, onClose }) {
  const isEmoji = design.centerIcon && design.centerIcon.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl leading-none bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 z-10"
      >
        &times;
      </button>

      {/* Card name */}
      <div className="absolute top-4 left-0 right-0 text-center text-white text-lg font-semibold">
        {design.name}
      </div>

      {/* Large card preview */}
      {design.sceneImage ? (
        <div className="rounded-xl overflow-hidden shadow-2xl" style={{ width: '240px', height: '336px' }}>
          <img
            src={design.sceneImage}
            alt={design.name}
            className="w-full h-full object-cover rounded-xl"
            draggable={false}
          />
        </div>
      ) : design.sceneSvg ? (
        <div
          className={`${design.bg} border-4 ${design.border} rounded-xl overflow-hidden shadow-2xl`}
          style={{ width: '240px', height: '336px' }}
        >
          <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: design.sceneSvg }} />
        </div>
      ) : design.type === 'fullcard' ? (
        <div
          className={`${design.bg} border-4 ${design.border} rounded-xl overflow-hidden shadow-2xl relative`}
          style={{ width: '240px', height: '336px' }}
        >
          <div className="absolute inset-0 rounded-lg" style={{ background: design.pattern }} />
          <div
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{ fontSize: '200px', lineHeight: 1, transform: 'scaleY(1.4)' }}
          >
            {design.centerIcon}
          </div>
        </div>
      ) : (
        <div
          className={`${design.bg} border-4 ${design.border} rounded-xl overflow-hidden shadow-2xl relative`}
          style={{ width: '240px', height: '336px' }}
        >
          <div className="absolute inset-0 rounded-lg" style={{ background: design.pattern }} />
          <div
            className="absolute rounded-lg"
            style={{
              top: '12px', left: '12px', right: '12px', bottom: '12px',
              border: `2px solid ${design.accentColor}`,
            }}
          />
          <div className={`absolute inset-0 flex items-center justify-center ${design.iconColor} font-bold select-none`}
            style={{ fontSize: isEmoji ? '80px' : '60px' }}
          >
            {design.centerIcon}
          </div>
          <div className="absolute top-2 left-2 select-none" style={{ fontSize: isEmoji ? '24px' : '16px', lineHeight: 1 }}>
            {design.centerIcon}
          </div>
          <div className="absolute bottom-2 right-2 select-none" style={{ fontSize: isEmoji ? '24px' : '16px', lineHeight: 1, transform: 'rotate(180deg)' }}>
            {design.centerIcon}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @param {'sm'|'md'|'lg'} size - Card size variant
 * @param {string} className - Additional CSS classes
 */
export default function CardBack({ size = 'md', className = '' }) {
  const design = useCardBack();
  const isFullcard = design.type === 'fullcard';
  const [showPreview, setShowPreview] = useState(false);

  // Emoji icons (animals) render larger for visibility
  const isEmoji = design.centerIcon && design.centerIcon.length > 1;

  const sizes = {
    sm: { outer: 'w-8 h-12', icon: isEmoji ? 'text-base' : 'text-xs', corner: isEmoji ? '8px' : '6px', fullPx: '32px', fullScaleY: 1.5, border: 'border', inset: 1 },
    md: { outer: 'w-10 h-14', icon: isEmoji ? 'text-xl' : 'text-sm', corner: isEmoji ? '10px' : '6px', fullPx: '40px', fullScaleY: 1.4, border: 'border-2', inset: 2 },
    lg: { outer: 'w-12 h-16', icon: isEmoji ? 'text-2xl' : 'text-base', corner: isEmoji ? '12px' : '6px', fullPx: '48px', fullScaleY: 1.33, border: 'border-2', inset: 2 },
  };

  const s = sizes[size] || sizes.md;

  const handleTap = (e) => {
    e.stopPropagation();
    setShowPreview(true);
  };

  const card = isFullcard ? (
    design.sceneImage ? (
      <div className={`rounded ${s.outer} relative overflow-hidden cursor-pointer ${className}`} onClick={handleTap}>
        <img
          src={design.sceneImage}
          alt={design.name}
          className="absolute inset-0 w-full h-full object-cover rounded"
          draggable={false}
        />
      </div>
    ) : (
      <div
        className={`${design.bg} ${s.border} ${design.border} rounded ${s.outer} relative overflow-hidden cursor-pointer ${className}`}
        onClick={handleTap}
      >
        <div className="absolute inset-0 rounded" style={{ background: design.pattern }} />
        {design.sceneSvg ? (
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: design.sceneSvg }} />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{ fontSize: s.fullPx, lineHeight: 1, transform: `scaleY(${s.fullScaleY})` }}
          >
            {design.centerIcon}
          </div>
        )}
      </div>
    )
  ) : (
    <div
      className={`${design.bg} ${s.border} ${design.border} rounded ${s.outer} relative overflow-hidden cursor-pointer ${className}`}
      onClick={handleTap}
    >
      <div className="absolute inset-0 rounded" style={{ background: design.pattern }} />
      <div
        className="absolute rounded"
        style={{
          top: `${s.inset + 2}px`,
          left: `${s.inset + 2}px`,
          right: `${s.inset + 2}px`,
          bottom: `${s.inset + 2}px`,
          border: `1px solid ${design.accentColor}`,
        }}
      />
      <div className={`absolute inset-0 flex items-center justify-center ${design.iconColor} ${s.icon} font-bold select-none`}>
        {design.centerIcon}
      </div>
      <div className="absolute top-0.5 left-0.5 select-none" style={{ fontSize: s.corner, lineHeight: 1 }}>
        {design.centerIcon}
      </div>
      <div className="absolute bottom-0.5 right-0.5 select-none" style={{ fontSize: s.corner, lineHeight: 1, transform: 'rotate(180deg)' }}>
        {design.centerIcon}
      </div>
    </div>
  );

  return (
    <>
      {card}
      {showPreview && <CardBackPreview design={design} onClose={() => setShowPreview(false)} />}
    </>
  );
}

/**
 * Inline card back styles for elements that can't use the component
 * (e.g., deck piles, crib stacks rendered as plain divs)
 */
export function useCardBackStyles() {
  const design = useCardBack();
  return {
    className: `${design.bg} ${design.border}`,
    style: { backgroundImage: design.pattern },
    design,
  };
}
