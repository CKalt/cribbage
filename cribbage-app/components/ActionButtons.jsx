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

  // Accept pending score - show reason prominently with strong visual indicator
  if (type === 'accept_score' && pendingScore) {
    // Extract card and scoring reason from the full reason string
    // Format: "Computer plays J♦ - pair for 2" or "You played 5♠ - fifteen for 2"
    const cardMatch = pendingScore.reason?.match(/^(?:You played |Computer plays )([^-]+)/);
    const cardPlayed = cardMatch ? cardMatch[1].trim() : null;
    const reasonText = pendingScore.reason?.replace(/^(You played |Computer plays )[^-]+ - /, '') || pendingScore.reason || '';
    const isPlayerScore = pendingScore.player === 'player';

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Card played + score banner - compact layout */}
        <div className={`
          w-full py-2 px-3 rounded-lg
          ${isPlayerScore ? 'bg-green-600/30 border-2 border-green-500' : 'bg-blue-600/30 border-2 border-blue-500'}
        `}>
          <div className="flex items-center justify-center gap-3">
            {/* Show the card that was played */}
            {cardPlayed && (
              <div className="bg-white text-black px-2 py-1 rounded font-bold text-lg shadow-md">
                {cardPlayed}
              </div>
            )}
            <div className="text-center">
              <div className="text-sm text-white">
                {isPlayerScore ? 'You played' : 'Computer played'}
              </div>
              <div className={`text-lg font-bold ${isPlayerScore ? 'text-green-300' : 'text-blue-300'}`}>
                +{pendingScore.points} pts - {reasonText}
              </div>
            </div>
          </div>
        </div>

        {/* Accept button */}
        <Button
          onClick={handlers.acceptScoreAndContinue}
          className={`
            px-6 py-3 text-lg font-bold rounded-lg
            ${isPlayerScore ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            shadow-lg border-2 border-white/30
          `}
        >
          ✓ Accept {pendingScore.points} Points
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
