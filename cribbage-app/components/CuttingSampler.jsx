'use client';

// CuttingSampler — Admin panel tab for previewing and selecting deck cut styles
// Wraps variants in CardBackContext so card back designs render outside the game

import { useState, useCallback } from 'react';
import { CardBackContext } from './CardBackContext';
import { pickCardBack } from '@/lib/cardBacks';
import { AngledDeck, SideEdgeDeck, IsometricDeck, BookOpenDeck } from './DeckCutVariants';
import DeckCut from './DeckCut';

const STYLE_KEY = 'cribbage-deckcut-style';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

function randomCard() {
  return {
    rank: RANKS[Math.floor(Math.random() * RANKS.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)],
  };
}

const VARIANTS = [
  { id: 'book-open', name: 'Book Open', description: 'Deck splits and top flips over to reveal card' },
  { id: 'classic', name: 'Classic', description: 'Current style — offset depth layers' },
  { id: 'angled', name: 'Angled Perspective', description: 'CSS 3D tilt with card-edge layers' },
  { id: 'side-edge', name: 'Side Edge', description: 'Visible card-edge band below face' },
  { id: 'isometric', name: 'Isometric', description: 'Clean offset stack with bounce reveal' },
];

function VariantPreview({ variant, isActive, onSelect }) {
  const [revealedCard, setRevealedCard] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleCut = useCallback(() => {
    const card = randomCard();
    setRevealedCard(card);
    setShowAnimation(true);
  }, []);

  const handleReset = () => {
    setRevealedCard(null);
    setShowAnimation(false);
  };

  const Component = variant.id === 'book-open' ? BookOpenDeck
    : variant.id === 'angled' ? AngledDeck
    : variant.id === 'side-edge' ? SideEdgeDeck
    : variant.id === 'isometric' ? IsometricDeck
    : DeckCut;

  return (
    <div className={`rounded-lg border-2 p-3 transition-all ${
      isActive ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-800/50'
    }`}>
      <div className="text-center mb-2">
        <div className="text-white text-sm font-bold">{variant.name}</div>
        <div className="text-gray-400 text-xs">{variant.description}</div>
      </div>

      <div className="flex justify-center" style={{ minHeight: 320 }}>
        <Component
          onCut={handleCut}
          disabled={false}
          label=""
          revealedCard={revealedCard}
          showCutAnimation={showAnimation}
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleReset}
          className="flex-1 text-xs py-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => onSelect(variant.id)}
          className={`flex-1 text-xs py-1.5 rounded transition-colors ${
            isActive
              ? 'bg-green-700 text-green-100'
              : 'bg-blue-700 text-blue-100 hover:bg-blue-600'
          }`}
        >
          {isActive ? '✓ Active' : 'Use This'}
        </button>
      </div>
    </div>
  );
}

export default function CuttingSampler() {
  const [cardBack, setCardBack] = useState(() => pickCardBack(Date.now()));
  const [activeStyle, setActiveStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STYLE_KEY) || 'classic';
    }
    return 'classic';
  });

  const shuffleCardBack = () => {
    setCardBack(pickCardBack(Date.now() + Math.random() * 100000));
  };

  const selectStyle = (id) => {
    setActiveStyle(id);
    localStorage.setItem(STYLE_KEY, id);
  };

  return (
    <CardBackContext.Provider value={cardBack}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-400 text-xs">
            Card back: <span className="text-white">{cardBack.name}</span>
          </div>
          <button
            onClick={shuffleCardBack}
            className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Shuffle Card Back
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VARIANTS.map(v => (
            <VariantPreview
              key={v.id}
              variant={v}
              isActive={activeStyle === v.id}
              onSelect={selectStyle}
            />
          ))}
        </div>

        <div className="text-gray-500 text-xs mt-3 text-center">
          Tap each deck to preview the cut animation — select your preferred style
        </div>
      </div>
    </CardBackContext.Provider>
  );
}
