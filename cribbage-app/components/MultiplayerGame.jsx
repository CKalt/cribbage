'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';
import PlayingCard, { CutCard, PlayedCard } from '@/components/PlayingCard';
import { GAME_PHASE } from '@/lib/multiplayer-game';

/**
 * Multiplayer Game wrapper component
 * Handles multiplayer-specific UI like opponent info, turn indicators, and polling
 */
export default function MultiplayerGame({ gameId, onExit }) {
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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

  // Get player's hand from game state
  const getMyHand = () => {
    const gs = gameState?.gameState;
    if (!gs) return [];
    const playerKey = gameState?.myPlayerKey;
    return gs[`${playerKey}Hand`] || [];
  };

  // Check if player has already discarded
  const hasDiscarded = () => {
    const gs = gameState?.gameState;
    if (!gs) return false;
    const playerKey = gameState?.myPlayerKey;
    return (gs[`${playerKey}Discards`] || []).length > 0;
  };

  // Get current phase
  const getCurrentPhase = () => {
    return gameState?.gameState?.phase || 'unknown';
  };

  // Handle card selection for discard
  const handleCardClick = (card) => {
    if (submitting) return;

    const isSelected = selectedCards.some(
      c => c.suit === card.suit && c.rank === card.rank
    );

    if (isSelected) {
      setSelectedCards(selectedCards.filter(
        c => !(c.suit === card.suit && c.rank === card.rank)
      ));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  // Handle discard submission
  const handleDiscard = async () => {
    if (selectedCards.length !== 2) return;

    setSubmitting(true);
    try {
      const result = await submitMove('discard', { cards: selectedCards });
      if (result.success) {
        setSelectedCards([]);
      } else {
        console.error('Discard failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cut
  const handleCut = async () => {
    setSubmitting(true);
    try {
      const result = await submitMove('cut', { cutIndex: Math.floor(Math.random() * 40) });
      if (!result.success) {
        console.error('Cut failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Clear selected cards when phase changes
  useEffect(() => {
    setSelectedCards([]);
  }, [getCurrentPhase()]);

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

        {/* Game state display */}
        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="text-center text-white mb-4">
            <div className="text-2xl font-bold mb-2">Game #{gameId.slice(0, 8)}</div>
            <div className="text-gray-400">
              Score: You {gameState?.myScore || 0} - {gameState?.opponentScore || 0} {opponent?.username}
            </div>
            {gameState?.gameState?.dealer && (
              <div className="text-sm text-yellow-400 mt-1">
                Dealer: {gameState.gameState.dealer === gameState.myPlayerKey ? 'You' : opponent?.username}
              </div>
            )}
          </div>

          {/* Last move info */}
          {gameState?.lastMove?.description && (
            <div className="bg-gray-700 rounded p-3 mb-4">
              <div className="text-gray-400 text-sm">Last move:</div>
              <div className="text-white">{gameState.lastMove.description}</div>
            </div>
          )}

          {/* Cut Card Display */}
          {gameState?.gameState?.cutCard && (
            <div className="text-center mb-4">
              <div className="text-gray-400 text-sm mb-1">Cut Card</div>
              <CutCard card={gameState.gameState.cutCard} />
            </div>
          )}

          {/* Phase-specific content */}
          {getCurrentPhase() === GAME_PHASE.DISCARDING && (
            <div className="mb-4">
              {hasDiscarded() ? (
                <div className="text-center text-green-400 py-4">
                  ✓ You've discarded. Waiting for {opponent?.username}...
                </div>
              ) : (
                <>
                  <div className="text-center text-white mb-3">
                    Select 2 cards to discard to the{' '}
                    <span className={gameState?.gameState?.dealer === gameState?.myPlayerKey ? 'text-green-400' : 'text-yellow-400'}>
                      {gameState?.gameState?.dealer === gameState?.myPlayerKey ? 'your crib' : "opponent's crib"}
                    </span>
                  </div>

                  {/* Player's Hand */}
                  <div className="flex justify-center gap-2 flex-wrap mb-4">
                    {getMyHand().map((card, idx) => {
                      const isSelected = selectedCards.some(
                        c => c.suit === card.suit && c.rank === card.rank
                      );
                      return (
                        <PlayingCard
                          key={`${card.rank}${card.suit}`}
                          card={card}
                          selected={isSelected}
                          onClick={() => handleCardClick(card)}
                          disabled={submitting}
                        />
                      );
                    })}
                  </div>

                  {/* Discard Button */}
                  <div className="text-center">
                    <Button
                      onClick={handleDiscard}
                      disabled={selectedCards.length !== 2 || submitting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Discarding...' : `Discard ${selectedCards.length}/2 cards`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cut Phase */}
          {getCurrentPhase() === GAME_PHASE.CUT && (
            <div className="text-center mb-4">
              {isMyTurn ? (
                <>
                  <div className="text-white mb-3">Tap the deck to cut</div>
                  <Button
                    onClick={handleCut}
                    disabled={submitting}
                    className="bg-yellow-600 hover:bg-yellow-700 text-lg px-8 py-4"
                  >
                    {submitting ? 'Cutting...' : '🎴 Cut Deck'}
                  </Button>
                </>
              ) : (
                <div className="text-gray-400">
                  Waiting for {opponent?.username} to cut...
                </div>
              )}
            </div>
          )}

          {/* Playing Phase */}
          {getCurrentPhase() === GAME_PHASE.PLAYING && (
            <div className="mb-4">
              {/* Current count */}
              <div className="text-center mb-3">
                <span className="text-gray-400">Count: </span>
                <span className="text-2xl text-white font-bold">
                  {gameState?.gameState?.playState?.currentCount || 0}
                </span>
                <span className="text-gray-400"> / 31</span>
              </div>

              {/* Played cards this round */}
              {gameState?.gameState?.playState?.roundCards?.length > 0 && (
                <div className="flex justify-center gap-1 mb-3">
                  {gameState.gameState.playState.roundCards.map((card, idx) => (
                    <PlayedCard key={idx} card={card} />
                  ))}
                </div>
              )}

              {/* Player's hand (remaining cards) */}
              <div className="text-gray-400 text-sm text-center mb-2">Your cards:</div>
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {(gameState?.gameState?.playState?.[`${gameState?.myPlayerKey}PlayHand`] || []).map((card, idx) => (
                  <PlayingCard
                    key={`${card.rank}${card.suit}`}
                    card={card}
                    onClick={() => {/* TODO: handle play */}}
                    disabled={!isMyTurn || submitting}
                  />
                ))}
              </div>

              {isMyTurn && (
                <div className="text-center text-yellow-400">
                  Play a card or say "Go"
                </div>
              )}
            </div>
          )}

          {/* Counting Phase */}
          {getCurrentPhase() === GAME_PHASE.COUNTING && (
            <div className="text-center mb-4">
              <div className="text-white mb-2">Counting Phase</div>
              <div className="text-gray-400">
                {isMyTurn ? 'Your turn to count' : `Waiting for ${opponent?.username} to count...`}
              </div>

              {/* Show hand */}
              <div className="flex justify-center gap-2 flex-wrap mt-4">
                {getMyHand().map((card, idx) => (
                  <PlayingCard
                    key={`${card.rank}${card.suit}`}
                    card={card}
                    disabled={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Game phase indicator */}
          <div className="text-center text-gray-500 text-sm mt-4">
            Phase: {getCurrentPhase()}
          </div>
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
