'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCardBack } from './CardBackContext';

/**
 * Animated card overlay that flies from one position to another.
 * Renders via portal to avoid clipping by overflow containers.
 *
 * @param {object} card - Card object { rank, suit, value }
 * @param {object} startRect - Source getBoundingClientRect() { top, left, width, height }
 * @param {object} endRect - Target getBoundingClientRect() { top, left }
 * @param {function} onComplete - Called when animation finishes
 * @param {boolean} faceDown - Show card back instead of face
 */
export default function FlyingCard({ card, startRect, endRect, onComplete, faceDown = false, className = 'flying-card' }) {
  const ref = useRef(null);
  const completedRef = useRef(false);
  const cardBack = useCardBack();

  // Guard: ensure onComplete fires exactly once, even if both
  // onAnimationEnd and the safety timeout trigger.
  const fireOnce = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (onComplete) onComplete();
  };

  useEffect(() => {
    completedRef.current = false;
    // Safety: if animation doesn't fire onAnimationEnd, clean up after timeout
    const timer = setTimeout(fireOnce, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!card || !startRect || !endRect) return null;

  const flyX = endRect.left - startRect.left;
  const flyY = endRect.top - startRect.top;

  const isRed = card.suit === '♥' || card.suit === '♦';

  // Use explicit pixel dimensions for reliable rendering during animation
  const w = startRect.width || 40;
  const h = startRect.height || 56;

  const overlay = (
    <div
      ref={ref}
      className={className}
      style={{
        top: startRect.top,
        left: startRect.left,
        width: w,
        height: h,
        '--fly-x': `${flyX}px`,
        '--fly-y': `${flyY}px`,
      }}
      onAnimationEnd={fireOnce}
    >
      {faceDown ? (
        <div
          className={`${cardBack.sceneImage ? '' : `${cardBack.bg} border-2 ${cardBack.border}`} rounded relative overflow-hidden`}
          style={{ width: w, height: h, ...(cardBack.sceneImage ? { backgroundColor: cardBack.bgHex || '#fef3c7' } : {}) }}
        >
          {cardBack.sceneImage ? (
            <img src={cardBack.sceneImage} alt="" className="absolute inset-0 w-full h-full object-contain rounded" draggable={false} />
          ) : (
            <>
              <div className="absolute inset-0 rounded" style={{ background: cardBack.pattern }} />
              {cardBack.sceneSvg ? (
                <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: cardBack.sceneSvg }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: '20px', lineHeight: 1 }}>
                  <span className={cardBack.iconColor}>{cardBack.centerIcon}</span>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className={`bg-white rounded p-2 text-xl font-bold w-full h-full flex items-center justify-center ${
          isRed ? 'text-red-600' : 'text-black'
        }`}>
          {card.rank}{card.suit}
        </div>
      )}
    </div>
  );

  // Portal to body so it's not clipped by any overflow container
  if (typeof document !== 'undefined') {
    return createPortal(overlay, document.body);
  }
  return overlay;
}
