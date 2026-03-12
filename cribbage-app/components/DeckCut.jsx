'use client';

// DeckCut Component - Visual deck cutting with 3D card stack
// Uses the actual CardBack component for authentic rendering

import { useState, useRef, useEffect } from 'react';
import CardBack from './CardBack';

/**
 * Visual deck that player can cut by tapping
 */
export default function DeckCut({
  onCut,
  disabled = false,
  label = "Tap the deck to cut",
  revealedCard = null,
  showCutAnimation = false
}) {
  const [cutPosition, setCutPosition] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const deckRef = useRef(null);

  useEffect(() => {
    if (revealedCard === null && !showCutAnimation) {
      setCutPosition(null);
      setIsAnimating(false);
    }
  }, [revealedCard, showCutAnimation]);

  const showAnimation = isAnimating || showCutAnimation;
  const effectiveCutPosition = cutPosition !== null ? cutPosition : (showCutAnimation ? 0.5 : null);

  const handleDeckClick = () => {
    if (disabled || isAnimating || cutPosition !== null) return;
    const clampedPosition = 0.4 + Math.random() * 0.2; // Random cut near middle
    setCutPosition(clampedPosition);
    setIsAnimating(true);
    setTimeout(() => {
      if (onCut) onCut(clampedPosition);
    }, 300);
  };

  const hasCut = effectiveCutPosition !== null && showAnimation;

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-sm text-gray-400 mb-3">{label}</div>}

      {/* Deck container with 3D perspective */}
      <div
        className="relative"
        style={{ width: 96, height: 140, perspective: '800px' }}
      >
        {/* Cut-away top portion — slides up and rotates after cut */}
        {hasCut && (
          <div
            className="absolute inset-0 z-20 transition-all duration-700 ease-out pointer-events-none"
            style={{
              transform: 'translateY(-50px) rotateZ(-8deg) rotateX(10deg)',
              opacity: 0.6,
            }}
          >
            <CardBack size="lg" className="w-full h-full" />
          </div>
        )}

        {/* Revealed card — appears from the cut */}
        {revealedCard && hasCut && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center"
          >
            <div
              className={`
                w-20 h-28 rounded-lg shadow-2xl flex items-center justify-center
                border-2 border-yellow-400 bg-white
                animate-deck-card-reveal
                ${revealedCard.suit === '♥' || revealedCard.suit === '♦' ? 'text-red-600' : 'text-black'}
              `}
            >
              <div className="text-center">
                <div className="text-3xl font-bold">{revealedCard.rank}</div>
                <div className="text-2xl">{revealedCard.suit}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main deck — 3D stack using CSS transforms */}
        <div
          ref={deckRef}
          onClick={handleDeckClick}
          className={`
            absolute inset-0 transition-all duration-500
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            ${!disabled && !hasCut ? 'hover:scale-[1.03]' : ''}
            ${hasCut ? 'translate-y-3' : ''}
          `}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(5deg) rotateY(-3deg) ${hasCut ? 'translateY(12px)' : ''}`,
          }}
        >
          {/* Depth layers — offset cards behind the top to create 3D thickness */}
          {[5, 4, 3, 2, 1].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-lg bg-gray-800 border border-gray-600"
              style={{
                transform: `translateZ(${-i * 3}px) translateX(${i * 0.5}px) translateY(${i * 0.5}px)`,
                opacity: 0.4 + i * 0.08,
                boxShadow: i === 5 ? '3px 3px 12px rgba(0,0,0,0.5)' : 'none',
              }}
            />
          ))}

          {/* Top card — the actual card back design, full size */}
          <div className="absolute inset-0" style={{ transform: 'translateZ(0)' }}>
            <CardBack size="lg" className="w-full h-full" />
          </div>

          {/* Tap prompt overlay */}
          {!disabled && !hasCut && (
            <div className="absolute inset-0 z-10 flex items-end justify-center pb-2 pointer-events-none" style={{ transform: 'translateZ(1px)' }}>
              <div className="text-[10px] font-bold tracking-widest text-white/70 bg-black/40 px-2 py-0.5 rounded">
                TAP
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes deck-card-reveal {
          0% {
            transform: scale(0.3) rotateY(180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) rotateY(90deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotateY(0deg);
            opacity: 1;
          }
        }
        .animate-deck-card-reveal {
          animation: deck-card-reveal 0.6s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

/**
 * Side-by-side deck cuts for initial dealer determination
 */
export function DualDeckCut({
  onPlayerCut,
  playerCard,
  computerCard,
  disabled = false,
  message
}) {
  const [playerHasCut, setPlayerHasCut] = useState(false);
  const [showComputer, setShowComputer] = useState(false);

  const handlePlayerCut = (position) => {
    setPlayerHasCut(true);
    setTimeout(() => {
      setShowComputer(true);
      if (onPlayerCut) onPlayerCut(position);
    }, 800);
  };

  return (
    <div className="flex flex-col items-center">
      {message && (
        <div className="text-lg text-white mb-6">{message}</div>
      )}
      <div className="flex justify-center gap-10">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">Your cut</div>
          <DeckCut
            onCut={handlePlayerCut}
            disabled={disabled || playerHasCut}
            label=""
            revealedCard={playerCard}
            showCutAnimation={playerHasCut}
          />
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">Computer's cut</div>
          {showComputer ? (
            <DeckCut
              disabled={true}
              label=""
              revealedCard={computerCard}
              showCutAnimation={true}
            />
          ) : (
            <div style={{ height: 140 }} className="flex items-center justify-center">
              <div className="text-gray-600 text-sm">Waiting...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
