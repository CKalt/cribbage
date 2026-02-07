'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Animated card overlay that flies from one position to another.
 * Renders via portal to avoid clipping by overflow containers.
 *
 * @param {object} card - Card object { rank, suit, value }
 * @param {object} startRect - Source getBoundingClientRect() { top, left, width, height }
 * @param {object} endRect - Target getBoundingClientRect() { top, left }
 * @param {function} onComplete - Called when animation finishes
 */
export default function FlyingCard({ card, startRect, endRect, onComplete }) {
  const ref = useRef(null);

  useEffect(() => {
    // Safety: if animation doesn't fire onAnimationEnd, clean up after timeout
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!card || !startRect || !endRect) return null;

  const flyX = endRect.left - startRect.left;
  const flyY = endRect.top - startRect.top;

  const isRed = card.suit === '♥' || card.suit === '♦';

  const overlay = (
    <div
      ref={ref}
      className="flying-card"
      style={{
        top: startRect.top,
        left: startRect.left,
        width: startRect.width,
        height: startRect.height,
        '--fly-x': `${flyX}px`,
        '--fly-y': `${flyY}px`,
      }}
      onAnimationEnd={() => {
        if (onComplete) onComplete();
      }}
    >
      <div className={`bg-white rounded p-2 text-xl font-bold w-full h-full flex items-center justify-center ${
        isRed ? 'text-red-600' : 'text-black'
      }`}>
        {card.rank}{card.suit}
      </div>
    </div>
  );

  // Portal to body so it's not clipped by any overflow container
  if (typeof document !== 'undefined') {
    return createPortal(overlay, document.body);
  }
  return overlay;
}
