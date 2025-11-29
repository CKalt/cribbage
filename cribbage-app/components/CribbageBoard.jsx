// Cribbage Board Component - Traditional 3-row layout with SVG
// Will be populated in Phase 4.1

import { Button } from '@/components/ui/button';

/**
 * Visual cribbage board with score pegs
 * @param {number} playerScore - Player's current score (0-121)
 * @param {number} computerScore - Computer's current score (0-121)
 * @param {function} onPegClick - Handler for manual score adjustment
 */
export default function CribbageBoard({ playerScore, computerScore, onPegClick }) {
  return (
    <div className="mb-6 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg p-4 shadow-xl">
      {/* Placeholder - SVG board will be implemented in Phase 4.1 */}
      <div className="text-center text-white">
        <p>Cribbage Board</p>
        <p>Player: {playerScore} | Computer: {computerScore}</p>
      </div>
    </div>
  );
}
