'use client';

// DeckCut Component — Lift-and-reveal deck cutting experience
// Shows a large card-back stack. On tap, top portion lifts to reveal cut card.

import { useState, useEffect } from 'react';
import { useCardBack } from './CardBackContext';
import { DeckCardFace, RevealedCard } from './DeckCutShared';
import { AngledDeck, SideEdgeDeck, IsometricDeck } from './DeckCutVariants';

// Re-export shared components for backward compatibility
export { DeckCardFace, RevealedCard } from './DeckCutShared';

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
  showCutAnimation = false,
  variant = 'classic'
}) {
  // Dispatch to variant components if not classic
  if (variant === 'angled') return <AngledDeck onCut={onCut} disabled={disabled} label={label} revealedCard={revealedCard} showCutAnimation={showCutAnimation} />;
  if (variant === 'side-edge') return <SideEdgeDeck onCut={onCut} disabled={disabled} label={label} revealedCard={revealedCard} showCutAnimation={showCutAnimation} />;
  if (variant === 'isometric') return <IsometricDeck onCut={onCut} disabled={disabled} label={label} revealedCard={revealedCard} showCutAnimation={showCutAnimation} />;
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
