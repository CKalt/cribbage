/**
 * Game action functions for Cribbage
 * These functions contain the game logic and manipulate game state
 */

import { Card, Player, GamePhase, PeggingPlay } from '@/types/game';
import { createDeck, shuffleDeck, getRankValue } from './cardUtils';
import { scorePegging, scoreHand } from './scoringUtils';
import { WINNING_SCORE } from './constants';

/**
 * Game state setter interface
 * All actions receive these setters as parameters
 */
export interface GameStateSetter {
  setGamePhase: (phase: GamePhase) => void;
  setDeck: (deck: Card[]) => void;
  setPlayerHand: (hand: Card[]) => void;
  setComputerHand: (hand: Card[]) => void;
  setCrib: (crib: Card[]) => void;
  setStarterCard: (card: Card | null) => void;
  setPlayerScore: (score: number | ((prev: number) => number)) => void;
  setComputerScore: (score: number | ((prev: number) => number)) => void;
  setDealer: (dealer: Player | null) => void;
  setMessage: (message: string) => void;
  setSelectedCards: (cards: Card[]) => void;
  setPeggingPile: (pile: PeggingPlay[]) => void;
  setPeggingCount: (count: number) => void;
  setPeggingTurn: (turn: Player | null) => void;
  setPlayerPeggingHand: (hand: Card[]) => void;
  setComputerPeggingHand: (hand: Card[]) => void;
  setPlayerPassedGo: (passed: boolean) => void;
  setComputerPassedGo: (passed: boolean) => void;
  setLastPegger: (player: Player | null) => void;
  setPlayerCutCard: (card: Card | null) => void;
  setComputerCutCard: (card: Card | null) => void;
  setDeckForCutting: (deck: Card[]) => void;
  setCutPosition: (position: number | null) => void;
}

/**
 * Initialize cutting for dealer
 */
export const cutForDeal = (setters: GameStateSetter) => {
  const newDeck = shuffleDeck(createDeck());
  setters.setDeckForCutting(newDeck);
  setters.setMessage('Click anywhere on the deck to cut!');
  setters.setGamePhase('cutting');
};

/**
 * Handle player cutting the deck
 */
export const handlePlayerCut = (
  position: number,
  gameState: {
    gamePhase: GamePhase;
    deckForCutting: Card[];
  },
  setters: GameStateSetter
) => {
  if (gameState.gamePhase !== 'cutting') return;

  setters.setCutPosition(position);
  const cutIndex = Math.floor((position / 100) * 40) + 5;
  const playerCard = gameState.deckForCutting[cutIndex];
  setters.setPlayerCutCard(playerCard);
  setters.setMessage('You cut the deck...');

  setTimeout(() => {
    setters.setMessage('Computer is cutting...');
    setTimeout(() => {
      const computerCutIndex = Math.floor(Math.random() * 20) + 30;
      const computerCard = gameState.deckForCutting[computerCutIndex];
      setters.setComputerCutCard(computerCard);
      setters.setMessage('Computer cuts the deck...');

      setTimeout(() => {
        const playerRank = getRankValue(playerCard.rank);
        const computerRank = getRankValue(computerCard.rank);

        if (playerRank < computerRank) {
          setters.setDealer('player');
          setters.setMessage(
            `You cut ${playerCard.rank}${playerCard.suit}, Computer cut ${computerCard.rank}${computerCard.suit}. You deal first! Lower card wins.`
          );
          setters.setGamePhase('cut');
        } else if (computerRank < playerRank) {
          setters.setDealer('computer');
          setters.setMessage(
            `You cut ${playerCard.rank}${playerCard.suit}, Computer cut ${computerCard.rank}${computerCard.suit}. Computer deals first! Lower card wins.`
          );
          setters.setGamePhase('cut');
        } else {
          setters.setMessage(
            `Tie! Both cut ${playerCard.rank}${playerCard.suit}. Click "Cut Again" to recut.`
          );
          setTimeout(() => {
            setters.setPlayerCutCard(null);
            setters.setComputerCutCard(null);
            setters.setDeckForCutting([]);
            setters.setCutPosition(null);
            setters.setGamePhase('initial');
          }, 2500);
        }
      }, 1000);
    }, 500);
  }, 1000);
};

/**
 * Deal hands to both players
 */
export const dealHands = (
  dealer: Player | null,
  setters: GameStateSetter
) => {
  const newDeck = shuffleDeck(createDeck());
  const player = newDeck.slice(0, 6);
  const computer = newDeck.slice(6, 12);
  const remaining = newDeck.slice(12);

  setters.setDeck(remaining);
  setters.setPlayerHand(player);
  setters.setComputerHand(computer);
  setters.setCrib([]);
  setters.setStarterCard(null);
  setters.setSelectedCards([]);
  setters.setPeggingPile([]);
  setters.setPeggingCount(0);
  setters.setPlayerPassedGo(false);
  setters.setComputerPassedGo(false);
  setters.setLastPegger(null);
  setters.setPlayerCutCard(null);
  setters.setComputerCutCard(null);
  setters.setGamePhase('discard');
  setters.setMessage(
    `Select 2 cards to discard to ${dealer === 'player' ? 'your' : "computer's"} crib`
  );
};

/**
 * Toggle card selection for discarding
 */
export const toggleCardSelection = (
  card: Card,
  selectedCards: Card[],
  setters: GameStateSetter
) => {
  const isSelected = selectedCards.some(
    (c) => c.suit === card.suit && c.rank === card.rank
  );

  if (isSelected) {
    setters.setSelectedCards(
      selectedCards.filter((c) => !(c.suit === card.suit && c.rank === card.rank))
    );
  } else if (selectedCards.length < 2) {
    setters.setSelectedCards([...selectedCards, card]);
  }
};

/**
 * Confirm discard to crib
 */
export const confirmDiscard = (
  gameState: {
    selectedCards: Card[];
    playerHand: Card[];
    computerHand: Card[];
  },
  setters: GameStateSetter
) => {
  if (gameState.selectedCards.length !== 2) {
    setters.setMessage('Please select exactly 2 cards to discard');
    return;
  }

  const newPlayerHand = gameState.playerHand.filter(
    (card) =>
      !gameState.selectedCards.some(
        (sc) => sc.suit === card.suit && sc.rank === card.rank
      )
  );

  const computerSorted = [...gameState.computerHand].sort((a, b) => b.value - a.value);
  const computerKeep = computerSorted.slice(0, 4);
  const computerDiscard = computerSorted.slice(4);

  setters.setPlayerHand(newPlayerHand);
  setters.setComputerHand(computerKeep);
  setters.setCrib([...gameState.selectedCards, ...computerDiscard]);
  setters.setSelectedCards([]);
  setters.setGamePhase('cut-starter');
  setters.setMessage('Click "Cut Starter Card"');
};

/**
 * Cut the starter card
 */
export const cutStarter = (
  gameState: {
    deck: Card[];
    dealer: Player | null;
  },
  setters: GameStateSetter
) => {
  const starter = gameState.deck[0];
  setters.setStarterCard(starter);
  setters.setDeck(gameState.deck.slice(1));

  if (starter.rank === 'J') {
    if (gameState.dealer === 'player') {
      setters.setPlayerScore((prev) => Math.min(prev + 2, WINNING_SCORE));
      setters.setMessage(`His Heels! You get 2 points for the Jack starter. Click "Start Pegging"`);
    } else {
      setters.setComputerScore((prev) => Math.min(prev + 2, WINNING_SCORE));
      setters.setMessage(
        `His Heels! Computer gets 2 points for the Jack starter. Click "Start Pegging"`
      );
    }
  } else {
    setters.setMessage(`Starter: ${starter.rank}${starter.suit}. Click "Start Pegging"`);
  }
};

/**
 * Start the pegging phase
 */
export const startPegging = (
  gameState: {
    playerHand: Card[];
    computerHand: Card[];
    dealer: Player | null;
  },
  setters: GameStateSetter,
  onComputerPeg?: () => void
) => {
  setters.setPlayerPeggingHand([...gameState.playerHand]);
  setters.setComputerPeggingHand([...gameState.computerHand]);
  setters.setPeggingPile([]);
  setters.setPeggingCount(0);
  setters.setPlayerPassedGo(false);
  setters.setComputerPassedGo(false);

  const firstPlayer = gameState.dealer === 'player' ? 'computer' : 'player';
  setters.setPeggingTurn(firstPlayer);
  setters.setGamePhase('pegging');
  setters.setMessage(firstPlayer === 'player' ? 'Your turn! Select a card to play for pegging' : 'Computer is pegging...');

  if (firstPlayer === 'computer' && onComputerPeg) {
    setTimeout(() => onComputerPeg(), 1000);
  }
};

/**
 * Player pegs a card
 */
export const playerPeg = (
  card: Card,
  gameState: {
    peggingCount: number;
    peggingPile: PeggingPlay[];
    playerPeggingHand: Card[];
    computerPeggingHand: Card[];
    lastPegger: Player | null;
  },
  setters: GameStateSetter,
  onStartCounting?: () => void,
  onComputerPeg?: () => void
) => {
  if (gameState.peggingCount + card.value > 31) {
    setters.setMessage('Cannot play - would exceed 31. Say "Go" or play another card.');
    return;
  }

  const newPile = [...gameState.peggingPile, { card, player: 'player' as Player }];
  const newCount = gameState.peggingCount + card.value;
  const newPlayerHand = gameState.playerPeggingHand.filter(
    (c) => !(c.suit === card.suit && c.rank === card.rank)
  );

  setters.setPeggingPile(newPile);
  setters.setPeggingCount(newCount);
  setters.setPlayerPeggingHand(newPlayerHand);
  setters.setPlayerPassedGo(false);
  setters.setLastPegger('player');

  const points = scorePegging(newPile, newCount);
  if (points > 0) {
    setters.setPlayerScore((prev) => Math.min(prev + points, WINNING_SCORE));
    setters.setMessage(`You scored ${points} point(s)! Count: ${newCount}`);
  } else {
    setters.setMessage(`Count: ${newCount}`);
  }

  if (newCount === 31) {
    setTimeout(() => {
      setters.setMessage('31 for 2 points! Resetting...');
      setters.setPeggingPile([]);
      setters.setPeggingCount(0);
      setters.setPlayerPassedGo(false);
      setters.setComputerPassedGo(false);

      if (newPlayerHand.length === 0 && gameState.computerPeggingHand.length === 0) {
        if (onStartCounting) setTimeout(() => onStartCounting(), 1500);
      } else if (newPlayerHand.length > 0 || gameState.computerPeggingHand.length > 0) {
        const nextPlayer = newPlayerHand.length > 0 ? 'player' : 'computer';
        setters.setPeggingTurn(nextPlayer);
        if (nextPlayer === 'computer' && onComputerPeg) {
          setTimeout(() => onComputerPeg(), 1000);
        }
      }
    }, 1500);
    return;
  }

  if (newPlayerHand.length === 0 && gameState.computerPeggingHand.length === 0) {
    setTimeout(() => {
      if (gameState.lastPegger === 'player') {
        setters.setPlayerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
        setters.setMessage('You get 1 for last card');
      } else {
        setters.setComputerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
        setters.setMessage('Computer gets 1 for last card');
      }
      if (onStartCounting) setTimeout(() => onStartCounting(), 1500);
    }, 1500);
    return;
  }

  setters.setPeggingTurn('computer');
  if (onComputerPeg) setTimeout(() => onComputerPeg(), 1000);
};

/**
 * Player says "Go"
 */
export const playerSayGo = (
  gameState: {
    computerPassedGo: boolean;
    lastPegger: Player | null;
    playerPeggingHand: Card[];
    computerPeggingHand: Card[];
  },
  setters: GameStateSetter,
  onStartCounting?: () => void,
  onComputerPeg?: () => void
) => {
  setters.setPlayerPassedGo(true);
  setters.setMessage('You say "Go"');

  if (gameState.computerPassedGo) {
    if (gameState.lastPegger === 'player') {
      setters.setPlayerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
    } else if (gameState.lastPegger === 'computer') {
      setters.setComputerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
    }

    setTimeout(() => {
      setters.setPeggingPile([]);
      setters.setPeggingCount(0);
      setters.setPlayerPassedGo(false);
      setters.setComputerPassedGo(false);

      if (gameState.playerPeggingHand.length === 0 && gameState.computerPeggingHand.length === 0) {
        if (onStartCounting) onStartCounting();
      } else {
        const nextPlayer = gameState.playerPeggingHand.length > 0 ? 'player' : 'computer';
        setters.setPeggingTurn(nextPlayer);
        if (nextPlayer === 'computer' && onComputerPeg) {
          setTimeout(() => onComputerPeg(), 1000);
        }
      }
    }, 1500);
    return;
  }

  setters.setPeggingTurn('computer');
  if (onComputerPeg) setTimeout(() => onComputerPeg(), 1000);
};

/**
 * Computer pegs a card
 */
export const computerPeg = (
  gameState: {
    computerPeggingHand: Card[];
    peggingCount: number;
    peggingPile: PeggingPlay[];
    playerPassedGo: boolean;
    lastPegger: Player | null;
    playerPeggingHand: Card[];
  },
  setters: GameStateSetter,
  onStartCounting?: () => void,
  onComputerPeg?: () => void
): void => {
  const playableCards = gameState.computerPeggingHand.filter(
    (c) => gameState.peggingCount + c.value <= 31
  );

  if (playableCards.length === 0) {
    setters.setComputerPassedGo(true);
    setters.setMessage('Computer says "Go"');

    if (gameState.playerPassedGo) {
      if (gameState.lastPegger === 'computer') {
        setters.setComputerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
      } else if (gameState.lastPegger === 'player') {
        setters.setPlayerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
      }

      setTimeout(() => {
        setters.setPeggingPile([]);
        setters.setPeggingCount(0);
        setters.setPlayerPassedGo(false);
        setters.setComputerPassedGo(false);

        if (gameState.playerPeggingHand.length === 0 && gameState.computerPeggingHand.length === 0) {
          if (onStartCounting) onStartCounting();
        } else {
          const nextPlayer = gameState.playerPeggingHand.length > 0 ? 'player' : 'computer';
          setters.setPeggingTurn(nextPlayer);
          if (nextPlayer === 'computer' && onComputerPeg) {
            setTimeout(() => onComputerPeg(), 1000);
          } else if (nextPlayer === 'player') {
            setters.setMessage('Your turn! Select a card to play');
          }
        }
      }, 1500);
      return;
    }

    setters.setPeggingTurn('player');
    setters.setMessage('Computer says "Go". Your turn! Select a card to play');
    return;
  }

  const card = playableCards[0];
  const newPile = [...gameState.peggingPile, { card, player: 'computer' as Player }];
  const newCount = gameState.peggingCount + card.value;
  const newComputerHand = gameState.computerPeggingHand.filter(
    (c) => !(c.suit === card.suit && c.rank === card.rank)
  );

  setters.setPeggingPile(newPile);
  setters.setPeggingCount(newCount);
  setters.setComputerPeggingHand(newComputerHand);
  setters.setComputerPassedGo(false);
  setters.setLastPegger('computer');

  const points = scorePegging(newPile, newCount);
  if (points > 0) {
    setters.setComputerScore((prev) => Math.min(prev + points, WINNING_SCORE));
    setters.setMessage(`Computer scored ${points} point(s)! Count: ${newCount}`);
  } else {
    setters.setMessage(`Computer plays ${card.rank}${card.suit}. Count: ${newCount}`);
  }

  if (newCount === 31) {
    setTimeout(() => {
      setters.setMessage('Computer makes 31 for 2 points! Resetting...');
      setters.setPeggingPile([]);
      setters.setPeggingCount(0);
      setters.setPlayerPassedGo(false);
      setters.setComputerPassedGo(false);

      if (gameState.playerPeggingHand.length === 0 && newComputerHand.length === 0) {
        if (onStartCounting) setTimeout(() => onStartCounting(), 1500);
      } else if (gameState.playerPeggingHand.length > 0 || newComputerHand.length > 0) {
        const nextPlayer = gameState.playerPeggingHand.length > 0 ? 'player' : 'computer';
        setters.setPeggingTurn(nextPlayer);
        if (nextPlayer === 'computer' && onComputerPeg) {
          setTimeout(() => onComputerPeg(), 1000);
        } else if (nextPlayer === 'player') {
          setters.setMessage('Your turn! Select a card to play');
        }
      }
    }, 1500);
    return;
  }

  if (gameState.playerPeggingHand.length === 0 && newComputerHand.length === 0) {
    setTimeout(() => {
      if (gameState.lastPegger === 'computer') {
        setters.setComputerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
        setters.setMessage('Computer gets 1 for last card');
      } else {
        setters.setPlayerScore((prev) => Math.min(prev + 1, WINNING_SCORE));
        setters.setMessage('You get 1 for last card');
      }
      if (onStartCounting) setTimeout(() => onStartCounting(), 1500);
    }, 1500);
    return;
  }

  setters.setPeggingTurn('player');
  // Update message to prompt player after a short delay
  setTimeout(() => {
    setters.setMessage('Your turn! Select a card to play');
  }, 1000);
};

/**
 * Start counting hands and crib
 */
export const startCounting = (
  gameState: {
    dealer: Player | null;
    computerHand: Card[];
    playerHand: Card[];
    crib: Card[];
    starterCard: Card | null;
  },
  setters: GameStateSetter,
  onCheckWin?: () => void
) => {
  if (!gameState.starterCard) return;

  setters.setGamePhase('counting');
  setters.setMessage('Counting hands...');

  setTimeout(() => {
    if (gameState.dealer === 'player') {
      const compScore = scoreHand(gameState.computerHand, gameState.starterCard!, false);
      setters.setComputerScore((prev) => Math.min(prev + compScore, WINNING_SCORE));
      setters.setMessage(`Computer's hand: ${compScore} points`);

      setTimeout(() => {
        const playerHandScore = scoreHand(gameState.playerHand, gameState.starterCard!, false);
        setters.setPlayerScore((prev) => Math.min(prev + playerHandScore, WINNING_SCORE));
        setters.setMessage(`Your hand: ${playerHandScore} points`);

        setTimeout(() => {
          const cribScore = scoreHand(gameState.crib, gameState.starterCard!, true);
          setters.setPlayerScore((prev) => Math.min(prev + cribScore, WINNING_SCORE));
          setters.setMessage(`Your crib: ${cribScore} points`);
          if (onCheckWin) setTimeout(() => onCheckWin(), 1500);
        }, 2000);
      }, 2000);
    } else {
      const playerHandScore = scoreHand(gameState.playerHand, gameState.starterCard!, false);
      setters.setPlayerScore((prev) => Math.min(prev + playerHandScore, WINNING_SCORE));
      setters.setMessage(`Your hand: ${playerHandScore} points`);

      setTimeout(() => {
        const compScore = scoreHand(gameState.computerHand, gameState.starterCard!, false);
        setters.setComputerScore((prev) => Math.min(prev + compScore, WINNING_SCORE));
        setters.setMessage(`Computer's hand: ${compScore} points`);

        setTimeout(() => {
          const cribScore = scoreHand(gameState.crib, gameState.starterCard!, true);
          setters.setComputerScore((prev) => Math.min(prev + cribScore, WINNING_SCORE));
          setters.setMessage(`Computer's crib: ${cribScore} points`);
          if (onCheckWin) setTimeout(() => onCheckWin(), 1500);
        }, 2000);
      }, 2000);
    }
  }, 1000);
};

/**
 * Check for winner and continue or end game
 */
export const checkWinAndContinue = (
  gameState: {
    playerScore: number;
    computerScore: number;
  },
  setters: GameStateSetter
) => {
  if (gameState.playerScore >= WINNING_SCORE || gameState.computerScore >= WINNING_SCORE) {
    setters.setGamePhase('game-over');
    setters.setMessage(
      gameState.playerScore >= WINNING_SCORE ? 'You won the game!' : 'Computer won the game!'
    );
  } else {
    setters.setGamePhase('round-end');
    setters.setMessage('Round complete. Click "Next Round"');
  }
};

/**
 * Start next round
 */
export const nextRound = (
  dealer: Player | null,
  setters: GameStateSetter
) => {
  setters.setDealer(dealer === 'player' ? 'computer' : 'player');
  setters.setGamePhase('deal');
  setters.setMessage(`${dealer === 'computer' ? 'You' : 'Computer'} will deal next. Click "Deal Cards"`);
};

/**
 * Start a new game
 */
export const newGame = (setters: GameStateSetter) => {
  setters.setPlayerScore(0);
  setters.setComputerScore(0);
  setters.setDealer(null);
  setters.setGamePhase('initial');
  setters.setMessage('Click "Cut for Deal" to determine who deals first');
};
