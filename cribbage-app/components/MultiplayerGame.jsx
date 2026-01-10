'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';

/**
 * Multiplayer Game wrapper component
 * Handles multiplayer-specific UI like opponent info, turn indicators, and polling
 */
export default function MultiplayerGame({ gameId, onExit }) {
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  const {
    gameState,
    opponent,
    loading,
    error,
    opponentConnected,
    isMyTurn,
    submitMove,
    forfeitGame,
    refresh
  } = useMultiplayerSync(gameId, false);

  // Handle forfeit
  const handleForfeit = async () => {
    const result = await forfeitGame();
    if (result.success) {
      onExit();
    }
    setShowForfeitConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-xl">Error: {error}</div>
        <Button onClick={onExit} className="bg-gray-600 hover:bg-gray-700">
          Back to Menu
        </Button>
      </div>
    );
  }

  // Game completed
  if (gameState?.status === 'completed' || gameState?.status === 'abandoned') {
    const isWinner = gameState?.winner === gameState?.myPlayerKey;
    const isForfeit = gameState?.status === 'abandoned';

    return (
      <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center gap-6">
        <div className={`text-4xl font-bold ${isWinner ? 'text-yellow-400' : 'text-gray-400'}`}>
          {isForfeit ? (
            isWinner ? 'Opponent Forfeited!' : 'Game Forfeited'
          ) : (
            isWinner ? 'You Win!' : 'You Lose'
          )}
        </div>
        <div className="text-white text-xl">
          Final Score: You {gameState?.myScore} - {gameState?.opponentScore} {opponent?.username}
        </div>
        <Button onClick={onExit} className="bg-blue-600 hover:bg-blue-700 text-lg px-6 py-3">
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-800 flex flex-col">
      {/* Top bar - Opponent info */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${opponentConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
          <div className="text-white">
            <span className="font-medium">{opponent?.username || 'Opponent'}</span>
            <span className="text-gray-400 ml-2">({gameState?.opponentScore || 0} pts)</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowForfeitConfirm(true)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Forfeit
          </button>
          <button
            onClick={onExit}
            className="text-gray-400 hover:text-white text-sm"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Turn indicator */}
        <div className={`mb-6 px-6 py-3 rounded-full text-lg font-bold ${
          isMyTurn
            ? 'bg-green-600 text-white animate-pulse'
            : 'bg-gray-700 text-gray-300'
        }`}>
          {isMyTurn ? "Your Turn" : `Waiting for ${opponent?.username || 'opponent'}...`}
        </div>

        {/* Game state display - placeholder for now */}
        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="text-center text-white mb-4">
            <div className="text-2xl font-bold mb-2">Game #{gameId.slice(0, 8)}</div>
            <div className="text-gray-400">
              Score: You {gameState?.myScore || 0} - {gameState?.opponentScore || 0} {opponent?.username}
            </div>
          </div>

          {/* Last move info */}
          {gameState?.lastMove?.description && (
            <div className="bg-gray-700 rounded p-3 mb-4">
              <div className="text-gray-400 text-sm">Last move:</div>
              <div className="text-white">{gameState.lastMove.description}</div>
            </div>
          )}

          {/* Game phase info */}
          {gameState?.gameState?.phase && (
            <div className="text-gray-400 text-center">
              Phase: {gameState.gameState.phase}
            </div>
          )}

          {/* Placeholder for full game integration */}
          <div className="mt-6 p-4 border-2 border-dashed border-gray-600 rounded text-center text-gray-500">
            Full game UI will be integrated here.
            <br />
            <span className="text-sm">
              (Player list, invite, and lobby are working. Game play integration in progress.)
            </span>
          </div>

          {/* Temporary test buttons */}
          {isMyTurn && (
            <div className="mt-4 flex justify-center gap-3">
              <Button
                onClick={async () => {
                  const result = await submitMove('sync_state', {
                    gameState: {
                      phase: 'test',
                      testMove: Date.now()
                    },
                    description: 'Test move submitted'
                  });
                  if (!result.success) {
                    console.error('Move failed:', result.error);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Make Test Move
              </Button>
            </div>
          )}
        </div>

        {/* Opponent status */}
        {!isMyTurn && !opponentConnected && (
          <div className="mt-4 text-yellow-400 text-sm">
            Opponent appears to be offline. They'll see your moves when they return.
          </div>
        )}
      </div>

      {/* Bottom bar - Your info */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <div className="text-white">
          <span className="font-medium">You</span>
          <span className="text-green-400 ml-2">({gameState?.myScore || 0} pts)</span>
        </div>
        <Button onClick={refresh} className="bg-gray-700 hover:bg-gray-600 text-sm">
          Refresh
        </Button>
      </div>

      {/* Forfeit confirmation modal */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Forfeit Game?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to forfeit? Your opponent will win the game.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowForfeitConfirm(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleForfeit}
                className="bg-red-600 hover:bg-red-700"
              >
                Forfeit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
