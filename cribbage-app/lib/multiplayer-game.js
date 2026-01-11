/**
 * Multiplayer Cribbage Game Logic
 * Handles game state initialization and move processing for multiplayer games
 */

import { createDeck, shuffleDeck } from './deck';
import { calculateHandScore } from './scoring';

/**
 * Game phases
 */
export const GAME_PHASE = {
  DEALING: 'dealing',
  DISCARDING: 'discarding',
  CUT: 'cut',
  PLAYING: 'playing',
  COUNTING: 'counting',
  GAME_OVER: 'gameOver'
};

/**
 * Initialize a new multiplayer game state
 * Called when an invitation is accepted and game begins
 * @param {string} dealer - 'player1' or 'player2'
 * @returns {object} Initial game state
 */
export function initializeGameState(dealer = 'player1') {
  // Create and shuffle deck
  const deck = shuffleDeck(createDeck());

  // Deal 6 cards to each player
  const player1Hand = deck.slice(0, 6);
  const player2Hand = deck.slice(6, 12);
  const remainingDeck = deck.slice(12);

  return {
    phase: GAME_PHASE.DISCARDING,
    round: 1,
    dealer: dealer,

    // Hands - each player sees only their own
    player1Hand: player1Hand,
    player2Hand: player2Hand,

    // Cards discarded to crib (hidden until counting)
    player1Discards: [],
    player2Discards: [],
    crib: [],

    // Cut card (revealed after discards)
    cutCard: null,
    remainingDeck: remainingDeck,

    // Play phase state
    playState: {
      player1PlayHand: [],  // Cards available to play
      player2PlayHand: [],
      playedCards: [],      // Cards played this round
      currentCount: 0,
      lastPlayedBy: null,
      player1Said: null,    // 'go' or null
      player2Said: null,
      roundCards: []        // Cards in current 31-count round
    },

    // Counting phase state
    countingState: {
      phase: null,          // 'nonDealer', 'dealer', 'crib'
      currentCounter: null,
      handsScored: []
    },

    // Pegging points scored this round
    peggingPoints: {
      player1: 0,
      player2: 0
    }
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
  playState.roundCards = [...playState.roundCards, card];
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
 * @returns {object} New game state for next round
 */
export function startNewRound(gameState, player1Score, player2Score) {
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
  const deck = shuffleDeck(createDeck());
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
