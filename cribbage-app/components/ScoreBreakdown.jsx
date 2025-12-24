'use client';

// Score Breakdown Component

import { useState } from 'react';

/**
 * Displays detailed score breakdown during counting phase (collapsed by default)
 * @param {Object} actualScore - Score object with { score, breakdown }
 * @param {boolean} show - Whether to show the breakdown container
 */
export default function ScoreBreakdown({ actualScore, show = true }) {
  const [expanded, setExpanded] = useState(false);

  if (!show || !actualScore) return null;

  const { score, breakdown } = actualScore;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors rounded"
      >
        <span className="text-yellow-400 font-bold">
          Score Breakdown: {score} points
        </span>
        <span className="text-gray-400 text-sm">
          {expanded ? '▲ Hide' : '▼ Show Details'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 text-sm border-t border-gray-600">
          <div className="pt-3">
            {breakdown && breakdown.length > 0 ? (
              breakdown.map((item, idx) => (
                <div key={idx} className="text-green-300 py-1">{item}</div>
              ))
            ) : (
              <div className="text-gray-400">No scoring combinations</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Displays a simple score result message
 * @param {number} claimed - Points claimed
 * @param {number} actual - Actual points
 * @param {boolean} correct - Whether claim was correct
 */
export function ScoreResult({ claimed, actual, correct }) {
  if (correct) {
    return (
      <div className="text-green-400 font-bold">
        Correct! {claimed} points scored.
      </div>
    );
  }

  if (claimed > actual) {
    return (
      <div className="text-red-400 font-bold">
        Overcounted! Claimed {claimed} but actual is {actual}. No points awarded.
      </div>
    );
  }

  return (
    <div className="text-yellow-400 font-bold">
      Undercounted! Claimed {claimed} but could have scored {actual}. {claimed} points awarded.
    </div>
  );
}
