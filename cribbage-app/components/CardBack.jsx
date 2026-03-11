// Decorative Card Back — renders the face-down side of a playing card
// Uses the current game's card back design from context
// Supports two types:
//   'icon' (default) — center icon + pattern + corner accents
//   'fullcard' — single large emoji filling the entire card

import { useCardBack } from './CardBackContext';

/**
 * @param {'sm'|'md'|'lg'} size - Card size variant
 * @param {string} className - Additional CSS classes
 */
export default function CardBack({ size = 'md', className = '' }) {
  const design = useCardBack();
  const isFullcard = design.type === 'fullcard';

  // Emoji icons (animals) render larger for visibility
  const isEmoji = design.centerIcon && design.centerIcon.length > 1;

  const sizes = {
    sm: { outer: 'w-8 h-12', icon: isEmoji ? 'text-base' : 'text-xs', corner: isEmoji ? '8px' : '6px', full: 'text-3xl', border: 'border', inset: 1 },
    md: { outer: 'w-10 h-14', icon: isEmoji ? 'text-xl' : 'text-sm', corner: isEmoji ? '10px' : '6px', full: 'text-4xl', border: 'border-2', inset: 2 },
    lg: { outer: 'w-12 h-16', icon: isEmoji ? 'text-2xl' : 'text-base', corner: isEmoji ? '12px' : '6px', full: 'text-5xl', border: 'border-2', inset: 2 },
  };

  const s = sizes[size] || sizes.md;

  if (isFullcard) {
    return (
      <div
        className={`${design.bg} ${s.border} ${design.border} rounded ${s.outer} relative overflow-hidden ${className}`}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 rounded"
          style={{ background: design.pattern }}
        />
        {/* Full-card emoji */}
        <div className={`absolute inset-0 flex items-center justify-center select-none ${s.full}`}>
          {design.centerIcon}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${design.bg} ${s.border} ${design.border} rounded ${s.outer} relative overflow-hidden ${className}`}
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 rounded"
        style={{ background: design.pattern }}
      />
      {/* Inner border frame */}
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
      {/* Center icon */}
      <div className={`absolute inset-0 flex items-center justify-center ${design.iconColor} ${s.icon} font-bold select-none`}>
        {design.centerIcon}
      </div>
      {/* Corner accents */}
      <div className={`absolute top-0.5 left-0.5 select-none`} style={{ fontSize: s.corner, lineHeight: 1 }}>
        {design.centerIcon}
      </div>
      <div className={`absolute bottom-0.5 right-0.5 select-none`} style={{ fontSize: s.corner, lineHeight: 1, transform: 'rotate(180deg)' }}>
        {design.centerIcon}
      </div>
    </div>
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
