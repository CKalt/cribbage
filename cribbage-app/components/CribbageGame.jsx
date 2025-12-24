'use client';

// Main Cribbage Game Component

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import game logic from lib/
import { createDeck, shuffleDeck } from '@/lib/deck';
import { calculateHandScore, calculatePeggingScore } from '@/lib/scoring';
import { computerSelectCrib, computerSelectPlay } from '@/lib/ai';
import { rankOrder } from '@/lib/constants';

// Import UI components
import CribbageBoard from './CribbageBoard';
import PlayingCard, { PlayedCard, LargeCard, CutCard } from './PlayingCard';
import GameMessage from './GameMessage';
import ScoreBreakdown from './ScoreBreakdown';
import DebugPanel from './DebugPanel';

/**
 * Main game component with all state management and game logic
 */
export default function CribbageGame() {
  // Game flow state
  const [gameState, setGameState] = useState('menu');
  const [dealer, setDealer] = useState('player');
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [message, setMessage] = useState('');

  // Deck/cards state
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [crib, setCrib] = useState([]);
  const [cutCard, setCutCard] = useState(null);

  // Score state
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  // Selection state
  const [selectedCards, setSelectedCards] = useState([]);

  // Play phase state
  const [playerPlayHand, setPlayerPlayHand] = useState([]);
  const [computerPlayHand, setComputerPlayHand] = useState([]);
  const [playerPlayedCards, setPlayerPlayedCards] = useState([]);
  const [computerPlayedCards, setComputerPlayedCards] = useState([]);
  const [allPlayedCards, setAllPlayedCards] = useState([]);
  const [currentCount, setCurrentCount] = useState(0);
  const [lastPlayedBy, setLastPlayedBy] = useState(null);
  const [lastGoPlayer, setLastGoPlayer] = useState(null);
  const [peggingHistory, setPeggingHistory] = useState([]); // Track all pegging plays for review
  const [showPeggingSummary, setShowPeggingSummary] = useState(false);
  const [countingHistory, setCountingHistory] = useState([]); // Track hand/crib counts for review
  const [showCountingHistory, setShowCountingHistory] = useState(false); // Toggle counting history panel
  const [computerCountingHand, setComputerCountingHand] = useState(null); // Track what computer is currently counting

  // Counting phase state
  const [countingTurn, setCountingTurn] = useState('');
  const [playerCountInput, setPlayerCountInput] = useState('');
  const [computerClaimedScore, setComputerClaimedScore] = useState(null);
  const [actualScore, setActualScore] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [counterIsComputer, setCounterIsComputer] = useState(null);
  const [handsCountedThisRound, setHandsCountedThisRound] = useState(0);
  const [isProcessingCount, setIsProcessingCount] = useState(false);
  const [pendingCountContinue, setPendingCountContinue] = useState(null); // Stores data for continuing after player acknowledges
  const [playerMadeCountDecision, setPlayerMadeCountDecision] = useState(false); // True after player accepts/objects
  const [showMugginsPreferenceDialog, setShowMugginsPreferenceDialog] = useState(false);
  const [pendingWrongMugginsResult, setPendingWrongMugginsResult] = useState(null); // Stores result to apply after preference chosen

  // Cutting phase state
  const [playerCutCard, setPlayerCutCard] = useState(null);
  const [computerCutCard, setComputerCutCard] = useState(null);

  // Scoring state
  const [pendingScore, setPendingScore] = useState(null);

  // Debug state
  const [debugLog, setDebugLog] = useState([]);
  const [gameLog, setGameLog] = useState([]);

  // Get muggins penalty preference from localStorage
  const getMugginsPreference = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mugginsPreference'); // 'no-penalty' or '2-points' or null
    }
    return null;
  };

  // Save muggins penalty preference to localStorage
  const saveMugginsPreference = (preference) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mugginsPreference', preference);
    }
  };

  // Enhanced logging function
  const addDebugLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-50), `[${timestamp}] ${msg}`]);
    console.log(`[${timestamp}] ${msg}`);
  };

  // Game event logging function
  const logGameEvent = (eventType, data) => {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data: data,
      gameState: {
        state: gameState,
        dealer: dealer,
        playerScore: playerScore,
        computerScore: computerScore,
        currentCount: currentCount,
        currentPlayer: currentPlayer
      }
    };
    setGameLog(prev => [...prev, event]);
    addDebugLog(`GAME EVENT: ${eventType} - ${JSON.stringify(data)}`);
  };

  // Manual peg adjustment handler
  const handlePegClick = (player, adjustment) => {
    if (player === 'player') {
      setPlayerScore(prev => {
        const newScore = adjustment ? Math.max(0, Math.min(121, prev + adjustment)) : prev;
        addDebugLog(`Manual peg adjustment: Player ${prev} -> ${newScore}`);
        logGameEvent('MANUAL_PEG', { player: 'player', oldScore: prev, newScore, adjustment });
        return newScore;
      });
    } else {
      setComputerScore(prev => {
        const newScore = adjustment ? Math.max(0, Math.min(121, prev + adjustment)) : prev;
        addDebugLog(`Manual peg adjustment: Computer ${prev} -> ${newScore}`);
        logGameEvent('MANUAL_PEG', { player: 'computer', oldScore: prev, newScore, adjustment });
        return newScore;
      });
    }
  };

  // Move to counting phase
  const moveToCountingPhase = () => {
    addDebugLog('Moving to counting phase');
    setGameState('counting');
    setHandsCountedThisRound(0);

    setComputerClaimedScore(null);
    setActualScore(null);
    setShowBreakdown(false);
    setIsProcessingCount(false);
    setPendingCountContinue(null);
    setPlayerMadeCountDecision(false);
    setShowMugginsPreferenceDialog(false);
    setPendingWrongMugginsResult(null);

    const firstCounter = dealer === 'player' ? 'computer' : 'player';
    const isComputerFirst = firstCounter === 'computer';

    setCounterIsComputer(isComputerFirst);
    setCountingTurn(firstCounter);

    addDebugLog(`First counter: ${firstCounter} (non-dealer), counterIsComputer: ${isComputerFirst}, dealer: ${dealer}`);
    setMessage(isComputerFirst ? 'Computer counts first (non-dealer)' : 'Count your hand (non-dealer first)');
  };

  // Start new game
  const startNewGame = () => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setPlayerScore(0);
    setComputerScore(0);
    setGameState('cutting');
    setPlayerCutCard(null);
    setComputerCutCard(null);
    setMessage('Cut the deck to determine dealer (low card deals)');

    logGameEvent('GAME_START', {
      deckSize: newDeck.length,
      timestamp: new Date().toISOString()
    });
  };

  // Player cuts the deck
  const playerCutDeck = () => {
    if (playerCutCard) return;

    const cutIndex = Math.floor(Math.random() * 30) + 10;
    const card = deck[cutIndex];
    setPlayerCutCard(card);

    setTimeout(() => {
      let compCutIndex;
      do {
        compCutIndex = Math.floor(Math.random() * 30) + 10;
      } while (compCutIndex === cutIndex);

      const compCard = deck[compCutIndex];
      setComputerCutCard(compCard);

      setTimeout(() => {
        const playerRank = rankOrder[card.rank];
        const computerRank = rankOrder[compCard.rank];

        if (playerRank < computerRank) {
          setDealer('player');
          setMessage('You cut lower - you deal first!');
          logGameEvent('CUT_FOR_DEALER', {
            playerCard: card,
            computerCard: compCard,
            dealer: 'player',
            playerRank: playerRank,
            computerRank: computerRank
          });
        } else if (computerRank < playerRank) {
          setDealer('computer');
          setMessage('Computer cut lower - computer deals first');
          logGameEvent('CUT_FOR_DEALER', {
            playerCard: card,
            computerCard: compCard,
            dealer: 'computer',
            playerRank: playerRank,
            computerRank: computerRank
          });
        } else {
          setMessage('Same rank! Cut again');
          setPlayerCutCard(null);
          setComputerCutCard(null);
          logGameEvent('CUT_FOR_DEALER_TIE', {
            playerCard: card,
            computerCard: compCard,
            rank: playerRank
          });
          return;
        }

        setTimeout(() => {
          setGameState('dealing');
          setPlayerCutCard(null);
          setComputerCutCard(null);
          dealHands(deck);
        }, 2000);
      }, 1500);
    }, 1000);
  };

  // Deal hands
  const dealHands = (currentDeck) => {
    const playerCards = currentDeck.slice(0, 6);
    const computerCards = currentDeck.slice(6, 12);

    if (playerCards.length !== 6 || computerCards.length !== 6) {
      console.error('Dealing error - should be 6 cards each. Player:', playerCards.length, 'Computer:', computerCards.length);
    }

    setPlayerHand(playerCards);
    setComputerHand(computerCards);
    setDeck(currentDeck.slice(12));
    setCrib([]);
    setSelectedCards([]);
    setCountingTurn('');
    setPlayerCountInput('');
    setComputerClaimedScore(null);
    setActualScore(null);
    setShowBreakdown(false);
    setPendingScore(null);
    setCutCard(null);
    setLastGoPlayer(null);
    setPeggingHistory([]);
    setShowPeggingSummary(false);
    setCountingHistory([]);
    setGameState('cribSelect');
    setMessage('Select 2 cards for the crib');

    logGameEvent('DEAL_HANDS', {
      playerHand: playerCards,
      computerHand: computerCards.map(c => ({ rank: c.rank, suit: c.suit })),
      dealer: dealer
    });
  };

  // Handle card selection for crib
  const toggleCardSelection = (card) => {
    if (gameState !== 'cribSelect') return;

    const isSelected = selectedCards.some(c => c.rank === card.rank && c.suit === card.suit);

    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  // Discard to crib
  const discardToCrib = () => {
    if (selectedCards.length !== 2) return;

    if (gameState !== 'cribSelect' || playerHand.length !== 6) {
      console.error('discardToCrib called in wrong state:', gameState, 'or wrong hand size:', playerHand.length);
      return;
    }

    const newPlayerHand = playerHand.filter(card =>
      !selectedCards.some(s => s.rank === card.rank && s.suit === card.suit)
    );

    const newComputerHand = computerSelectCrib(computerHand, dealer === 'computer');

    const computerDiscards = computerHand.filter(card =>
      !newComputerHand.some(c => c.rank === card.rank && c.suit === card.suit)
    );

    const newCrib = [...selectedCards, ...computerDiscards];

    if (newPlayerHand.length !== 4 || newComputerHand.length !== 4 || newCrib.length !== 4) {
      console.error('Invalid card counts after discard');
      return;
    }

    const cut = deck[0];
    const newDeck = deck.slice(1);

    setPlayerHand(newPlayerHand);
    setComputerHand(newComputerHand);
    setCrib(newCrib);
    setSelectedCards([]);
    setCutCard(cut);
    setDeck(newDeck);

    setPlayerPlayHand([...newPlayerHand]);
    setComputerPlayHand([...newComputerHand]);
    setPlayerPlayedCards([]);
    setComputerPlayedCards([]);
    setAllPlayedCards([]);
    setCurrentCount(0);
    setLastPlayedBy(null);
    setLastGoPlayer(null);

    logGameEvent('DISCARD_TO_CRIB', {
      playerDiscards: selectedCards,
      computerDiscards: computerDiscards,
      crib: newCrib,
      cutCard: cut,
      playerHand: newPlayerHand,
      computerHand: newComputerHand
    });

    if (cut.rank === 'J') {
      setGameState('play');
      if (dealer === 'player') {
        setPendingScore({ player: 'player', points: 2, reason: 'His heels!' });
        setMessage('His heels! 2 points for dealer - Click Accept');
      } else {
        setPendingScore({ player: 'computer', points: 2, reason: 'His heels!' });
        setMessage('His heels! 2 points for dealer - Click Accept');
      }
      setCurrentPlayer(dealer === 'player' ? 'computer' : 'player');
    } else {
      setGameState('play');
      setCurrentPlayer(dealer === 'player' ? 'computer' : 'player');
      setMessage(dealer === 'player' ? "Computer's turn (non-dealer starts)" : "Your turn (non-dealer starts)");
    }
  };

  // Accept score and continue
  const acceptScoreAndContinue = () => {
    if (!pendingScore) return;

    if (pendingScore.player === 'player') {
      setPlayerScore(prev => prev + pendingScore.points);
    } else {
      setComputerScore(prev => prev + pendingScore.points);
    }

    logGameEvent('SCORE_POINTS', {
      player: pendingScore.player,
      points: pendingScore.points,
      reason: pendingScore.reason,
      newPlayerScore: pendingScore.player === 'player' ? playerScore + pendingScore.points : playerScore,
      newComputerScore: pendingScore.player === 'computer' ? computerScore + pendingScore.points : computerScore
    });

    // Add to pegging history if this is a pegging phase score
    if (gameState === 'play' || pendingScore.reason === 'One for last card') {
      setPeggingHistory(prev => [...prev, {
        type: 'points',
        player: pendingScore.player,
        points: pendingScore.points,
        reason: pendingScore.reason
      }]);
    }

    const scoringPlayer = pendingScore.player;
    const wasGoPoint = pendingScore.reason === 'One for last card';
    const wasHisHeels = pendingScore.reason === 'His heels!';
    const needsLastCard = pendingScore.needsLastCard;
    setPendingScore(null);

    setLastGoPlayer(null);

    if (needsLastCard) {
      setPendingScore({ player: scoringPlayer, points: 1, reason: 'One for last card' });
      setMessage(`${scoringPlayer === 'player' ? 'Now claim' : 'Computer also gets'} 1 point for last card - Click Accept`);
      return;
    }

    if (wasHisHeels) {
      setMessage(`${currentPlayer === 'player' ? 'Your' : "Computer's"} turn (non-dealer starts)`);
    } else if (gameState === 'play') {
      if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
        moveToCountingPhase();
        return;
      }

      if (currentCount === 31 || (wasGoPoint && (playerPlayHand.length > 0 || computerPlayHand.length > 0))) {
        if (playerPlayHand.length > 0 || computerPlayHand.length > 0) {
          setPlayerPlayedCards([]);
          setComputerPlayedCards([]);
          setAllPlayedCards([]);
          setCurrentCount(0);
          setLastGoPlayer(null);

          if (playerPlayHand.length > 0 && computerPlayHand.length === 0) {
            setCurrentPlayer('player');
            setMessage('Your turn - play your remaining cards');
          } else if (computerPlayHand.length > 0 && playerPlayHand.length === 0) {
            setCurrentPlayer('computer');
            setMessage("Computer plays remaining cards");
          } else if (playerPlayHand.length > 0 && computerPlayHand.length > 0) {
            const nextPlayer = lastPlayedBy === 'player' ? 'computer' : 'player';
            setCurrentPlayer(nextPlayer);
            setMessage(`${nextPlayer === 'player' ? 'Your' : "Computer's"} turn - new round`);
          }

          setLastPlayedBy(null);
        }
      } else {
        // Determine next player, but check if they have cards to play
        let nextPlayer = scoringPlayer === 'player' ? 'computer' : 'player';

        // Check if the intended next player has any playable cards
        const nextPlayerHand = nextPlayer === 'player' ? playerPlayHand : computerPlayHand;
        const otherPlayerHand = nextPlayer === 'player' ? computerPlayHand : playerPlayHand;
        const nextPlayerCanPlay = nextPlayerHand.some(card => currentCount + card.value <= 31);
        const otherPlayerCanPlay = otherPlayerHand.some(card => currentCount + card.value <= 31);

        if (nextPlayerHand.length === 0 || !nextPlayerCanPlay) {
          // Next player has no cards or can't play any
          if (otherPlayerHand.length > 0 && otherPlayerCanPlay) {
            // Other player can still play
            nextPlayer = nextPlayer === 'player' ? 'computer' : 'player';
            setCurrentPlayer(nextPlayer);
            setMessage(`${nextPlayer === 'player' ? 'Your' : "Computer's"} turn`);
          } else if (otherPlayerHand.length === 0 && nextPlayerHand.length === 0) {
            // Both out of cards
            moveToCountingPhase();
            return;
          } else {
            // Neither can play at current count - award last card point
            if (lastPlayedBy) {
              setPendingScore({ player: lastPlayedBy, points: 1, reason: 'One for last card' });
              setMessage(`${lastPlayedBy === 'player' ? 'You get' : 'Computer gets'} 1 point for last card - Click Accept`);
            }
          }
        } else {
          setCurrentPlayer(nextPlayer);
          setMessage(`${nextPlayer === 'player' ? 'Your' : "Computer's"} turn`);
        }
      }
    }
  };

  // Computer makes a play - useEffect
  useEffect(() => {
    if (gameState === 'play' && currentPlayer === 'computer' && !pendingScore) {
      const timer = setTimeout(() => {
        const card = computerSelectPlay(computerPlayHand, allPlayedCards, currentCount);

        if (card) {
          const newCount = currentCount + card.value;
          const newAllPlayed = [...allPlayedCards, card];
          const { score, reason } = calculatePeggingScore(newAllPlayed, newCount);

          const newComputerPlayHand = computerPlayHand.filter(c => !(c.rank === card.rank && c.suit === card.suit));
          setComputerPlayHand(newComputerPlayHand);
          setComputerPlayedCards(prev => [...prev, card]);
          setAllPlayedCards(newAllPlayed);
          setCurrentCount(newCount);
          setLastPlayedBy('computer');

          logGameEvent('PLAY_CARD', {
            player: 'computer',
            card: card,
            newCount: newCount,
            score: score,
            reason: reason,
            remainingCards: newComputerPlayHand.length
          });

          // Add to pegging history
          setPeggingHistory(prev => [...prev, {
            type: 'play',
            player: 'computer',
            card: `${card.rank}${card.suit}`,
            count: newCount,
            points: score,
            reason: reason || null
          }]);

          const isLastCard = newComputerPlayHand.length === 0;
          const playerOutOfCards = playerPlayHand.length === 0;

          if (score > 0) {
            if (isLastCard && playerOutOfCards) {
              setPendingScore({
                player: 'computer',
                points: score,
                reason: `Computer plays ${card.rank}${card.suit} - ${reason}`,
                needsLastCard: true
              });
              setMessage(`Computer plays ${card.rank}${card.suit} for ${score} - ${reason} - Click Accept`);
            } else {
              setPendingScore({ player: 'computer', points: score, reason: `Computer plays ${card.rank}${card.suit} - ${reason}` });
              setMessage(`Computer plays ${card.rank}${card.suit} for ${score} - ${reason} - Click Accept`);
            }
          } else if (isLastCard && playerOutOfCards) {
            setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
            setMessage('Computer gets 1 point for last card - Click Accept');
          } else {
            setMessage(`Computer plays ${card.rank}${card.suit} (count: ${newCount})`);

            if (playerPlayHand.length > 0) {
              setCurrentPlayer('player');
            } else {
              const canContinue = newComputerPlayHand.some(c => newCount + c.value <= 31);
              if (!canContinue && newComputerPlayHand.length > 0) {
                setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
                setMessage('Computer gets 1 point for last card - Click Accept');
              }
            }
          }
        } else {
          setMessage('Computer says "Go"');
          setLastGoPlayer('computer');

          logGameEvent('COMPUTER_GO', {
            player: 'computer',
            currentCount: currentCount,
            remainingCards: computerPlayHand.length
          });

          // Add Go to pegging history
          setPeggingHistory(prev => [...prev, {
            type: 'go',
            player: 'computer',
            count: currentCount
          }]);

          const playerCanStillPlay = playerPlayHand.some(card => currentCount + card.value <= 31);

          if (playerCanStillPlay) {
            setCurrentPlayer('player');
            setMessage('Computer says "Go" - You can still play');
          } else {
            if (lastPlayedBy === 'player') {
              setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
              setMessage('Computer says "Go" - You get 1 point for last card - Click Accept');
            } else if (lastPlayedBy === 'computer') {
              setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
              setMessage('Computer says "Go" and gets 1 point for last card - Click Accept');
            }
          }
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState, pendingScore, computerPlayHand, allPlayedCards, currentCount, playerPlayHand, lastPlayedBy]);

  // Player makes a play
  const playerPlay = (card) => {
    if (currentPlayer !== 'player' || pendingScore) return;
    if (currentCount + card.value > 31) {
      setMessage("Can't play that card - total would exceed 31");
      return;
    }

    const newCount = currentCount + card.value;
    const newAllPlayed = [...allPlayedCards, card];
    const { score, reason } = calculatePeggingScore(newAllPlayed, newCount);

    const newPlayerPlayHand = playerPlayHand.filter(c => !(c.rank === card.rank && c.suit === card.suit));
    setPlayerPlayHand(newPlayerPlayHand);
    setPlayerPlayedCards(prev => [...prev, card]);
    setAllPlayedCards(newAllPlayed);
    setCurrentCount(newCount);
    setLastPlayedBy('player');

    logGameEvent('PLAY_CARD', {
      player: 'player',
      card: card,
      newCount: newCount,
      score: score,
      reason: reason,
      remainingCards: newPlayerPlayHand.length
    });

    // Add to pegging history
    setPeggingHistory(prev => [...prev, {
      type: 'play',
      player: 'player',
      card: `${card.rank}${card.suit}`,
      count: newCount,
      points: score,
      reason: reason || null
    }]);

    const isLastCard = newPlayerPlayHand.length === 0;
    const computerOutOfCards = computerPlayHand.length === 0;

    if (score > 0) {
      if (isLastCard && computerOutOfCards) {
        setPendingScore({
          player: 'player',
          points: score,
          reason: `You played ${card.rank}${card.suit} - ${reason}`,
          needsLastCard: true
        });
        setMessage(`You scored ${score} - ${reason}! Click Accept (then claim last card)`);
      } else {
        setPendingScore({ player: 'player', points: score, reason: `You played ${card.rank}${card.suit} - ${reason}` });
        setMessage(`You scored ${score} - ${reason}! Click Accept`);
      }
    } else if (isLastCard && computerOutOfCards) {
      setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
      setMessage('You get 1 point for last card - Click Accept');
    } else {
      setMessage(`You played ${card.rank}${card.suit} (count: ${newCount})`);
      setCurrentPlayer('computer');
    }
  };

  // Player says go
  const playerGo = () => {
    if (currentPlayer !== 'player' || pendingScore) return;

    setMessage('You say "Go"');
    setLastGoPlayer('player');

    logGameEvent('PLAYER_GO', {
      player: 'player',
      currentCount: currentCount,
      remainingCards: playerPlayHand.length
    });

    // Add Go to pegging history
    setPeggingHistory(prev => [...prev, {
      type: 'go',
      player: 'player',
      count: currentCount
    }]);

    const computerCanPlay = computerPlayHand.some(card => currentCount + card.value <= 31);

    if (computerCanPlay) {
      setCurrentPlayer('computer');
    } else {
      if (lastPlayedBy) {
        if (lastPlayedBy === 'player') {
          setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
          setMessage('You claim 1 point for last card - Click Accept');
        } else {
          setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
          setMessage('Computer gets 1 point for last card - Click Accept');
        }
      }
    }
  };

  // Player claims last card point
  const claimLastCard = () => {
    if (currentPlayer !== 'player' || pendingScore) return;

    setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
    setMessage('You claim 1 point for last card - Click Accept');

    if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
      return;
    }
  };

  // Submit player's count
  const submitPlayerCount = () => {
    const claimed = parseInt(playerCountInput);
    if (isNaN(claimed)) {
      setMessage('Please enter a valid number');
      return;
    }

    addDebugLog(`Player submitting count - counterIsComputer: ${counterIsComputer}, handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);

    if (counterIsComputer) {
      addDebugLog('BLOCKED: Not player turn');
      return;
    }

    let hand;
    let handType;
    if (handsCountedThisRound === 0 && dealer === 'computer') {
      hand = playerHand;
      handType = 'hand';
      addDebugLog('Player counting as non-dealer (hand)');
    } else if (handsCountedThisRound === 0 && dealer === 'player') {
      addDebugLog('ERROR: Player trying to count when they should not');
      return;
    } else if (handsCountedThisRound === 1 && dealer === 'player') {
      hand = playerHand;
      handType = 'hand';
      addDebugLog('Player counting as dealer (hand)');
    } else if (handsCountedThisRound === 2 && dealer === 'player') {
      hand = crib;
      handType = 'crib';
      addDebugLog('Player counting as dealer (crib)');
    } else {
      addDebugLog(`ERROR: Player counting in wrong situation`);
      return;
    }

    const { score, breakdown } = calculateHandScore(hand, cutCard, handType === 'crib');
    setActualScore({ score, breakdown });

    logGameEvent('PLAYER_COUNT', {
      handType: handType,
      claimed: claimed,
      actual: score,
      hand: hand,
      handsCountedThisRound: handsCountedThisRound
    });

    // Add to counting history
    setCountingHistory(prev => [...prev, {
      player: 'player',
      handType,
      cards: hand.map(c => `${c.rank}${c.suit}`),
      cutCard: `${cutCard.rank}${cutCard.suit}`,
      claimed,
      actual: score,
      breakdown
    }]);

    const newHandsCountedThisRound = handsCountedThisRound + 1;
    setHandsCountedThisRound(newHandsCountedThisRound);
    setPlayerCountInput('');
    setShowBreakdown(true);

    if (claimed === score) {
      setMessage(`Correct! ${score} points`);
      setPlayerScore(prev => prev + score);
      addDebugLog(`Player count correct. Hands counted now: ${newHandsCountedThisRound}`);

      // Auto-advance after short delay for correct counts
      setTimeout(() => {
        proceedAfterPlayerCount(newHandsCountedThisRound);
      }, 2500);
    } else if (claimed < score) {
      setMessage(`You undercounted! You claimed ${claimed} but it's ${score} - You only get ${claimed}. Review the breakdown and click Continue.`);
      setPlayerScore(prev => prev + claimed);
      addDebugLog(`Player undercounted. Waiting for acknowledgment. Hands counted now: ${newHandsCountedThisRound}`);

      // Wait for player to acknowledge
      setPendingCountContinue({ newHandsCountedThisRound, type: 'undercount' });
    } else {
      setMessage(`Muggins! You overcounted. You claimed ${claimed} but it's only ${score}. You get 0 points. Review the breakdown and click Continue.`);
      // No points for overcounting
      addDebugLog(`Player overcounted. Waiting for acknowledgment. Hands counted now: ${newHandsCountedThisRound}`);

      // Wait for player to acknowledge
      setPendingCountContinue({ newHandsCountedThisRound, type: 'overcount' });
    }
  };

  // Continue after player acknowledges their count result
  const handleCountContinue = () => {
    if (!pendingCountContinue) return;

    const { newHandsCountedThisRound } = pendingCountContinue;
    addDebugLog(`Player acknowledged count result. Continuing...`);
    setPendingCountContinue(null);
    proceedAfterPlayerCount(newHandsCountedThisRound);
  };

  // Common logic for proceeding after player count
  const proceedAfterPlayerCount = (newHandsCountedThisRound) => {
    setShowBreakdown(false);
    setActualScore(null);

    if (newHandsCountedThisRound >= 3) {
      addDebugLog('All counting complete - checking for game end');
      setCountingTurn('');
      setCounterIsComputer(null);

      setTimeout(() => {
        if (playerScore >= 121 || computerScore >= 121) {
          setGameState('gameOver');
          setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
        } else {
          setMessage('Hand complete - Dealing next hand...');
          setTimeout(() => {
            setDealer(dealer === 'player' ? 'computer' : 'player');
            const newDeck = shuffleDeck(createDeck());
            setDeck(newDeck);
            dealHands(newDeck);
          }, 1500);
        }
      }, 100);
    } else if (newHandsCountedThisRound === 1) {
      addDebugLog(`First count done by player, dealer (${dealer}) counts hand next`);
      setCountingTurn(dealer);
      setCounterIsComputer(dealer === 'computer');
      setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
    } else if (newHandsCountedThisRound === 2) {
      addDebugLog(`Second count done by player, dealer (${dealer}) counts crib next`);
      setCountingTurn('crib');
      setCounterIsComputer(dealer === 'computer');
      setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
    }
  };

  // Computer counts
  const computerCounts = () => {
    addDebugLog(`computerCounts() called - counterIsComputer: ${counterIsComputer}, handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);

    if (!counterIsComputer || handsCountedThisRound >= 3) {
      addDebugLog(`BLOCKED: counterIsComputer=${counterIsComputer}, handsCountedThisRound=${handsCountedThisRound}`);
      return;
    }

    if (isProcessingCount) {
      addDebugLog('BLOCKED: computerCounts() blocked by isProcessingCount flag');
      return;
    }

    if (computerClaimedScore !== null) {
      addDebugLog('BLOCKED: computerCounts() blocked - already has claimed score');
      return;
    }

    // Reset decision state for new count
    setPlayerMadeCountDecision(false);
    setShowMugginsPreferenceDialog(false);

    setIsProcessingCount(true);
    addDebugLog('Set isProcessingCount = true');

    let hand;
    let handType;
    if (handsCountedThisRound === 0 && dealer === 'player') {
      hand = computerHand;
      handType = 'hand';
      addDebugLog('Computer counting as non-dealer (hand)');
    } else if (handsCountedThisRound === 1 && dealer === 'computer') {
      hand = computerHand;
      handType = 'hand';
      addDebugLog('Computer counting as dealer (hand)');
    } else if (handsCountedThisRound === 2 && dealer === 'computer') {
      hand = crib;
      handType = 'crib';
      addDebugLog('Computer counting as dealer (crib)');
    } else {
      addDebugLog(`ERROR: Computer counting in wrong situation`);
      setIsProcessingCount(false);
      return;
    }

    addDebugLog(`Computer counting their ${handType}`);

    // Store the hand being counted for history
    setComputerCountingHand({
      handType,
      cards: hand.map(c => `${c.rank}${c.suit}`)
    });

    const { score, breakdown } = calculateHandScore(hand, cutCard, handType === 'crib');
    setActualScore({ score, breakdown });

    let claimed = score;
    if (Math.random() < 0.1 && score > 0) {
      const error = Math.random() < 0.5 ? -2 : 2;
      claimed = Math.max(0, score + error);
      addDebugLog(`Computer making counting error: actual ${score}, claiming ${claimed}`);
    }

    setComputerClaimedScore(claimed);
    addDebugLog(`Computer claims ${claimed} points for ${handType}`);
    setMessage(`Computer claims ${claimed} points for ${handType === 'crib' ? 'the crib' : 'their hand'} - Do you accept?`);
  };

  // Accept computer's count
  const acceptComputerCount = () => {
    addDebugLog(`acceptComputerCount() - claimed: ${computerClaimedScore}, handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);

    setPlayerMadeCountDecision(true);
    const { score, breakdown } = actualScore;
    if (computerClaimedScore <= score) {
      // Add to counting history
      if (computerCountingHand) {
        setCountingHistory(prev => [...prev, {
          player: 'computer',
          handType: computerCountingHand.handType,
          cards: computerCountingHand.cards,
          cutCard: `${cutCard.rank}${cutCard.suit}`,
          claimed: computerClaimedScore,
          actual: score,
          breakdown
        }]);
      }

      setComputerScore(prev => {
        addDebugLog(`Computer score: ${prev} -> ${prev + computerClaimedScore}`);
        return prev + computerClaimedScore;
      });

      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);
      addDebugLog(`Computer count accepted. Hands counted now: ${newHandsCountedThisRound}`);

      setMessage(`Computer scores ${computerClaimedScore} points`);
      setShowBreakdown(false);
      setActualScore(null);
      setComputerClaimedScore(null);
      setIsProcessingCount(false);

      setTimeout(() => {
        addDebugLog(`After accepting computer count, newHandsCountedThisRound: ${newHandsCountedThisRound}`);

        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete - checking for game end');
          setCountingTurn('');
          setCounterIsComputer(null);

          setTimeout(() => {
            if (playerScore >= 121 || computerScore >= 121) {
              setGameState('gameOver');
              setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
            } else {
              setMessage('Hand complete - Dealing next hand...');
              setTimeout(() => {
                setDealer(dealer === 'player' ? 'computer' : 'player');
                const newDeck = shuffleDeck(createDeck());
                setDeck(newDeck);
                dealHands(newDeck);
              }, 1500);
            }
          }, 100);
        } else if (newHandsCountedThisRound === 1) {
          addDebugLog(`First count done, dealer (${dealer}) counts hand next`);
          setCountingTurn(dealer);
          setCounterIsComputer(dealer === 'computer');
          setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
        } else if (newHandsCountedThisRound === 2) {
          addDebugLog(`Second count done, dealer (${dealer}) counts crib next`);
          setCountingTurn('crib');
          setCounterIsComputer(dealer === 'computer');
          setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
        }
      }, 1500);
    }
  };

  // Apply the result of a wrong muggins call based on preference
  const applyWrongMugginsResult = (preference, resultData) => {
    const { score, claimed, newHandsCountedThisRound } = resultData;

    if (preference === '2-points') {
      setMessage(`Wrong call! Computer's count was correct (${claimed}). Computer gets ${claimed} + 2 penalty points.`);
      setComputerScore(prev => prev + claimed + 2);
    } else {
      setMessage(`Wrong call! Computer's count was correct. They get ${claimed} points.`);
      setComputerScore(prev => prev + claimed);
    }

    setShowBreakdown(true);
    setPlayerMadeCountDecision(true);

    setTimeout(() => {
      setShowBreakdown(false);
      setActualScore(null);
      setComputerClaimedScore(null);
      setIsProcessingCount(false);
      setPlayerMadeCountDecision(false);

      if (newHandsCountedThisRound >= 3) {
        addDebugLog('All counting complete after wrong muggins');
        setCountingTurn('');
        setCounterIsComputer(null);

        setTimeout(() => {
          if (playerScore >= 121 || computerScore >= 121) {
            setGameState('gameOver');
            setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
          } else {
            setMessage('Hand complete - Dealing next hand...');
            setTimeout(() => {
              setDealer(dealer === 'player' ? 'computer' : 'player');
              const newDeck = shuffleDeck(createDeck());
              setDeck(newDeck);
              dealHands(newDeck);
            }, 1500);
          }
        }, 100);
      } else if (newHandsCountedThisRound === 1) {
        setCountingTurn(dealer);
        setCounterIsComputer(dealer === 'computer');
        setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
      } else if (newHandsCountedThisRound === 2) {
        setCountingTurn('crib');
        setCounterIsComputer(dealer === 'computer');
        setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
      }
    }, 3000);
  };

  // Handle muggins preference selection
  const handleMugginsPreferenceChoice = (preference) => {
    saveMugginsPreference(preference);
    setShowMugginsPreferenceDialog(false);
    if (pendingWrongMugginsResult) {
      applyWrongMugginsResult(preference, pendingWrongMugginsResult);
      setPendingWrongMugginsResult(null);
    }
  };

  // Object to computer's count
  const objectToComputerCount = () => {
    const { score, breakdown } = actualScore;
    addDebugLog(`Object to computer count: claimed=${computerClaimedScore}, actual=${score}`);

    setPlayerMadeCountDecision(true);

    // Add to counting history (for all objection cases)
    if (computerCountingHand) {
      setCountingHistory(prev => [...prev, {
        player: 'computer',
        handType: computerCountingHand.handType,
        cards: computerCountingHand.cards,
        cutCard: `${cutCard.rank}${cutCard.suit}`,
        claimed: computerClaimedScore,
        actual: score,
        breakdown,
        objected: true
      }]);
    }

    if (computerClaimedScore > score) {
      // Correct muggins call - computer overcounted
      const mugginsPoints = computerClaimedScore - score;
      setMessage(`MUGGINS! Computer overcounted: claimed ${computerClaimedScore} but actual is ${score}. Computer gets 0, you get ${mugginsPoints}!`);
      setShowBreakdown(true);

      setPlayerScore(prev => prev + mugginsPoints);
      addDebugLog(`Muggins! Player gets ${mugginsPoints} points`);

      logGameEvent('MUGGINS', {
        caughtPlayer: 'computer',
        claimed: computerClaimedScore,
        actual: score,
        mugginsPoints: mugginsPoints,
        breakdown: breakdown
      });

      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);
      addDebugLog(`Computer overcount caught. Hands counted now: ${newHandsCountedThisRound}`);

      setTimeout(() => {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(null);
        setIsProcessingCount(false);
        setPlayerMadeCountDecision(false);

        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete after muggins');
          setCountingTurn('');
          setCounterIsComputer(null);

          setTimeout(() => {
            if (playerScore >= 121 || computerScore >= 121) {
              setGameState('gameOver');
              setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
            } else {
              setMessage('Hand complete - Dealing next hand...');
              setTimeout(() => {
                setDealer(dealer === 'player' ? 'computer' : 'player');
                const newDeck = shuffleDeck(createDeck());
                setDeck(newDeck);
                dealHands(newDeck);
              }, 1500);
            }
          }, 100);
        } else if (newHandsCountedThisRound === 1) {
          addDebugLog(`First count done (muggins), dealer (${dealer}) counts hand next`);
          setCountingTurn(dealer);
          setCounterIsComputer(dealer === 'computer');
          setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
        } else if (newHandsCountedThisRound === 2) {
          addDebugLog(`Second count done (muggins), dealer (${dealer}) counts crib next`);
          setCountingTurn('crib');
          setCounterIsComputer(dealer === 'computer');
          setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
        }
      }, 5000);
    } else if (computerClaimedScore === score) {
      // Wrong muggins call - computer was correct
      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);

      const preference = getMugginsPreference();
      if (!preference) {
        // First time - ask for preference
        setPendingWrongMugginsResult({ score, claimed: computerClaimedScore, newHandsCountedThisRound });
        setShowMugginsPreferenceDialog(true);
        return;
      }

      applyWrongMugginsResult(preference, { score, claimed: computerClaimedScore, newHandsCountedThisRound });
    } else {
      // Computer undercounted - player's objection reveals they could have had more
      setPlayerMadeCountDecision(true);
      setMessage(`Computer undercounted! They claimed ${computerClaimedScore} but could have had ${score}. They get ${computerClaimedScore} points.`);
      setComputerScore(prev => prev + computerClaimedScore);
      setShowBreakdown(true);

      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);

      setTimeout(() => {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(null);
        setIsProcessingCount(false);
        setPlayerMadeCountDecision(false);

        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete after undercount');
          setCountingTurn('');
          setCounterIsComputer(null);

          setTimeout(() => {
            if (playerScore >= 121 || computerScore >= 121) {
              setGameState('gameOver');
              setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
            } else {
              setMessage('Hand complete - Dealing next hand...');
              setTimeout(() => {
                setDealer(dealer === 'player' ? 'computer' : 'player');
                const newDeck = shuffleDeck(createDeck());
                setDeck(newDeck);
                dealHands(newDeck);
              }, 1500);
            }
          }, 100);
        } else if (newHandsCountedThisRound === 1) {
          addDebugLog(`First count done (undercount), dealer (${dealer}) counts hand next`);
          setCountingTurn(dealer);
          setCounterIsComputer(dealer === 'computer');
          setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
        } else if (newHandsCountedThisRound === 2) {
          addDebugLog(`Second count done (undercount), dealer (${dealer}) counts crib next`);
          setCountingTurn('crib');
          setCounterIsComputer(dealer === 'computer');
          setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
        }
      }, 3000);
    }
  };

  // Check if pegging is truly complete
  useEffect(() => {
    if (gameState === 'play' && !pendingScore) {
      if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
        moveToCountingPhase();
      }
    }
  }, [gameState, playerPlayHand.length, computerPlayHand.length, pendingScore]);

  // Use effect for computer counting
  useEffect(() => {
    const shouldComputerCount = gameState === 'counting' &&
                               counterIsComputer === true &&
                               !pendingScore &&
                               !actualScore &&
                               computerClaimedScore === null &&
                               !isProcessingCount &&
                               handsCountedThisRound < 3;

    addDebugLog(`useEffect check - shouldCount: ${shouldComputerCount}, counterIsComputer: ${counterIsComputer}, ` +
                `handsCountedThisRound: ${handsCountedThisRound}, state: ${gameState}, pendingScore: ${!!pendingScore}, ` +
                `actualScore: ${!!actualScore}, computerClaimedScore: ${computerClaimedScore}, isProcessingCount: ${isProcessingCount}`);

    if (shouldComputerCount) {
      addDebugLog('Setting timer for computer to count');
      const timer = setTimeout(() => {
        addDebugLog('Timer fired - calling computerCounts()');
        computerCounts();
      }, 1500);
      return () => {
        addDebugLog('Clearing computer count timer');
        clearTimeout(timer);
      };
    }
  }, [counterIsComputer, gameState, pendingScore, actualScore, computerClaimedScore, isProcessingCount, handsCountedThisRound, dealer, countingTurn]);

  // Check if player can play any card
  const playerCanPlay = playerPlayHand.some(card => currentCount + card.value <= 31);

  return (
    <div className="min-h-screen bg-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-green-800 text-white">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Cribbage</CardTitle>
            <div className="text-center text-green-600 text-xs">v0.1.0-b14</div>
          </CardHeader>
          <CardContent>
            {gameState === 'menu' && (
              <div className="text-center">
                <Button onClick={startNewGame} className="text-lg px-8 py-4">
                  Start New Game
                </Button>
              </div>
            )}

            {/* Cutting for dealer */}
            {gameState === 'cutting' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-lg mb-4">{message}</div>

                  {/* Show cut cards */}
                  <div className="flex justify-center gap-8 mb-6">
                    <div>
                      <div className="text-sm mb-2">Your cut:</div>
                      <LargeCard card={playerCutCard} placeholder={!playerCutCard} />
                    </div>

                    <div>
                      <div className="text-sm mb-2">Computer's cut:</div>
                      <LargeCard card={computerCutCard} placeholder={!computerCutCard} />
                    </div>
                  </div>

                  {!playerCutCard && (
                    <Button onClick={playerCutDeck} className="bg-blue-600 hover:bg-blue-700">
                      Cut Deck
                    </Button>
                  )}
                </div>
              </div>
            )}

            {gameState !== 'menu' && gameState !== 'cutting' && (
              <>
                {/* Visual Cribbage Board */}
                <CribbageBoard
                  playerScore={playerScore}
                  computerScore={computerScore}
                  onPegClick={handlePegClick}
                />

                {/* Scores */}
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="text-lg">Player: {playerScore}/121</div>
                  </div>
                  <div>
                    <div className="text-lg">Computer: {computerScore}/121</div>
                  </div>
                </div>

                {/* Dealer indicator */}
                <div className="text-center mb-4">
                  Dealer: {dealer === 'player' ? 'You' : 'Computer'}
                </div>

                {/* Cut card */}
                {cutCard && (
                  <div className="text-center mb-4">
                    <div className="text-sm mb-1">Cut Card:</div>
                    <CutCard card={cutCard} />
                  </div>
                )}

                {/* Counting phase indicator */}
                {gameState === 'counting' && (
                  <div className="text-center mb-4">
                    <div className="text-sm text-yellow-300 mb-2">
                      Counting: {handsCountedThisRound === 0 ? 'Non-dealer hand' :
                                 handsCountedThisRound === 1 ? 'Dealer hand' :
                                 handsCountedThisRound === 2 ? 'Crib' : 'Complete'}
                      {' • '}
                      {counterIsComputer ? "Computer's turn" : 'Your turn'}
                      {dealer === 'player' && handsCountedThisRound === 2 && ' (your crib)'}
                    </div>
                    <div className="space-x-2">
                      <Button
                        onClick={() => setShowPeggingSummary(!showPeggingSummary)}
                        className="bg-purple-600 hover:bg-purple-700 text-xs"
                      >
                        {showPeggingSummary ? 'Hide' : 'Show'} Pegging Summary
                      </Button>
                      {countingHistory.length > 0 && (
                        <Button
                          onClick={() => setShowCountingHistory(!showCountingHistory)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          {showCountingHistory ? 'Hide' : 'Show'} Counting History
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Pegging Summary Panel */}
                {gameState === 'counting' && showPeggingSummary && peggingHistory.length > 0 && (
                  <div className="mb-4 p-3 bg-purple-900 rounded border border-purple-600">
                    <div className="text-sm font-bold text-purple-300 mb-2">Pegging Summary</div>
                    <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                      {peggingHistory.map((entry, idx) => (
                        <div key={idx} className={`${entry.player === 'player' ? 'text-blue-300' : 'text-red-300'}`}>
                          {entry.type === 'play' && (
                            <>
                              <span className="font-bold">{entry.player === 'player' ? 'You' : 'CPU'}:</span>
                              {' '}{entry.card} → {entry.count}
                              {entry.points > 0 && <span className="text-yellow-300"> (+{entry.points} {entry.reason})</span>}
                            </>
                          )}
                          {entry.type === 'go' && (
                            <>
                              <span className="font-bold">{entry.player === 'player' ? 'You' : 'CPU'}:</span>
                              {' '}"Go" at {entry.count}
                            </>
                          )}
                          {entry.type === 'points' && (
                            <>
                              <span className="font-bold">{entry.player === 'player' ? 'You' : 'CPU'}:</span>
                              {' '}<span className="text-yellow-300">+{entry.points} ({entry.reason})</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-600 text-xs">
                      <span className="text-blue-300">You: {peggingHistory.filter(e => e.type === 'points' && e.player === 'player').reduce((sum, e) => sum + e.points, 0)} pts</span>
                      {' • '}
                      <span className="text-red-300">CPU: {peggingHistory.filter(e => e.type === 'points' && e.player === 'computer').reduce((sum, e) => sum + e.points, 0)} pts</span>
                    </div>
                  </div>
                )}

                {/* Counting History Panel */}
                {gameState === 'counting' && showCountingHistory && countingHistory.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-900 rounded border border-blue-600">
                    <div className="text-sm font-bold text-blue-300 mb-2">Counting History</div>
                    <div className="text-xs space-y-2 max-h-60 overflow-y-auto">
                      {countingHistory.map((entry, idx) => (
                        <div key={idx} className={`p-2 rounded ${entry.player === 'player' ? 'bg-blue-800' : 'bg-red-900'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-bold ${entry.player === 'player' ? 'text-blue-300' : 'text-red-300'}`}>
                              {entry.player === 'player' ? 'You' : 'CPU'} - {entry.handType === 'crib' ? 'Crib' : 'Hand'}
                            </span>
                            <span className="text-yellow-300">
                              {entry.claimed === entry.actual ? (
                                `+${entry.claimed} pts`
                              ) : entry.claimed < entry.actual ? (
                                `+${entry.claimed} (could be ${entry.actual})`
                              ) : (
                                <span className="text-red-400">Overcounted! 0 pts</span>
                              )}
                            </span>
                          </div>
                          <div className="text-gray-300">
                            Cards: {entry.cards.join(', ')} + {entry.cutCard}
                          </div>
                          {entry.breakdown && entry.breakdown.length > 0 && (
                            <div className="text-gray-400 mt-1">
                              {entry.breakdown.map((b, i) => (
                                <span key={i}>{i > 0 ? ', ' : ''}{b.points}pts ({b.description})</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Play area with separate stacks */}
                {gameState === 'play' && (
                  <div className="mb-6">
                    <div className="text-center mb-2">Count: {currentCount}</div>
                    <div className="bg-green-700 rounded p-4">
                      {/* Computer's played cards */}
                      <div className="mb-3">
                        <div className="text-xs mb-1">Computer's plays:</div>
                        <div className="flex flex-wrap gap-1 min-h-[40px]">
                          {computerPlayedCards.map((card, idx) => (
                            <PlayedCard key={idx} card={card} />
                          ))}
                        </div>
                      </div>
                      {/* Player's played cards */}
                      <div>
                        <div className="text-xs mb-1">Your plays:</div>
                        <div className="flex flex-wrap gap-1 min-h-[40px]">
                          {playerPlayedCards.map((card, idx) => (
                            <PlayedCard key={idx} card={card} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message - dynamic during crib selection */}
                {gameState === 'cribSelect' && selectedCards.length < 2 ? (
                  <GameMessage message={
                    selectedCards.length === 0
                      ? `Select 2 cards for ${dealer === 'player' ? 'your' : "computer's"} crib`
                      : `Select one more card for ${dealer === 'player' ? 'your' : "computer's"} crib`
                  } />
                ) : gameState !== 'cribSelect' ? (
                  <GameMessage message={message} />
                ) : null}

                {/* Pending score accept button */}
                {pendingScore && (
                  <div className="text-center mb-4">
                    <Button onClick={acceptScoreAndContinue} className="bg-yellow-600 hover:bg-yellow-700">
                      Accept {pendingScore.points} Points
                    </Button>
                  </div>
                )}

                {/* Computer hand */}
                <div className={`mb-6 p-2 rounded ${
                  gameState === 'counting' && counterIsComputer && computerClaimedScore !== null &&
                  ((handsCountedThisRound === 0 && dealer === 'player') || (handsCountedThisRound === 1 && dealer === 'computer'))
                    ? 'bg-yellow-900/30 border-2 border-yellow-500' : ''
                }`}>
                  <div className="text-sm mb-2">Computer's Hand: {gameState === 'play' ? `${computerPlayHand.length} cards` : ''}</div>
                  <div className="flex flex-wrap gap-2">
                    {(gameState === 'counting' || gameState === 'gameOver' ? computerHand :
                      gameState === 'play' ? computerPlayHand :
                      computerHand).map((card, idx) => (
                      <PlayingCard
                        key={idx}
                        card={card}
                        faceDown={gameState !== 'counting' && gameState !== 'gameOver'}
                        revealed={gameState === 'counting' || gameState === 'gameOver'}
                        highlighted={
                          gameState === 'counting' && counterIsComputer && computerClaimedScore !== null &&
                          ((handsCountedThisRound === 0 && dealer === 'player') || (handsCountedThisRound === 1 && dealer === 'computer'))
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Player hand */}
                <div className={`mb-6 p-2 rounded ${
                  (gameState === 'cribSelect') ||
                  (gameState === 'play' && currentPlayer === 'player' && !pendingScore) ||
                  (gameState === 'counting' && !counterIsComputer && !pendingCountContinue &&
                   ((handsCountedThisRound === 0 && dealer === 'computer') || (handsCountedThisRound === 1 && dealer === 'player')))
                    ? 'bg-yellow-900/30 border-2 border-yellow-500' : ''
                }`}>
                  <div className="text-sm mb-2">Your Hand: ({gameState === 'play' || gameState === 'counting' ? 4 : playerHand.length} cards)</div>
                  <div className="flex flex-wrap gap-2">
                    {(gameState === 'cribSelect' ? playerHand :
                      gameState === 'play' ? playerPlayHand :
                      playerHand).map((card, idx) => (
                      <PlayingCard
                        key={idx}
                        card={card}
                        selected={selectedCards.some(c => c.rank === card.rank && c.suit === card.suit)}
                        disabled={
                          (gameState === 'play' && (currentCount + card.value > 31 || currentPlayer !== 'player' || pendingScore)) ||
                          (gameState === 'cribSelect' && playerHand.length !== 6)
                        }
                        highlighted={
                          (gameState === 'cribSelect') ||
                          (gameState === 'play' && currentPlayer === 'player' && !pendingScore) ||
                          (gameState === 'counting' && !counterIsComputer && !pendingCountContinue &&
                           ((handsCountedThisRound === 0 && dealer === 'computer') || (handsCountedThisRound === 1 && dealer === 'player')))
                        }
                        onClick={() => {
                          if (gameState === 'cribSelect' && playerHand.length === 6) toggleCardSelection(card);
                          else if (gameState === 'play' && currentPlayer === 'player' && !pendingScore) playerPlay(card);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Crib display during counting */}
                {gameState === 'counting' && ((countingTurn === 'crib' && handsCountedThisRound === 2) ||
                 (actualScore && computerClaimedScore !== null && handsCountedThisRound === 2 && dealer === 'computer') ||
                 (actualScore && !counterIsComputer && handsCountedThisRound === 2 && dealer === 'player') ||
                 (pendingCountContinue && handsCountedThisRound === 3)) && (
                  <div className={`mb-6 p-2 rounded ${
                    (counterIsComputer && computerClaimedScore !== null && handsCountedThisRound === 2 && dealer === 'computer') ||
                    (!counterIsComputer && !pendingCountContinue && handsCountedThisRound === 2 && dealer === 'player')
                      ? 'bg-yellow-900/30 border-2 border-yellow-500' : ''
                  }`}>
                    <div className="text-sm mb-2">Crib ({dealer === 'player' ? 'Yours' : "Computer's"}):</div>
                    <div className="flex flex-wrap gap-2">
                      {crib.map((card, idx) => (
                        <div key={idx} className={`bg-white rounded p-2 text-xl font-bold ${
                          card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                        } ${
                          (counterIsComputer && computerClaimedScore !== null && handsCountedThisRound === 2 && dealer === 'computer') ||
                          (!counterIsComputer && !pendingCountContinue && handsCountedThisRound === 2 && dealer === 'player')
                            ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50' : ''
                        }`}>
                          {card.rank}{card.suit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Counting input */}
                {gameState === 'counting' && !actualScore && !pendingScore && !computerClaimedScore &&
                 counterIsComputer === false && (
                  <div className="text-center mb-4">
                    <input
                      type="number"
                      value={playerCountInput}
                      onChange={(e) => setPlayerCountInput(e.target.value)}
                      className="bg-white text-black p-2 rounded mr-2"
                      placeholder="Your count"
                    />
                    <Button onClick={submitPlayerCount} className="bg-blue-600 hover:bg-blue-700">
                      Submit Count
                    </Button>
                  </div>
                )}

                {/* Computer count verification */}
                {gameState === 'counting' && counterIsComputer && actualScore && !pendingScore && computerClaimedScore !== null && !playerMadeCountDecision && !showMugginsPreferenceDialog && (
                  <div className="text-center mb-4">
                    <div className="bg-yellow-900 border-2 border-yellow-500 rounded p-4 mb-4 inline-block">
                      <div className="text-yellow-300 font-bold mb-2">
                        Computer claims {computerClaimedScore} points
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        Count the hand yourself to verify!
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={acceptComputerCount} className="bg-green-600 hover:bg-green-700">
                          Accept
                        </Button>
                        <Button onClick={objectToComputerCount} className="bg-red-600 hover:bg-red-700">
                          Muggins!
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Muggins penalty preference dialog */}
                {showMugginsPreferenceDialog && (
                  <div className="text-center mb-4">
                    <div className="bg-purple-900 border-2 border-purple-500 rounded p-4 mb-4 inline-block">
                      <div className="text-purple-300 font-bold mb-2">
                        Wrong Muggins Call!
                      </div>
                      <div className="text-sm text-gray-300 mb-3">
                        Computer's count was correct. What penalty for wrong Muggins calls?
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => handleMugginsPreferenceChoice('no-penalty')} className="bg-green-600 hover:bg-green-700">
                          No Penalty (traditional)
                        </Button>
                        <Button onClick={() => handleMugginsPreferenceChoice('2-points')} className="bg-red-600 hover:bg-red-700">
                          2 Point Penalty
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        This preference will be saved for future games
                      </div>
                    </div>
                  </div>
                )}

                {/* Score breakdown - only show after player decides (when computer counting) or always (when player counting) */}
                <ScoreBreakdown
                  actualScore={actualScore}
                  show={gameState === 'counting' && (!counterIsComputer || playerMadeCountDecision)}
                />

                {/* Continue button after player miscount */}
                {pendingCountContinue && (
                  <div className="text-center mb-4">
                    <Button
                      onClick={handleCountContinue}
                      className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {/* Discard button - only show when 2 cards selected */}
                {gameState === 'cribSelect' && selectedCards.length === 2 && playerHand.length === 6 && (
                  <div className="text-center">
                    <Button
                      onClick={discardToCrib}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Discard
                    </Button>
                  </div>
                )}

                {/* Action buttons for play phase */}
                {gameState === 'play' && currentPlayer === 'player' && !pendingScore && (
                  <div className="text-center space-x-2">
                    {playerPlayHand.length > 0 && currentCount >= 21 && (
                      <Button onClick={playerGo} className="bg-red-600 hover:bg-red-700">
                        Go
                      </Button>
                    )}
                    {lastGoPlayer === 'computer' && !playerCanPlay && lastPlayedBy === 'player' && !pendingScore && (
                      <Button onClick={claimLastCard} className="bg-green-600 hover:bg-green-700">
                        Claim Last Card (1 point)
                      </Button>
                    )}
                  </div>
                )}

                {gameState === 'gameOver' && (
                  <div className="text-center">
                    <Button onClick={startNewGame} className="bg-green-600 hover:bg-green-700">
                      New Game
                    </Button>
                  </div>
                )}

                {/* Debug Panel */}
                <DebugPanel
                  debugLog={debugLog}
                  gameLog={gameLog}
                  gameState={{
                    state: gameState,
                    dealer,
                    playerScore,
                    computerScore,
                    handsCountedThisRound,
                    counterIsComputer,
                    countingTurn,
                    computerClaimedScore,
                    pendingCountContinue,
                    peggingHistory,
                    playerHand: playerHand?.map(c => `${c.rank}${c.suit}`),
                    computerHand: computerHand?.map(c => `${c.rank}${c.suit}`),
                    crib: crib?.map(c => `${c.rank}${c.suit}`),
                    cutCard: cutCard ? `${cutCard.rank}${cutCard.suit}` : null,
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
