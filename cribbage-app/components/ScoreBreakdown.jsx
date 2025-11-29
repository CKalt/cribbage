// Score Breakdown Component

/**
 * Displays detailed score breakdown during counting phase
 * @param {Object} actualScore - Score object with { score, breakdown }
 * @param {boolean} show - Whether to show the breakdown
 */
export default function ScoreBreakdown({ actualScore, show = true }) {
  if (!show || !actualScore) return null;

  const { score, breakdown } = actualScore;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded p-4 mb-4">
      <div className="text-yellow-400 font-bold mb-2">Score Breakdown:</div>
      <div className="text-sm">
        {breakdown && breakdown.length > 0 ? (
          breakdown.map((item, idx) => (
            <div key={idx} className="text-green-300">{item}</div>
          ))
        ) : (
          <div className="text-gray-400">No scoring combinations</div>
        )}
        <div className="font-bold mt-2 text-white border-t border-gray-600 pt-2">
          Actual Total: {score} points
        </div>
      </div>
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
