// Game Actions - Single source of truth for what action the user needs to take
// This prevents "stuck" states where no button is visible

/**
 * Action types and their default labels
 */
export const GAME_ACTIONS = {
  menu: { type: 'menu_choice', label: null },
  cutting: { type: 'cut_deck', label: 'Tap deck to cut' },
  cutForStarter: { type: 'cut_starter', label: 'Tap to cut starter' },
  cribSelect: { type: 'select_cards', label: null }, // No button, user selects cards
  cribSelect_ready: { type: 'confirm_discard', label: 'Discard to Crib' },
  play_player_turn: { type: 'play_card', label: null }, // No button, user clicks card
  play_player_go: { type: 'say_go', label: 'Say "Go"' },
  play_accept_score: { type: 'accept_score', label: 'Accept Points' },
  play_waiting: { type: 'wait', label: null },
  counting_player_input: { type: 'enter_score', label: null }, // ScoreSelector handles this
  counting_player_continue: { type: 'continue', label: 'Continue' },
  counting_computer_verify: { type: 'verify', label: null }, // Multiple buttons
  counting_muggins_choice: { type: 'muggins_pref', label: null }, // Multiple buttons
  counting_waiting: { type: 'wait', label: null },
  gameOver: { type: 'game_over', label: 'Play Again' },
};

/**
 * Determine the current required action from game state
 * This is the single source of truth for what the user should do next
 *
 * @param {Object} state - Current game state
 * @returns {Object} Action object with type, label, and metadata
 */
export function getRequiredAction(state) {
  const {
    gameState,
    currentPlayer,
    selectedCards = [],
    playerHand = [],
    pendingScore,
    pendingCountContinue,
    counterIsComputer,
    actualScore,
    computerClaimedScore,
    playerMadeCountDecision,
    showMugginsPreferenceDialog,
    playerPlayHand = [],
    currentCount = 0,
    cutResultReady,
    dealer,
  } = state;

  switch (gameState) {
    case 'menu':
      return { ...GAME_ACTIONS.menu };

    case 'cutting':
      if (cutResultReady) {
        return { type: 'proceed_after_cut', label: 'Start Game' };
      }
      return { ...GAME_ACTIONS.cutting };

    case 'cutForStarter':
      // Non-dealer cuts the starter
      if (dealer === 'player') {
        // Computer cuts, user waits
        return { type: 'wait', label: null };
      }
      return { ...GAME_ACTIONS.cutForStarter };

    case 'cribSelect':
      if (selectedCards.length >= 2 && playerHand.length === 6) {
        return { ...GAME_ACTIONS.cribSelect_ready };
      }
      return {
        ...GAME_ACTIONS.cribSelect,
        detail: `Select ${2 - selectedCards.length} more card${2 - selectedCards.length !== 1 ? 's' : ''}`,
      };

    case 'play':
      if (pendingScore) {
        return {
          type: 'accept_score',
          label: `Accept ${pendingScore.points} Points`,
          pendingScore,
        };
      }
      if (currentPlayer !== 'player') {
        return { ...GAME_ACTIONS.play_waiting };
      }
      // Check if player can play any card
      const canPlay = playerPlayHand.some(c => currentCount + c.value <= 31);
      if (!canPlay && playerPlayHand.length > 0) {
        return { ...GAME_ACTIONS.play_player_go };
      }
      return { ...GAME_ACTIONS.play_player_turn };

    case 'counting':
      // Priority order matters here - check most specific conditions first

      // 1. Player needs to acknowledge their count result
      if (pendingCountContinue) {
        return {
          ...GAME_ACTIONS.counting_player_continue,
          pendingCountContinue,
        };
      }

      // 2. Muggins preference dialog is showing
      if (showMugginsPreferenceDialog) {
        return { ...GAME_ACTIONS.counting_muggins_choice };
      }

      // 3. Computer is counting and player needs to verify
      if (counterIsComputer) {
        if (computerClaimedScore !== null && !playerMadeCountDecision) {
          return {
            ...GAME_ACTIONS.counting_computer_verify,
            computerClaimedScore,
          };
        }
        // If actualScore is still set from player's previous count (restored game scenario),
        // show Continue button to clear it so computer can proceed
        if (actualScore) {
          return {
            ...GAME_ACTIONS.counting_player_continue,
            restoredGameRecovery: true,
          };
        }
        // Computer is processing
        return { ...GAME_ACTIONS.counting_waiting };
      }

      // 4. Player needs to enter their count
      if (!actualScore) {
        return { ...GAME_ACTIONS.counting_player_input };
      }

      // 5. Fallback - should have pendingCountContinue set, but just in case
      return {
        ...GAME_ACTIONS.counting_player_continue,
        fallback: true,
      };

    case 'gameOver':
      return { ...GAME_ACTIONS.gameOver };

    default:
      // Unknown state - provide a fallback
      return {
        type: 'unknown',
        label: 'Continue',
        warning: `Unknown game state: ${gameState}`,
      };
  }
}

/**
 * Check if the current action requires a visible button
 * (as opposed to clicking cards or waiting)
 */
export function actionRequiresButton(action) {
  const buttonTypes = [
    'confirm_discard',
    'accept_score',
    'say_go',
    'continue',
    'verify',
    'muggins_pref',
    'game_over',
    'proceed_after_cut',
  ];
  return buttonTypes.includes(action.type);
}

/**
 * Check if the user is potentially stuck (action required but might not be visible)
 */
export function isPotentiallyStuck(action, gameState) {
  if (!actionRequiresButton(action)) {
    return false;
  }

  // These are the problematic states where buttons can be off-screen
  const riskStates = ['counting', 'play'];
  return riskStates.includes(gameState);
}
