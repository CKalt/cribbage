'use client';

// Score Selector Component - Visual grid for selecting hand/crib scores

// Valid cribbage scores: 0-24, 28, 29 (25, 26, 27 are impossible)
const IMPOSSIBLE_SCORES = [25, 26, 27];

/**
 * Visual score selector grid for counting phase
 * @param {Function} onSelect - Callback when score is selected (immediate commit)
 * @param {boolean} disabled - Whether selection is disabled
 */
export default function ScoreSelector({ onSelect, disabled = false }) {
  const handleScoreClick = (score) => {
    if (disabled || IMPOSSIBLE_SCORES.includes(score)) return;
    if (onSelect) {
      onSelect(score);
    }
  };

  // Generate scores 0-29 in a 6x5 grid
  const scores = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-gray-400 mb-3">Tap your count:</div>

      {/* Score grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {scores.map((score) => {
          const isImpossible = IMPOSSIBLE_SCORES.includes(score);

          return (
            <button
              key={score}
              onClick={() => handleScoreClick(score)}
              disabled={disabled || isImpossible}
              className={`
                w-12 h-12 rounded-lg font-bold text-lg transition-all duration-150
                ${isImpossible
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-green-900 text-green-100 hover:bg-green-700 hover:scale-105 active:scale-95 active:bg-green-500'
                }
                ${disabled && !isImpossible ? 'opacity-50 cursor-not-allowed' : ''}
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
