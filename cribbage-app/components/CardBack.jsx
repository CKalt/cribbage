// Decorative Card Back — renders the face-down side of a playing card
// Uses the current game's card back design from context

import { useCardBack } from './CardBackContext';

/**
 * @param {'sm'|'md'|'lg'} size - Card size variant
 * @param {string} className - Additional CSS classes
 */
export default function CardBack({ size = 'md', className = '' }) {
  const design = useCardBack();

  const sizes = {
    sm: { outer: 'w-8 h-12', icon: 'text-xs', border: 'border', inset: 1 },
    md: { outer: 'w-10 h-14', icon: 'text-sm', border: 'border-2', inset: 2 },
    lg: { outer: 'w-12 h-16', icon: 'text-base', border: 'border-2', inset: 2 },
  };

  const s = sizes[size] || sizes.md;

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
      <div className={`absolute top-0.5 left-1 ${design.iconColor} select-none`} style={{ fontSize: '6px' }}>
        {design.centerIcon}
      </div>
      <div className={`absolute bottom-0.5 right-1 ${design.iconColor} select-none`} style={{ fontSize: '6px', transform: 'rotate(180deg)' }}>
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
