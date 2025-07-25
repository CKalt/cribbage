'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Card suits and ranks
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const rankValues = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10 };

// Create a deck of cards
const createDeck = () => {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, value: rankValues[rank] });
    }
  }
  return deck;
};

// Shuffle deck
const shuffleDeck = (deck) => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Calculate hand score (for counting phase)
const calculateHandScore = (hand, cutCard, isCrib = false) => {
  let score = 0;
  let breakdown = [];
  const allCards = [...hand, cutCard];
  
  console.log(`Calculating score for hand: ${hand.map(c => c.rank + c.suit).join(', ')}, cut: ${cutCard.rank}${cutCard.suit}, isCrib: ${isCrib}`);
  
  // Fifteens - find all combinations that sum to 15
  for (let i = 0; i < (1 << allCards.length); i++) {
    let sum = 0;
    let combo = [];
    for (let j = 0; j < allCards.length; j++) {
      if (i & (1 << j)) {
        sum += allCards[j].value;
        combo.push(`${allCards[j].rank}${allCards[j].suit}`);
      }
    }
    if (sum === 15 && combo.length >= 2) {
      score += 2;
      breakdown.push(`Fifteen (${combo.join('+')}): 2`);
    }
  }
  
  // Pairs
  for (let i = 0; i < allCards.length; i++) {
    for (let j = i + 1; j < allCards.length; j++) {
      if (allCards[i].rank === allCards[j].rank) {
        score += 2;
        breakdown.push(`Pair (${allCards[i].rank}${allCards[i].suit}-${allCards[j].rank}${allCards[j].suit}): 2`);
      }
    }
  }
  
  // Runs - check for sequences of 3, 4, or 5 cards
  const rankOrder = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
  
  let maxRunLength = 0;
  let runCombinations = [];
  
  for (let size = 5; size >= 3; size--) {
    for (let i = 0; i < (1 << allCards.length); i++) {
      let selectedCards = [];
      for (let j = 0; j < allCards.length; j++) {
        if (i & (1 << j)) selectedCards.push(allCards[j]);
      }
      
      if (selectedCards.length === size) {
        const sorted = selectedCards.map(c => ({ ...c, order: rankOrder[c.rank] })).sort((a, b) => a.order - b.order);
        let isRun = true;
        for (let k = 1; k < sorted.length; k++) {
          if (sorted[k].order !== sorted[k - 1].order + 1) {
            isRun = false;
            break;
          }
        }
        
        if (isRun && size >= maxRunLength) {
          if (size > maxRunLength) {
            maxRunLength = size;
            runCombinations = [sorted.map(c => `${c.rank}${c.suit}`).join('-')];
          } else if (size === maxRunLength) {
            const runStr = sorted.map(c => `${c.rank}${c.suit}`).join('-');
            if (!runCombinations.includes(runStr)) {
              runCombinations.push(runStr);
            }
          }
        }
      }
    }
    if (runCombinations.length > 0) break;
  }
  
  runCombinations.forEach(run => {
    score += maxRunLength;
    breakdown.push(`Run of ${maxRunLength} (${run}): ${maxRunLength}`);
  });
  
  // Flush - only count cards in hand (not cut card initially)
  const handSuits = {};
  hand.forEach(card => {
    handSuits[card.suit] = (handSuits[card.suit] || 0) + 1;
  });
  
  for (const suit in handSuits) {
    if (handSuits[suit] === 4) {
      score += 4;
      breakdown.push(`Flush (4 ${suit}): 4`);
      if (cutCard.suit === suit) {
        score += 1;
        breakdown.push(`Flush with cut (5 ${suit}): 1`);
      }
    }
  }
  
  // Nobs (Jack of same suit as cut card in hand) - only check cards in hand, not cut card
  console.log(`Checking nobs: hand cards = ${hand.map(c => c.rank + c.suit).join(', ')}, cut card = ${cutCard.rank}${cutCard.suit}`);
  hand.forEach(card => {
    console.log(`Checking card ${card.rank}${card.suit}: rank=${card.rank}, suit=${card.suit}, cut suit=${cutCard.suit}`);
    if (card.rank === 'J' && card.suit === cutCard.suit) {
      score += 1;
      breakdown.push(`Nobs (J${card.suit} matches cut card ${cutCard.rank}${cutCard.suit}): 1`);
      console.log(`NOBS FOUND! Jack of ${card.suit} matches cut card suit ${cutCard.suit}`);
    }
  });
  
  console.log(`Final score: ${score}, breakdown:`, breakdown);
  return { score, breakdown };
};

// Calculate pegging score for the last played card
const calculatePeggingScore = (playedCards, currentCount) => {
  if (playedCards.length === 0) return { score: 0, reason: '' };
  
  let score = 0;
  let reasons = [];
  
  // Check for 15
  if (currentCount === 15) {
    score += 2;
    reasons.push('fifteen for 2');
  }
  
  // Check for 31
  if (currentCount === 31) {
    score += 2;
    reasons.push('thirty-one for 2');
  }
  
  // Check for pairs/trips/quads
  if (playedCards.length >= 2) {
    let matchCount = 1;
    const lastRank = playedCards[playedCards.length - 1].rank;
    
    for (let i = playedCards.length - 2; i >= 0; i--) {
      if (playedCards[i].rank === lastRank) {
        matchCount++;
      } else {
        break;
      }
    }
    
    if (matchCount === 2) {
      score += 2;
      reasons.push('pair for 2');
    } else if (matchCount === 3) {
      score += 6;
      reasons.push('three of a kind for 6');
    } else if (matchCount === 4) {
      score += 12;
      reasons.push('four of a kind for 12');
    }
  }
  
  // Check for runs (must be at least 3 cards and check only the most recent cards)
  if (playedCards.length >= 3) {
    const rankOrder = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
    
    // Try different run lengths starting from the longest possible
    for (let runLength = Math.min(7, playedCards.length); runLength >= 3; runLength--) {
      const recentCards = playedCards.slice(-runLength);
      const sortedRanks = recentCards.map(c => rankOrder[c.rank]).sort((a, b) => a - b);
      
      let isRun = true;
      for (let i = 1; i < sortedRanks.length; i++) {
        if (sortedRanks[i] !== sortedRanks[i - 1] + 1) {
          isRun = false;
          break;
        }
      }
      
      if (isRun) {
        score += runLength;
        reasons.push(`run of ${runLength} for ${runLength}`);
        break; // Only count the longest run
      }
    }
  }
  
  return { score, reason: reasons.join(' and ') };
};

// Computer AI - select cards for crib
const computerSelectCrib = (hand, isDealer) => {
  if (hand.length !== 6) {
    console.error('computerSelectCrib called with wrong number of cards:', hand.length);
    return hand.slice(0, 4); // Fallback
  }
  
  let bestCards = [];
  let bestScore = -1000;
  
  // Try all combinations of 4 cards to keep
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const kept = hand.filter((_, idx) => idx !== i && idx !== j);
      
      if (kept.length !== 4) {
        console.error('Kept cards should be 4 but is', kept.length);
        continue;
      }
      
      const discarded = [hand[i], hand[j]];
      
      // Estimate potential score
      let score = 0;
      
      // Count guaranteed points in kept cards
      // Fifteens
      for (let a = 0; a < kept.length; a++) {
        for (let b = a + 1; b < kept.length; b++) {
          if (kept[a].value + kept[b].value === 15) score += 2;
        }
      }
      
      // Pairs
      for (let a = 0; a < kept.length; a++) {
        for (let b = a + 1; b < kept.length; b++) {
          if (kept[a].rank === kept[b].rank) score += 2;
        }
      }
      
      // Potential for runs
      const rankOrder = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
      const keptRanks = kept.map(c => rankOrder[c.rank]).sort((a, b) => a - b);
      for (let a = 0; a < keptRanks.length - 2; a++) {
        if (keptRanks[a + 2] - keptRanks[a] <= 2) score += 1; // Close to a run
      }
      
      // Prefer to keep 5s (good for 15s)
      kept.forEach(card => {
        if (card.rank === '5') score += 2;
      });
      
      // If dealer, slightly penalize good cards going to our crib
      // If not dealer, heavily penalize good cards going to opponent's crib
      const cribPenalty = isDealer ? 0.3 : 1;
      discarded.forEach(card => {
        if (card.rank === '5') score -= 2 * cribPenalty;
        if (['J', 'Q', 'K'].includes(card.rank) && card.value === 10) score -= 1 * cribPenalty;
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestCards = kept;
      }
    }
  }
  
  // Final safety check
  if (bestCards.length !== 4) {
    console.error('computerSelectCrib returning wrong number of cards:', bestCards.length);
    return hand.slice(0, 4);
  }
  
  return bestCards;
};

// Computer AI - select card to play
const computerSelectPlay = (hand, playedCards, currentCount) => {
  const validCards = hand.filter(card => currentCount + card.value <= 31);
  
  if (validCards.length === 0) return null;
  if (validCards.length === 1) return validCards[0];
  
  let bestCard = null;
  let bestScore = -1000;
  
  validCards.forEach(card => {
    let score = 0;
    const newCount = currentCount + card.value;
    const tempPlayed = [...playedCards, card];
    
    // Calculate immediate points
    const { score: immediatePoints } = calculatePeggingScore(tempPlayed, newCount);
    score += immediatePoints * 10;
    
    // Prefer to play cards that don't give opponent easy points
    const remaining = 31 - newCount;
    if (remaining === 10 || remaining === 5) score -= 5; // Might give opponent 15
    if (remaining >= 1 && remaining <= 6) score -= 2; // Might give opponent 31
    
    // Keep low cards for later if possible
    if (card.value <= 4 && currentCount < 15) score -= 1;
    
    // Random factor to make AI less predictable
    score += Math.random() * 0.5;
    
    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  });
  
  return bestCard;
};

export default function CribbageGame() {
  const [gameState, setGameState] = useState('menu');
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [crib, setCrib] = useState([]);
  const [cutCard, setCutCard] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [dealer, setDealer] = useState('player');
  const [selectedCards, setSelectedCards] = useState([]);
  const [playerPlayedCards, setPlayerPlayedCards] = useState([]);
  const [computerPlayedCards, setComputerPlayedCards] = useState([]);
  const [allPlayedCards, setAllPlayedCards] = useState([]); // Track order for scoring
  const [currentCount, setCurrentCount] = useState(0);
  const [message, setMessage] = useState('');
  const [playerPlayHand, setPlayerPlayHand] = useState([]);
  const [computerPlayHand, setComputerPlayHand] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [lastPlayedBy, setLastPlayedBy] = useState(null);
  const [lastGoPlayer, setLastGoPlayer] = useState(null);
  const [pendingScore, setPendingScore] = useState(null);
  const [countingTurn, setCountingTurn] = useState('');
  const [playerCountInput, setPlayerCountInput] = useState('');
  const [computerClaimedScore, setComputerClaimedScore] = useState(0);
  const [actualScore, setActualScore] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [playerCutCard, setPlayerCutCard] = useState(null);
  const [computerCutCard, setComputerCutCard] = useState(null);
  const [isProcessingCount, setIsProcessingCount] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [counterIsComputer, setCounterIsComputer] = useState(null);
  const [handsCountedThisRound, setHandsCountedThisRound] = useState(0);
  const [gameLog, setGameLog] = useState([]);
  const [showGameLog, setShowGameLog] = useState(false);
  const [replayMode, setReplayMode] = useState(false);
  const [replayLog, setReplayLog] = useState(null);
  const [replayIndex, setReplayIndex] = useState(0);

  // Enhanced logging function that logs both debug and game events
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-50), `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
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
    
    // Also add to debug log for immediate visibility
    addDebugLog(`GAME EVENT: ${eventType} - ${JSON.stringify(data)}`);
  };

  // Copy game log to clipboard
  const copyGameLog = () => {
    const logText = JSON.stringify(gameLog, null, 2);
    navigator.clipboard.writeText(logText).then(() => {
      alert('Game log copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy log:', err);
      alert('Failed to copy log. Check console for details.');
    });
  };

  // Load replay log
  const loadReplayLog = () => {
    const input = prompt('Paste the game log JSON here:');
    if (input) {
      try {
        const log = JSON.parse(input);
        setReplayLog(log);
        setReplayMode(true);
        setReplayIndex(0);
        alert(`Loaded replay with ${log.length} events. Click "Next Event" to replay.`);
      } catch (err) {
        alert('Invalid log format. Please paste a valid JSON log.');
      }
    }
  };

  // Process next replay event
  const nextReplayEvent = () => {
    if (!replayLog || replayIndex >= replayLog.length) {
      alert('Replay complete!');
      setReplayMode(false);
      return;
    }

    const event = replayLog[replayIndex];
    addDebugLog(`REPLAY: ${event.type} - ${JSON.stringify(event.data)}`);
    
    // Process the event based on its type
    switch (event.type) {
      case 'GAME_START':
        startNewGame();
        break;
      case 'CUT_FOR_DEALER':
        // Simulate the cut based on logged data
        setPlayerCutCard(event.data.playerCard);
        setComputerCutCard(event.data.computerCard);
        setDealer(event.data.dealer);
        break;
      case 'DEAL_HANDS':
        setPlayerHand(event.data.playerHand);
        setComputerHand(event.data.computerHand);
        setGameState('cribSelect');
        break;
      case 'DISCARD_TO_CRIB':
        // Apply the discard action
        setPlayerHand(event.data.playerHand);
        setComputerHand(event.data.computerHand);
        setCrib(event.data.crib);
        setCutCard(event.data.cutCard);
        setGameState('play');
        break;
      case 'PLAY_CARD':
        // Simulate card play
        if (event.data.player === 'player') {
          playerPlay(event.data.card);
        } else {
          // Simulate computer play
          setComputerPlayHand(prev => prev.filter(c => !(c.rank === event.data.card.rank && c.suit === event.data.card.suit)));
          setComputerPlayedCards(prev => [...prev, event.data.card]);
          setAllPlayedCards(prev => [...prev, event.data.card]);
          setCurrentCount(event.data.newCount);
          setLastPlayedBy('computer');
        }
        break;
      case 'PLAYER_GO':
      case 'COMPUTER_GO':
        setLastGoPlayer(event.data.player);
        break;
      case 'SCORE_POINTS':
        if (event.data.player === 'player') {
          setPlayerScore(prev => prev + event.data.points);
        } else {
          setComputerScore(prev => prev + event.data.points);
        }
        break;
      // Add more event types as needed
    }
    
    setReplayIndex(prev => prev + 1);
  };

  // Move to counting phase
  const moveToCountingPhase = () => {
    addDebugLog('Moving to counting phase');
    setGameState('counting');
    // Non-dealer counts first
    const firstCounter = dealer === 'player' ? 'computer' : 'player';
    setCounterIsComputer(firstCounter === 'computer');
    setHandsCountedThisRound(0);
    setCountingTurn(firstCounter === 'computer' ? 'computer' : 'player');
    addDebugLog(`First counter: ${firstCounter} (non-dealer), counterIsComputer: ${firstCounter === 'computer'}, dealer: ${dealer}`);
    setMessage(firstCounter === 'computer' ? 'Computer counts first (non-dealer)' : 'Count your hand (non-dealer first)');
    
    // Clear any previous counting state
    setComputerClaimedScore(0);
    setActualScore(null);
    setShowBreakdown(false);
    setIsProcessingCount(false);
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
    
    // Log game start
    logGameEvent('GAME_START', { 
      deckSize: newDeck.length,
      timestamp: new Date().toISOString()
    });
  };

  // Player cuts the deck
  const playerCutDeck = () => {
    if (playerCutCard) return; // Already cut
    
    // Pick a random card from the middle portion of the deck
    const cutIndex = Math.floor(Math.random() * 30) + 10; // Between index 10-40
    const card = deck[cutIndex];
    setPlayerCutCard(card);
    
    // Computer cuts after a delay
    setTimeout(() => {
      let compCutIndex;
      do {
        compCutIndex = Math.floor(Math.random() * 30) + 10;
      } while (compCutIndex === cutIndex); // Ensure different card
      
      const compCard = deck[compCutIndex];
      setComputerCutCard(compCard);
      
      // Determine dealer after showing both cards
      setTimeout(() => {
        const rankOrder = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
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
          // Tie - cut again
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
        
        // Proceed to dealing after a pause
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
    
    // Verify we're dealing 6 cards to each player
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
    setComputerClaimedScore(0);
    setActualScore(null);
    setShowBreakdown(false);
    setPendingScore(null);
    setCutCard(null); // Clear the cut card when dealing new hands
    setLastGoPlayer(null);
    setGameState('cribSelect');
    setMessage('Select 2 cards for the crib');
    
    // Log the deal
    logGameEvent('DEAL_HANDS', {
      playerHand: playerCards,
      computerHand: computerCards.map(c => ({ rank: c.rank, suit: c.suit })), // Log computer cards for replay
      dealer: dealer
    });
  };

  // Handle card selection for crib
  const toggleCardSelection = (card) => {
    if (gameState !== 'cribSelect') return; // Prevent selection in wrong state
    
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
    
    // Prevent double-clicking and wrong state
    if (gameState !== 'cribSelect' || playerHand.length !== 6) {
      console.error('discardToCrib called in wrong state:', gameState, 'or wrong hand size:', playerHand.length);
      return;
    }
    
    // Remove selected cards from player's hand
    const newPlayerHand = playerHand.filter(card => 
      !selectedCards.some(s => s.rank === card.rank && s.suit === card.suit)
    );
    
    // Computer selects which cards to keep (returns 4 cards)
    const newComputerHand = computerSelectCrib(computerHand, dealer === 'computer');
    
    // Find computer's discarded cards
    const computerDiscards = computerHand.filter(card => 
      !newComputerHand.some(c => c.rank === card.rank && c.suit === card.suit)
    );
    
    // Create the crib with both players' discards
    const newCrib = [...selectedCards, ...computerDiscards];
    
    // Verify we have the right number of cards
    if (newPlayerHand.length !== 4) {
      console.error('Player hand should have 4 cards but has', newPlayerHand.length);
      return;
    }
    if (newComputerHand.length !== 4) {
      console.error('Computer hand should have 4 cards but has', newComputerHand.length);
      return;
    }
    if (newCrib.length !== 4) {
      console.error('Crib should have 4 cards but has', newCrib.length);
      return;
    }
    
    // Cut the deck
    const cut = deck[0];
    const newDeck = deck.slice(1);
    
    // Use a single setState call to update everything atomically
    // Update all state in one go to avoid timing issues
    setPlayerHand(newPlayerHand);
    setComputerHand(newComputerHand);
    setCrib(newCrib);
    setSelectedCards([]);
    setCutCard(cut);
    setDeck(newDeck);
    
    // Set up play hands
    setPlayerPlayHand([...newPlayerHand]);
    setComputerPlayHand([...newComputerHand]);
    setPlayerPlayedCards([]);
    setComputerPlayedCards([]);
    setAllPlayedCards([]);
    setCurrentCount(0);
    setLastPlayedBy(null);
    setLastGoPlayer(null);
    
    // Log the crib discard
    logGameEvent('DISCARD_TO_CRIB', {
      playerDiscards: selectedCards,
      computerDiscards: computerDiscards,
      crib: newCrib,
      cutCard: cut,
      playerHand: newPlayerHand,
      computerHand: newComputerHand
    });
    
    // Check for his heels (Jack as cut card)
    if (cut.rank === 'J') {
      setGameState('play'); // Go to play state first
      if (dealer === 'player') {
        setPendingScore({ player: 'player', points: 2, reason: 'His heels!' });
        setMessage('His heels! 2 points for dealer - Click Accept');
      } else {
        setPendingScore({ player: 'computer', points: 2, reason: 'His heels!' });
        setMessage('His heels! 2 points for dealer - Click Accept');
      }
      // Non-dealer plays first after accepting
      setCurrentPlayer(dealer === 'player' ? 'computer' : 'player');
    } else {
      // Go directly to play
      setGameState('play');
      // Non-dealer plays first
      setCurrentPlayer(dealer === 'player' ? 'computer' : 'player');
      setMessage(dealer === 'player' ? "Computer's turn (non-dealer starts)" : "Your turn (non-dealer starts)");
    }
  };

  // Modified accept score to handle continuation
  const acceptScoreAndContinue = () => {
    if (!pendingScore) return;
    
    if (pendingScore.player === 'player') {
      setPlayerScore(prev => prev + pendingScore.points);
    } else {
      setComputerScore(prev => prev + pendingScore.points);
    }
    
    // Log the score
    logGameEvent('SCORE_POINTS', {
      player: pendingScore.player,
      points: pendingScore.points,
      reason: pendingScore.reason,
      newPlayerScore: pendingScore.player === 'player' ? playerScore + pendingScore.points : playerScore,
      newComputerScore: pendingScore.player === 'computer' ? computerScore + pendingScore.points : computerScore
    });
    
    const scoringPlayer = pendingScore.player;
    const wasGoPoint = pendingScore.reason === 'One for last card';
    const wasHisHeels = pendingScore.reason === 'His heels!';
    const needsLastCard = pendingScore.needsLastCard;
    setPendingScore(null);
    
    // Clear the lastGoPlayer state when accepting a score
    setLastGoPlayer(null);
    
    // Check if we need to immediately claim last card point
    if (needsLastCard) {
      // Either player just scored points and needs to claim last card too
      setPendingScore({ player: scoringPlayer, points: 1, reason: 'One for last card' });
      setMessage(`${scoringPlayer === 'player' ? 'Now claim' : 'Computer also gets'} 1 point for last card - Click Accept`);
      return;
    }
    
    // Handle different game states
    if (wasHisHeels) {
      // After his heels, continue with play - current player already set
      setMessage(`${currentPlayer === 'player' ? 'Your' : "Computer's"} turn (non-dealer starts)`);
    } else if (gameState === 'play') {
      // Pegging phase - check game state
      
      // First check if all cards have been played
      if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
        // All cards played, move to counting
        moveToCountingPhase();
        return;
      }
      
      if (currentCount === 31 || (wasGoPoint && (playerPlayHand.length > 0 || computerPlayHand.length > 0))) {
        // Need to start new round if anyone has cards left
        if (playerPlayHand.length > 0 || computerPlayHand.length > 0) {
          setPlayerPlayedCards([]);
          setComputerPlayedCards([]);
          setAllPlayedCards([]);
          setCurrentCount(0);
          setLastGoPlayer(null);
          
          // Determine who plays first in new round
          if (playerPlayHand.length > 0 && computerPlayHand.length === 0) {
            // Only player has cards
            setCurrentPlayer('player');
            setMessage('Your turn - play your remaining cards');
          } else if (computerPlayHand.length > 0 && playerPlayHand.length === 0) {
            // Only computer has cards
            setCurrentPlayer('computer');
            setMessage("Computer plays remaining cards");
          } else if (playerPlayHand.length > 0 && computerPlayHand.length > 0) {
            // Both have cards - the player who DIDN'T play last card leads
            const nextPlayer = lastPlayedBy === 'player' ? 'computer' : 'player';
            setCurrentPlayer(nextPlayer);
            setMessage(`${nextPlayer === 'player' ? 'Your' : "Computer's"} turn - new round`);
          }
          
          // Clear lastPlayedBy for the new round
          setLastPlayedBy(null);
        }
      } else {
        // Normal play continues - opponent of scorer plays next
        const nextPlayer = scoringPlayer === 'player' ? 'computer' : 'player';
        setCurrentPlayer(nextPlayer);
        setMessage(`${nextPlayer === 'player' ? 'Your' : "Computer's"} turn`);
      }
    }
  };

  // Computer makes a play
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
          
          // Log computer's play
          logGameEvent('PLAY_CARD', {
            player: 'computer',
            card: card,
            newCount: newCount,
            score: score,
            reason: reason,
            remainingCards: newComputerPlayHand.length
          });
          
          // Check if this was computer's last card
          const isLastCard = newComputerPlayHand.length === 0;
          const playerOutOfCards = playerPlayHand.length === 0;
          
          if (score > 0) {
            if (isLastCard && playerOutOfCards) {
              // Computer scored AND played last card - needs both points
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
            // Computer played its last card and player has no cards - get last card point
            setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
            setMessage('Computer gets 1 point for last card - Click Accept');
          } else {
            setMessage(`Computer plays ${card.rank}${card.suit} (count: ${newCount})`);
            
            // Always give player a turn unless they have no cards
            if (playerPlayHand.length > 0) {
              setCurrentPlayer('player');
            } else {
              // Player has no cards, computer continues if possible
              const canContinue = newComputerPlayHand.some(c => newCount + c.value <= 31);
              if (!canContinue && newComputerPlayHand.length > 0) {
                // Computer can't play more but has cards - get last card point
                setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
                setMessage('Computer gets 1 point for last card - Click Accept');
              }
              // Else computer will continue automatically
            }
          }
        } else {
          // Computer can't play (would exceed 31) - must say go
          setMessage('Computer says "Go"');
          setLastGoPlayer('computer'); // Track who said go
          
          // Log computer's go
          logGameEvent('COMPUTER_GO', {
            player: 'computer',
            currentCount: currentCount,
            remainingCards: computerPlayHand.length
          });
          
          // Check if player can still play
          const playerCanStillPlay = playerPlayHand.some(card => currentCount + card.value <= 31);
          
          if (playerCanStillPlay) {
            // Player can still play, so it remains their turn
            setCurrentPlayer('player');
            setMessage('Computer says "Go" - You can still play');
          } else {
            // Player also can't play - whoever played last gets the point
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
    
    // Log the play
    logGameEvent('PLAY_CARD', {
      player: 'player',
      card: card,
      newCount: newCount,
      score: score,
      reason: reason,
      remainingCards: newPlayerPlayHand.length
    });
    
    // Check if this was player's last card
    const isLastCard = newPlayerPlayHand.length === 0;
    const computerOutOfCards = computerPlayHand.length === 0;
    
    if (score > 0) {
      // Store whether we need to claim last card after this score
      if (isLastCard && computerOutOfCards) {
        // Set a flag to claim last card point after accepting the current score
        setPendingScore({ 
          player: 'player', 
          points: score, 
          reason: `You played ${card.rank}${card.suit} - ${reason}`,
          needsLastCard: true  // Flag to handle last card after
        });
        setMessage(`You scored ${score} - ${reason}! Click Accept (then claim last card)`);
      } else {
        setPendingScore({ player: 'player', points: score, reason: `You played ${card.rank}${card.suit} - ${reason}` });
        setMessage(`You scored ${score} - ${reason}! Click Accept`);
      }
    } else if (isLastCard && computerOutOfCards) {
      // Player played their last card and computer has no cards - get last card point
      setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
      setMessage('You get 1 point for last card - Click Accept');
    } else {
      setMessage(`You played ${card.rank}${card.suit} (count: ${newCount})`);
      // Always give computer a turn to play or say go
      setCurrentPlayer('computer');
    }
  };

  // Player says go
  const playerGo = () => {
    if (currentPlayer !== 'player' || pendingScore) return;
    
    setMessage('You say "Go"');
    setLastGoPlayer('player'); // Track that player said go
    
    // Log the go
    logGameEvent('PLAYER_GO', {
      player: 'player',
      currentCount: currentCount,
      remainingCards: playerPlayHand.length
    });
    
    // Check if computer can still play
    const computerCanPlay = computerPlayHand.some(card => currentCount + card.value <= 31);
    
    if (computerCanPlay) {
      // Computer continues playing
      setCurrentPlayer('computer');
    } else {
      // Neither can play - whoever played last gets 1 point
      if (lastPlayedBy) {
        if (lastPlayedBy === 'player') {
          // Player claims the last card point
          setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
          setMessage('You claim 1 point for last card - Click Accept');
        } else {
          // Computer gets the point
          setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
          setMessage('Computer gets 1 point for last card - Click Accept');
        }
      }
    }
  };

  // Player claims last card point (new function)
  const claimLastCard = () => {
    if (currentPlayer !== 'player' || pendingScore) return;
    
    // Player claims they played the last card
    setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
    setMessage('You claim 1 point for last card - Click Accept');
    
    // Check if this ends the round
    if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
      // This will move to counting after accepting the point
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
    
    // Only count if it's player's turn
    if (counterIsComputer) {
      addDebugLog('BLOCKED: Not player turn');
      return;
    }
    
    let hand;
    let handType;
    if (handsCountedThisRound === 0 && dealer === 'computer') {
      // Player is non-dealer, counting their hand
      hand = playerHand;
      handType = 'hand';
      addDebugLog('Player counting as non-dealer (hand)');
    } else if (handsCountedThisRound === 0 && dealer === 'player') {
      // This should never happen - computer counts first when player is dealer
      addDebugLog('ERROR: Player trying to count when they should not (player is dealer, computer should count first)');
      return;
    } else if (handsCountedThisRound === 1 && dealer === 'player') {
      // Player is dealer, counting their hand (second)
      hand = playerHand;
      handType = 'hand';
      addDebugLog('Player counting as dealer (hand)');
    } else if (handsCountedThisRound === 2 && dealer === 'player') {
      // Player is dealer, counting the crib (third)
      hand = crib;
      handType = 'crib';
      addDebugLog('Player counting as dealer (crib)');
    } else {
      addDebugLog(`ERROR: Player counting in wrong situation - handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);
      return;
    }
    
    const { score, breakdown } = calculateHandScore(hand, cutCard, handType === 'crib');
    setActualScore({ score, breakdown });
    
    // Log the counting event
    logGameEvent('PLAYER_COUNT', {
      handType: handType,
      claimed: claimed,
      actual: score,
      hand: hand,
      handsCountedThisRound: handsCountedThisRound
    });
    
    if (claimed === score) {
      setMessage(`Correct! ${score} points`);
      setPlayerScore(prev => prev + score);
      setShowBreakdown(true);
    } else if (claimed < score) {
      setMessage(`You undercounted! You claimed ${claimed} but it's ${score} - You only get ${claimed}`);
      setPlayerScore(prev => prev + claimed);
      setShowBreakdown(true);
    } else {
      setMessage(`Muggins! You overcounted. You claimed ${claimed} but it's only ${score}`);
      setShowBreakdown(true);
    }
    setPlayerCountInput('');
    
    // Increment hands counted and toggle counter
    const newHandsCountedThisRound = handsCountedThisRound + 1;
    setHandsCountedThisRound(newHandsCountedThisRound);
    addDebugLog(`Player count complete. Hands counted now: ${newHandsCountedThisRound}`);
    
    // After player counts, determine next turn
    if (newHandsCountedThisRound === 1 && dealer === 'computer') {
      // Player (non-dealer) just counted, now computer (dealer) counts hand
      setCounterIsComputer(true);
      setCountingTurn('computer');
      addDebugLog(`After first count, switching to computer dealer. counterIsComputer: true`);
    } else if (newHandsCountedThisRound === 1 && dealer === 'player') {
      // This should never happen - computer should count first when player is dealer
      addDebugLog('ERROR: Unexpected state - player counted first but player is dealer');
    } else if (newHandsCountedThisRound === 2 && dealer === 'player') {
      // Player (dealer) just counted hand, now counts crib
      setCounterIsComputer(false);
      setCountingTurn('crib');
      addDebugLog('Player (dealer) will count crib next');
    } else if (newHandsCountedThisRound === 2 && dealer === 'computer') {
      // Computer (dealer) just counted hand, now counts crib
      setCounterIsComputer(true);
      setCountingTurn('crib');
      addDebugLog('Computer (dealer) will count crib next');
    } else {
      addDebugLog(`All counting complete. Hands counted: ${newHandsCountedThisRound}`);
    }
    
    // Continue after a delay
    setTimeout(() => {
      setShowBreakdown(false);
      setActualScore(null);
      // Use the updated handsCountedThisRound value instead of closure
      if (newHandsCountedThisRound >= 3) {
        addDebugLog('All counting complete via setTimeout - checking for game end');
        setCountingTurn('');
        setCounterIsComputer(null);
        
        // Check for game end (this will use current scores from state)
        setTimeout(() => {
          setGameState(prevState => {
            // Check scores at time of execution
            if (playerScore >= 121 || computerScore >= 121) {
              setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
              return 'gameOver';
            } else {
              setMessage('Hand complete - Dealing next hand...');
              setTimeout(() => {
                setDealer(dealer === 'player' ? 'computer' : 'player');
                const newDeck = shuffleDeck(createDeck());
                setDeck(newDeck);
                dealHands(newDeck);
              }, 1500);
              return prevState;
            }
          });
        }, 100);
      } else {
        addDebugLog(`Player setTimeout calling proceedToNextCountingPhase with newHandsCountedThisRound: ${newHandsCountedThisRound}`);
        proceedToNextCountingPhase();
      }
    }, claimed === score ? 2500 : (claimed > score ? 3000 : 2000));
  };

  // Computer counts
  const computerCounts = () => {
    addDebugLog(`computerCounts() called - counterIsComputer: ${counterIsComputer}, handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);
    
    // Only count if it's computer's turn and we haven't counted all hands
    if (!counterIsComputer || handsCountedThisRound >= 3) {
      addDebugLog(`BLOCKED: counterIsComputer=${counterIsComputer}, handsCountedThisRound=${handsCountedThisRound} (max 3)`);
      return;
    }
    
    if (isProcessingCount) {
      addDebugLog('BLOCKED: computerCounts() blocked by isProcessingCount flag');
      return;
    }
    
    if (computerClaimedScore > 0) {
      addDebugLog('BLOCKED: computerCounts() blocked - already has claimed score');
      return;
    }
    
    setIsProcessingCount(true);
    addDebugLog('Set isProcessingCount = true');
    
    let hand;
    let handType;
    if (handsCountedThisRound === 0 && dealer === 'player') {
      // Computer is non-dealer, counting their hand
      hand = computerHand;
      handType = 'hand';
      addDebugLog('Computer counting as non-dealer (hand)');
    } else if (handsCountedThisRound === 1 && dealer === 'computer') {
      // Computer is dealer, counting their hand (second)
      hand = computerHand;
      handType = 'hand';
      addDebugLog('Computer counting as dealer (hand)');
    } else if (handsCountedThisRound === 2 && dealer === 'computer') {
      // Computer is dealer, counting the crib
      hand = crib;
      handType = 'crib';
      addDebugLog('Computer counting as dealer (crib)');
    } else {
      addDebugLog(`ERROR: Computer counting in wrong situation - handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);
      setIsProcessingCount(false);
      return;
    }
    
    addDebugLog(`Computer counting their ${handType}`);
    
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
    
    const { score } = actualScore;
    if (computerClaimedScore <= score) {
      setComputerScore(prev => {
        addDebugLog(`Computer score: ${prev} -> ${prev + computerClaimedScore}`);
        return prev + computerClaimedScore;
      });
      setMessage(`Computer scores ${computerClaimedScore} points`);
      setShowBreakdown(false);
      setActualScore(null);
      setComputerClaimedScore(0);
      setIsProcessingCount(false);
      
      // Increment hands counted and toggle counter
      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);
      addDebugLog(`Computer count accepted. Hands counted now: ${newHandsCountedThisRound}`);
      
      // Determine next state immediately based on the NEW count
      if (newHandsCountedThisRound === 1) {
        // First hand counted, now dealer counts their hand
        setCounterIsComputer(dealer === 'computer');
        addDebugLog(`After first count, dealer (${dealer}) counts hand next. counterIsComputer: ${dealer === 'computer'}`);
      } else if (newHandsCountedThisRound === 2) {
        // Both hands counted, dealer counts crib
        setCounterIsComputer(dealer === 'computer');
        addDebugLog(`After second count, dealer (${dealer}) counts crib next. counterIsComputer: ${dealer === 'computer'}`);
      } else {
        // All counting complete
        setCounterIsComputer(null);
        addDebugLog(`All counting complete. Hands counted: ${newHandsCountedThisRound}`);
      }
      
      setTimeout(() => {
        addDebugLog('Proceeding to next counting phase after accept');
        // Use the updated handsCountedThisRound value instead of closure
        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete via setTimeout - checking for game end');
          setCountingTurn('');
          setCounterIsComputer(null);
          
          // Check for game end (this will use current scores from state)
          setTimeout(() => {
            setGameState(prevState => {
              // Check scores at time of execution
              if (playerScore >= 121 || computerScore >= 121) {
                setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
                return 'gameOver';
              } else {
                setMessage('Hand complete - Dealing next hand...');
                setTimeout(() => {
                  setDealer(dealer === 'player' ? 'computer' : 'player');
                  const newDeck = shuffleDeck(createDeck());
                  setDeck(newDeck);
                  dealHands(newDeck);
                }, 1500);
                return prevState;
              }
            });
          }, 100);
        } else {
          proceedToNextCountingPhase();
        }
      }, 1500);
    }
  };

  // Object to computer's count
  const objectToComputerCount = () => {
    const { score } = actualScore;
    if (computerClaimedScore > score) {
      // Player correctly caught an overcount - Muggins!
      setMessage(`Good catch! Muggins! Computer overcounted - claimed ${computerClaimedScore} but actual score is ${score}. Computer gets 0 points!`);
      setShowBreakdown(true);
      // Computer gets NO points for overcounting
      
      // Increment hands counted here too
      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);
      addDebugLog(`Computer overcount caught. Hands counted now: ${newHandsCountedThisRound}`);
      
      setTimeout(() => {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(0);
        setIsProcessingCount(false); // Reset the flag
        
        // Use the updated value instead of closure
        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete after muggins - checking for game end');
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
        } else {
          proceedToNextCountingPhase();
        }
      }, 4000); // Give player time to enjoy their successful muggins call
    } else if (computerClaimedScore === score) {
      // Computer's count was correct
      setMessage(`Computer's count was correct. They get ${computerClaimedScore} points.`);
      setComputerScore(prev => prev + computerClaimedScore);
      
      // Increment hands counted here too
      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);
      
      setTimeout(() => {
        setActualScore(null);
        setComputerClaimedScore(0);
        setIsProcessingCount(false); // Reset the flag
        
        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete after correct count - checking for game end');
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
        } else {
          proceedToNextCountingPhase();
        }
      }, 2000);
    } else {
      // Computer undercounted - they still get what they claimed
      setMessage(`Computer undercounted! They claimed ${computerClaimedScore} but could have had ${score}. They get ${computerClaimedScore} points.`);
      setComputerScore(prev => prev + computerClaimedScore);
      setShowBreakdown(true);
      
      // Increment hands counted here too
      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);
      
      setTimeout(() => {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(0);
        setIsProcessingCount(false); // Reset the flag
        
        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete after undercount - checking for game end');
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
        } else {
          proceedToNextCountingPhase();
        }
      }, 3000);
    }
  };

  // Proceed to next counting phase
  const proceedToNextCountingPhase = () => {
    addDebugLog(`proceedToNextCountingPhase() - current turn: ${countingTurn}, dealer: ${dealer}, handsCountedThisRound: ${handsCountedThisRound}`);
    
    // Clear any previous scoring state FIRST
    setComputerClaimedScore(0);
    setActualScore(null);
    setShowBreakdown(false);
    setIsProcessingCount(false);
    
    // Get current hands counted from state
    const currentHandsCounted = handsCountedThisRound;
    addDebugLog(`Current hands counted in proceedToNextCountingPhase: ${currentHandsCounted}`);
    
    // Determine next counting turn based on handsCountedThisRound and dealer
    if (currentHandsCounted === 1) {
      // First hand counted (non-dealer), now dealer counts their hand
      if (dealer === 'player') {
        addDebugLog('Computer (non-dealer) done -> Player (dealer) counts hand');
        setCountingTurn('player');
        setCounterIsComputer(false);
        setMessage('Count your hand (dealer)');
      } else {
        addDebugLog('Player (non-dealer) done -> Computer (dealer) counts hand');
        setCountingTurn('computer');
        setCounterIsComputer(true);
        setMessage('Computer counts (dealer)');
      }
    } else if (currentHandsCounted === 2) {
      // Both hands counted, now dealer counts crib
      if (dealer === 'player') {
        addDebugLog('Player (dealer) counts crib');
        setCountingTurn('crib');
        setCounterIsComputer(false);
        setMessage('Count your crib');
      } else {
        addDebugLog('Computer (dealer) counts crib');
        setCountingTurn('crib');
        setCounterIsComputer(true);
        setMessage('Computer counts crib');
      }
    } else if (currentHandsCounted >= 3) {
      addDebugLog('All counting complete - checking for game end');
      // IMPORTANT: Clear counting turn immediately to prevent any pending timers
      setCountingTurn('');
      setCounterIsComputer(null);
      
      if (playerScore >= 121 || computerScore >= 121) {
        setGameState('gameOver');
        setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
      } else {
        setMessage('Hand complete - Dealing next hand...');
        // Small delay before dealing next hand
        setTimeout(() => {
          setDealer(dealer === 'player' ? 'computer' : 'player');
          const newDeck = shuffleDeck(createDeck());
          setDeck(newDeck);
          dealHands(newDeck);
        }, 1500);
      }
    } else {
      addDebugLog(`WARNING: Unexpected state - handsCountedThisRound: ${currentHandsCounted}, dealer: ${dealer}`);
    }
  };

  // Check if pegging is truly complete
  useEffect(() => {
    if (gameState === 'play' && !pendingScore) {
      // Check if both players are out of cards
      if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
        // Pegging is done, move to counting
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
                               computerClaimedScore === 0 && 
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
  }, [counterIsComputer, gameState, pendingScore, actualScore, computerClaimedScore, isProcessingCount, handsCountedThisRound, dealer]);

  // Check if player can play any card
  const playerCanPlay = playerPlayHand.some(card => currentCount + card.value <= 31);

  return (
    <div className="min-h-screen bg-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-green-800 text-white">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Cribbage</CardTitle>
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
                      {playerCutCard ? (
                        <div className={`inline-block bg-white rounded p-3 text-3xl font-bold ${
                          playerCutCard.suit === '♥' || playerCutCard.suit === '♦' ? 'text-red-600' : 'text-black'
                        }`}>
                          {playerCutCard.rank}{playerCutCard.suit}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-600 rounded p-3 w-16 h-20">?</div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm mb-2">Computer's cut:</div>
                      {computerCutCard ? (
                        <div className={`inline-block bg-white rounded p-3 text-3xl font-bold ${
                          computerCutCard.suit === '♥' || computerCutCard.suit === '♦' ? 'text-red-600' : 'text-black'
                        }`}>
                          {computerCutCard.rank}{computerCutCard.suit}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-600 rounded p-3 w-16 h-20">?</div>
                      )}
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
                    <div className={`inline-block bg-white rounded p-2 text-2xl font-bold ${
                      cutCard.suit === '♥' || cutCard.suit === '♦' ? 'text-red-600' : 'text-black'
                    }`}>
                      {cutCard.rank}{cutCard.suit}
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
                            <div key={idx} className={`bg-white rounded p-1 text-sm font-bold ${
                              card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                            }`}>
                              {card.rank}{card.suit}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Player's played cards */}
                      <div>
                        <div className="text-xs mb-1">Your plays:</div>
                        <div className="flex flex-wrap gap-1 min-h-[40px]">
                          {playerPlayedCards.map((card, idx) => (
                            <div key={idx} className={`bg-white rounded p-1 text-sm font-bold ${
                              card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                            }`}>
                              {card.rank}{card.suit}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Message */}
                {message && (
                  <div className="text-center mb-4 text-yellow-300 text-lg">
                    {message}
                  </div>
                )}
                
                {/* Pending score accept button */}
                {pendingScore && (
                  <div className="text-center mb-4">
                    <Button onClick={acceptScoreAndContinue} className="bg-yellow-600 hover:bg-yellow-700">
                      Accept {pendingScore.points} Points
                    </Button>
                  </div>
                )}
                
                {/* Computer hand */}
                <div className="mb-6">
                  <div className="text-sm mb-2">Computer's Hand: {gameState === 'play' ? `${computerPlayHand.length} cards` : ''}</div>
                  <div className="flex flex-wrap gap-2">
                    {(gameState === 'counting' || gameState === 'gameOver' ? computerHand : 
                      gameState === 'play' ? computerPlayHand :
                      computerHand).map((card, idx) => (
                      <div key={idx} className={`bg-gray-600 text-white rounded p-2 w-12 h-16 flex items-center justify-center ${
                        (gameState === 'counting' || gameState === 'gameOver') && (card.suit === '♥' || card.suit === '♦') ? 'text-red-400' : ''
                      }`}>
                        {gameState === 'counting' || gameState === 'gameOver' ? `${card.rank}${card.suit}` : '?'}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Player hand */}
                <div className="mb-6">
                  <div className="text-sm mb-2">Your Hand: ({gameState === 'play' || gameState === 'counting' ? 4 : playerHand.length} cards)</div>
                  <div className="flex flex-wrap gap-2">
                    {(gameState === 'cribSelect' ? playerHand : 
                      gameState === 'play' ? playerPlayHand : 
                      playerHand).map((card, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (gameState === 'cribSelect' && playerHand.length === 6) toggleCardSelection(card);
                          else if (gameState === 'play' && currentPlayer === 'player' && !pendingScore) playerPlay(card);
                        }}
                        className={`bg-white rounded p-2 text-xl font-bold cursor-pointer transition-all
                          ${selectedCards.some(c => c.rank === card.rank && c.suit === card.suit) ? 'ring-4 ring-yellow-400' : ''}
                          ${gameState === 'play' && (currentCount + card.value > 31 || currentPlayer !== 'player' || pendingScore) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                          ${gameState === 'cribSelect' && playerHand.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}
                          ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}
                        `}
                      >
                        {card.rank}{card.suit}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Crib display during counting */}
                {gameState === 'counting' && ((countingTurn === 'crib' && handsCountedThisRound === 2) || 
                 (actualScore && computerClaimedScore > 0 && handsCountedThisRound === 2 && dealer === 'computer')) && (
                  <div className="mb-6">
                    <div className="text-sm mb-2">Crib ({dealer === 'player' ? 'Yours' : "Computer's"}):</div>
                    <div className="flex flex-wrap gap-2">
                      {crib.map((card, idx) => (
                        <div key={idx} className={`bg-yellow-600 rounded p-2 text-xl font-bold ${
                          card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
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
                {gameState === 'counting' && countingTurn && actualScore && !pendingScore && computerClaimedScore >= 0 && (
                  <div className="text-center mb-4">
                    <Button onClick={acceptComputerCount} className="bg-green-600 hover:bg-green-700 mr-2">
                      Accept
                    </Button>
                    <Button onClick={objectToComputerCount} className="bg-red-600 hover:bg-red-700">
                      Object (Muggins!)
                    </Button>
                  </div>
                )}
                
                {/* Score breakdown */}
                {showBreakdown && actualScore && (
                  <div className="bg-gray-700 rounded p-4 mb-4">
                    <div className="text-sm">
                      {actualScore.breakdown.map((item, idx) => (
                        <div key={idx}>{item}</div>
                      ))}
                      <div className="font-bold mt-2">Total: {actualScore.score}</div>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                {gameState === 'cribSelect' && (
                  <div className="text-center">
                    <Button
                      onClick={discardToCrib}
                      disabled={selectedCards.length !== 2 || playerHand.length !== 6}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Discard to Crib ({selectedCards.length}/2)
                    </Button>
                  </div>
                )}
                
                {/* Action buttons for play phase */}
                {gameState === 'play' && currentPlayer === 'player' && !pendingScore && (
                  <div className="text-center space-x-2">
                    {/* Show Go button when count is above 21 and player has cards */}
                    {playerPlayHand.length > 0 && currentCount >= 21 && (
                      <Button onClick={playerGo} className="bg-red-600 hover:bg-red-700">
                        Go
                      </Button>
                    )}
                    {/* Show claim last card button when computer has said go and player can't play */}
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
                
                {/* Debug Log Toggle Button */}
                <div className="text-center mt-4 space-x-2">
                  <Button 
                    onClick={() => setShowDebugLog(!showDebugLog)} 
                    className="bg-gray-600 hover:bg-gray-700 text-sm"
                  >
                    {showDebugLog ? 'Hide' : 'Show'} Debug Log
                  </Button>
                  
                  <Button 
                    onClick={() => setShowGameLog(!showGameLog)} 
                    className="bg-purple-600 hover:bg-purple-700 text-sm"
                  >
                    {showGameLog ? 'Hide' : 'Show'} Game Log
                  </Button>
                  
                  {gameLog.length > 0 && (
                    <Button 
                      onClick={copyGameLog} 
                      className="bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      Copy Game Log
                    </Button>
                  )}
                  
                  <Button 
                    onClick={loadReplayLog} 
                    className="bg-green-600 hover:bg-green-700 text-sm"
                  >
                    Load Replay
                  </Button>
                  
                  {replayMode && (
                    <Button 
                      onClick={nextReplayEvent} 
                      className="bg-yellow-600 hover:bg-yellow-700 text-sm"
                    >
                      Next Event ({replayIndex}/{replayLog?.length || 0})
                    </Button>
                  )}
                </div>
                
                {/* Debug Log Display */}
                {showDebugLog && debugLog.length > 0 && (
                  <div className="mt-4 p-2 bg-gray-800 rounded text-xs font-mono max-h-40 overflow-y-auto">
                    <div className="text-yellow-400 mb-1">Debug Log:</div>
                    {debugLog.slice(-10).map((log, idx) => (
                      <div key={idx} className="text-gray-300">{log}</div>
                    ))}
                  </div>
                )}
                
                {/* Game Log Display */}
                {showGameLog && gameLog.length > 0 && (
                  <div className="mt-4 p-2 bg-purple-900 rounded text-xs font-mono max-h-60 overflow-y-auto">
                    <div className="text-yellow-400 mb-1">Game Event Log ({gameLog.length} events):</div>
                    {gameLog.slice(-20).map((event, idx) => (
                      <div key={idx} className="text-gray-300 mb-2">
                        <div className="text-green-400">[{new Date(event.timestamp).toLocaleTimeString()}] {event.type}</div>
                        <div className="ml-4">{JSON.stringify(event.data, null, 2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}