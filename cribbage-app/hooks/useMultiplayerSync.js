'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for synchronizing multiplayer game state
 * Polls for updates when it's the opponent's turn
 */
export function useMultiplayerSync(gameId, isMyTurn) {
  const [gameState, setGameState] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(true);
  const pollIntervalRef = useRef(null);
  const lastPollRef = useRef(null);

  // Fetch game state
  const fetchGameState = useCallback(async () => {
    if (!gameId) return;

    try {
      const response = await fetch(`/api/multiplayer/games/${gameId}`);
      const data = await response.json();

      if (data.success) {
        setGameState(data.game);
        setOpponent(data.game.opponent);
        setError(null);

        // Check if opponent is connected (seen in last 2 minutes)
        if (data.game.opponent?.lastSeen) {
          const lastSeen = new Date(data.game.opponent.lastSeen);
          const secondsAgo = (Date.now() - lastSeen.getTime()) / 1000;
          setOpponentConnected(secondsAgo < 120);
        }

        lastPollRef.current = Date.now();
      } else {
        setError(data.error || 'Failed to fetch game state');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Submit a move
  const submitMove = useCallback(async (moveType, data) => {
    if (!gameId) return { success: false, error: 'No game ID' };

    try {
      const response = await fetch(`/api/multiplayer/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveType, data })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state immediately
        setGameState(prev => ({
          ...prev,
          ...result.game
        }));
      }

      return result;
    } catch (err) {
      return { success: false, error: 'Network error: ' + err.message };
    }
  }, [gameId]);

  // Start/stop polling based on whose turn it is
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Initial fetch
    fetchGameState();

    // Only poll when waiting for opponent
    if (!isMyTurn && gameId) {
      // Poll every 3 seconds when waiting for opponent
      pollIntervalRef.current = setInterval(() => {
        fetchGameState();
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [gameId, isMyTurn, fetchGameState]);

  // Forfeit the game
  const forfeitGame = useCallback(async () => {
    if (!gameId) return { success: false, error: 'No game ID' };

    try {
      const response = await fetch(`/api/multiplayer/games/${gameId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setGameState(prev => ({
          ...prev,
          status: 'abandoned'
        }));
      }

      return result;
    } catch (err) {
      return { success: false, error: 'Network error: ' + err.message };
    }
  }, [gameId]);

  return {
    gameState,
    opponent,
    loading,
    error,
    opponentConnected,
    isMyTurn: gameState?.isMyTurn ?? isMyTurn,
    submitMove,
    forfeitGame,
    refresh: fetchGameState
  };
}
