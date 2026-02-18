'use client';

import { useState, useEffect } from 'react';

// Score Selector Component - Visual grid for selecting hand/crib scores

// Valid cribbage scores: 0-24, 28, 29 (25, 26, 27 are impossible)
const IMPOSSIBLE_SCORES = [25, 26, 27];

/**
 * Visual score selector grid for counting phase
 * @param {Function} onSelect - Callback when score is selected (immediate commit)
 * @param {boolean} disabled - Whether selection is disabled
 */
export default function ScoreSelector({ onSelect, disabled = false }) {
  // Brief delay before accepting taps to prevent accidental submissions
  // when ScoreSelector appears right after tapping Continue (bug #73)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleScoreClick = (score) => {
    if (!ready || disabled || IMPOSSIBLE_SCORES.includes(score)) return;
    if (onSelect) {
      onSelect(score);
    }
  };

  // Generate scores 0-29 in a 6x5 grid
  const scores = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className={`flex flex-col items-center transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-50'}`}>
      <div className="text-sm text-gray-400 mb-3">
        {ready ? 'Tap your count:' : 'Count your hand...'}
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {scores.map((score) => {
          const isImpossible = IMPOSSIBLE_SCORES.includes(score);

          return (
            <button
              key={score}
              onClick={() => handleScoreClick(score)}
              disabled={disabled || isImpossible || !ready}
              className={`
                w-12 h-12 rounded-lg font-bold text-lg transition-all duration-150
                ${isImpossible
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-green-900 text-green-100 hover:bg-green-700 hover:scale-105 active:scale-95 active:bg-green-500'
                }
                ${(disabled || !ready) && !isImpossible ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {score}
            </button>
          );
        })}
      </div>

      {/* Hint text */}
      <div className="text-xs text-gray-500">
        Scores 25, 26, 27 are impossible in cribbage
      </div>
    </div>
  );
}
