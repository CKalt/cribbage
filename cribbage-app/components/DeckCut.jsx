'use client';

// DeckCut Component - Visual deck cutting experience

import { useState, useRef } from 'react';

/**
 * Visual deck that player can cut by tapping
 * @param {Function} onCut - Callback with cut position (0-1) and resulting card
 * @param {boolean} disabled - Whether cutting is disabled
 * @param {string} label - Label text (e.g., "Cut for dealer")
 * @param {Object} revealedCard - Card to show after cut (null before cut)
 * @param {boolean} showCutAnimation - Whether to show the cut animation
 */
export default function DeckCut({
  onCut,
  disabled = false,
  label = "Tap the deck to cut",
  revealedCard = null,
  showCutAnimation = false
}) {
  const [cutPosition, setCutPosition] = useState(showCutAnimation ? 0.5 : null); // 0-1 representing where user tapped
  const [isAnimating, setIsAnimating] = useState(showCutAnimation);
  const deckRef = useRef(null);

  const handleDeckClick = (e) => {
    if (disabled || isAnimating || cutPosition !== null) return;

    const rect = deckRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const position = clickY / rect.height; // 0 = top, 1 = bottom

    // Clamp to reasonable cut range (10%-90% of deck)
    const clampedPosition = Math.max(0.1, Math.min(0.9, position));

    setCutPosition(clampedPosition);
    setIsAnimating(true);

    // Trigger callback after animation starts
    setTimeout(() => {
      if (onCut) {
        onCut(clampedPosition);
      }
    }, 300);
  };

  // Calculate how many cards in top/bottom portions based on cut
  const topCards = cutPosition ? Math.round(cutPosition * 40) : 0;
  const bottomCards = cutPosition ? 40 - topCards : 40;

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-gray-400 mb-4">{label}</div>

      {/* Deck container */}
      <div className="relative h-64 flex flex-col items-center justify-center">

        {/* Top portion (after cut) */}
        {cutPosition !== null && (
          <div
            className={`
              absolute transition-all duration-500 ease-out
              ${isAnimating ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              top: '0px',
              transform: isAnimating ? 'translateY(-20px) rotate(-3deg)' : 'translateY(0)',
            }}
          >
            <div className="relative">
              {/* Stack of cards - top portion */}
              {Array.from({ length: Math.min(topCards, 15) }).map((_, i) => (
                <div
                  key={`top-${i}`}
                  className="absolute bg-blue-800 border border-blue-600 rounded-sm"
                  style={{
                    width: '80px',
                    height: '4px',
                    top: `${i * 2}px`,
                    left: `${i * 0.3}px`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Revealed card */}
        {revealedCard && (isAnimating || showCutAnimation) && (
          <div
            className="absolute z-10 transition-all duration-700 ease-out"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <div
              className={`
                w-20 h-28 bg-white rounded-lg shadow-xl
                flex items-center justify-center
                text-2xl font-bold
                border-2 border-yellow-400
                animate-card-reveal
                ${revealedCard.suit === '♥' || revealedCard.suit === '♦' ? 'text-red-600' : 'text-black'}
              `}
            >
              <div className="text-center">
                <div className="text-3xl">{revealedCard.rank}</div>
                <div className="text-2xl">{revealedCard.suit}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main deck / Bottom portion */}
        <div
          ref={deckRef}
          onClick={handleDeckClick}
          className={`
            relative cursor-pointer transition-all duration-300
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
            ${cutPosition !== null ? 'translate-y-8' : ''}
          `}
          style={{
            width: '100px',
            height: cutPosition !== null ? '80px' : '160px',
          }}
        >
          {/* Card stack visual */}
          {Array.from({ length: cutPosition !== null ? Math.min(bottomCards, 20) : 40 }).map((_, i) => (
            <div
              key={`card-${i}`}
              className={`
                absolute bg-gradient-to-br from-blue-700 to-blue-900
                border border-blue-500 rounded-sm
                ${!disabled && cutPosition === null ? 'hover:from-blue-600 hover:to-blue-800' : ''}
              `}
              style={{
                width: '80px',
                height: '4px',
                top: `${i * 3}px`,
                left: `${i * 0.5}px`,
                boxShadow: i === (cutPosition !== null ? Math.min(bottomCards, 20) : 40) - 1
                  ? '0 4px 8px rgba(0,0,0,0.4)'
                  : '0 1px 2px rgba(0,0,0,0.2)',
              }}
            />
          ))}

          {/* Deck back design overlay */}
          {cutPosition === null && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{ top: '40px' }}
            >
              <div className="text-blue-400 text-xs font-bold opacity-50">
                TAP TO CUT
              </div>
            </div>
          )}
        </div>

        {/* Cut indicator line on hover */}
        {!disabled && cutPosition === null && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute left-0 right-0 h-0.5 bg-yellow-400 opacity-0 hover:opacity-100 transition-opacity"
              style={{ top: '50%' }}
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      {cutPosition === null && !disabled && (
        <div className="text-xs text-gray-500 mt-4">
          Tap anywhere on the deck to cut
        </div>
      )}

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes card-reveal {
          0% {
            transform: translateY(-50%) scale(0.5) rotateY(180deg);
            opacity: 0;
          }
          50% {
            transform: translateY(-50%) scale(1.1) rotateY(90deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-50%) scale(1) rotateY(0deg);
            opacity: 1;
          }
        }

        .animate-card-reveal {
          animation: card-reveal 0.6s ease-out forwards;
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

    // Trigger computer cut after player
    setTimeout(() => {
      setShowComputer(true);
      if (onPlayerCut) {
        onPlayerCut(position);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col items-center">
      {message && (
        <div className="text-lg text-white mb-6">{message}</div>
      )}

      <div className="flex justify-center gap-12">
        {/* Player's cut */}
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

        {/* Computer's cut */}
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
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-600 text-sm">Waiting...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
