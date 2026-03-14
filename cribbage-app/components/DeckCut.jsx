'use client';

// DeckCut Component — Lift-and-reveal deck cutting experience
// Shows a large card-back stack. On tap, top portion lifts to reveal cut card.

import { useState, useEffect } from 'react';
import { useCardBack } from './CardBackContext';

/**
 * Renders the card back design at a custom size (larger than CardBack component supports).
 * Replicates the rendering logic from CardBack.jsx for all card types.
 */
function DeckCardFace({ width = 120, height = 168 }) {
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
function RevealedCard({ card, className = '' }) {
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

// Deck dimensions
const DECK_W = 120;
const DECK_H = 168;

/**
 * Visual deck that player can cut by tapping.
 * Shows a 3D card stack. On tap, top portion lifts to reveal the cut card.
 */
export default function DeckCut({
  onCut,
  disabled = false,
  label = '',
  revealedCard = null,
  showCutAnimation = false
}) {
  const [hasCut, setHasCut] = useState(false);
  const [liftPhase, setLiftPhase] = useState('idle'); // idle | lifting | lifted | fading | done
  const cardBack = useCardBack();

  // Reset when revealedCard is cleared (e.g., deck reset between dealer cuts)
  useEffect(() => {
    if (revealedCard === null && !showCutAnimation) {
      setHasCut(false);
      setLiftPhase('idle');
    }
  }, [revealedCard, showCutAnimation]);

  // When showCutAnimation is triggered externally (computer cut), start the lift
  useEffect(() => {
    if (showCutAnimation && !hasCut) {
      startCutAnimation();
    }
  }, [showCutAnimation]);

  const startCutAnimation = () => {
    setHasCut(true);
    setLiftPhase('lifting');
    // Lift phase: top portion rises
    setTimeout(() => setLiftPhase('lifted'), 50); // trigger CSS transition
    // Fade phase: lifted portion starts fading
    setTimeout(() => setLiftPhase('fading'), 600);
    // Done: lifted portion gone
    setTimeout(() => setLiftPhase('done'), 1000);
  };

  const handleDeckClick = () => {
    if (disabled || hasCut) return;
    startCutAnimation();
    // Trigger the onCut callback after a brief delay
    setTimeout(() => {
      if (onCut) onCut(0.4 + Math.random() * 0.2);
    }, 400);
  };

  const isLifted = liftPhase === 'lifted' || liftPhase === 'fading' || liftPhase === 'done';
  const showRevealedCard = hasCut && revealedCard;

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-sm text-gray-400 mb-3">{label}</div>}

      {/* Main container — holds deck + lifted portion + revealed card */}
      <div
        className="relative"
        style={{ width: DECK_W, height: DECK_H + 90 }}
      >
        {/* Lifted top portion — rises up and fades */}
        {hasCut && liftPhase !== 'idle' && liftPhase !== 'done' && (
          <div
            className="absolute left-0 z-20 pointer-events-none"
            style={{
              width: DECK_W,
              height: DECK_H,
              top: 0,
              transition: 'all 0.5s ease-out',
              transform: isLifted ? 'translateY(-70px) rotateZ(-6deg)' : 'translateY(0) rotateZ(0)',
              opacity: liftPhase === 'fading' ? 0 : (isLifted ? 0.7 : 1),
            }}
          >
            <DeckCardFace width={DECK_W} height={DECK_H} />
          </div>
        )}

        {/* Revealed card — fades in from the gap */}
        {showRevealedCard && (
          <div
            className="absolute z-30 flex justify-center"
            style={{
              left: (DECK_W - 80) / 2,
              top: 10,
              transition: 'all 0.4s ease-out',
              transitionDelay: '0.3s',
              opacity: isLifted ? 1 : 0,
              transform: isLifted ? 'scale(1)' : 'scale(0.85)',
            }}
          >
            <RevealedCard card={revealedCard} />
          </div>
        )}

        {/* Bottom deck — stays in place, shifts down slightly after cut */}
        <div
          onClick={handleDeckClick}
          className={`
            absolute left-0 transition-all duration-500
            ${disabled ? 'opacity-60 cursor-not-allowed' : hasCut ? '' : 'cursor-pointer active:scale-[0.97]'}
          `}
          style={{
            top: hasCut ? 130 : 0,
            width: DECK_W,
            height: DECK_H,
          }}
        >
          {/* 3D depth layers */}
          {[6, 5, 4, 3, 2, 1].map((i) => (
            <div
              key={i}
              className="absolute rounded-lg"
              style={{
                width: DECK_W,
                height: DECK_H,
                backgroundColor: cardBack.bgHex || '#333',
                border: `1px solid ${cardBack.borderHex || '#555'}`,
                top: `${i * 1.5}px`,
                left: `${i * 0.7}px`,
                opacity: 0.3 + i * 0.05,
                boxShadow: i === 6 ? '4px 6px 16px rgba(0,0,0,0.5)' : 'none',
              }}
            />
          ))}

          {/* Top card face */}
          <div className="absolute top-0 left-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <DeckCardFace width={DECK_W} height={DECK_H} />
          </div>

          {/* Tap prompt */}
          {!disabled && !hasCut && (
            <div className="absolute z-10 flex items-end justify-center pointer-events-none" style={{ top: 0, left: 0, width: DECK_W, height: DECK_H, paddingBottom: 8 }}>
              <div className="text-[10px] font-bold tracking-widest text-white/80 bg-black/40 px-3 py-1 rounded">
                TAP TO CUT
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
