'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { getRequiredAction, actionRequiresButton, isPotentiallyStuck } from '@/lib/gameActions';

/**
 * Hook that computes the required action and provides handlers
 * Single source of truth for "what should the user do now"
 *
 * @param {Object} gameState - All relevant game state
 * @param {Object} handlers - Action handler functions
 * @returns {Object} Required action with handler and metadata
 */
export function useRequiredAction(gameState, handlers) {
  const action = useMemo(() => {
    return getRequiredAction(gameState);
  }, [
    gameState.gameState,
    gameState.currentPlayer,
    gameState.selectedCards?.length,
    gameState.playerHand?.length,
    gameState.pendingScore,
    gameState.pendingCountContinue,
    gameState.counterIsComputer,
    gameState.actualScore,
    gameState.computerClaimedScore,
    gameState.playerMadeCountDecision,
    gameState.showMugginsPreferenceDialog,
    gameState.playerPlayHand?.length,
    gameState.currentCount,
    gameState.cutResultReady,
    gameState.dealer,
  ]);

  // Map action types to their handlers
  const handler = useMemo(() => {
    const handlerMap = {
      confirm_discard: handlers.discardToCrib,
      accept_score: handlers.acceptScoreAndContinue,
      continue: handlers.handleCountContinue,
      say_go: handlers.playerGo,
      game_over: handlers.resetGame,
      proceed_after_cut: handlers.proceedAfterCut,
      // Multi-button types don't have a single handler
      verify: null,
      muggins_pref: null,
      // No-button types
      menu_choice: null,
      cut_deck: null,
      cut_starter: null,
      select_cards: null,
      play_card: null,
      enter_score: null,
      wait: null,
    };
    return handlerMap[action.type] || null;
  }, [action.type, handlers]);

  return useMemo(() => ({
    ...action,
    handler,
    requiresButton: actionRequiresButton(action),
    isPotentiallyStuck: isPotentiallyStuck(action, gameState.gameState),
  }), [action, handler, gameState.gameState]);
}

/**
 * Hook that detects stuck states and provides fallback recovery
 *
 * @param {Object} requiredAction - The current required action
 * @param {Object} gameState - Current game state
 * @param {Function} onStuck - Callback when stuck state detected
 * @param {number} timeout - Milliseconds before considering user stuck (default 8000)
 */
export function useStuckDetection(requiredAction, gameState, onStuck, timeout = 8000) {
  const [stuckTimer, setStuckTimer] = useState(null);
  const [isStuck, setIsStuck] = useState(false);

  // Clear stuck state when action changes
  useEffect(() => {
    setIsStuck(false);
    if (stuckTimer) {
      clearTimeout(stuckTimer);
      setStuckTimer(null);
    }
  }, [requiredAction.type, gameState.gameState]);

  // Start timer when potentially stuck
  useEffect(() => {
    if (requiredAction.isPotentiallyStuck && !isStuck) {
      const timer = setTimeout(() => {
        setIsStuck(true);
        if (onStuck) {
          onStuck(requiredAction);
        }
      }, timeout);
      setStuckTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [requiredAction.isPotentiallyStuck, requiredAction.type, isStuck, timeout, onStuck]);

  const clearStuck = useCallback(() => {
    setIsStuck(false);
    if (stuckTimer) {
      clearTimeout(stuckTimer);
      setStuckTimer(null);
    }
  }, [stuckTimer]);

  return { isStuck, clearStuck };
}

/**
 * Development-mode hook that logs warnings for potential issues
 */
export function useActionDebug(requiredAction, gameState) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Warn on unknown states
    if (requiredAction.type === 'unknown') {
      console.error('[GameAction] UNKNOWN STATE:', {
        gameState: gameState.gameState,
        action: requiredAction,
      });
    }

    // Warn on fallback actions
    if (requiredAction.fallback) {
      console.warn('[GameAction] FALLBACK ACTION:', {
        gameState: gameState.gameState,
        action: requiredAction,
        hint: 'This state should have pendingCountContinue set',
      });
    }

    // Log action changes for debugging
    console.debug('[GameAction]', requiredAction.type, {
      label: requiredAction.label,
      requiresButton: requiredAction.requiresButton,
      gameState: gameState.gameState,
    });
  }, [requiredAction, gameState.gameState]);
}
