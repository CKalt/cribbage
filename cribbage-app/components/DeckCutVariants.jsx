'use client';

// DeckCut Variants — Three visual approaches to deck cutting
// Each variant uses DeckCardFace for the card back and RevealedCard for the cut card

import { useState, useEffect } from 'react';
import { useCardBack } from './CardBackContext';
import { DeckCardFace, RevealedCard } from './DeckCutShared';

// Shared lift animation hook
function useLiftAnimation({ revealedCard, showCutAnimation, onCut }) {
  const [hasCut, setHasCut] = useState(false);
  const [liftPhase, setLiftPhase] = useState('idle');

  useEffect(() => {
    if (revealedCard === null && !showCutAnimation) {
      setHasCut(false);
      setLiftPhase('idle');
    }
  }, [revealedCard, showCutAnimation]);

  useEffect(() => {
    if (showCutAnimation && !hasCut) {
      startCut();
    }
  }, [showCutAnimation]);

  const startCut = () => {
    setHasCut(true);
    setLiftPhase('lifting');
    setTimeout(() => setLiftPhase('lifted'), 50);
    setTimeout(() => setLiftPhase('fading'), 600);
    setTimeout(() => setLiftPhase('done'), 1000);
  };

  const handleClick = (disabled) => {
    if (disabled || hasCut) return;
    startCut();
    setTimeout(() => {
      if (onCut) onCut(0.4 + Math.random() * 0.2);
    }, 400);
  };

  const isLifted = liftPhase === 'lifted' || liftPhase === 'fading' || liftPhase === 'done';
  const showLifted = hasCut && liftPhase !== 'idle' && liftPhase !== 'done';
  const isFading = liftPhase === 'fading';

  return { hasCut, liftPhase, isLifted, showLifted, isFading, handleClick };
}

// ── Variant A: Angled Perspective ──────────────────────────────────────────

const ANGLED_W = 140;
const ANGLED_H = 196;

export function AngledDeck({
  onCut, disabled = false, label = '', revealedCard = null, showCutAnimation = false
}) {
  const cardBack = useCardBack();
  const { hasCut, isLifted, showLifted, isFading, handleClick } = useLiftAnimation({ revealedCard, showCutAnimation, onCut });

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-sm text-gray-400 mb-3">{label}</div>}

      <div className="relative" style={{ width: ANGLED_W + 30, height: ANGLED_H + 120, perspective: '800px' }}>

        {/* Lifted top portion */}
        {showLifted && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              width: ANGLED_W, height: ANGLED_H,
              left: 10, top: 0,
              transition: 'all 0.5s ease-out',
              transform: isLifted
                ? 'translateY(-80px) translateX(15px) rotateZ(-8deg) rotateX(25deg) rotateY(-8deg)'
                : 'rotateX(25deg) rotateY(-8deg)',
              opacity: isFading ? 0 : (isLifted ? 0.65 : 1),
            }}
          >
            <DeckCardFace width={ANGLED_W} height={ANGLED_H} />
          </div>
        )}

        {/* Revealed card */}
        {hasCut && revealedCard && (
          <div
            className="absolute z-30"
            style={{
              left: (ANGLED_W + 30 - 80) / 2,
              top: 20,
              transition: 'all 0.4s ease-out 0.3s',
              opacity: isLifted ? 1 : 0,
              transform: isLifted ? 'scale(1)' : 'scale(0.85)',
            }}
          >
            <RevealedCard card={revealedCard} />
          </div>
        )}

        {/* Main deck with 3D perspective */}
        <div
          onClick={() => handleClick(disabled)}
          className={`absolute transition-all duration-500 ${disabled ? 'opacity-60 cursor-not-allowed' : hasCut ? '' : 'cursor-pointer active:scale-[0.97]'}`}
          style={{
            left: 10,
            top: hasCut ? 140 : 10,
            width: ANGLED_W, height: ANGLED_H,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(25deg) rotateY(-8deg)',
          }}
        >
          {/* Card-edge depth layers */}
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-lg"
              style={{
                width: ANGLED_W, height: ANGLED_H,
                top: `${(14 - i) * 1}px`,
                left: `${(14 - i) * 0.3}px`,
                backgroundColor: '#f5f0e8',
                border: '1px solid #e0d8c8',
                boxShadow: i === 0 ? '6px 8px 20px rgba(0,0,0,0.5)' : 'none',
              }}
            />
          ))}
          {/* Top card */}
          <div className="absolute top-0 left-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <DeckCardFace width={ANGLED_W} height={ANGLED_H} />
          </div>
          {/* Tap prompt */}
          {!disabled && !hasCut && (
            <div className="absolute z-10 flex items-end justify-center pointer-events-none"
              style={{ top: 0, left: 0, width: ANGLED_W, height: ANGLED_H, paddingBottom: 8 }}>
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

// ── Variant B: Side-Edge Stack ─────────────────────────────────────────────

const SIDE_W = 130;
const SIDE_H = 182;
const EDGE_HEIGHT = 22;

export function SideEdgeDeck({
  onCut, disabled = false, label = '', revealedCard = null, showCutAnimation = false
}) {
  const cardBack = useCardBack();
  const { hasCut, isLifted, showLifted, isFading, handleClick } = useLiftAnimation({ revealedCard, showCutAnimation, onCut });

  const edgeStripes = Array.from({ length: 18 }).map((_, i) => ({
    color: i % 3 === 0 ? '#e8e0d0' : '#f5f0e8',
    height: i === 17 ? 2 : 1,
  }));

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-sm text-gray-400 mb-3">{label}</div>}

      <div className="relative" style={{ width: SIDE_W + 20, height: SIDE_H + EDGE_HEIGHT + 130 }}>

        {/* Lifted portion: card + top half of edge */}
        {showLifted && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: 10, top: 0,
              transition: 'all 0.5s ease-out',
              transform: isLifted ? 'translateY(-90px) rotateZ(-4deg)' : 'translateY(0)',
              opacity: isFading ? 0 : (isLifted ? 0.65 : 1),
            }}
          >
            <DeckCardFace width={SIDE_W} height={SIDE_H} />
            {/* Top half of card edge */}
            <div className="overflow-hidden rounded-b-lg" style={{ width: SIDE_W, height: EDGE_HEIGHT / 2 }}>
              {edgeStripes.slice(0, 9).map((s, i) => (
                <div key={i} style={{ height: s.height, backgroundColor: s.color }} />
              ))}
            </div>
          </div>
        )}

        {/* Revealed card */}
        {hasCut && revealedCard && (
          <div
            className="absolute z-30"
            style={{
              left: (SIDE_W + 20 - 80) / 2,
              top: 20,
              transition: 'all 0.4s ease-out 0.3s',
              opacity: isLifted ? 1 : 0,
              transform: isLifted ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
            }}
          >
            <RevealedCard card={revealedCard} />
          </div>
        )}

        {/* Bottom deck: card + full edge band */}
        <div
          onClick={() => handleClick(disabled)}
          className={`absolute transition-all duration-500 ${disabled ? 'opacity-60 cursor-not-allowed' : hasCut ? '' : 'cursor-pointer active:scale-[0.97]'}`}
          style={{
            left: 10,
            top: hasCut ? 140 : 10,
            width: SIDE_W,
          }}
        >
          {/* Card face */}
          <div style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
            <DeckCardFace width={SIDE_W} height={SIDE_H} />
          </div>
          {/* Card edge band */}
          <div
            className="overflow-hidden rounded-b-lg"
            style={{
              width: SIDE_W,
              height: EDGE_HEIGHT,
              boxShadow: '3px 8px 20px rgba(0,0,0,0.45)',
            }}
          >
            {edgeStripes.map((s, i) => (
              <div key={i} style={{ height: s.height, backgroundColor: s.color }} />
            ))}
          </div>
          {/* Tap prompt */}
          {!disabled && !hasCut && (
            <div className="flex justify-center mt-2">
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

// ── Variant C: Isometric Clean ─────────────────────────────────────────────

const ISO_W = 130;
const ISO_H = 182;
const ISO_LAYERS = 9;

export function IsometricDeck({
  onCut, disabled = false, label = '', revealedCard = null, showCutAnimation = false
}) {
  const cardBack = useCardBack();
  const { hasCut, isLifted, showLifted, isFading, handleClick } = useLiftAnimation({ revealedCard, showCutAnimation, onCut });

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-sm text-gray-400 mb-3">{label}</div>}

      <div className="relative" style={{ width: ISO_W + ISO_LAYERS * 2 + 20, height: ISO_H + ISO_LAYERS * 2 + 120 }}>

        {/* Lifted portion */}
        {showLifted && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: 10, top: 0,
              transition: 'all 0.5s ease-out',
              transform: isLifted ? 'translateY(-80px) translateX(10px) rotateZ(3deg)' : 'translateY(0)',
              opacity: isFading ? 0 : (isLifted ? 0.6 : 1),
            }}
          >
            <DeckCardFace width={ISO_W} height={ISO_H} />
          </div>
        )}

        {/* Revealed card with bounce */}
        {hasCut && revealedCard && (
          <div
            className="absolute z-30"
            style={{
              left: (ISO_W + ISO_LAYERS * 2 + 20 - 80) / 2,
              top: 15,
            }}
          >
            <div className={isLifted ? 'animate-iso-reveal' : 'opacity-0'}>
              <RevealedCard card={revealedCard} />
            </div>
          </div>
        )}

        {/* Isometric stack */}
        <div
          onClick={() => handleClick(disabled)}
          className={`absolute transition-all duration-500 ${disabled ? 'opacity-60 cursor-not-allowed' : hasCut ? '' : 'cursor-pointer active:scale-[0.97]'}`}
          style={{
            left: 10,
            top: hasCut ? 135 : 10,
          }}
        >
          {/* Offset shadow layers */}
          {Array.from({ length: ISO_LAYERS }).map((_, i) => {
            const layer = ISO_LAYERS - 1 - i;
            return (
              <div
                key={i}
                className="absolute rounded-lg"
                style={{
                  width: ISO_W, height: ISO_H,
                  top: `${layer * 2}px`,
                  left: `${layer * 2}px`,
                  backgroundColor: '#f5f0e8',
                  border: '1px solid #e0d8c8',
                  opacity: 0.3 + layer * 0.07,
                  boxShadow: i === 0 ? '4px 6px 20px rgba(0,0,0,0.45)' : 'none',
                }}
              />
            );
          })}
          {/* Top card */}
          <div className="absolute top-0 left-0" style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.25)' }}>
            <DeckCardFace width={ISO_W} height={ISO_H} />
          </div>
          {/* Tap prompt */}
          {!disabled && !hasCut && (
            <div className="absolute z-10 flex items-end justify-center pointer-events-none"
              style={{ top: 0, left: 0, width: ISO_W, height: ISO_H, paddingBottom: 8 }}>
              <div className="text-[10px] font-bold tracking-widest text-white/80 bg-black/40 px-3 py-1 rounded">
                TAP TO CUT
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes iso-reveal-bounce {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          80% { transform: scale(0.97); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-iso-reveal {
          animation: iso-reveal-bounce 0.5s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// ── Variant D: Book-Open Reveal ────────────────────────────────────────────

const BOOK_W = 150;
const BOOK_CARD_H = 100; // card face height (perspective-compressed)
const BOOK_EDGE_H = 28;  // full edge band height
const TOTAL_EDGE_STRIPES = 22;

function EdgeBand({ stripeCount, width = BOOK_W }) {
  return (
    <div className="overflow-hidden" style={{ width, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
      {Array.from({ length: stripeCount }).map((_, i) => (
        <div key={i} style={{
          height: i === stripeCount - 1 ? 2 : 1,
          backgroundColor: i % 3 === 0 ? '#d8d0c0' : '#f0eae0',
        }} />
      ))}
    </div>
  );
}

export function BookOpenDeck({
  onCut, disabled = false, label = '', revealedCard = null, showCutAnimation = false
}) {
  const cardBack = useCardBack();
  const [phase, setPhase] = useState('idle'); // idle | splitting | split | flipping | revealed
  const [splitPoint, setSplitPoint] = useState(0.5);

  // Reset when revealedCard cleared
  useEffect(() => {
    if (revealedCard === null && !showCutAnimation) {
      setPhase('idle');
    }
  }, [revealedCard, showCutAnimation]);

  // External trigger (computer cut)
  useEffect(() => {
    if (showCutAnimation && phase === 'idle') {
      startCut();
    }
  }, [showCutAnimation]);

  const startCut = () => {
    const sp = 0.3 + Math.random() * 0.4; // 30-70% split
    setSplitPoint(sp);
    setPhase('splitting');
    setTimeout(() => setPhase('split'), 50);
    setTimeout(() => setPhase('flipping'), 350);
    setTimeout(() => setPhase('revealed'), 1100);
  };

  const handleClick = () => {
    if (disabled || phase !== 'idle') return;
    startCut();
    setTimeout(() => {
      if (onCut) onCut(splitPoint);
    }, 400);
  };

  const topStripes = Math.round(splitPoint * TOTAL_EDGE_STRIPES);
  const bottomStripes = TOTAL_EDGE_STRIPES - topStripes;
  const isSplit = phase !== 'idle' && phase !== 'splitting';
  const isFlipping = phase === 'flipping' || phase === 'revealed';
  const isRevealed = phase === 'revealed';

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-sm text-gray-400 mb-3">{label}</div>}

      {/* 3D perspective container */}
      <div style={{ perspective: '1000px', perspectiveOrigin: 'center 30%', width: BOOK_W + 20, height: BOOK_CARD_H + BOOK_EDGE_H + 100 }}>

        {/* Top stack — only appears after split, rotates open like a book */}
        {(isSplit || isFlipping) && (
          <div
            className="relative"
            style={{
              width: BOOK_W,
              marginLeft: 10,
              transformStyle: 'preserve-3d',
              transformOrigin: 'bottom center',
              transition: isFlipping
                ? 'transform 0.7s ease-in-out'
                : 'transform 0.3s ease-out',
              transform: isFlipping
                ? 'rotateX(-180deg) translateY(-12px)'
                : 'translateY(-12px) rotateX(0deg)',
            }}
          >
            {/* Front face: card back + top edge stripes */}
            <div style={{ backfaceVisibility: 'hidden' }}>
              <div style={{
                width: BOOK_W,
                height: BOOK_CARD_H,
                transform: 'rotateX(20deg)',
                transformOrigin: 'bottom center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                <DeckCardFace width={BOOK_W} height={BOOK_CARD_H} />
              </div>
              <EdgeBand stripeCount={topStripes} />
            </div>

            {/* Back face: revealed card (pre-rotated 180 so it shows when flipped) */}
            <div style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
              position: 'absolute',
              top: 0, left: 0, right: 0,
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 4,
            }}>
              {revealedCard && (
                <RevealedCard card={revealedCard} />
              )}
            </div>
          </div>
        )}

        {/* Bottom stack — stays on the table */}
        <div
          onClick={handleClick}
          className={`relative ${disabled ? 'opacity-60 cursor-not-allowed' : phase === 'idle' ? 'cursor-pointer active:scale-[0.98]' : ''}`}
          style={{
            width: BOOK_W,
            marginLeft: 10,
            transition: 'margin-top 0.3s ease-out',
            marginTop: isSplit ? 8 : 0,
          }}
        >
          {/* Card back (top of bottom stack) — only visible before split */}
          {!isSplit && (
            <div style={{
              width: BOOK_W,
              height: BOOK_CARD_H,
              transform: 'rotateX(20deg)',
              transformOrigin: 'bottom center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <DeckCardFace width={BOOK_W} height={BOOK_CARD_H} />
            </div>
          )}

          {/* Edge band — full when unsplit, bottom portion when split */}
          <div style={{
            boxShadow: '3px 6px 16px rgba(0,0,0,0.4)',
            borderRadius: '0 0 4px 4px',
          }}>
            <EdgeBand stripeCount={isSplit ? bottomStripes : TOTAL_EDGE_STRIPES} />
          </div>

          {/* Tap prompt */}
          {!disabled && phase === 'idle' && (
            <div className="flex justify-center mt-2">
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
