'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';
import { useAuth } from '@/contexts/AuthContext';
import PlayingCard, { CutCard, PlayedCard } from '@/components/PlayingCard';
import DeckCut from '@/components/DeckCut';
import CribbageBoard from '@/components/CribbageBoard';
import ScoreSelector from '@/components/ScoreSelector';
import { GAME_PHASE } from '@/lib/multiplayer-game';

/**
 * Multiplayer Game wrapper component
 * Handles multiplayer-specific UI like opponent info, turn indicators, and polling
 */
export default function MultiplayerGame({ gameId, onExit }) {
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showAdminCancel, setShowAdminCancel] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastPlayAnnouncement, setLastPlayAnnouncement] = useState(null);
  const [newCardIndex, setNewCardIndex] = useState(-1);
  const [cutForDealerState, setCutForDealerState] = useState({ myCut: null, opponentCut: null, result: null });
  const [showPeggingSummary, setShowPeggingSummary] = useState(false);
  const prevPlayedCountRef = useRef(0);

  // Get current user for email display
  const { user } = useAuth();
  const userEmail = user?.attributes?.email || user?.username || '';

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

  // Handle admin cancel - deletes game entirely
  const handleAdminCancel = async () => {
    try {
      const response = await fetch(`/api/multiplayer/games/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin-cancel' })
      });
      const data = await response.json();
      if (data.success) {
        onExit();
      }
    } catch (err) {
      console.error('Admin cancel error:', err);
    }
    setShowAdminCancel(false);
  };

  const isAdmin = userEmail.toLowerCase() === 'chris@chrisk.com';

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

  // Handle cut for dealer
  const handleCutForDealer = async (position) => {
    setSubmitting(true);
    try {
      const result = await submitMove('cut-for-dealer', { cutPosition: position });
      if (result.success) {
        const gs = result.game?.gameState;
        const myKey = gameState?.myPlayerKey;
        if (gs?.cutForDealer) {
          const myCard = gs.cutForDealer[`${myKey}Card`];
          const opponentKey = myKey === 'player1' ? 'player2' : 'player1';
          const oppCard = gs.cutForDealer[`${opponentKey}Card`];
          setCutForDealerState(prev => ({
            myCut: myCard || prev.myCut,
            opponentCut: oppCard || prev.opponentCut,
            result: gs.cutForDealer?.dealer ? 'determined' : (gs.cutForDealer?.tied ? 'tied' : prev.result)
          }));
        }
      } else {
        console.error('Cut for dealer failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle acknowledge dealer
  const handleAcknowledgeDealer = async () => {
    setSubmitting(true);
    try {
      const result = await submitMove('acknowledge-dealer', {});
      if (!result.success) {
        console.error('Acknowledge failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deal (dealer clicks "Deal the cards")
  const handleDeal = async () => {
    setSubmitting(true);
    try {
      const result = await submitMove('deal', {});
      if (!result.success) {
        console.error('Deal failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Sync cut-for-dealer state from polling updates
  useEffect(() => {
    const gs = gameState?.gameState;
    if (!gs) return;

    if (gs.phase === GAME_PHASE.CUTTING_FOR_DEALER || gs.cutForDealer) {
      const myKey = gameState?.myPlayerKey;
      const opponentKey = myKey === 'player1' ? 'player2' : 'player1';
      const myCard = gs.cutForDealer?.[`${myKey}Card`];
      const oppCard = gs.cutForDealer?.[`${opponentKey}Card`];

      setCutForDealerState(prev => ({
        myCut: myCard || prev.myCut,
        opponentCut: oppCard || prev.opponentCut,
        result: gs.cutForDealer?.dealer ? 'determined' : (gs.cutForDealer?.tied ? 'tied' : prev.result)
      }));
    }
  }, [gameState?.gameState?.phase, gameState?.gameState?.cutForDealer]);

  // Reset cut-for-dealer state on tie (when cards are cleared)
  useEffect(() => {
    const gs = gameState?.gameState;
    if (gs?.cutForDealer?.tied && gs.cutForDealer.player1Card === null) {
      setCutForDealerState({ myCut: null, opponentCut: null, result: null });
    }
  }, [gameState?.gameState?.cutForDealer?.player1Card]);

  // Get playable cards during play phase
  const getPlayableCards = () => {
    const gs = gameState?.gameState;
    if (!gs || gs.phase !== GAME_PHASE.PLAYING) return [];

    const playerKey = gameState?.myPlayerKey;
    const playHand = gs.playState?.[`${playerKey}PlayHand`] || [];
    const currentCount = gs.playState?.currentCount || 0;

    return playHand.filter(card => {
      const cardValue = Math.min(card.value, 10);
      return currentCount + cardValue <= 31;
    });
  };

  // Check if player can play any card
  const canPlayAnyCard = () => {
    return getPlayableCards().length > 0;
  };

  // Check if card is playable
  const isCardPlayable = (card) => {
    const playable = getPlayableCards();
    return playable.some(c => c.suit === card.suit && c.rank === card.rank);
  };

  // Handle playing a card
  const handlePlayCard = async (card) => {
    if (!isMyTurn || submitting) return;
    if (!isCardPlayable(card)) return;

    setSubmitting(true);
    try {
      const result = await submitMove('play', { card });
      if (!result.success) {
        console.error('Play failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle saying "Go"
  const handleGo = async () => {
    if (!isMyTurn || submitting) return;

    setSubmitting(true);
    try {
      const result = await submitMove('go', {});
      if (!result.success) {
        console.error('Go failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle accepting a pending pegging score
  const handleAcceptPeggingScore = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitMove('accept-pegging-score', {});
      if (!result.success) {
        console.error('Accept pegging score failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle claiming a count score
  const handleClaimCount = async (claimedScore) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitMove('claim-count', { claimedScore });
      if (!result.success) {
        console.error('Claim count failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle verifying opponent's count
  const handleVerifyCount = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitMove('verify-count', {});
      if (!result.success) {
        console.error('Verify count failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle calling muggins
  const handleCallMuggins = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitMove('call-muggins', {});
      if (!result.success) {
        console.error('Call muggins failed:', result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Clear selected cards when phase changes
  useEffect(() => {
    setSelectedCards([]);
  }, [getCurrentPhase()]);

  // Detect new cards played for animation and announcements
  useEffect(() => {
    const playedCards = gameState?.gameState?.playState?.playedCards || [];
    const prevCount = prevPlayedCountRef.current;

    if (playedCards.length > prevCount && prevCount > 0) {
      const newestCard = playedCards[playedCards.length - 1];
      const isOpponentCard = newestCard.playedBy !== gameState?.myPlayerKey;

      // Animate the newest card
      setNewCardIndex(playedCards.length - 1);
      setTimeout(() => setNewCardIndex(-1), 800);

      // Show announcement for opponent plays
      if (isOpponentCard) {
        setLastPlayAnnouncement({
          card: newestCard,
          player: opponent?.username || 'Opponent',
        });
        setTimeout(() => setLastPlayAnnouncement(null), 2500);
      }
    }

    prevPlayedCountRef.current = playedCards.length;
  }, [gameState?.gameState?.playState?.playedCards?.length]);

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
    <div className="h-screen bg-green-800 flex flex-col">
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
          <span className="text-gray-400 text-sm">{userEmail}</span>
          {isAdmin && (
            <button
              onClick={() => setShowAdminCancel(true)}
              className="text-yellow-400 hover:text-yellow-300 text-sm font-bold"
            >
              Cancel Game
            </button>
          )}
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
      <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto p-4">
        {/* Turn indicator */}
        {getCurrentPhase() !== GAME_PHASE.CUTTING_FOR_DEALER && (
          <div className={`mb-4 px-6 py-3 rounded-full text-lg font-bold ${
            isMyTurn
              ? 'bg-green-600 text-white animate-pulse'
              : 'bg-gray-700 text-gray-300'
          }`}>
            {isMyTurn ? "Your Turn" : `Waiting for ${opponent?.username || 'opponent'}...`}
          </div>
        )}

        {/* Cribbage Board */}
        {getCurrentPhase() !== GAME_PHASE.CUTTING_FOR_DEALER && (
          <div className="w-full max-w-2xl mb-4">
            <CribbageBoard
              playerScore={gameState?.myScore || 0}
              computerScore={gameState?.opponentScore || 0}
              playerLabel="You"
              opponentLabel={opponent?.username || 'Opp'}
            />
          </div>
        )}

        {/* Game state display */}
        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="text-center text-white mb-4">
            <div className="text-2xl font-bold mb-2">Game #{gameId.slice(0, 8)}</div>
            <div className="text-gray-400">
              Score: You {gameState?.myScore || 0} - {gameState?.opponentScore || 0} {opponent?.username}
            </div>
            {gameState?.gameState?.dealer && getCurrentPhase() !== GAME_PHASE.CUTTING_FOR_DEALER && (
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

          {/* Pending Pegging Score Banner */}
          {gameState?.gameState?.pendingPeggingScore && (() => {
            const pending = gameState.gameState.pendingPeggingScore;
            const isMyScore = pending.player === gameState?.myPlayerKey;

            return (
              <div className="mb-4">
                <div className={`
                  w-full py-3 px-4 rounded-lg text-center
                  ${isMyScore ? 'bg-green-600/30 border-2 border-green-500' : 'bg-blue-600/30 border-2 border-blue-500'}
                  animate-pulse
                `}>
                  <div className="text-xl font-bold text-white">
                    {isMyScore ? 'You scored!' : `${opponent?.username} scored!`}
                  </div>
                  <div className={`text-lg font-semibold ${isMyScore ? 'text-green-300' : 'text-blue-300'}`}>
                    +{pending.points} points - {pending.reason}
                  </div>
                </div>

                {isMyScore ? (
                  <div className="text-center mt-3">
                    <Button
                      onClick={handleAcceptPeggingScore}
                      disabled={submitting}
                      className={`
                        px-8 py-4 text-xl font-bold rounded-lg
                        bg-green-600 hover:bg-green-700
                        shadow-lg transform hover:scale-105 transition-all
                        border-2 border-white/30
                      `}
                    >
                      {submitting ? 'Accepting...' : `Accept ${pending.points} Points`}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center mt-3 text-gray-400">
                    Waiting for {opponent?.username} to accept...
                  </div>
                )}
              </div>
            );
          })()}

          {/* Cut for Dealer Phase */}
          {getCurrentPhase() === GAME_PHASE.CUTTING_FOR_DEALER && (() => {
            const cutData = gameState?.gameState?.cutForDealer;
            const myKey = gameState?.myPlayerKey;
            const opponentKey = myKey === 'player1' ? 'player2' : 'player1';
            const dealerDetermined = !!cutData?.dealer;
            const iAmDealer = cutData?.dealer === myKey;
            const myAck = cutData?.[`${myKey}Acknowledged`];
            const oppAck = cutData?.[`${opponentKey}Acknowledged`];
            const bothAcknowledged = myAck && oppAck;

            return (
              <div className="mb-4">
                <div className="text-center text-white text-xl font-bold mb-4">
                  Cut for Dealer
                </div>

                {!dealerDetermined && (
                  <div className="text-center text-gray-400 mb-6">
                    Low card deals. Tap the deck to cut!
                  </div>
                )}

                {/* Side-by-side decks / cards */}
                {!dealerDetermined ? (
                  <div className="flex justify-center gap-8 sm:gap-12">
                    {/* My cut */}
                    <div className="text-center">
                      <div className="text-sm text-green-400 mb-2 font-medium">Your Cut</div>
                      {cutForDealerState.myCut ? (
                        <DeckCut
                          disabled={true}
                          label=""
                          revealedCard={cutForDealerState.myCut}
                          showCutAnimation={true}
                        />
                      ) : (
                        <DeckCut
                          onCut={handleCutForDealer}
                          disabled={submitting || cutForDealerState.myCut !== null}
                          label=""
                        />
                      )}
                    </div>

                    {/* Opponent's cut */}
                    <div className="text-center">
                      <div className="text-sm text-blue-400 mb-2 font-medium">{opponent?.username || 'Opponent'}'s Cut</div>
                      {cutForDealerState.opponentCut ? (
                        <DeckCut
                          disabled={true}
                          label=""
                          revealedCard={cutForDealerState.opponentCut}
                          showCutAnimation={true}
                        />
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-500 text-sm">
                            {cutForDealerState.myCut ? 'Waiting for opponent...' : 'Waiting...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Dealer determined - show both cards and result */
                  <div className="text-center">
                    <div className="flex justify-center gap-8 mb-4">
                      <div>
                        <div className="text-sm text-green-400 mb-1">You</div>
                        <div className={`w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-bold border-2 ${
                          iAmDealer ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-green-400'
                        } ${
                          cutForDealerState.myCut?.suit === '♥' || cutForDealerState.myCut?.suit === '♦' ? 'text-red-600' : 'text-black'
                        }`}>
                          <div>
                            <div>{cutForDealerState.myCut?.rank}</div>
                            <div>{cutForDealerState.myCut?.suit}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-400 text-2xl font-bold">vs</div>
                      <div>
                        <div className="text-sm text-blue-400 mb-1">{opponent?.username}</div>
                        <div className={`w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-bold border-2 ${
                          !iAmDealer ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-blue-400'
                        } ${
                          cutForDealerState.opponentCut?.suit === '♥' || cutForDealerState.opponentCut?.suit === '♦' ? 'text-red-600' : 'text-black'
                        }`}>
                          <div>
                            <div>{cutForDealerState.opponentCut?.rank}</div>
                            <div>{cutForDealerState.opponentCut?.suit}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-yellow-400 text-lg font-bold mb-4">
                      {iAmDealer ? 'You deal!' : `${opponent?.username} deals!`}
                    </div>

                    {/* Action buttons based on role */}
                    {!myAck && !iAmDealer && (
                      <Button
                        onClick={handleAcknowledgeDealer}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
                      >
                        {submitting ? 'Confirming...' : 'Confirm Dealer'}
                      </Button>
                    )}

                    {!myAck && iAmDealer && (
                      <Button
                        onClick={handleAcknowledgeDealer}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
                      >
                        {submitting ? 'Confirming...' : 'Confirm'}
                      </Button>
                    )}

                    {myAck && iAmDealer && !bothAcknowledged && (
                      <div className="text-gray-400">
                        Waiting for {opponent?.username} to confirm...
                      </div>
                    )}

                    {myAck && !iAmDealer && !bothAcknowledged && (
                      <div className="text-gray-400">
                        Waiting for {opponent?.username} to confirm...
                      </div>
                    )}

                    {bothAcknowledged && iAmDealer && (
                      <Button
                        onClick={handleDeal}
                        disabled={submitting}
                        className="bg-yellow-600 hover:bg-yellow-700 text-lg px-8 py-3 animate-pulse"
                      >
                        {submitting ? 'Dealing...' : 'Deal the Cards'}
                      </Button>
                    )}

                    {bothAcknowledged && !iAmDealer && (
                      <div className="text-gray-400">
                        Waiting for {opponent?.username} to deal...
                      </div>
                    )}
                  </div>
                )}

                {/* Tie message */}
                {cutForDealerState.result === 'tied' && !dealerDetermined && (
                  <div className="text-center mt-6">
                    <div className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-full text-lg font-bold animate-pulse">
                      Tied! Cut again!
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
          {getCurrentPhase() === GAME_PHASE.PLAYING && (() => {
            const playState = gameState?.gameState?.playState;
            const roundCards = playState?.roundCards || [];
            const allPlayedCards = playState?.playedCards || [];
            const currentCount = playState?.currentCount || 0;
            const myKey = gameState?.myPlayerKey;
            const opponentKey = myKey === 'player1' ? 'player2' : 'player1';
            const myPlayHand = playState?.[`${myKey}PlayHand`] || [];
            const opponentSaidGo = playState?.[`${opponentKey}Said`] === 'go';

            return (
              <div className="mb-4">
                {/* Opponent play announcement overlay */}
                {lastPlayAnnouncement && (
                  <div className="mb-3 text-center animate-bounce">
                    <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {lastPlayAnnouncement.player} played {lastPlayAnnouncement.card.rank}{lastPlayAnnouncement.card.suit}
                    </div>
                  </div>
                )}

                {/* Current count - large and prominent */}
                <div className="text-center mb-4">
                  <div className={`inline-block px-6 py-2 rounded-full ${
                    currentCount === 15 || currentCount === 31
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}>
                    <span className="text-gray-300 text-sm">Count </span>
                    <span className="text-3xl font-bold">{currentCount}</span>
                    <span className="text-gray-300 text-sm"> / 31</span>
                  </div>
                </div>

                {/* Card pile - overlapping face-up cards */}
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4 min-h-[90px]">
                  {roundCards.length > 0 ? (
                    <div className="flex justify-center items-end">
                      {roundCards.map((card, idx) => {
                        const isMyCard = card.playedBy === myKey;
                        const isNewest = idx === roundCards.length - 1;
                        const isRed = card.suit === '♥' || card.suit === '♦';
                        // Find this card's position in the allPlayedCards array for animation detection
                        const globalIdx = allPlayedCards.length - roundCards.length + idx;
                        const isAnimating = globalIdx === newCardIndex;

                        return (
                          <div
                            key={`${card.rank}${card.suit}-${idx}`}
                            className={`
                              relative transition-all duration-300
                              ${idx > 0 ? '-ml-6' : ''}
                              ${isAnimating ? 'animate-[slideUp_0.5s_ease-out]' : ''}
                              ${isNewest ? 'z-10 scale-110' : ''}
                            `}
                            style={{
                              zIndex: idx,
                              ...(isAnimating ? {} : {}),
                            }}
                          >
                            {/* Player indicator dot */}
                            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${
                              isMyCard ? 'bg-green-400' : 'bg-blue-400'
                            }`} />
                            {/* Card */}
                            <div className={`
                              bg-white rounded-lg px-2.5 py-1.5 font-bold text-lg shadow-md
                              border-2 ${isMyCard ? 'border-green-500' : 'border-blue-500'}
                              ${isRed ? 'text-red-600' : 'text-black'}
                              ${isNewest ? 'shadow-lg ring-2 ring-white/30' : ''}
                            `}>
                              {card.rank}{card.suit}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center text-sm py-3">No cards played yet</div>
                  )}
                  {/* Legend */}
                  {roundCards.length > 0 && (
                    <div className="flex justify-center gap-4 mt-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> You
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> {opponent?.username}
                      </span>
                    </div>
                  )}
                </div>

                {/* All played cards (previous rounds) */}
                {allPlayedCards.length > roundCards.length && (
                  <div className="text-center mb-3">
                    <div className="text-gray-500 text-xs">
                      Previous rounds: {allPlayedCards.length - roundCards.length} cards played
                    </div>
                  </div>
                )}

                {/* Opponent said Go indicator */}
                {opponentSaidGo && (
                  <div className="text-center mb-3">
                    <div className="inline-block bg-orange-600/80 text-white px-4 py-2 rounded-full text-sm font-bold">
                      {opponent?.username} said "Go" — play if you can!
                    </div>
                  </div>
                )}

                {/* Player's hand */}
                <div className="text-gray-400 text-sm text-center mb-2">
                  Your cards ({myPlayHand.length} remaining):
                </div>
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                  {myPlayHand.map((card, idx) => {
                    const playable = isCardPlayable(card);
                    const hasPending = !!gameState?.gameState?.pendingPeggingScore;
                    return (
                      <PlayingCard
                        key={`${card.rank}${card.suit}`}
                        card={card}
                        onClick={() => handlePlayCard(card)}
                        disabled={!isMyTurn || submitting || !playable || hasPending}
                        highlighted={isMyTurn && playable && !hasPending}
                      />
                    );
                  })}
                </div>

                {/* Action buttons */}
                {isMyTurn && !gameState?.gameState?.pendingPeggingScore && (
                  <div className="text-center">
                    {canPlayAnyCard() ? (
                      <div className="text-yellow-400 mb-2">
                        Tap a highlighted card to play it
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-red-400 mb-2">
                          No playable cards (would exceed 31)
                        </div>
                        <Button
                          onClick={handleGo}
                          disabled={submitting}
                          className="bg-orange-600 hover:bg-orange-700 text-lg px-6 py-3"
                        >
                          {submitting ? 'Saying Go...' : 'Say "Go"'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Counting Phase */}
          {getCurrentPhase() === GAME_PHASE.COUNTING && (
            <div className="text-center mb-4">
              <div className="text-white text-xl font-bold mb-2">Counting Phase</div>

              {(() => {
                const countingState = gameState?.gameState?.countingState || {};
                const countPhase = countingState.phase || 'nonDealer';
                const dealer = gameState?.gameState?.dealer;
                const isDealer = gameState?.myPlayerKey === dealer;
                const nonDealer = dealer === 'player1' ? 'player2' : 'player1';
                const handsScored = countingState.handsScored || [];
                const waitingForVerification = countingState.waitingForVerification;
                const claimedScore = countingState.claimedScore;
                const actualScore = countingState.actualScore;
                const countedHand = countingState.countedHand;

                let phaseLabel;
                if (countPhase === 'nonDealer') {
                  phaseLabel = isDealer ? `${opponent?.username}'s Hand` : 'Your Hand';
                } else if (countPhase === 'dealer') {
                  phaseLabel = isDealer ? 'Your Hand' : `${opponent?.username}'s Hand`;
                } else if (countPhase === 'crib') {
                  phaseLabel = 'Crib';
                }

                // Am I the counter for this sub-phase?
                const iAmCounter = (countPhase === 'nonDealer' && !isDealer) ||
                                   (countPhase === 'dealer' && isDealer) ||
                                   (countPhase === 'crib' && isDealer);

                return (
                  <>
                    <div className="text-yellow-400 mb-2">
                      Counting: {phaseLabel}
                    </div>

                    {/* Verification UI: opponent verifies the counter's claim */}
                    {waitingForVerification && !iAmCounter && isMyTurn ? (
                      <div className="mb-4">
                        <div className="text-white mb-2">
                          {opponent?.username} claims <span className="text-yellow-400 font-bold text-xl">{claimedScore}</span> points
                        </div>

                        {/* Show the hand being counted so verifier can check */}
                        {countedHand && (
                          <div className="mb-3">
                            <div className="text-gray-400 text-sm mb-1">Their hand:</div>
                            <div className="flex justify-center gap-2 flex-wrap">
                              {countedHand.map((card, idx) => (
                                <PlayingCard
                                  key={`verify-${card.rank}${card.suit}`}
                                  card={card}
                                  disabled={true}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-center gap-3 mt-3">
                          <Button
                            onClick={handleVerifyCount}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
                          >
                            {submitting ? 'Accepting...' : `Accept ${claimedScore}`}
                          </Button>
                          <Button
                            onClick={handleCallMuggins}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 text-lg px-6 py-3"
                          >
                            {submitting ? 'Calling...' : 'Muggins!'}
                          </Button>
                        </div>
                      </div>
                    ) : waitingForVerification && iAmCounter ? (
                      <div className="text-gray-400 mb-4">
                        You claimed {claimedScore} points. Waiting for {opponent?.username} to verify...
                      </div>
                    ) : iAmCounter && isMyTurn ? (
                      /* ScoreSelector for the counter */
                      <div className="mb-4">
                        <div className="text-gray-400 mb-3">
                          {countPhase === 'crib' ? 'Count the crib' : 'Count your hand'}
                        </div>

                        {/* Show hand being counted */}
                        <div className="mb-3">
                          <div className="flex justify-center gap-2 flex-wrap">
                            {countPhase === 'crib' ? (
                              gameState?.gameState?.crib?.map((card, idx) => (
                                <PlayingCard
                                  key={`crib-${card.rank}${card.suit}`}
                                  card={card}
                                  disabled={true}
                                />
                              ))
                            ) : (
                              getMyHand().map((card, idx) => (
                                <PlayingCard
                                  key={`${card.rank}${card.suit}`}
                                  card={card}
                                  disabled={true}
                                />
                              ))
                            )}
                          </div>
                        </div>

                        <ScoreSelector
                          onSelect={handleClaimCount}
                          disabled={submitting}
                        />
                      </div>
                    ) : (
                      <div className="text-gray-400 mb-4">
                        Waiting for {opponent?.username} to count...
                      </div>
                    )}

                    {/* Show previously counted hands */}
                    {handsScored.length > 0 && (
                      <div className="mt-4 bg-gray-700 rounded-lg p-4 text-left">
                        <div className="text-white font-bold mb-2">Scores This Round:</div>
                        {handsScored.map((scored, idx) => {
                          const isMyHand = scored.player === gameState?.myPlayerKey;
                          const label = scored.phase === 'crib' ? 'Crib' :
                                        (isMyHand ? 'Your Hand' : `${opponent?.username}'s Hand`);
                          return (
                            <div key={idx} className="mb-2">
                              <div className={`font-medium ${isMyHand ? 'text-green-400' : 'text-gray-300'}`}>
                                {label}: {scored.claimedScore !== undefined ? scored.claimedScore : scored.score} points
                                {scored.claimedScore !== undefined && scored.actualScore !== undefined && scored.claimedScore !== scored.actualScore && (
                                  <span className="text-yellow-400 text-sm ml-2">(actual: {scored.actualScore})</span>
                                )}
                              </div>
                              {scored.breakdown && scored.breakdown.length > 0 && (
                                <div className="text-gray-400 text-sm ml-4">
                                  {scored.breakdown.map((item, i) => (
                                    <div key={i}>{item}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pegging Summary Toggle */}
                    {(gameState?.gameState?.peggingHistory || []).length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowPeggingSummary(!showPeggingSummary)}
                          className="text-sm text-blue-400 hover:text-blue-300 underline"
                        >
                          {showPeggingSummary ? 'Hide' : 'Show'} Pegging Summary
                        </button>

                        {showPeggingSummary && (
                          <div className="mt-2 bg-gray-700 rounded-lg p-4 text-left max-h-48 overflow-y-auto">
                            <div className="text-white font-bold mb-2">Pegging History:</div>
                            {gameState.gameState.peggingHistory.map((event, idx) => {
                              const isMe = event.player === gameState?.myPlayerKey;
                              const name = isMe ? 'You' : (opponent?.username || 'Opp');

                              if (event.type === 'play') {
                                return (
                                  <div key={idx} className={`text-sm ${isMe ? 'text-green-400' : 'text-blue-400'}`}>
                                    {name} played {event.card} (count: {event.count})
                                    {event.points > 0 && <span className="text-yellow-400"> +{event.points} ({event.reason})</span>}
                                  </div>
                                );
                              } else if (event.type === 'go') {
                                return (
                                  <div key={idx} className={`text-sm ${isMe ? 'text-green-400' : 'text-blue-400'}`}>
                                    {name} said "Go" (count: {event.count})
                                  </div>
                                );
                              } else if (event.type === 'points') {
                                return (
                                  <div key={idx} className={`text-sm ${isMe ? 'text-green-400' : 'text-blue-400'}`}>
                                    {name}: +{event.points} ({event.reason})
                                  </div>
                                );
                              }
                              return null;
                            })}
                            <div className="mt-2 pt-2 border-t border-gray-600 text-sm">
                              <span className="text-green-400">Your pegging: {gameState?.gameState?.peggingPoints?.[gameState?.myPlayerKey] || 0}</span>
                              {' | '}
                              <span className="text-blue-400">{opponent?.username}: {gameState?.gameState?.peggingPoints?.[gameState?.myPlayerKey === 'player1' ? 'player2' : 'player1'] || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
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
                No
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

      {/* Admin cancel confirmation modal */}
      {showAdminCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-yellow-500">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Cancel Game (Admin)</h3>
            <p className="text-gray-300 mb-6">
              This will permanently delete this game. Both players will be returned to the menu and can start a new game.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowAdminCancel(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                No
              </Button>
              <Button
                onClick={handleAdminCancel}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Cancel Game
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
