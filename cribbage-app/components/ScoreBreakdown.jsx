// Score Breakdown Component
// Will be populated in Phase 4.4

/**
 * Displays detailed score breakdown
 * @param {Array} breakdown - Array of scoring descriptions
 * @param {number} total - Total score
 */
export default function ScoreBreakdown({ breakdown, total }) {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded p-4 mb-4">
        <div className="text-yellow-400 font-bold mb-2">Score Breakdown:</div>
        <div className="text-gray-400">No scoring combinations</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded p-4 mb-4">
      <div className="text-yellow-400 font-bold mb-2">Score Breakdown:</div>
      <div className="text-sm">
        {breakdown.map((item, idx) => (
          <div key={idx} className="text-green-300">{item}</div>
        ))}
        <div className="font-bold mt-2 text-white border-t border-gray-600 pt-2">
          Actual Total: {total} points
        </div>
      </div>
    </div>
  );
}
