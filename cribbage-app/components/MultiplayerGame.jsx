'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';
import { useAuth } from '@/contexts/AuthContext';
import PlayingCard, { CutCard, PlayedCard } from '@/components/PlayingCard';
import DeckCut from '@/components/DeckCut';
import CribbageBoard from '@/components/CribbageBoard';
import ScoreSelector from '@/components/ScoreSelector';
import FlyingCard from '@/components/FlyingCard';
import { GAME_PHASE } from '@/lib/multiplayer-game';

/**
 * Multiplayer Game wrapper component
 * Handles multiplayer-specific UI like opponent info, turn indicators, and polling
 */
export default function MultiplayerGame({ gameId, onExit }) {
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showAdminCancel, setShowAdminCancel] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [peggingSelectedCard, setPeggingSelectedCard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastPlayAnnouncement, setLastPlayAnnouncement] = useState(null);
  const [cutForDealerState, setCutForDealerState] = useState({ myCut: null, opponentCut: null, result: null });
  const [showPeggingSummary, setShowPeggingSummary] = useState(false);

  // Animation state
  const [flyingCard, setFlyingCard] = useState(null);
  const [discardingCards, setDiscardingCards] = useState([]);
  const [cribCardsInPile, setCribCardsInPile] = useState(0);
  const [landingCardIndex, setLandingCardIndex] = useState(null);
  const [landingIsOpponent, setLandingIsOpponent] = useState(false);
  const [pendingOpponentPlay, setPendingOpponentPlay] = useState(null);

  // Crib reveal animation state
  const [cribRevealPhase, setCribRevealPhase] = useState('idle'); // idle, revealing, done
  const [cribRevealedCards, setCribRevealedCards] = useState([]);

  // Refs for animation positions
  const playerHandRef = useRef(null);
  const opponentHandRef = useRef(null);
  const playerPlayAreaRef = useRef(null);
  const opponentPlayAreaRef = useRef(null);
  const cribPileRef = useRef(null);
  const cribDisplayRef = useRef(null);

  // Tracking refs for detecting state changes via polling
  const prevPlayedCountRef = useRef(0);
  const prevOpponentDiscardedRef = useRef(false);
  const prevPhaseRef = useRef(null);
  const prevCountingPhaseRef = useRef(null);

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

  // Derived values
  const gs = gameState?.gameState;
  const myKey = gameState?.myPlayerKey;
  const opponentKey = myKey === 'player1' ? 'player2' : 'player1';
  const phase = gs?.phase || 'unknown';
  const dealer = gs?.dealer;
  const isDealer = myKey === dealer;
  const nonDealer = dealer === 'player1' ? 'player2' : 'player1';
  const opponentName = opponent?.email || opponent?.username || 'Opponent';

  // Clear pegging selection when not in play phase or not my turn
  useEffect(() => {
    if (phase !== GAME_PHASE.PLAYING || !isMyTurn) {
      setPeggingSelectedCard(null);
    }
  }, [phase, isMyTurn]);

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
    if (!gs) return [];
    return gs[`${myKey}Hand`] || [];
  };

  // Check if player has already discarded
  const hasDiscarded = () => {
    if (!gs) return false;
    return (gs[`${myKey}Discards`] || []).length > 0;
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

  // Handle discard submission with animation
  const handleDiscard = async () => {
    if (selectedCards.length !== 2) return;

    // Start animation: hide selected cards, fly them to crib pile
    setDiscardingCards([...selectedCards]);

    // Get source rects from selected cards
    const selectedElements = playerHandRef.current?.querySelectorAll('[data-selected="true"]');
    const targetRect = cribPileRef.current?.getBoundingClientRect();

    if (selectedElements?.length >= 2 && targetRect) {
      const firstRect = selectedElements[0].getBoundingClientRect();
      const secondRect = selectedElements[1].getBoundingClientRect();
      const cardsToDiscard = [...selectedCards];

      // Fly first card
      setFlyingCard({
        card: cardsToDiscard[0],
        startRect: firstRect,
        endRect: targetRect,
        faceDown: true,
        className: 'flying-card-crib',
        onComplete: () => {
          setCribCardsInPile(prev => prev + 1);
          // Fly second card
          setFlyingCard({
            card: cardsToDiscard[1],
            startRect: secondRect,
            endRect: targetRect,
            faceDown: true,
            className: 'flying-card-crib',
            onComplete: () => {
              setCribCardsInPile(prev => prev + 1);
              setFlyingCard(null);
              setDiscardingCards([]);
              // Now submit the API call
              doDiscard(cardsToDiscard);
            }
          });
        }
      });
    } else {
      // No animation targets available, just submit
      doDiscard([...selectedCards]);
    }
  };

  const doDiscard = async (cards) => {
    setSubmitting(true);
    try {
      const result = await submitMove('discard', { cards });
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
        const resultGs = result.game?.gameState;
        if (resultGs?.cutForDealer) {
          const myCard = resultGs.cutForDealer[`${myKey}Card`];
          const oppCard = resultGs.cutForDealer[`${opponentKey}Card`];
          setCutForDealerState(prev => ({
            myCut: myCard || prev.myCut,
            opponentCut: oppCard || prev.opponentCut,
            result: resultGs.cutForDealer?.dealer ? 'determined' : (resultGs.cutForDealer?.tied ? 'tied' : prev.result)
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
    if (!gs) return;

    if (gs.phase === GAME_PHASE.CUTTING_FOR_DEALER || gs.cutForDealer) {
      const myCard = gs.cutForDealer?.[`${myKey}Card`];
      const oppCard = gs.cutForDealer?.[`${opponentKey}Card`];

      setCutForDealerState(prev => ({
        myCut: myCard || prev.myCut,
        opponentCut: oppCard || prev.opponentCut,
        result: gs.cutForDealer?.dealer ? 'determined' : (gs.cutForDealer?.tied ? 'tied' : prev.result)
      }));
    }
  }, [gs?.phase, gs?.cutForDealer]);

  // Reset cut-for-dealer state on tie (when cards are cleared)
  useEffect(() => {
    if (gs?.cutForDealer?.tied && gs.cutForDealer.player1Card === null) {
      setCutForDealerState({ myCut: null, opponentCut: null, result: null });
    }
  }, [gs?.cutForDealer?.player1Card]);

  // Get playable cards during play phase
  const getPlayableCards = () => {
    if (!gs || gs.phase !== GAME_PHASE.PLAYING) return [];

    const playHand = gs.playState?.[`${myKey}PlayHand`] || [];
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

  // Handle playing a card with animation
  const handlePlayCard = async (card, e) => {
    if (!isMyTurn || submitting) return;
    if (!isCardPlayable(card)) return;

    // Capture source rect from clicked card
    const sourceRect = e?.currentTarget?.getBoundingClientRect();
    const targetRect = playerPlayAreaRef.current?.getBoundingClientRect();

    if (sourceRect && targetRect) {
      setFlyingCard({
        card,
        startRect: sourceRect,
        endRect: targetRect,
        faceDown: false,
        className: 'flying-card',
        onComplete: () => {
          setFlyingCard(null);
          // Submit the play
          doPlayCard(card);
        }
      });
    } else {
      doPlayCard(card);
    }
  };

  const doPlayCard = async (card) => {
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
  }, [phase]);

  // Track crib pile count based on discard state
  useEffect(() => {
    if (!gs) return;

    if (phase === GAME_PHASE.DISCARDING) {
      const myDiscards = (gs[`${myKey}Discards`] || []).length;
      const oppDiscards = (gs[`${opponentKey}Discards`] || []).length;

      // Detect opponent discard arriving via polling
      const oppHasDiscarded = oppDiscards > 0;
      if (oppHasDiscarded && !prevOpponentDiscardedRef.current) {
        // Opponent just discarded — grow crib pile instantly
        setCribCardsInPile(prev => Math.min(prev + 2, 4));
      }
      prevOpponentDiscardedRef.current = oppHasDiscarded;

      // If we haven't animated our own discard yet, set pile from known state
      if (myDiscards > 0 && discardingCards.length === 0) {
        setCribCardsInPile(myDiscards + oppDiscards);
      }
    } else if (phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.CUT) {
      setCribCardsInPile(4);
    } else if (phase === GAME_PHASE.CUTTING_FOR_DEALER) {
      setCribCardsInPile(0);
      prevOpponentDiscardedRef.current = false;
    }
  }, [phase, gs?.[`${myKey}Discards`]?.length, gs?.[`${opponentKey}Discards`]?.length]);

  // Reset crib pile for new round
  useEffect(() => {
    if (phase === GAME_PHASE.DISCARDING) {
      const myDiscards = (gs?.[`${myKey}Discards`] || []).length;
      const oppDiscards = (gs?.[`${opponentKey}Discards`] || []).length;
      if (myDiscards === 0 && oppDiscards === 0) {
        setCribCardsInPile(0);
        prevOpponentDiscardedRef.current = false;
        setCribRevealPhase('idle');
        setCribRevealedCards([]);
      }
    }
  }, [gs?.round]);

  // Detect new cards played (opponent plays arrive via polling) and animate
  useEffect(() => {
    const playedCards = gs?.playState?.playedCards || [];
    const prevCount = prevPlayedCountRef.current;

    if (playedCards.length > prevCount && prevCount > 0) {
      const newestCard = playedCards[playedCards.length - 1];
      const isOpponentCard = newestCard.playedBy !== myKey;

      if (isOpponentCard) {
        // Animate opponent's card from their hand area to play area
        const sourceRect = opponentHandRef.current?.getBoundingClientRect();
        const targetRect = opponentPlayAreaRef.current?.getBoundingClientRect();

        if (sourceRect && targetRect) {
          setPendingOpponentPlay(newestCard);
          setFlyingCard({
            card: newestCard,
            startRect: sourceRect,
            endRect: targetRect,
            faceDown: false,
            className: 'flying-card',
            onComplete: () => {
              setFlyingCard(null);
              setPendingOpponentPlay(null);
              // Landing pulse
              setLandingCardIndex(playedCards.length - 1);
              setLandingIsOpponent(true);
              setTimeout(() => setLandingCardIndex(null), 300);
            }
          });
        }

        // Show announcement
        setLastPlayAnnouncement({
          card: newestCard,
          player: opponentName,
        });
        setTimeout(() => setLastPlayAnnouncement(null), 2500);
      } else {
        // Our own card — landing pulse
        setLandingCardIndex(playedCards.length - 1);
        setLandingIsOpponent(false);
        setTimeout(() => setLandingCardIndex(null), 300);
      }
    }

    prevPlayedCountRef.current = playedCards.length;
  }, [gs?.playState?.playedCards?.length]);

  // Crib reveal animation when counting transitions to crib phase
  useEffect(() => {
    const countingState = gs?.countingState;
    const countPhase = countingState?.phase;

    if (countPhase === 'crib' && prevCountingPhaseRef.current !== 'crib' && cribRevealPhase === 'idle') {
      startCribReveal();
    }

    prevCountingPhaseRef.current = countPhase;
  }, [gs?.countingState?.phase]);

  const startCribReveal = () => {
    const cribCards = gs?.crib || [];
    if (cribCards.length === 0) {
      setCribRevealPhase('done');
      return;
    }

    setCribRevealPhase('revealing');
    setCribRevealedCards([]);
    revealNextCribCard(cribCards, 0);
  };

  const revealNextCribCard = (cribCards, index) => {
    if (index >= cribCards.length) {
      setCribRevealPhase('done');
      return;
    }

    const sourceRect = cribPileRef.current?.getBoundingClientRect();
    const targetRect = cribDisplayRef.current?.getBoundingClientRect();

    if (sourceRect && targetRect) {
      setFlyingCard({
        card: cribCards[index],
        startRect: sourceRect,
        endRect: targetRect,
        faceDown: false,
        className: 'flying-card-crib',
        onComplete: () => {
          setFlyingCard(null);
          setCribRevealedCards(prev => [...prev, cribCards[index]]);
          setTimeout(() => revealNextCribCard(cribCards, index + 1), 200);
        }
      });
    } else {
      // No refs available, just reveal all at once
      setCribRevealedCards(cribCards);
      setCribRevealPhase('done');
    }
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
    const isWinner = gameState?.winner === myKey;
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
          Final Score: You {gameState?.myScore} - {gameState?.opponentScore} {opponentName}
        </div>
        <Button onClick={onExit} className="bg-blue-600 hover:bg-blue-700 text-lg px-6 py-3">
          Back to Menu
        </Button>
      </div>
    );
  }

  // Helper: get opponent card count for face-down display
  const getOpponentCardCount = () => {
    if (!gs) return 0;
    if (phase === GAME_PHASE.DISCARDING) {
      const oppDiscards = (gs[`${opponentKey}Discards`] || []).length;
      return oppDiscards > 0 ? 4 : 6;
    }
    if (phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.CUT) {
      return (gs.playState?.[`${opponentKey}PlayHand`] || []).length;
    }
    return 4;
  };

  // Helper: get opponent's hand cards (for counting phase)
  const getOpponentHand = () => {
    if (!gs) return [];
    return gs[`${opponentKey}Hand`] || [];
  };

  // Helper: should show opponent's hand face-up?
  const showOpponentFaceUp = () => {
    if (phase !== GAME_PHASE.COUNTING) return false;
    return true; // During counting, always show opponent's hand face-up
  };

  // Helper: determine counting context
  const getCountingContext = () => {
    const countingState = gs?.countingState || {};
    const countPhase = countingState.phase || 'nonDealer';
    const handsScored = countingState.handsScored || [];
    const waitingForVerification = countingState.waitingForVerification;
    const claimedScore = countingState.claimedScore;
    const actualScore = countingState.actualScore;
    const countedHand = countingState.countedHand;

    // Am I the counter for this sub-phase?
    const iAmCounter = (countPhase === 'nonDealer' && !isDealer) ||
                       (countPhase === 'dealer' && isDealer) ||
                       (countPhase === 'crib' && isDealer);

    let phaseLabel;
    if (countPhase === 'nonDealer') {
      phaseLabel = isDealer ? `${opponentName}'s Hand` : 'Your Hand';
    } else if (countPhase === 'dealer') {
      phaseLabel = isDealer ? 'Your Hand' : `${opponentName}'s Hand`;
    } else if (countPhase === 'crib') {
      phaseLabel = 'Crib';
    }

    // Is this counting the opponent's hand? (for highlighting)
    const isCountingOpponentHand = (countPhase === 'nonDealer' && isDealer) ||
                                   (countPhase === 'dealer' && !isDealer);
    const isCountingMyHand = (countPhase === 'nonDealer' && !isDealer) ||
                             (countPhase === 'dealer' && isDealer);
    const isCountingCrib = countPhase === 'crib';

    return {
      countPhase, handsScored, waitingForVerification, claimedScore,
      actualScore, countedHand, iAmCounter, phaseLabel,
      isCountingOpponentHand, isCountingMyHand, isCountingCrib
    };
  };

  // Render crib pile (reusable)
  const renderCribPile = (extraClassName = '') => {
    const pileCount = cribCardsInPile;
    const showDuringCounting = phase === GAME_PHASE.COUNTING && cribRevealPhase !== 'done';
    const showNormally = phase === GAME_PHASE.DISCARDING || phase === GAME_PHASE.CUT || phase === GAME_PHASE.PLAYING;

    if (!showNormally && !showDuringCounting) return null;

    return (
      <div ref={cribPileRef} className={`flex flex-col items-center ${extraClassName} ${cribRevealPhase === 'revealing' ? 'opacity-60' : ''}`}>
        <div className="relative w-12 h-16">
          {pileCount === 0 ? (
            <div className="w-12 h-16 border-2 border-dashed border-green-600 rounded flex items-center justify-center">
              <span className="text-[10px] text-green-600">Crib</span>
            </div>
          ) : (
            <>
              {pileCount >= 1 && <div className="absolute top-0 left-0 bg-blue-900 border-2 border-blue-700 rounded w-12 h-16 shadow-md" />}
              {pileCount >= 2 && <div className="absolute top-1 left-0.5 bg-blue-800 border-2 border-blue-600 rounded w-12 h-16 shadow-md" />}
              {pileCount >= 3 && <div className="absolute top-2 left-1 bg-blue-700 border-2 border-blue-500 rounded w-12 h-16 shadow-lg" />}
              {pileCount >= 4 && <div className="absolute top-3 left-1.5 bg-blue-900 border-2 border-blue-400 rounded w-12 h-16 shadow-lg flex items-center justify-center font-bold text-xs text-blue-200">Crib</div>}
            </>
          )}
        </div>
        <div className="text-[10px] text-gray-400 mt-4">Crib</div>
      </div>
    );
  };

  // Split round cards into my cards and opponent cards
  const getPlayerRoundCards = () => {
    const roundCards = gs?.playState?.roundCards || [];
    const myCards = roundCards.filter(c => c.playedBy === myKey);
    const oppCards = roundCards.filter(c => c.playedBy === opponentKey);
    return { myCards, oppCards, allRoundCards: roundCards };
  };

  return (
    <div className="h-screen bg-green-800 flex flex-col">
      {/* Top bar - Opponent info */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${opponentConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
          <div className="text-white">
            <span className="font-medium">{opponentName}</span>
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

        {/* Cut for Dealer Phase */}
        {phase === GAME_PHASE.CUTTING_FOR_DEALER && (() => {
          const cutData = gs?.cutForDealer;
          const dealerDetermined = !!cutData?.dealer;
          const iAmDealer = cutData?.dealer === myKey;
          const myAck = cutData?.[`${myKey}Acknowledged`];
          const oppAck = cutData?.[`${opponentKey}Acknowledged`];
          const bothAcknowledged = myAck && oppAck;

          return (
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
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
                    <div className="text-sm text-blue-400 mb-2 font-medium">{opponentName}'s Cut</div>
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
                      <div className="text-sm text-blue-400 mb-1">{opponentName}</div>
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
                    {iAmDealer ? 'You deal!' : `${opponentName} deals!`}
                  </div>

                  {/* Action buttons based on role */}
                  {!myAck && (
                    <Button
                      onClick={handleAcknowledgeDealer}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
                    >
                      {submitting ? 'Confirming...' : iAmDealer ? 'Confirm' : 'Confirm Dealer'}
                    </Button>
                  )}

                  {myAck && !bothAcknowledged && (
                    <div className="text-gray-400">
                      Waiting for {opponentName} to confirm...
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
                      Waiting for {opponentName} to deal...
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

        {/* Main game layout — matches single-player visual hierarchy */}
        {phase !== GAME_PHASE.CUTTING_FOR_DEALER && (
          <>
            {/* Cribbage Board */}
            <div className="w-full max-w-2xl mb-4">
              <CribbageBoard
                playerScore={gameState?.myScore || 0}
                computerScore={gameState?.opponentScore || 0}
                playerLabel="You"
                opponentLabel={opponentName}
              />
            </div>

            {/* Dealer indicator + Cut card */}
            <div className="text-center mb-4 max-w-2xl w-full">
              {dealer && (
                <div className="text-sm text-yellow-400 mb-2">
                  Dealer: {isDealer ? 'You' : opponentName}
                </div>
              )}
              {gs?.cutCard && (
                <div className="mb-2">
                  <div className="text-sm text-gray-400 mb-1">Cut Card</div>
                  <CutCard card={gs.cutCard} />
                </div>
              )}
            </div>

            {/* Turn indicator */}
            {(() => {
              const discardingNeedAction = phase === GAME_PHASE.DISCARDING && !hasDiscarded();
              const showYourTurn = isMyTurn || discardingNeedAction;
              return (
                <div className={`mb-4 px-6 py-2 rounded-full text-sm font-bold ${
                  showYourTurn
                    ? 'bg-green-600 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {showYourTurn ? "Your Turn" : `Waiting for ${opponentName}...`}
                </div>
              );
            })()}

            {/* Opponent's hand + Crib pile (if opponent is dealer) */}
            {(phase === GAME_PHASE.DISCARDING || phase === GAME_PHASE.CUT || phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.COUNTING) && (() => {
              const isCounting = phase === GAME_PHASE.COUNTING;
              const ctx = isCounting ? getCountingContext() : null;
              const opponentHighlighted = isCounting && ctx?.isCountingOpponentHand && !ctx?.waitingForVerification;
              const showCribHere = isCounting && !isDealer && ctx?.isCountingCrib && (cribRevealPhase === 'revealing' || cribRevealPhase === 'done');
              const cribHighlighted = showCribHere && cribRevealPhase === 'done' && ctx?.iAmCounter !== true;

              return (
                <div className={`mb-4 max-w-2xl w-full p-3 rounded-lg ${
                  opponentHighlighted || cribHighlighted ? 'bg-yellow-900/30 border-2 border-yellow-500' : 'bg-gray-800/60 border border-gray-700/50'
                }`}>
                  <div className="text-sm mb-2 text-gray-400">
                    {showCribHere ? `Crib (${opponentName}'s):` : `${opponentName}'s Hand:`}
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    {/* Crib pile next to opponent's hand if opponent is dealer */}
                    {!isDealer && !showCribHere && renderCribPile()}

                    <div className="grid min-w-0">
                      {/* Hand cards */}
                      <div ref={opponentHandRef} className={`col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-4 sm:[&>*:not(:first-child)]:-ml-3 ${showCribHere ? 'invisible' : ''}`}>
                        {showOpponentFaceUp() ? (
                          // During counting: show face-up
                          getOpponentHand().map((card, idx) => (
                            <div key={idx} style={{ marginTop: idx % 2 === 1 ? '4px' : '0' }}>
                              <PlayingCard
                                card={card}
                                revealed={true}
                                highlighted={opponentHighlighted}
                                disabled={true}
                              />
                            </div>
                          ))
                        ) : (
                          // During play/discard: show face-down
                          Array.from({ length: getOpponentCardCount() }).map((_, idx) => (
                            <div key={idx} style={{ marginTop: idx % 2 === 1 ? '4px' : '0' }}>
                              <PlayingCard card={{ rank: '?', suit: '?' }} faceDown={true} />
                            </div>
                          ))
                        )}
                      </div>
                      {/* Crib reveal display */}
                      {showCribHere && (
                        <div ref={cribDisplayRef} className="col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-3">
                          {(cribRevealPhase === 'revealing' ? cribRevealedCards : gs?.crib || []).map((card, idx) => (
                            <div key={idx} style={{ marginTop: idx % 2 === 1 ? '4px' : '0' }}>
                              <PlayingCard card={card} highlighted={cribHighlighted} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cut card shown alongside during counting */}
                    {isCounting && gs?.cutCard && !showCribHere && (
                      <div className="ml-2 opacity-75">
                        <div className="text-[10px] text-gray-500 mb-1">Cut</div>
                        <PlayingCard card={gs.cutCard} revealed={true} disabled={true} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Pending Pegging Score Banner */}
            {gs?.pendingPeggingScore && (() => {
              const pending = gs.pendingPeggingScore;
              const isMyScore = pending.player === myKey;

              return (
                <div className="mb-4 max-w-2xl w-full">
                  <div className={`
                    w-full py-3 px-4 rounded-lg text-center
                    ${isMyScore ? 'bg-green-600/30 border-2 border-green-500' : 'bg-blue-600/30 border-2 border-blue-500'}
                    animate-pulse
                  `}>
                    <div className="text-xl font-bold text-white">
                      {isMyScore ? 'You scored!' : `${opponentName} scored!`}
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
                      Waiting for {opponentName} to accept...
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Opponent play announcement */}
            {lastPlayAnnouncement && (
              <div className="mb-3 text-center animate-bounce">
                <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  {lastPlayAnnouncement.player} played {lastPlayAnnouncement.card.rank}{lastPlayAnnouncement.card.suit}
                </div>
              </div>
            )}

            {/* Play area with separate stacks */}
            {phase === GAME_PHASE.PLAYING && (() => {
              const playState = gs?.playState;
              const currentCount = playState?.currentCount || 0;
              const { myCards, oppCards, allRoundCards } = getPlayerRoundCards();
              const allPlayedCards = playState?.playedCards || [];
              const opponentSaidGo = playState?.[`${opponentKey}Said`] === 'go';

              // Filter out pending opponent play from display (being animated)
              const displayOppCards = pendingOpponentPlay
                ? oppCards.filter(c => !(c.rank === pendingOpponentPlay.rank && c.suit === pendingOpponentPlay.suit))
                : oppCards;

              return (
                <div className="mb-4 max-w-2xl w-full">
                  {/* Current count */}
                  <div className="text-center mb-3">
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

                  {/* Play area — separate stacks like single-player */}
                  <div className="bg-green-700 rounded p-4 mb-3">
                    {/* Opponent's played cards */}
                    <div className="mb-3">
                      <div className="text-xs mb-1 text-gray-300">{opponentName}'s plays:</div>
                      <div ref={opponentPlayAreaRef} className="flex flex-wrap justify-center [&>*:not(:first-child)]:-ml-2 min-h-[32px]">
                        {displayOppCards.map((card, idx) => {
                          const globalIdx = allPlayedCards.findIndex(c => c.rank === card.rank && c.suit === card.suit && c.playedBy === opponentKey);
                          return (
                            <div key={idx} className={globalIdx === landingCardIndex && landingIsOpponent ? 'animate-[cardLand_0.3s_ease-out]' : ''} style={{ marginTop: idx % 2 === 1 ? '3px' : '0' }}>
                              <PlayedCard card={card} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Player's played cards */}
                    <div>
                      <div className="text-xs mb-1 text-gray-300">Your plays:</div>
                      <div ref={playerPlayAreaRef} className="flex flex-wrap justify-center [&>*:not(:first-child)]:-ml-2 min-h-[32px]">
                        {myCards.map((card, idx) => {
                          const globalIdx = allPlayedCards.findIndex(c => c.rank === card.rank && c.suit === card.suit && c.playedBy === myKey);
                          return (
                            <div key={idx} className={globalIdx === landingCardIndex && !landingIsOpponent ? 'animate-[cardLand_0.3s_ease-out]' : ''} style={{ marginTop: idx % 2 === 1 ? '3px' : '0' }}>
                              <PlayedCard card={card} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Previous rounds info */}
                  {allPlayedCards.length > allRoundCards.length && (
                    <div className="text-center mb-3">
                      <div className="text-gray-500 text-xs">
                        Previous rounds: {allPlayedCards.length - allRoundCards.length} cards played
                      </div>
                    </div>
                  )}

                  {/* Opponent said Go indicator */}
                  {opponentSaidGo && (
                    <div className="text-center mb-3">
                      <div className="inline-block bg-orange-600/80 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {opponentName} said "Go" — play if you can!
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Message area */}
            {phase === GAME_PHASE.DISCARDING && !hasDiscarded() && (
              <div className="text-center text-yellow-400 mb-3 max-w-2xl w-full">
                Select 2 cards for {isDealer ? 'your crib' : `${opponentName}'s crib`}
              </div>
            )}
            {phase === GAME_PHASE.DISCARDING && hasDiscarded() && (
              <div className="text-center text-green-400 mb-3 max-w-2xl w-full">
                Discarded. Waiting for {opponentName}...
              </div>
            )}
            {phase === GAME_PHASE.CUT && (
              <div className="text-center mb-3 max-w-2xl w-full">
                {isMyTurn ? (
                  <Button
                    onClick={handleCut}
                    disabled={submitting}
                    className="bg-yellow-600 hover:bg-yellow-700 text-lg px-8 py-4"
                  >
                    {submitting ? 'Cutting...' : 'Cut Deck'}
                  </Button>
                ) : (
                  <div className="text-gray-400">
                    Waiting for {opponentName} to cut...
                  </div>
                )}
              </div>
            )}
            {phase === GAME_PHASE.PLAYING && isMyTurn && !gs?.pendingPeggingScore && (
              <div className="text-center mb-3 max-w-2xl w-full">
                {canPlayAnyCard() ? (
                  peggingSelectedCard ? (
                    <div className="space-y-2">
                      <div className="text-cyan-400">
                        Tap the raised card again or press Play
                      </div>
                      <Button
                        onClick={() => {
                          const selectedEl = document.querySelector('[class*="ring-cyan-400"]');
                          if (selectedEl && peggingSelectedCard) {
                            handlePlayCard(peggingSelectedCard, { currentTarget: selectedEl });
                            setPeggingSelectedCard(null);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
                      >
                        Play Card
                      </Button>
                    </div>
                  ) : (
                    <div className="text-yellow-400">
                      Tap a card to select it
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="text-red-400">
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

            {/* Player's hand + Crib pile (if player is dealer) */}
            {(phase === GAME_PHASE.DISCARDING || phase === GAME_PHASE.CUT || phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.COUNTING) && (() => {
              const isCounting = phase === GAME_PHASE.COUNTING;
              const ctx = isCounting ? getCountingContext() : null;
              const myPlayHand = gs?.playState?.[`${myKey}PlayHand`] || [];
              const handToShow = phase === GAME_PHASE.PLAYING ? myPlayHand : getMyHand();
              const showCribHere = isCounting && isDealer && ctx?.isCountingCrib && (cribRevealPhase === 'revealing' || cribRevealPhase === 'done');
              const playerHighlighted = !showCribHere && (
                (phase === GAME_PHASE.DISCARDING && !hasDiscarded()) ||
                (phase === GAME_PHASE.PLAYING && isMyTurn && !gs?.pendingPeggingScore) ||
                (isCounting && ctx?.isCountingMyHand && !ctx?.waitingForVerification)
              );
              const cribHighlighted = showCribHere && cribRevealPhase === 'done' && !ctx?.waitingForVerification;
              const showBorder = playerHighlighted || cribHighlighted || showCribHere;
              const hasPending = !!gs?.pendingPeggingScore;

              return (
                <div className={`mb-4 max-w-2xl w-full p-3 rounded-lg ${
                  showBorder ? 'bg-yellow-900/30 border-2 border-yellow-500' : 'bg-gray-800/60 border border-gray-700/50'
                }`}>
                  <div className="text-sm mb-2 text-gray-400">
                    {showCribHere ? 'Crib (Yours):' : `Your Hand${phase === GAME_PHASE.PLAYING ? ` (${myPlayHand.length} remaining)` : ''}:`}
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <div className="grid min-w-0">
                      {/* Hand cards */}
                      <div ref={playerHandRef} className={`col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-4 sm:[&>*:not(:first-child)]:-ml-3 ${showCribHere ? 'invisible' : ''}`}>
                        {handToShow.map((card, idx) => {
                          const isBeingDiscarded = discardingCards.some(d => d.rank === card.rank && d.suit === card.suit);
                          const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
                          const playable = phase === GAME_PHASE.PLAYING ? isCardPlayable(card) : true;

                          return (
                            <div
                              key={`${card.rank}${card.suit}`}
                              className="relative"
                              data-selected={isSelected ? 'true' : 'false'}
                              style={{ marginTop: idx % 2 === 1 ? '4px' : '0', ...(isBeingDiscarded ? { visibility: 'hidden' } : {}) }}
                            >
                              {phase === GAME_PHASE.PLAYING && peggingSelectedCard &&
                               peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-cyan-300 text-xs px-2 py-1 rounded shadow-lg border border-cyan-400/30 z-10">
                                  Click again to play, or another card to select
                                </div>
                              )}
                              <PlayingCard
                                card={card}
                                selected={
                                  (phase === GAME_PHASE.DISCARDING && !hasDiscarded() && isSelected) ||
                                  (phase === GAME_PHASE.PLAYING && peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit)
                                }
                                highlighted={
                                  playerHighlighted ||
                                  (phase === GAME_PHASE.PLAYING && isMyTurn && playable && !hasPending)
                                }
                                disabled={
                                  isCounting ||
                                  (phase === GAME_PHASE.PLAYING && (!isMyTurn || !playable || hasPending)) ||
                                  (phase === GAME_PHASE.DISCARDING && hasDiscarded()) ||
                                  submitting
                                }
                                onClick={(e) => {
                                  if (phase === GAME_PHASE.DISCARDING && !hasDiscarded()) {
                                    handleCardClick(card);
                                  } else if (phase === GAME_PHASE.PLAYING && isMyTurn && !hasPending) {
                                    if (!isCardPlayable(card)) return;
                                    if (peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit) {
                                      handlePlayCard(card, e);
                                      setPeggingSelectedCard(null);
                                    } else {
                                      setPeggingSelectedCard(card);
                                    }
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {/* Crib reveal display */}
                      {showCribHere && (
                        <div ref={cribDisplayRef} className="col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-3">
                          {(cribRevealPhase === 'revealing' ? cribRevealedCards : gs?.crib || []).map((card, idx) => (
                            <div key={idx} style={{ marginTop: idx % 2 === 1 ? '4px' : '0' }}>
                              <PlayingCard card={card} highlighted={cribHighlighted} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Crib pile next to player's hand if player is dealer */}
                    {isDealer && !showCribHere && renderCribPile()}

                    {/* Cut card shown alongside during counting */}
                    {isCounting && gs?.cutCard && !showCribHere && (
                      <div className="ml-2 opacity-75">
                        <div className="text-[10px] text-gray-500 mb-1">Cut</div>
                        <PlayingCard card={gs.cutCard} revealed={true} disabled={true} size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Discard button */}
                  {phase === GAME_PHASE.DISCARDING && !hasDiscarded() && (
                    <div className="text-center mt-3">
                      <Button
                        onClick={handleDiscard}
                        disabled={selectedCards.length !== 2 || submitting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Discarding...' : `Discard ${selectedCards.length}/2 cards`}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Counting Phase UI */}
            {phase === GAME_PHASE.COUNTING && (() => {
              const ctx = getCountingContext();
              const { countPhase, handsScored, waitingForVerification, claimedScore, actualScore, countedHand, iAmCounter, phaseLabel } = ctx;

              return (
                <div className="max-w-2xl w-full mb-4">
                  <div className="text-center text-white text-lg font-bold mb-2">Counting Phase</div>
                  <div className="text-center text-yellow-400 mb-3">
                    Counting: {phaseLabel}
                  </div>

                  {/* Verification UI: opponent verifies the counter's claim */}
                  {waitingForVerification && !iAmCounter && isMyTurn ? (
                    <div className="mb-4 text-center">
                      <div className="text-white mb-2">
                        {opponentName} claims <span className="text-yellow-400 font-bold text-xl">{claimedScore}</span> points
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
                            {gs?.cutCard && (
                              <div className="ml-2 opacity-75">
                                <PlayingCard card={gs.cutCard} revealed={true} disabled={true} size="sm" />
                              </div>
                            )}
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
                    <div className="text-gray-400 text-center mb-4">
                      You claimed {claimedScore} points. Waiting for {opponentName} to verify...
                    </div>
                  ) : iAmCounter && isMyTurn ? (
                    /* ScoreSelector for the counter */
                    <div className="mb-4">
                      <div className="text-gray-400 text-center mb-3">
                        {countPhase === 'crib' ? 'Count the crib' : 'Count your hand'}
                      </div>

                      {/* Show hand being counted with cut card */}
                      <div className="mb-3">
                        <div className="flex justify-center gap-2 flex-wrap">
                          {countPhase === 'crib' ? (
                            (cribRevealPhase === 'done' ? (gs?.crib || []) : cribRevealedCards).map((card, idx) => (
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
                          {gs?.cutCard && (
                            <div className="ml-2 opacity-75">
                              <PlayingCard card={gs.cutCard} revealed={true} disabled={true} size="sm" />
                            </div>
                          )}
                        </div>
                      </div>

                      <ScoreSelector
                        onSelect={handleClaimCount}
                        disabled={submitting}
                      />
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center mb-4">
                      Waiting for {opponentName} to count...
                    </div>
                  )}

                  {/* Show previously counted hands with breakdowns */}
                  {handsScored.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-4 text-left">
                      <div className="text-white font-bold mb-2">Scores This Round:</div>
                      {handsScored.map((scored, idx) => {
                        const isMyHand = scored.player === myKey;
                        const label = scored.phase === 'crib' ? 'Crib' :
                                      (isMyHand ? 'Your Hand' : `${opponentName}'s Hand`);
                        return (
                          <div key={idx} className="mb-3">
                            <div className={`font-medium ${isMyHand ? 'text-green-400' : 'text-gray-300'}`}>
                              {label}: {scored.claimedScore !== undefined ? scored.claimedScore : scored.score} points
                              {scored.claimedScore !== undefined && scored.actualScore !== undefined && scored.claimedScore !== scored.actualScore && (
                                <span className="text-yellow-400 text-sm ml-2">(actual: {scored.actualScore})</span>
                              )}
                              {scored.muggins && (
                                <span className="text-red-400 text-sm ml-2">Muggins!</span>
                              )}
                            </div>
                            {scored.breakdown && scored.breakdown.length > 0 && (
                              <div className="text-gray-400 text-sm ml-4 mt-1">
                                {scored.breakdown.map((item, i) => {
                                  const str = typeof item === 'string' ? item : `${item.description}: ${item.points}`;
                                  return <div key={i}>{str}</div>;
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pegging Summary Toggle */}
                  {(gs?.peggingHistory || []).length > 0 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowPeggingSummary(!showPeggingSummary)}
                        className="text-sm text-blue-400 hover:text-blue-300 underline"
                      >
                        {showPeggingSummary ? 'Hide' : 'Show'} Pegging Summary
                      </button>

                      {showPeggingSummary && (
                        <div className="mt-2 bg-gray-700 rounded-lg p-4 text-left max-h-48 overflow-y-auto">
                          <div className="text-white font-bold mb-2">Pegging History:</div>
                          {gs.peggingHistory.map((event, idx) => {
                            const isMe = event.player === myKey;
                            const name = isMe ? 'You' : (opponentName);

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
                            <span className="text-green-400">Your pegging: {gs?.peggingPoints?.[myKey] || 0}</span>
                            {' | '}
                            <span className="text-blue-400">{opponentName}: {gs?.peggingPoints?.[opponentKey] || 0}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Game phase indicator */}
            <div className="text-center text-gray-500 text-sm mt-2">
              Phase: {phase}
            </div>
          </>
        )}

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

      {/* Flying card animation overlay */}
      {flyingCard && (
        <FlyingCard
          key={`${flyingCard.card.rank}${flyingCard.card.suit}${flyingCard.faceDown ? '-fd' : ''}${flyingCard.className || ''}`}
          card={flyingCard.card}
          startRect={flyingCard.startRect}
          endRect={flyingCard.endRect}
          faceDown={flyingCard.faceDown || false}
          onComplete={flyingCard.onComplete}
          className={flyingCard.className || 'flying-card'}
        />
      )}
    </div>
  );
}
