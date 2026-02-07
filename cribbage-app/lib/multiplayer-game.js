/**
 * Multiplayer Cribbage Game Logic
 * Handles game state initialization and move processing for multiplayer games
 */

import { createDeck, shuffleDeck } from './deck';
import { calculateHandScore } from './scoring';
import { rankOrder } from './constants';

/**
 * Game phases
 */
export const GAME_PHASE = {
  CUTTING_FOR_DEALER: 'cuttingForDealer',
  DEALING: 'dealing',
  DISCARDING: 'discarding',
  CUT: 'cut',
  PLAYING: 'playing',
  COUNTING: 'counting',
  GAME_OVER: 'gameOver'
};

/**
 * Initialize a new multiplayer game state for cut-for-dealer phase
 * Called when an invitation is accepted and game begins
 * @param {array} testDeck - Optional pre-defined deck for testing
 * @returns {object} Initial game state in cuttingForDealer phase
 */
export function initializeGameState(dealer = null, testDeck = null) {
  // If dealer is specified, skip cut-for-dealer (used for subsequent rounds or testing)
  if (dealer) {
    return initializeRoundState(dealer, testDeck);
  }

  // First game: start with cut-for-dealer phase
  const cutDeck = testDeck || shuffleDeck(createDeck());

  return {
    phase: GAME_PHASE.CUTTING_FOR_DEALER,
    round: 1,
    dealer: null,

    // Cut for dealer state
    cutForDealer: {
      player1Card: null,
      player2Card: null,
      deck: cutDeck
    },

    // Empty hands until dealer is determined and cards are dealt
    player1Hand: [],
    player2Hand: [],
    player1Discards: [],
    player2Discards: [],
    crib: [],
    cutCard: null,
    remainingDeck: [],

    playState: {
      player1PlayHand: [],
      player2PlayHand: [],
      playedCards: [],
      currentCount: 0,
      lastPlayedBy: null,
      player1Said: null,
      player2Said: null,
      roundCards: []
    },

    countingState: {
      phase: null,
      currentCounter: null,
      handsScored: [],
      claimedScore: null,
      actualScore: null,
      actualBreakdown: null,
      countedHand: null,
      waitingForVerification: false
    },

    pendingPeggingScore: null,
    peggingHistory: [],

    peggingPoints: {
      player1: 0,
      player2: 0
    }
  };
}

/**
 * Initialize round state with dealt cards (used after dealer is determined)
 * @param {string} dealer - 'player1' or 'player2'
 * @param {array} testDeck - Optional pre-defined deck for testing
 * @returns {object} Game state in discarding phase
 */
export function initializeRoundState(dealer, testDeck = null) {
  const deck = testDeck || shuffleDeck(createDeck());

  const player1Hand = deck.slice(0, 6);
  const player2Hand = deck.slice(6, 12);
  const remainingDeck = deck.slice(12);

  return {
    phase: GAME_PHASE.DISCARDING,
    round: 1,
    dealer: dealer,

    player1Hand: player1Hand,
    player2Hand: player2Hand,
    player1Discards: [],
    player2Discards: [],
    crib: [],
    cutCard: null,
    remainingDeck: remainingDeck,

    playState: {
      player1PlayHand: [],
      player2PlayHand: [],
      playedCards: [],
      currentCount: 0,
      lastPlayedBy: null,
      player1Said: null,
      player2Said: null,
      roundCards: []
    },

    countingState: {
      phase: null,
      currentCounter: null,
      handsScored: [],
      claimedScore: null,
      actualScore: null,
      actualBreakdown: null,
      countedHand: null,
      waitingForVerification: false
    },

    pendingPeggingScore: null,
    peggingHistory: [],

    peggingPoints: {
      player1: 0,
      player2: 0
    }
  };
}

/**
 * Process a cut-for-dealer move
 * @param {object} gameState - Current game state
 * @param {string} playerKey - 'player1' or 'player2'
 * @param {number} cutPosition - 0-1 representing where player tapped
 * @returns {object} { success, newState, error, description, nextTurn, dealerDetermined, dealer }
 */
export function processCutForDealer(gameState, playerKey, cutPosition) {
  if (gameState.phase !== GAME_PHASE.CUTTING_FOR_DEALER) {
    return { success: false, error: 'Not in cut-for-dealer phase' };
  }

  const cutForDealer = { ...gameState.cutForDealer };
  const cardKey = `${playerKey}Card`;

  // Check if player already cut
  if (cutForDealer[cardKey] !== null) {
    return { success: false, error: 'You have already cut' };
  }

  // Convert position to deck index
  const deck = cutForDealer.deck;
  const index = Math.floor(cutPosition * deck.length);
  const clampedIndex = Math.max(0, Math.min(deck.length - 1, index));
  const card = deck[clampedIndex];

  cutForDealer[cardKey] = card;

  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const opponentCardKey = `${opponentKey}Card`;
  const bothCut = cutForDealer[opponentCardKey] !== null;

  if (!bothCut) {
    // Waiting for opponent to cut
    return {
      success: true,
      newState: {
        ...gameState,
        cutForDealer
      },
      description: `Cut ${card.rank}${card.suit}. Waiting for opponent to cut.`,
      nextTurn: opponentKey
    };
  }

  // Both have cut - compare cards
  const myRank = rankOrder[card.rank];
  const opponentRank = rankOrder[cutForDealer[opponentCardKey].rank];

  if (myRank === opponentRank) {
    // Tie - reset for re-cut with a fresh shuffled deck
    const newDeck = shuffleDeck(createDeck());
    return {
      success: true,
      newState: {
        ...gameState,
        cutForDealer: {
          player1Card: null,
          player2Card: null,
          deck: newDeck,
          tied: true
        }
      },
      description: `Both cut ${card.rank} - tied! Cut again.`,
      nextTurn: 'player1',
      tied: true
    };
  }

  // Lower card deals (Ace is lowest/best)
  const dealer = myRank < opponentRank ? playerKey : opponentKey;

  // Stay in cuttingForDealer phase - wait for both players to acknowledge
  cutForDealer.dealer = dealer;
  cutForDealer.player1Acknowledged = false;
  cutForDealer.player2Acknowledged = false;

  return {
    success: true,
    newState: {
      ...gameState,
      cutForDealer
    },
    description: `Dealer determined!`,
    nextTurn: opponentKey, // Other player needs to see result
    dealerDetermined: true,
    dealer: dealer
  };
}

/**
 * Process an acknowledge-dealer move
 * Both players must acknowledge before dealer can deal
 * @param {object} gameState - Current game state
 * @param {string} playerKey - 'player1' or 'player2'
 * @returns {object} { success, newState, error, description, nextTurn }
 */
export function processAcknowledgeDealer(gameState, playerKey) {
  if (gameState.phase !== GAME_PHASE.CUTTING_FOR_DEALER) {
    return { success: false, error: 'Not in cut-for-dealer phase' };
  }

  if (!gameState.cutForDealer?.dealer) {
    return { success: false, error: 'Dealer not yet determined' };
  }

  const ackKey = `${playerKey}Acknowledged`;
  if (gameState.cutForDealer[ackKey]) {
    return { success: false, error: 'Already acknowledged' };
  }

  const cutForDealer = { ...gameState.cutForDealer };
  cutForDealer[ackKey] = true;

  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';

  return {
    success: true,
    newState: {
      ...gameState,
      cutForDealer
    },
    description: `Acknowledged dealer.`,
    nextTurn: cutForDealer.dealer // Dealer's turn to deal
  };
}

/**
 * Process a deal move - dealer deals the cards after both acknowledge
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Must be the dealer
 * @returns {object} { success, newState, error, description, nextTurn }
 */
export function processDeal(gameState, playerKey) {
  if (gameState.phase !== GAME_PHASE.CUTTING_FOR_DEALER) {
    return { success: false, error: 'Not in cut-for-dealer phase' };
  }

  const cutForDealer = gameState.cutForDealer;
  if (!cutForDealer?.dealer) {
    return { success: false, error: 'Dealer not yet determined' };
  }

  if (playerKey !== cutForDealer.dealer) {
    return { success: false, error: 'Only the dealer can deal' };
  }

  if (!cutForDealer.player1Acknowledged || !cutForDealer.player2Acknowledged) {
    return { success: false, error: 'Both players must acknowledge first' };
  }

  // Deal cards for the first round
  const roundState = initializeRoundState(cutForDealer.dealer);

  return {
    success: true,
    newState: {
      ...roundState,
      cutForDealer: cutForDealer
    },
    description: `Cards dealt!`,
    nextTurn: 'player1' // Both need to discard
  };
}

/**
 * Process a discard move
 * @param {object} gameState - Current game state
 * @param {string} playerKey - 'player1' or 'player2'
 * @param {array} cards - Cards to discard (2 cards)
 * @returns {object} { success, newState, error, description, nextTurn }
 */
export function processDiscard(gameState, playerKey, cards) {
  if (gameState.phase !== GAME_PHASE.DISCARDING) {
    return { success: false, error: 'Not in discard phase' };
  }

  if (!cards || cards.length !== 2) {
    return { success: false, error: 'Must discard exactly 2 cards' };
  }

  const handKey = `${playerKey}Hand`;
  const discardsKey = `${playerKey}Discards`;

  // Verify player hasn't already discarded
  if (gameState[discardsKey].length > 0) {
    return { success: false, error: 'Already discarded' };
  }

  // Verify cards are in player's hand
  const hand = gameState[handKey];
  for (const card of cards) {
    const found = hand.find(c => c.suit === card.suit && c.rank === card.rank);
    if (!found) {
      return { success: false, error: 'Card not in hand' };
    }
  }

  // Remove cards from hand, add to discards
  const newHand = hand.filter(c =>
    !cards.some(dc => dc.suit === c.suit && dc.rank === c.rank)
  );

  const newState = {
    ...gameState,
    [handKey]: newHand,
    [discardsKey]: cards,
    crib: [...gameState.crib, ...cards]
  };

  // Check if both players have discarded
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const opponentDiscardsKey = `${opponentKey}Discards`;
  const bothDiscarded = newState[opponentDiscardsKey].length === 2;

  if (bothDiscarded) {
    // Move to cut phase - non-dealer cuts
    const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';
    newState.phase = GAME_PHASE.CUT;

    // Set up play hands (4 cards each after discard)
    newState.playState.player1PlayHand = [...newState.player1Hand];
    newState.playState.player2PlayHand = [...newState.player2Hand];

    return {
      success: true,
      newState,
      description: `Discarded 2 cards. Both players ready - waiting for cut.`,
      nextTurn: nonDealer  // Non-dealer cuts
    };
  }

  return {
    success: true,
    newState,
    description: `Discarded 2 cards to crib`,
    nextTurn: opponentKey  // Wait for opponent to discard
  };
}

/**
 * Process the cut (reveal starter card)
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player doing the cut
 * @param {number} cutIndex - Index into remaining deck (0-39)
 * @returns {object} { success, newState, error, description, nextTurn, scoreChange }
 */
export function processCut(gameState, playerKey, cutIndex = null) {
  if (gameState.phase !== GAME_PHASE.CUT) {
    return { success: false, error: 'Not in cut phase' };
  }

  // Use random index if not specified
  const index = cutIndex ?? Math.floor(Math.random() * gameState.remainingDeck.length);
  const cutCard = gameState.remainingDeck[index];

  // Non-dealer plays first (unless His Heels requires acceptance)
  const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';

  // His Heels - Jack as starter gives dealer 2 points (pending acceptance)
  if (cutCard.rank === 'J') {
    const newState = {
      ...gameState,
      phase: GAME_PHASE.CUT,  // Stay in cut phase until accepted
      cutCard: cutCard,
      pendingPeggingScore: {
        player: gameState.dealer,
        points: 2,
        reason: 'His Heels',
        isHisHeels: true
      }
    };

    return {
      success: true,
      newState,
      description: `Cut ${cutCard.rank}${cutCard.suit} - His Heels! Dealer scores 2.`,
      nextTurn: gameState.dealer  // Dealer must accept
    };
  }

  const newState = {
    ...gameState,
    phase: GAME_PHASE.PLAYING,
    cutCard: cutCard
  };

  return {
    success: true,
    newState,
    description: `Cut ${cutCard.rank}${cutCard.suit}`,
    nextTurn: nonDealer
  };
}

/**
 * Process a play (pegging) move
 * Scores are stored as pendingPeggingScore and require acceptance before being applied.
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player making the play
 * @param {object} card - Card being played, or null for "Go"
 * @returns {object} { success, newState, error, description, nextTurn, scoreChange }
 */
export function processPlay(gameState, playerKey, card) {
  if (gameState.phase !== GAME_PHASE.PLAYING) {
    return { success: false, error: 'Not in play phase' };
  }

  // Block play if there's a pending score waiting to be accepted
  if (gameState.pendingPeggingScore) {
    return { success: false, error: 'A pending score must be accepted first' };
  }

  const playState = { ...gameState.playState };
  const playHandKey = `${playerKey}PlayHand`;
  const saidKey = `${playerKey}Said`;
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const opponentPlayHandKey = `${opponentKey}PlayHand`;
  const opponentSaidKey = `${opponentKey}Said`;
  const peggingHistory = [...(gameState.peggingHistory || [])];

  // Handle "Go"
  if (card === null) {
    const playerHand = playState[playHandKey];
    const playerCanPlay = playerHand.some(c =>
      playState.currentCount + Math.min(c.value, 10) <= 31
    );

    if (playerCanPlay) {
      return { success: false, error: 'You have playable cards - you must play one' };
    }

    playState[saidKey] = 'go';
    peggingHistory.push({ type: 'go', player: playerKey, count: playState.currentCount });

    // Check if opponent also said Go or has no playable cards
    const opponentHand = playState[opponentPlayHandKey];
    const opponentCanPlay = opponentHand.some(c =>
      playState.currentCount + Math.min(c.value, 10) <= 31
    );

    if (playState[opponentSaidKey] === 'go' || !opponentCanPlay) {
      // Both said Go - last player to play gets 1 point (or 2 for 31)
      const points = playState.currentCount === 31 ? 2 : 1;
      const scoringPlayer = playState.lastPlayedBy;
      const reason = playState.currentCount === 31 ? '31 for 2' : 'Go for 1';

      peggingHistory.push({ type: 'points', player: scoringPlayer, points, reason });

      // Check if both hands empty
      const player1Done = playState.player1PlayHand.length === 0;
      const player2Done = playState.player2PlayHand.length === 0;

      // Store pending score - don't reset round yet, accept handler will do it
      return {
        success: true,
        newState: {
          ...gameState,
          playState,
          peggingHistory,
          pendingPeggingScore: {
            player: scoringPlayer,
            points,
            reason,
            resetRound: true,
            bothDone: player1Done && player2Done
          }
        },
        description: `Go! ${reason}`,
        nextTurn: scoringPlayer  // Scoring player must accept
      };
    }

    return {
      success: true,
      newState: { ...gameState, playState, peggingHistory },
      description: `Said "Go"`,
      nextTurn: opponentKey
    };
  }

  // Playing a card
  const playerHand = playState[playHandKey];
  const cardIndex = playerHand.findIndex(c => c.suit === card.suit && c.rank === card.rank);

  if (cardIndex === -1) {
    return { success: false, error: 'Card not in hand' };
  }

  const cardValue = Math.min(card.value, 10);
  if (playState.currentCount + cardValue > 31) {
    return { success: false, error: 'Would exceed 31' };
  }

  // Remove card from hand, add to played
  const newHand = [...playerHand];
  newHand.splice(cardIndex, 1);
  playState[playHandKey] = newHand;

  playState.playedCards = [...playState.playedCards, { ...card, playedBy: playerKey }];
  playState.roundCards = [...playState.roundCards, { ...card, playedBy: playerKey }];
  playState.currentCount += cardValue;
  playState.lastPlayedBy = playerKey;

  // Reset opponent's Go since a card was played
  playState[opponentSaidKey] = null;

  // Calculate pegging points
  let points = 0;
  let pointsDesc = [];

  // 15
  if (playState.currentCount === 15) {
    points += 2;
    pointsDesc.push('15 for 2');
  }

  // 31
  if (playState.currentCount === 31) {
    points += 2;
    pointsDesc.push('31 for 2');
  }

  // Pairs
  const roundCards = playState.roundCards;
  if (roundCards.length >= 2) {
    const lastCards = roundCards.slice(-4).reverse();
    let pairCount = 0;
    for (let i = 1; i < lastCards.length; i++) {
      if (lastCards[i].rank === card.rank) {
        pairCount++;
      } else {
        break;
      }
    }
    if (pairCount === 1) {
      points += 2;
      pointsDesc.push('pair for 2');
    } else if (pairCount === 2) {
      points += 6;
      pointsDesc.push('three of a kind for 6');
    } else if (pairCount === 3) {
      points += 12;
      pointsDesc.push('four of a kind for 12');
    }
  }

  // Record card play in history
  peggingHistory.push({
    type: 'play', player: playerKey,
    card: `${card.rank}${card.suit}`,
    count: playState.currentCount,
    points, reason: pointsDesc.join(', ') || null
  });

  // Check if both hands empty after this play
  const player1Done = playState.player1PlayHand.length === 0;
  const player2Done = playState.player2PlayHand.length === 0;

  // If count is 31, note the reset (will happen now or on accept)
  const hit31 = playState.currentCount === 31;

  // Last card point check (both done, not 31)
  let needsLastCard = false;
  if (player1Done && player2Done && !hit31 && playState.currentCount > 0) {
    needsLastCard = true;
  }

  const description = `Played ${card.rank}${card.suit} (count: ${playState.currentCount})${pointsDesc.length > 0 ? ' - ' + pointsDesc.join(', ') : ''}`;

  if (points > 0) {
    // Store pending score
    const reason = pointsDesc.join(', ');

    // If hit 31, reset round immediately (it's automatic)
    if (hit31) {
      playState.currentCount = 0;
      playState.roundCards = [];
      playState[saidKey] = null;
      playState[opponentSaidKey] = null;
    }

    return {
      success: true,
      newState: {
        ...gameState,
        playState,
        peggingHistory,
        pendingPeggingScore: {
          player: playerKey,
          points,
          reason,
          needsLastCard,
          bothDone: player1Done && player2Done
        }
      },
      description,
      nextTurn: playerKey  // Scoring player must accept
    };
  }

  // No points scored
  // If hit 31 with no extra points (shouldn't happen since 31=2pts, but safety)
  if (hit31) {
    playState.currentCount = 0;
    playState.roundCards = [];
    playState[saidKey] = null;
    playState[opponentSaidKey] = null;
  }

  // If both done with no points and no last card needed
  if (player1Done && player2Done) {
    // No last card point either (count was 0 or was 31)
    const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';
    return {
      success: true,
      newState: {
        ...gameState,
        phase: GAME_PHASE.COUNTING,
        playState,
        peggingHistory
      },
      description,
      nextTurn: nonDealer
    };
  }

  // Determine next turn
  let nextTurn = opponentKey;
  const opponentHand = playState[opponentPlayHandKey];
  const opponentCanPlay = opponentHand.some(c =>
    playState.currentCount + Math.min(c.value, 10) <= 31
  );

  // If opponent can't play, check if current player can
  if (!opponentCanPlay) {
    const myCanPlay = playState[playHandKey].some(c =>
      playState.currentCount + Math.min(c.value, 10) <= 31
    );
    if (myCanPlay) {
      nextTurn = playerKey;
    }
  }

  return {
    success: true,
    newState: {
      ...gameState,
      playState,
      peggingHistory
    },
    description,
    nextTurn
  };
}

/**
 * Process acceptance of a pending pegging score
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player accepting the score
 * @returns {object} { success, newState, error, description, nextTurn, scoreChange, scorePlayer }
 */
export function processAcceptPeggingScore(gameState, playerKey) {
  const pending = gameState.pendingPeggingScore;
  if (!pending) {
    return { success: false, error: 'No pending score to accept' };
  }
  if (pending.player !== playerKey) {
    return { success: false, error: 'Not your score to accept' };
  }

  const playState = { ...gameState.playState };
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const peggingHistory = [...(gameState.peggingHistory || [])];

  // Apply points to pegging tracker
  const newPeggingPoints = {
    ...gameState.peggingPoints,
    [playerKey]: gameState.peggingPoints[playerKey] + pending.points
  };

  // Handle last card chaining: if needsLastCard, create a new pending for 1 point
  if (pending.needsLastCard) {
    peggingHistory.push({ type: 'points', player: playerKey, points: 1, reason: 'last card for 1' });
    return {
      success: true,
      newState: {
        ...gameState,
        playState,
        peggingPoints: newPeggingPoints,
        peggingHistory,
        pendingPeggingScore: {
          player: playerKey,
          points: 1,
          reason: 'last card for 1',
          needsLastCard: false,
          bothDone: true
        }
      },
      description: `Accepted ${pending.points} points (${pending.reason}). Last card!`,
      nextTurn: playerKey,
      scoreChange: pending.points,
      scorePlayer: playerKey
    };
  }

  // Handle round reset (from Go)
  if (pending.resetRound) {
    playState.currentCount = 0;
    playState.roundCards = [];
    playState.player1Said = null;
    playState.player2Said = null;
  }

  // Determine phase and next turn
  let newPhase = gameState.phase;
  let nextTurn;

  if (pending.bothDone) {
    // Both hands empty -> counting
    newPhase = GAME_PHASE.COUNTING;
    const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';
    nextTurn = nonDealer;
  } else if (pending.resetRound) {
    // Round reset after Go - determine who plays next
    // The non-scoring player leads next (opponent of last-played)
    nextTurn = opponentKey;
    // But check if opponent has cards
    const oppHand = playState[`${opponentKey}PlayHand`] || [];
    const myHand = playState[`${playerKey}PlayHand`] || [];
    if (oppHand.length === 0 && myHand.length > 0) {
      nextTurn = playerKey;
    }
  } else {
    // Normal card play - opponent's turn
    nextTurn = opponentKey;
    // Check if opponent can play
    const oppHand = playState[`${opponentKey}PlayHand`] || [];
    const oppCanPlay = oppHand.some(c =>
      playState.currentCount + Math.min(c.value, 10) <= 31
    );
    if (!oppCanPlay) {
      const myHand = playState[`${playerKey}PlayHand`] || [];
      const myCanPlay = myHand.some(c =>
        playState.currentCount + Math.min(c.value, 10) <= 31
      );
      if (myCanPlay) nextTurn = playerKey;
    }
  }

  // His Heels acceptance: transition to playing phase, non-dealer starts
  if (pending.isHisHeels) {
    newPhase = GAME_PHASE.PLAYING;
    const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';
    nextTurn = nonDealer;
  }

  return {
    success: true,
    newState: {
      ...gameState,
      phase: newPhase,
      playState,
      peggingPoints: newPeggingPoints,
      peggingHistory,
      pendingPeggingScore: null
    },
    description: `Accepted ${pending.points} points (${pending.reason})`,
    nextTurn,
    scoreChange: pending.points,
    scorePlayer: playerKey
  };
}

/**
 * Get card display string
 */
export function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

/**
 * Get cards that a player can legally play
 */
export function getPlayableCards(gameState, playerKey) {
  if (gameState.phase !== GAME_PHASE.PLAYING) {
    return [];
  }

  const playHandKey = `${playerKey}PlayHand`;
  const hand = gameState.playState[playHandKey];
  const currentCount = gameState.playState.currentCount;

  return hand.filter(card => currentCount + Math.min(card.value, 10) <= 31);
}

/**
 * Process a count move (hand scoring)
 * Order: non-dealer hand, dealer hand, crib (dealer)
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player doing the count
 * @returns {object} { success, newState, error, description, nextTurn, scoreChange, scoreBreakdown }
 */
export function processCount(gameState, playerKey) {
  if (gameState.phase !== GAME_PHASE.COUNTING) {
    return { success: false, error: 'Not in counting phase' };
  }

  const countingState = { ...gameState.countingState };
  const dealer = gameState.dealer;
  const nonDealer = dealer === 'player1' ? 'player2' : 'player1';

  // Determine what phase of counting we're in
  let countPhase = countingState.phase;
  if (!countPhase) {
    countPhase = 'nonDealer';  // Non-dealer counts first
  }

  // Validate it's the correct player's turn to count
  let expectedPlayer;
  if (countPhase === 'nonDealer') {
    expectedPlayer = nonDealer;
  } else if (countPhase === 'dealer') {
    expectedPlayer = dealer;
  } else if (countPhase === 'crib') {
    expectedPlayer = dealer;
  }

  if (playerKey !== expectedPlayer) {
    return { success: false, error: `Not your turn to count. Waiting for ${expectedPlayer}` };
  }

  // Get the hand to count
  let handToCount;
  let isCrib = false;
  let handLabel;

  if (countPhase === 'nonDealer') {
    handToCount = gameState[`${nonDealer}Hand`];
    handLabel = 'hand';
  } else if (countPhase === 'dealer') {
    handToCount = gameState[`${dealer}Hand`];
    handLabel = 'hand';
  } else if (countPhase === 'crib') {
    handToCount = gameState.crib;
    isCrib = true;
    handLabel = 'crib';
  }

  // Calculate score
  const { score, breakdown } = calculateHandScore(handToCount, gameState.cutCard, isCrib);

  // Record this count
  countingState.handsScored = [
    ...countingState.handsScored,
    {
      phase: countPhase,
      player: playerKey,
      hand: handToCount,
      score,
      breakdown
    }
  ];

  // Determine next phase
  let nextPhase;
  let nextTurn;
  let newGamePhase = GAME_PHASE.COUNTING;

  if (countPhase === 'nonDealer') {
    nextPhase = 'dealer';
    nextTurn = dealer;
  } else if (countPhase === 'dealer') {
    nextPhase = 'crib';
    nextTurn = dealer;  // Dealer counts crib
  } else if (countPhase === 'crib') {
    // All counting done - start new round or end game
    nextPhase = null;
    newGamePhase = GAME_PHASE.DEALING;  // Will trigger new round setup
    nextTurn = dealer === 'player1' ? 'player2' : 'player1';  // Alternate dealer
  }

  countingState.phase = nextPhase;
  countingState.currentCounter = nextTurn;

  const description = `Counted ${handLabel}: ${score} points`;

  return {
    success: true,
    newState: {
      ...gameState,
      phase: newGamePhase,
      countingState
    },
    description,
    nextTurn,
    scoreChange: score,
    scorePlayer: playerKey,
    scoreBreakdown: breakdown,
    countedHand: handToCount,
    countPhase
  };
}

/**
 * Process a claim-count move (player declares their score)
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player claiming the score
 * @param {number} claimedScore - Score the player declares
 * @returns {object} { success, newState, error, description, nextTurn }
 */
export function processClaimCount(gameState, playerKey, claimedScore) {
  if (gameState.phase !== GAME_PHASE.COUNTING) {
    return { success: false, error: 'Not in counting phase' };
  }

  const countingState = { ...gameState.countingState };
  const dealer = gameState.dealer;
  const nonDealer = dealer === 'player1' ? 'player2' : 'player1';

  let countPhase = countingState.phase || 'nonDealer';

  // Validate it's the correct player
  let expectedPlayer;
  if (countPhase === 'nonDealer') expectedPlayer = nonDealer;
  else if (countPhase === 'dealer') expectedPlayer = dealer;
  else if (countPhase === 'crib') expectedPlayer = dealer;

  if (playerKey !== expectedPlayer) {
    return { success: false, error: 'Not your turn to count' };
  }

  if (countingState.waitingForVerification) {
    return { success: false, error: 'Already waiting for verification' };
  }

  // Get the hand to count
  let handToCount;
  let isCrib = false;
  if (countPhase === 'nonDealer') {
    handToCount = gameState[`${nonDealer}Hand`];
  } else if (countPhase === 'dealer') {
    handToCount = gameState[`${dealer}Hand`];
  } else if (countPhase === 'crib') {
    handToCount = gameState.crib;
    isCrib = true;
  }

  // Server calculates actual score
  const { score: actualScore, breakdown: actualBreakdown } = calculateHandScore(handToCount, gameState.cutCard, isCrib);

  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';

  countingState.claimedScore = claimedScore;
  countingState.actualScore = actualScore;
  countingState.actualBreakdown = actualBreakdown;
  countingState.countedHand = handToCount;
  countingState.waitingForVerification = true;

  return {
    success: true,
    newState: {
      ...gameState,
      countingState
    },
    description: `Claimed ${claimedScore} points for ${countPhase === 'crib' ? 'crib' : 'hand'}`,
    nextTurn: opponentKey
  };
}

/**
 * Process a verify-count move (opponent accepts the claimed score)
 * Counter gets their claimedScore (not actual - undercounting is your loss)
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player verifying (the opponent)
 * @returns {object} { success, newState, error, description, nextTurn, scoreChange, scorePlayer }
 */
export function processVerifyCount(gameState, playerKey) {
  if (gameState.phase !== GAME_PHASE.COUNTING) {
    return { success: false, error: 'Not in counting phase' };
  }

  const countingState = { ...gameState.countingState };
  if (!countingState.waitingForVerification) {
    return { success: false, error: 'No count waiting for verification' };
  }

  const dealer = gameState.dealer;
  const nonDealer = dealer === 'player1' ? 'player2' : 'player1';
  let countPhase = countingState.phase || 'nonDealer';

  // The counter is the other player (not the verifier)
  const counterKey = playerKey === 'player1' ? 'player2' : 'player1';
  const scoreToAward = countingState.claimedScore;

  // Record in handsScored
  countingState.handsScored = [
    ...countingState.handsScored,
    {
      phase: countPhase,
      player: counterKey,
      hand: countingState.countedHand,
      score: scoreToAward,
      claimedScore: countingState.claimedScore,
      actualScore: countingState.actualScore,
      breakdown: countingState.actualBreakdown
    }
  ];

  // Clear verification state
  countingState.claimedScore = null;
  countingState.actualScore = null;
  countingState.actualBreakdown = null;
  countingState.countedHand = null;
  countingState.waitingForVerification = false;

  // Advance to next counting sub-phase
  let nextPhase;
  let nextTurn;
  let newGamePhase = GAME_PHASE.COUNTING;

  if (countPhase === 'nonDealer') {
    nextPhase = 'dealer';
    nextTurn = dealer;
  } else if (countPhase === 'dealer') {
    nextPhase = 'crib';
    nextTurn = dealer;
  } else if (countPhase === 'crib') {
    nextPhase = null;
    newGamePhase = GAME_PHASE.DEALING;
    nextTurn = dealer === 'player1' ? 'player2' : 'player1';
  }

  countingState.phase = nextPhase;
  countingState.currentCounter = nextTurn;

  return {
    success: true,
    newState: {
      ...gameState,
      phase: newGamePhase,
      countingState
    },
    description: `Accepted count of ${scoreToAward} points`,
    nextTurn,
    scoreChange: scoreToAward,
    scorePlayer: counterKey
  };
}

/**
 * Process a call-muggins move
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player calling muggins (the verifier/opponent)
 * @returns {object} { success, newState, error, description, nextTurn, scoreChanges, mugginsResult }
 */
export function processCallMuggins(gameState, playerKey) {
  if (gameState.phase !== GAME_PHASE.COUNTING) {
    return { success: false, error: 'Not in counting phase' };
  }

  const countingState = { ...gameState.countingState };
  if (!countingState.waitingForVerification) {
    return { success: false, error: 'No count waiting for verification' };
  }

  const dealer = gameState.dealer;
  const nonDealer = dealer === 'player1' ? 'player2' : 'player1';
  let countPhase = countingState.phase || 'nonDealer';

  const counterKey = playerKey === 'player1' ? 'player2' : 'player1';
  const claimed = countingState.claimedScore;
  const actual = countingState.actualScore;

  let scoreChanges = [];
  let mugginsResult;

  if (claimed > actual) {
    // Correct muggins: counter overcounted
    // Counter gets 0, caller steals the difference
    scoreChanges = [
      { player: counterKey, change: 0 },
      { player: playerKey, change: claimed - actual }
    ];
    mugginsResult = {
      correct: true,
      claimed,
      actual,
      stolen: claimed - actual,
      message: `Correct Muggins! ${claimed} claimed but only ${actual} actual. You steal ${claimed - actual} points.`
    };
  } else if (claimed === actual) {
    // Wrong muggins: count was correct
    // Counter gets their points, no penalty (penalty is optional in rules)
    scoreChanges = [
      { player: counterKey, change: claimed }
    ];
    mugginsResult = {
      correct: false,
      claimed,
      actual,
      stolen: 0,
      message: `Wrong Muggins! Count of ${claimed} was correct.`
    };
  } else {
    // Wrong muggins: counter undercounted (claimed < actual)
    // Counter keeps their claimed score (undercounting is their loss)
    scoreChanges = [
      { player: counterKey, change: claimed }
    ];
    mugginsResult = {
      correct: false,
      claimed,
      actual,
      stolen: 0,
      message: `Wrong Muggins! ${claimed} claimed, actual was ${actual}. Undercount stands.`
    };
  }

  // Record in handsScored
  countingState.handsScored = [
    ...countingState.handsScored,
    {
      phase: countPhase,
      player: counterKey,
      hand: countingState.countedHand,
      score: claimed > actual ? 0 : claimed,
      claimedScore: claimed,
      actualScore: actual,
      breakdown: countingState.actualBreakdown,
      muggins: mugginsResult.correct
    }
  ];

  // Clear verification state
  countingState.claimedScore = null;
  countingState.actualScore = null;
  countingState.actualBreakdown = null;
  countingState.countedHand = null;
  countingState.waitingForVerification = false;

  // Advance counting phase
  let nextPhase;
  let nextTurn;
  let newGamePhase = GAME_PHASE.COUNTING;

  if (countPhase === 'nonDealer') {
    nextPhase = 'dealer';
    nextTurn = dealer;
  } else if (countPhase === 'dealer') {
    nextPhase = 'crib';
    nextTurn = dealer;
  } else if (countPhase === 'crib') {
    nextPhase = null;
    newGamePhase = GAME_PHASE.DEALING;
    nextTurn = dealer === 'player1' ? 'player2' : 'player1';
  }

  countingState.phase = nextPhase;
  countingState.currentCounter = nextTurn;

  return {
    success: true,
    newState: {
      ...gameState,
      phase: newGamePhase,
      countingState
    },
    description: mugginsResult.correct ? `Called Muggins! Stole ${claimed - actual} points` : `Called Muggins incorrectly`,
    nextTurn,
    scoreChanges,
    mugginsResult
  };
}

/**
 * Start a new round after counting is complete
 * @param {object} gameState - Current game state after counting
 * @param {number} player1Score - Player 1's total score
 * @param {number} player2Score - Player 2's total score
 * @param {array} testDeck - Optional pre-defined deck for testing
 * @returns {object} New game state for next round
 */
export function startNewRound(gameState, player1Score, player2Score, testDeck = null) {
  // Check for game over (121 points)
  if (player1Score >= 121 || player2Score >= 121) {
    return {
      ...gameState,
      phase: GAME_PHASE.GAME_OVER
    };
  }

  // Alternate dealer
  const newDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';

  // Create fresh game state for new round
  const deck = testDeck || shuffleDeck(createDeck());
  const player1Hand = deck.slice(0, 6);
  const player2Hand = deck.slice(6, 12);
  const remainingDeck = deck.slice(12);

  return {
    phase: GAME_PHASE.DISCARDING,
    round: gameState.round + 1,
    dealer: newDealer,

    player1Hand,
    player2Hand,

    player1Discards: [],
    player2Discards: [],
    crib: [],

    cutCard: null,
    remainingDeck,

    playState: {
      player1PlayHand: [],
      player2PlayHand: [],
      playedCards: [],
      currentCount: 0,
      lastPlayedBy: null,
      player1Said: null,
      player2Said: null,
      roundCards: []
    },

    countingState: {
      phase: null,
      currentCounter: null,
      handsScored: [],
      claimedScore: null,
      actualScore: null,
      actualBreakdown: null,
      countedHand: null,
      waitingForVerification: false
    },

    pendingPeggingScore: null,
    peggingHistory: [],

    peggingPoints: {
      player1: 0,
      player2: 0
    }
  };
}
