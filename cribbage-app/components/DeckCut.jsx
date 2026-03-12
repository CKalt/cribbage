'use client';

// DeckCut Component - Visual deck cutting experience
// Shows the card back design as a 3D-perspective card stack

import { useState, useRef, useEffect } from 'react';
import { useCardBack } from './CardBackContext';

/**
 * Renders a single card-back face for the deck stack
 */
function CardFace({ cardBack, width, height, className = '', style = {} }) {
  const isPainting = !!cardBack.sceneImage;
  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{
        width,
        height,
        backgroundColor: isPainting ? (cardBack.bgHex || '#fef3c7') : cardBack.bgHex,
        border: isPainting ? 'none' : `2px solid ${cardBack.borderHex}`,
        ...style,
      }}
    >
      {isPainting ? (
        <img
          src={cardBack.sceneImage}
          alt=""
          className="w-full h-full object-contain rounded-lg"
          draggable={false}
        />
      ) : cardBack.sceneSvg ? (
        <>
          <div className="absolute inset-0 rounded-lg" style={{ background: cardBack.pattern }} />
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: cardBack.sceneSvg }} />
        </>
      ) : (
        <>
          <div className="absolute inset-0 rounded-lg" style={{ background: cardBack.pattern }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="select-none"
              style={{
                fontSize: cardBack.centerIcon?.length > 1 ? '28px' : '20px',
                color: cardBack.borderHex,
                opacity: 0.9,
              }}
            >
              {cardBack.centerIcon}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

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
  const cardBack = useCardBack();

  useEffect(() => {
    if (revealedCard === null && !showCutAnimation) {
      setCutPosition(null);
      setIsAnimating(false);
    }
  }, [revealedCard, showCutAnimation]);

  const showAnimation = isAnimating || showCutAnimation;
  const effectiveCutPosition = cutPosition !== null ? cutPosition : (showCutAnimation ? 0.5 : null);

  const handleDeckClick = (e) => {
    if (disabled || isAnimating || cutPosition !== null) return;

    const rect = deckRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const position = clickY / rect.height;
    const clampedPosition = Math.max(0.1, Math.min(0.9, position));

    setCutPosition(clampedPosition);
    setIsAnimating(true);

    setTimeout(() => {
      if (onCut) onCut(clampedPosition);
    }, 300);
  };

  const CARD_W = 80;
  const CARD_H = 112;

  return (
    <div className="flex flex-col items-center">
      {label && <div className="text-sm text-gray-400 mb-3">{label}</div>}

      {/* Deck container */}
      <div className="relative" style={{ width: CARD_W + 20, height: CARD_H + 40, perspective: '600px' }}>

        {/* Top portion slides away after cut */}
        {effectiveCutPosition !== null && showAnimation && (
          <div
            className="absolute z-20 transition-all duration-500 ease-out"
            style={{
              top: '-30px',
              left: '-10px',
              transform: 'translateY(-10px) rotate(-5deg)',
              transformOrigin: 'center bottom',
            }}
          >
            <CardFace cardBack={cardBack} width={CARD_W} height={CARD_H} style={{ opacity: 0.7, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
          </div>
        )}

        {/* Revealed card */}
        {revealedCard && showAnimation && (
          <div
            className="absolute z-30 animate-card-reveal"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`
                rounded-lg shadow-xl flex items-center justify-center
                border-2 border-yellow-400 bg-white
                ${revealedCard.suit === '♥' || revealedCard.suit === '♦' ? 'text-red-600' : 'text-black'}
              `}
              style={{ width: CARD_W, height: CARD_H }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold">{revealedCard.rank}</div>
                <div className="text-2xl">{revealedCard.suit}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main deck — 3D card stack */}
        <div
          ref={deckRef}
          onClick={handleDeckClick}
          className={`
            absolute transition-all duration-300
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
            ${effectiveCutPosition !== null ? 'translate-y-4' : ''}
          `}
          style={{
            bottom: 0,
            left: '50%',
            transform: `translateX(-50%) ${effectiveCutPosition !== null ? 'translateY(16px)' : ''}`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Stack shadow layers behind the main card */}
          {[4, 3, 2, 1].map((i) => (
            <div
              key={i}
              className="absolute rounded-lg"
              style={{
                width: CARD_W,
                height: CARD_H,
                backgroundColor: cardBack.bgHex || '#333',
                border: `1px solid ${cardBack.borderHex || '#555'}`,
                top: `${-i * 2}px`,
                left: `${i * 1}px`,
                opacity: 0.5 + (i * 0.1),
                boxShadow: i === 4 ? '0 6px 20px rgba(0,0,0,0.4)' : 'none',
              }}
            />
          ))}

          {/* Top card — full card back design */}
          <div className="relative" style={{ width: CARD_W, height: CARD_H }}>
            <CardFace
              cardBack={cardBack}
              width={CARD_W}
              height={CARD_H}
              className="relative"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            />

            {/* Subtle tap prompt on the card */}
            {!disabled && effectiveCutPosition === null && (
              <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                <div
                  className="text-[9px] font-semibold tracking-wide opacity-60 px-2 py-0.5 rounded bg-black/30"
                  style={{ color: '#fff' }}
                >
                  TAP
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline styles for card reveal animation */}
      <style jsx>{`
        @keyframes card-reveal {
          0% {
            transform: translate(-50%, -50%) scale(0.5) rotateY(180deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1) rotateY(90deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotateY(0deg);
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

      <div className="flex justify-center gap-12">
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
            <div style={{ height: 152 }} className="flex items-center justify-center">
              <div className="text-gray-600 text-sm">Waiting...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
