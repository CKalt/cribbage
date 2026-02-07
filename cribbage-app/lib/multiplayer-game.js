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
      handsScored: []
    },

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
      handsScored: []
    },

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

  let scoreChange = 0;
  let heelsMessage = '';

  // His Heels - Jack as starter gives dealer 2 points
  if (cutCard.rank === 'J') {
    scoreChange = 2;
    heelsMessage = ' - His Heels! Dealer scores 2.';
  }

  // Non-dealer plays first
  const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';

  const newState = {
    ...gameState,
    phase: GAME_PHASE.PLAYING,
    cutCard: cutCard
  };

  return {
    success: true,
    newState,
    description: `Cut ${cutCard.rank}${cutCard.suit}${heelsMessage}`,
    nextTurn: nonDealer,  // Non-dealer plays first
    scoreChange: scoreChange,
    scorePlayer: gameState.dealer  // Dealer gets His Heels
  };
}

/**
 * Process a play (pegging) move
 * @param {object} gameState - Current game state
 * @param {string} playerKey - Player making the play
 * @param {object} card - Card being played, or null for "Go"
 * @returns {object} { success, newState, error, description, nextTurn, scoreChange }
 */
export function processPlay(gameState, playerKey, card) {
  if (gameState.phase !== GAME_PHASE.PLAYING) {
    return { success: false, error: 'Not in play phase' };
  }

  const playState = { ...gameState.playState };
  const playHandKey = `${playerKey}PlayHand`;
  const saidKey = `${playerKey}Said`;
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const opponentPlayHandKey = `${opponentKey}PlayHand`;
  const opponentSaidKey = `${opponentKey}Said`;

  // Handle "Go"
  if (card === null) {
    // Check if player has any playable cards - they can only say Go if they don't
    const playerHand = playState[playHandKey];
    const playerCanPlay = playerHand.some(c =>
      playState.currentCount + Math.min(c.value, 10) <= 31
    );

    if (playerCanPlay) {
      return { success: false, error: 'You have playable cards - you must play one' };
    }

    // Player says Go
    playState[saidKey] = 'go';

    // Check if opponent also said Go or has no playable cards
    const opponentHand = playState[opponentPlayHandKey];
    const opponentCanPlay = opponentHand.some(c =>
      playState.currentCount + Math.min(c.value, 10) <= 31
    );

    if (playState[opponentSaidKey] === 'go' || !opponentCanPlay) {
      // Both said Go - last player to play gets 1 point (or 2 for 31)
      let points = playState.currentCount === 31 ? 2 : 1;
      const scoringPlayer = playState.lastPlayedBy;

      // Reset for new round
      playState.currentCount = 0;
      playState.roundCards = [];
      playState[saidKey] = null;
      playState[opponentSaidKey] = null;

      // Check if play phase is over (both hands empty)
      const player1Done = playState.player1PlayHand.length === 0;
      const player2Done = playState.player2PlayHand.length === 0;

      let newPhase = gameState.phase;
      let nextTurn = opponentKey;

      if (player1Done && player2Done) {
        // Move to counting phase
        newPhase = GAME_PHASE.COUNTING;
        const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';
        nextTurn = nonDealer;  // Non-dealer counts first
      }

      return {
        success: true,
        newState: {
          ...gameState,
          phase: newPhase,
          playState,
          peggingPoints: {
            ...gameState.peggingPoints,
            [scoringPlayer]: gameState.peggingPoints[scoringPlayer] + points
          }
        },
        description: `Go! ${scoringPlayer === playerKey ? 'You' : 'Opponent'} scores ${points} for ${playState.currentCount === 31 ? '31' : 'last card'}`,
        nextTurn,
        scoreChange: points,
        scorePlayer: scoringPlayer
      };
    }

    return {
      success: true,
      newState: { ...gameState, playState },
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

  // Pairs (simplified - just check immediate pairs)
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

  // Determine next turn
  let nextTurn = opponentKey;
  const opponentHand = playState[opponentPlayHandKey];
  const opponentCanPlay = opponentHand.some(c =>
    playState.currentCount + Math.min(c.value, 10) <= 31
  );

  // If count is 31, reset for new round
  if (playState.currentCount === 31) {
    playState.currentCount = 0;
    playState.roundCards = [];
    playState[saidKey] = null;
    playState[opponentSaidKey] = null;
  }

  // Check if play phase is over
  const player1Done = playState.player1PlayHand.length === 0;
  const player2Done = playState.player2PlayHand.length === 0;
  let newPhase = gameState.phase;

  if (player1Done && player2Done) {
    // Last card point if not already 31
    if (playState.currentCount > 0 && playState.currentCount < 31) {
      points += 1;
      pointsDesc.push('last card for 1');
    }
    newPhase = GAME_PHASE.COUNTING;
    const nonDealer = gameState.dealer === 'player1' ? 'player2' : 'player1';
    nextTurn = nonDealer;
  }

  const description = `Played ${card.rank}${card.suit} (count: ${playState.currentCount})${pointsDesc.length > 0 ? ' - ' + pointsDesc.join(', ') : ''}`;

  return {
    success: true,
    newState: {
      ...gameState,
      phase: newPhase,
      playState,
      peggingPoints: {
        ...gameState.peggingPoints,
        [playerKey]: gameState.peggingPoints[playerKey] + points
      }
    },
    description,
    nextTurn,
    scoreChange: points,
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
      handsScored: []
    },

    peggingPoints: {
      player1: 0,
      player2: 0
    }
  };
}
