// Save this as components/CribbageGame.jsx
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
  
  // Nobs (Jack of same suit as cut card in hand)
  hand.forEach(card => {
    if (card.rank === 'J' && card.suit === cutCard.suit) {
      score += 1;
      breakdown.push(`Nobs (J${card.suit}): 1`);
    }
  });
  
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

  // Move to counting phase
  const moveToCountingPhase = () => {
    setGameState('counting');
    setCountingTurn(dealer === 'player' ? 'computer' : 'player');
    setMessage(dealer === 'player' ? 'Computer counts first (non-dealer)' : 'Count your hand (non-dealer first)');
  };

  // Start new game
  const startNewGame = () => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setPlayerScore(0);
    setComputerScore(0);
    setDealer(Math.random() < 0.5 ? 'player' : 'computer');
    setGameState('dealing');
    dealHands(newDeck);
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
    
    const scoringPlayer = pendingScore.player;
    const wasGoPoint = pendingScore.reason === 'One for last card';
    const wasHisHeels = pendingScore.reason === 'His heels!';
    setPendingScore(null);
    
    // Clear the lastGoPlayer state when accepting a score
    setLastGoPlayer(null);
    
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
          
          // Check if this was computer's last card
          const isLastCard = newComputerPlayHand.length === 0;
          
          if (score > 0) {
            setPendingScore({ player: 'computer', points: score, reason: `Computer plays ${card.rank}${card.suit} - ${reason}` });
            setMessage(`Computer plays ${card.rank}${card.suit} for ${score} - ${reason} - Click Accept`);
          } else if (isLastCard && playerPlayHand.length === 0) {
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
          
          // Now it's player's turn to either play or claim the point
          setCurrentPlayer('player');
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState, pendingScore]);

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
    
    // Check if this was player's last card
    const isLastCard = newPlayerPlayHand.length === 0;
    
    if (score > 0) {
      setPendingScore({ player: 'player', points: score, reason: `You played ${card.rank}${card.suit} - ${reason}` });
      setMessage(`You scored ${score} - ${reason}! Click Accept`);
    } else if (isLastCard && computerPlayHand.length === 0) {
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
    
    let hand;
    if (countingTurn === 'player') {
      // Player is counting their own hand
      hand = playerHand;
    } else if (countingTurn === 'crib') {
      // Player is counting the crib (they are dealer)
      hand = crib;
    } else {
      // This shouldn't happen
      console.error('Player counting in wrong turn:', countingTurn);
      return;
    }
    
    const { score, breakdown } = calculateHandScore(hand, cutCard, countingTurn === 'crib');
    setActualScore({ score, breakdown });
    
    if (claimed === score) {
      setMessage(`Correct! ${score} points`);
      setPlayerScore(prev => prev + score);
    } else if (claimed < score) {
      setMessage(`You undercounted! You claimed ${claimed} but it's ${score} - You only get ${claimed}`);
      setPlayerScore(prev => prev + claimed);
    } else {
      setMessage(`Muggins! You overcounted. You claimed ${claimed} but it's only ${score}`);
      setShowBreakdown(true);
    }
    setPlayerCountInput('');
    
    // Continue after a delay
    setTimeout(() => {
      setShowBreakdown(false);
      setActualScore(null);
      proceedToNextCountingPhase();
    }, claimed > score ? 3000 : 2000);
  };

  // Computer counts
  const computerCounts = () => {
    let hand;
    if (countingTurn === 'computer') {
      // Computer is counting their own hand
      hand = computerHand;
    } else if (countingTurn === 'crib') {
      // Counting the crib - use the actual crib cards
      hand = crib;
    } else {
      // This shouldn't happen - player counts their own hand
      console.error('Computer counting in wrong turn:', countingTurn);
      return;
    }
    
    const { score, breakdown } = calculateHandScore(hand, cutCard, countingTurn === 'crib');
    setActualScore({ score, breakdown });
    
    // Computer sometimes makes mistakes (10% chance)
    let claimed = score;
    if (Math.random() < 0.1 && score > 0) {
      // Make a small error only if there are points to miscount
      const error = Math.random() < 0.5 ? -2 : 2;
      claimed = Math.max(0, score + error);
    }
    
    setComputerClaimedScore(claimed);
    setMessage(`Computer claims ${claimed} points for ${countingTurn === 'crib' ? 'the crib' : 'their hand'} - Do you accept?`);
  };

  // Accept computer's count
  const acceptComputerCount = () => {
    const { score } = actualScore;
    if (computerClaimedScore <= score) {
      // Add points immediately and continue
      setComputerScore(prev => prev + computerClaimedScore);
      setMessage(`Computer scores ${computerClaimedScore} points`);
      setShowBreakdown(false);
      setActualScore(null);
      setComputerClaimedScore(0);
      
      // Move to next phase after a short delay
      setTimeout(() => proceedToNextCountingPhase(), 1500);
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
      setTimeout(() => {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(0);
        proceedToNextCountingPhase();
      }, 4000); // Give player time to enjoy their successful muggins call
    } else if (computerClaimedScore === score) {
      // Computer's count was correct
      setMessage(`Computer's count was correct. They get ${computerClaimedScore} points.`);
      setComputerScore(prev => prev + computerClaimedScore);
      setTimeout(() => {
        setActualScore(null);
        setComputerClaimedScore(0);
        proceedToNextCountingPhase();
      }, 2000);
    } else {
      // Computer undercounted - they still get what they claimed
      setMessage(`Computer undercounted! They claimed ${computerClaimedScore} but could have had ${score}. They get ${computerClaimedScore} points.`);
      setComputerScore(prev => prev + computerClaimedScore);
      setShowBreakdown(true);
      setTimeout(() => {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(0);
        proceedToNextCountingPhase();
      }, 3000);
    }
  };

  // Proceed to next counting phase
  const proceedToNextCountingPhase = () => {
    // Clear any previous scoring state
    setComputerClaimedScore(0);
    setActualScore(null);
    setShowBreakdown(false);
    
    // Determine next counting turn
    if (countingTurn === (dealer === 'player' ? 'computer' : 'player')) {
      // Non-dealer just counted, now dealer
      setCountingTurn(dealer);
      setMessage(dealer === 'player' ? 'Count your hand (dealer)' : 'Computer counts (dealer)');
    } else if (countingTurn === dealer) {
      // Dealer just counted their hand, now crib
      setCountingTurn('crib');
      setMessage(dealer === 'player' ? 'Count your crib' : 'Computer counts crib');
    } else {
      // Done counting, check for winner or next hand
      if (playerScore >= 121 || computerScore >= 121) {
        setGameState('gameOver');
        setMessage(playerScore >= 121 ? 'You win!' : 'Computer wins!');
      } else {
        // Next hand - but don't deal yet
        setCountingTurn('');
        setMessage('Hand complete - Click to continue');
        // Wait for a moment before dealing next hand
        setTimeout(() => {
          setDealer(dealer === 'player' ? 'computer' : 'player');
          const newDeck = shuffleDeck(createDeck());
          setDeck(newDeck);
          dealHands(newDeck);
        }, 1500);
      }
    }
  };

  // Check if pegging is truly complete
  useEffect(() => {
    if (gameState === 'play' && !pendingScore) {
      // Check if both players are out of cards
      if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
        // Pegging is done, move to counting
        moveToCountingPhase();
      } else if (currentCount === 0 && allPlayedCards.length === 0) {
        // New round just started - check if only one player has cards
        if (playerPlayHand.length === 1 && computerPlayHand.length === 0) {
          // Player has last card starting a new round
          setMessage('You have the last card - play it for 1 point');
        } else if (computerPlayHand.length === 1 && playerPlayHand.length === 0) {
          // Computer has last card starting a new round
          setMessage('Computer has the last card');
          // Computer will play automatically via the computer play effect
        }
      }
    }
  }, [gameState, playerPlayHand.length, computerPlayHand.length, currentCount, allPlayedCards.length, pendingScore]);

  // Use effect for computer counting
  useEffect(() => {
    if (gameState === 'counting' && countingTurn && !pendingScore && !actualScore && computerClaimedScore === 0) {
      const isComputerTurn = (countingTurn === 'computer') || 
        (countingTurn === 'crib' && dealer === 'computer');
      
      if (isComputerTurn) {
        const timer = setTimeout(() => computerCounts(), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [countingTurn, gameState, pendingScore, actualScore, computerClaimedScore]);

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
            
            {gameState !== 'menu' && (
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
                {gameState === 'counting' && (countingTurn === 'crib' || (actualScore && computerClaimedScore >= 0)) && (
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
                 ((countingTurn === 'player') || (countingTurn === 'crib' && dealer === 'player')) && (
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
                {gameState === 'counting' && actualScore && !pendingScore && computerClaimedScore >= 0 && (
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
                    {playerPlayHand.length > 0 && (
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}