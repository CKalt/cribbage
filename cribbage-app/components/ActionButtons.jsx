'use client';

// ActionButtons Component - Centralized action button rendering
// Prevents stuck states by ensuring action buttons are always rendered consistently

import { Button } from '@/components/ui/button';

/**
 * Renders the appropriate action button(s) based on the current required action
 * This is the single place where all game action buttons are rendered
 *
 * @param {Object} requiredAction - The current required action from useRequiredAction
 * @param {Object} handlers - All action handler functions
 * @param {Object} pendingScore - Pending score object (if any)
 * @param {number} computerClaimedScore - Computer's claimed score (if verifying)
 * @param {number} selectedCardsLength - Number of cards selected (for crib discard)
 */
export default function ActionButtons({
  requiredAction,
  handlers,
  pendingScore,
  computerClaimedScore,
  selectedCardsLength = 0,
}) {
  const { type, label } = requiredAction;

  // No button needed for these action types
  if (!type || type === 'wait' || type === 'menu_choice' || type === 'cut_deck' ||
      type === 'cut_starter' || type === 'select_cards' || type === 'play_card' ||
      type === 'enter_score' || type === 'unknown') {
    return null;
  }

  // Computer count verification - two buttons
  if (type === 'verify') {
    return (
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handlers.acceptComputerCount}
          className="bg-green-600 hover:bg-green-700 px-6 py-3"
        >
          Accept {computerClaimedScore}
        </Button>
        <Button
          onClick={handlers.objectToComputerCount}
          className="bg-red-600 hover:bg-red-700 px-6 py-3"
        >
          Muggins!
        </Button>
      </div>
    );
  }

  // Muggins preference choice - two buttons
  if (type === 'muggins_pref') {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-center text-yellow-300 mb-1">
          Wrong Muggins! Choose penalty:
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => handlers.handleMugginsPreferenceChoice('no-penalty')}
            className="bg-green-600 hover:bg-green-700"
          >
            No Penalty
          </Button>
          <Button
            onClick={() => handlers.handleMugginsPreferenceChoice('2-points')}
            className="bg-red-600 hover:bg-red-700"
          >
            2 Point Penalty
          </Button>
        </div>
      </div>
    );
  }

  // Accept pending score - show reason prominently
  if (type === 'accept_score' && pendingScore) {
    // Extract the scoring reason from the full reason string
    const reasonText = pendingScore.reason?.replace(/^(You played |Computer plays )[^-]+ - /, '') || '';
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-yellow-300 text-lg font-bold animate-pulse">
          {pendingScore.player === 'player' ? 'You scored!' : 'Computer scored!'} {reasonText}
        </div>
        <Button
          onClick={handlers.acceptScoreAndContinue}
          className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 text-lg font-bold"
        >
          Accept {pendingScore.points} Points
        </Button>
      </div>
    );
  }

  // Confirm crib discard
  if (type === 'confirm_discard') {
    return (
      <Button
        onClick={handlers.discardToCrib}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
      >
        Discard to Crib
      </Button>
    );
  }

  // Say Go in play phase
  if (type === 'say_go') {
    return (
      <Button
        onClick={handlers.playerGo}
        className="bg-red-600 hover:bg-red-700 px-6 py-3"
      >
        Say "Go"
      </Button>
    );
  }

  // Continue after counting
  if (type === 'continue') {
    return (
      <Button
        onClick={handlers.handleCountContinue}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
      >
        Continue
      </Button>
    );
  }

  // Game over - play again
  if (type === 'game_over') {
    return (
      <Button
        onClick={handlers.startNewGame}
        className="bg-green-600 hover:bg-green-700 px-6 py-3"
      >
        Play Again
      </Button>
    );
  }

  // Proceed after cut
  if (type === 'proceed_after_cut') {
    return (
      <Button
        onClick={handlers.proceedAfterCut}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
      >
        Start Game
      </Button>
    );
  }

  // Fallback - render with label if available
  if (label && requiredAction.handler) {
    return (
      <Button
        onClick={requiredAction.handler}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
      >
        {label}
      </Button>
    );
  }

  return null;
}
