import React, { useState } from 'react';

const CribbageGame = () => {
  // Card definitions
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const createDeck = () => {
    const deck = [];
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank, value: getCardValue(rank) });
      }
    }
    return deck;
  };
  
  const getCardValue = (rank) => {
    if (rank === 'A') return 1;
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
  };
  
  const getRankValue = (rank) => {
    const rankMap = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
    return rankMap[rank];
  };
  
  const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };
  
  // Game state
  const [gamePhase, setGamePhase] = useState('initial');
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [crib, setCrib] = useState([]);
  const [starterCard, setStarterCard] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [dealer, setDealer] = useState(null);
  const [message, setMessage] = useState('Click "Cut for Deal" to determine who deals first');
  const [selectedCards, setSelectedCards] = useState([]);
  const [peggingPile, setPeggingPile] = useState([]);
  const [peggingCount, setPeggingCount] = useState(0);
  const [peggingTurn, setPeggingTurn] = useState(null);
  const [playerPeggingHand, setPlayerPeggingHand] = useState([]);
  const [computerPeggingHand, setComputerPeggingHand] = useState([]);
  const [playerPassedGo, setPlayerPassedGo] = useState(false);
  const [computerPassedGo, setComputerPassedGo] = useState(false);
  const [lastPegger, setLastPegger] = useState(null);
  const [playerCutCard, setPlayerCutCard] = useState(null);
  const [computerCutCard, setComputerCutCard] = useState(null);
  const [deckForCutting, setDeckForCutting] = useState([]);
  const [cutPosition, setCutPosition] = useState(null);
  
  // Initial cut for dealer
  const cutForDeal = () => {
    const newDeck = shuffleDeck(createDeck());
    setDeckForCutting(newDeck);
    setMessage('Click anywhere on the deck to cut!');
    setGamePhase('cutting');
  };
  
  const handlePlayerCut = (position) => {
    if (gamePhase !== 'cutting') return;
    
    setCutPosition(position);
    const cutIndex = Math.floor((position / 100) * 40) + 5;
    const playerCard = deckForCutting[cutIndex];
    setPlayerCutCard(playerCard);
    setMessage('You cut the deck...');
    
    setTimeout(() => {
      setMessage('Computer is cutting...');
      setTimeout(() => {
        const computerCutIndex = Math.floor(Math.random() * 20) + 30;
        const computerCard = deckForCutting[computerCutIndex];
        setComputerCutCard(computerCard);
        setMessage('Computer cuts the deck...');
        
        setTimeout(() => {
          const playerRank = getRankValue(playerCard.rank);
          const computerRank = getRankValue(computerCard.rank);
          
          if (playerRank < computerRank) {
            setDealer('player');
            setMessage(`You cut ${playerCard.rank}${playerCard.suit}, Computer cut ${computerCard.rank}${computerCard.suit}. You deal first! Lower card wins.`);
            setGamePhase('cut');
          } else if (computerRank < playerRank) {
            setDealer('computer');
            setMessage(`You cut ${playerCard.rank}${playerCard.suit}, Computer cut ${computerCard.rank}${computerCard.suit}. Computer deals first! Lower card wins.`);
            setGamePhase('cut');
          } else {
            setMessage(`Tie! Both cut ${playerCard.rank}${playerCard.suit}. Click "Cut Again" to recut.`);
            setTimeout(() => {
              setPlayerCutCard(null);
              setComputerCutCard(null);
              setDeckForCutting([]);
              setCutPosition(null);
              setGamePhase('initial');
            }, 2500);
          }
        }, 1000);
      }, 500);
    }, 1000);
  };
  
  const dealHands = () => {
    const newDeck = shuffleDeck(createDeck());
    const player = newDeck.slice(0, 6);
    const computer = newDeck.slice(6, 12);
    const remaining = newDeck.slice(12);
    
    setDeck(remaining);
    setPlayerHand(player);
    setComputerHand(computer);
    setCrib([]);
    setStarterCard(null);
    setSelectedCards([]);
    setPeggingPile([]);
    setPeggingCount(0);
    setPlayerPassedGo(false);
    setComputerPassedGo(false);
    setLastPegger(null);
    setPlayerCutCard(null);
    setComputerCutCard(null);
    setGamePhase('discard');
    setMessage(`Select 2 cards to discard to ${dealer === 'player' ? 'your' : "computer's"} crib`);
  };
  
  const toggleCardSelection = (card) => {
    const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
    
    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => !(c.suit === card.suit && c.rank === card.rank)));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    }
  };
  
  const confirmDiscard = () => {
    if (selectedCards.length !== 2) {
      setMessage('Please select exactly 2 cards to discard');
      return;
    }
    
    const newPlayerHand = playerHand.filter(card => 
      !selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank)
    );
    
    const computerSorted = [...computerHand].sort((a, b) => b.value - a.value);
    const computerKeep = computerSorted.slice(0, 4);
    const computerDiscard = computerSorted.slice(4);
    
    setPlayerHand(newPlayerHand);
    setComputerHand(computerKeep);
    setCrib([...selectedCards, ...computerDiscard]);
    setSelectedCards([]);
    setGamePhase('cut-starter');
    setMessage('Click "Cut Starter Card"');
  };
  
  const cutStarter = () => {
    const starter = deck[0];
    setStarterCard(starter);
    setDeck(deck.slice(1));
    
    if (starter.rank === 'J') {
      if (dealer === 'player') {
        setPlayerScore(prev => Math.min(prev + 2, 121));
        setMessage(`His Heels! You get 2 points for the Jack starter. Click "Start Pegging"`);
      } else {
        setComputerScore(prev => Math.min(prev + 2, 121));
        setMessage(`His Heels! Computer gets 2 points for the Jack starter. Click "Start Pegging"`);
      }
    } else {
      setMessage(`Starter: ${starter.rank}${starter.suit}. Click "Start Pegging"`);
    }
  };
  
  const startPegging = () => {
    setPlayerPeggingHand([...playerHand]);
    setComputerPeggingHand([...computerHand]);
    setPeggingPile([]);
    setPeggingCount(0);
    setPlayerPassedGo(false);
    setComputerPassedGo(false);
    
    const firstPlayer = dealer === 'player' ? 'computer' : 'player';
    setPeggingTurn(firstPlayer);
    setGamePhase('pegging');
    setMessage(firstPlayer === 'player' ? 'Your turn to peg' : 'Computer is pegging...');
    
    if (firstPlayer === 'computer') {
      setTimeout(() => computerPeg(), 1000);
    }
  };
  
  const playerPeg = (card) => {
    if (peggingCount + card.value > 31) {
      setMessage('Cannot play - would exceed 31. Say "Go" or play another card.');
      return;
    }
    
    const newPile = [...peggingPile, { card, player: 'player' }];
    const newCount = peggingCount + card.value;
    const newPlayerHand = playerPeggingHand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
    
    setPeggingPile(newPile);
    setPeggingCount(newCount);
    setPlayerPeggingHand(newPlayerHand);
    setPlayerPassedGo(false);
    setLastPegger('player');
    
    const points = scorePegging(newPile, newCount);
    if (points > 0) {
      setPlayerScore(prev => Math.min(prev + points, 121));
      setMessage(`You scored ${points} point(s)! Count: ${newCount}`);
    } else {
      setMessage(`Count: ${newCount}`);
    }
    
    if (newCount === 31) {
      setTimeout(() => {
        setMessage('31 for 2 points! Resetting...');
        setPeggingPile([]);
        setPeggingCount(0);
        setPlayerPassedGo(false);
        setComputerPassedGo(false);
        
        if (newPlayerHand.length === 0 && computerPeggingHand.length === 0) {
          setTimeout(() => startCounting(), 1500);
        } else if (newPlayerHand.length > 0 || computerPeggingHand.length > 0) {
          const nextPlayer = newPlayerHand.length > 0 ? 'player' : 'computer';
          setPeggingTurn(nextPlayer);
          if (nextPlayer === 'computer') {
            setTimeout(() => computerPeg(), 1000);
          }
        }
      }, 1500);
      return;
    }
    
    if (newPlayerHand.length === 0 && computerPeggingHand.length === 0) {
      setTimeout(() => {
        if (lastPegger === 'player') {
          setPlayerScore(prev => Math.min(prev + 1, 121));
          setMessage('You get 1 for last card');
        } else {
          setComputerScore(prev => Math.min(prev + 1, 121));
          setMessage('Computer gets 1 for last card');
        }
        setTimeout(() => startCounting(), 1500);
      }, 1500);
      return;
    }
    
    setPeggingTurn('computer');
    setTimeout(() => computerPeg(), 1000);
  };
  
  const playerSayGo = () => {
    setPlayerPassedGo(true);
    setMessage('You say "Go"');
    
    if (computerPassedGo) {
      if (lastPegger === 'player') {
        setPlayerScore(prev => Math.min(prev + 1, 121));
      } else if (lastPegger === 'computer') {
        setComputerScore(prev => Math.min(prev + 1, 121));
      }
      
      setTimeout(() => {
        setPeggingPile([]);
        setPeggingCount(0);
        setPlayerPassedGo(false);
        setComputerPassedGo(false);
        
        if (playerPeggingHand.length === 0 && computerPeggingHand.length === 0) {
          startCounting();
        } else {
          const nextPlayer = playerPeggingHand.length > 0 ? 'player' : 'computer';
          setPeggingTurn(nextPlayer);
          if (nextPlayer === 'computer') {
            setTimeout(() => computerPeg(), 1000);
          }
        }
      }, 1500);
      return;
    }
    
    setPeggingTurn('computer');
    setTimeout(() => computerPeg(), 1000);
  };
  
  const computerPeg = () => {
    const playableCards = computerPeggingHand.filter(c => peggingCount + c.value <= 31);
    
    if (playableCards.length === 0) {
      setComputerPassedGo(true);
      setMessage('Computer says "Go"');
      
      if (playerPassedGo) {
        if (lastPegger === 'computer') {
          setComputerScore(prev => Math.min(prev + 1, 121));
        } else if (lastPegger === 'player') {
          setPlayerScore(prev => Math.min(prev + 1, 121));
        }
        
        setTimeout(() => {
          setPeggingPile([]);
          setPeggingCount(0);
          setPlayerPassedGo(false);
          setComputerPassedGo(false);
          
          if (playerPeggingHand.length === 0 && computerPeggingHand.length === 0) {
            startCounting();
          } else {
            const nextPlayer = playerPeggingHand.length > 0 ? 'player' : 'computer';
            setPeggingTurn(nextPlayer);
            if (nextPlayer === 'computer') {
              setTimeout(() => computerPeg(), 1000);
            }
          }
        }, 1500);
        return;
      }
      
      setPeggingTurn('player');
      return;
    }
    
    const card = playableCards[0];
    const newPile = [...peggingPile, { card, player: 'computer' }];
    const newCount = peggingCount + card.value;
    const newComputerHand = computerPeggingHand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
    
    setPeggingPile(newPile);
    setPeggingCount(newCount);
    setComputerPeggingHand(newComputerHand);
    setComputerPassedGo(false);
    setLastPegger('computer');
    
    const points = scorePegging(newPile, newCount);
    if (points > 0) {
      setComputerScore(prev => Math.min(prev + points, 121));
      setMessage(`Computer scored ${points} point(s)! Count: ${newCount}`);
    } else {
      setMessage(`Computer plays ${card.rank}${card.suit}. Count: ${newCount}`);
    }
    
    if (newCount === 31) {
      setTimeout(() => {
        setMessage('Computer makes 31 for 2 points! Resetting...');
        setPeggingPile([]);
        setPeggingCount(0);
        setPlayerPassedGo(false);
        setComputerPassedGo(false);
        
        if (playerPeggingHand.length === 0 && newComputerHand.length === 0) {
          setTimeout(() => startCounting(), 1500);
        } else if (playerPeggingHand.length > 0 || newComputerHand.length > 0) {
          const nextPlayer = playerPeggingHand.length > 0 ? 'player' : 'computer';
          setPeggingTurn(nextPlayer);
          if (nextPlayer === 'computer') {
            setTimeout(() => computerPeg(), 1000);
          }
        }
      }, 1500);
      return;
    }
    
    if (playerPeggingHand.length === 0 && newComputerHand.length === 0) {
      setTimeout(() => {
        if (lastPegger === 'computer') {
          setComputerScore(prev => Math.min(prev + 1, 121));
          setMessage('Computer gets 1 for last card');
        } else {
          setPlayerScore(prev => Math.min(prev + 1, 121));
          setMessage('You get 1 for last card');
        }
        setTimeout(() => startCounting(), 1500);
      }, 1500);
      return;
    }
    
    setPeggingTurn('player');
  };
  
  const scorePegging = (pile, count) => {
    let points = 0;
    
    if (count === 15) points += 2;
    if (count === 31) points += 2;
    
    if (pile.length >= 2) {
      const last = pile[pile.length - 1].card.rank;
      const secondLast = pile[pile.length - 2].card.rank;
      
      if (last === secondLast) {
        if (pile.length >= 3 && pile[pile.length - 3].card.rank === last) {
          if (pile.length >= 4 && pile[pile.length - 4].card.rank === last) {
            points += 12;
          } else {
            points += 6;
          }
        } else {
          points += 2;
        }
      }
    }
    
    for (let len = pile.length; len >= 3; len--) {
      const recentCards = pile.slice(-len).map(p => p.card);
      if (isRun(recentCards)) {
        points += len;
        break;
      }
    }
    
    return points;
  };
  
  const isRun = (cards) => {
    const values = cards.map(c => getRankValue(c.rank)).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) return false;
    }
    return true;
  };
  
  const startCounting = () => {
    setGamePhase('counting');
    setMessage('Counting hands...');
    
    setTimeout(() => {
      if (dealer === 'player') {
        const compScore = scoreHand(computerHand, starterCard, false);
        setComputerScore(prev => Math.min(prev + compScore, 121));
        setMessage(`Computer's hand: ${compScore} points`);
        
        setTimeout(() => {
          const playerHandScore = scoreHand(playerHand, starterCard, false);
          setPlayerScore(prev => Math.min(prev + playerHandScore, 121));
          setMessage(`Your hand: ${playerHandScore} points`);
          
          setTimeout(() => {
            const cribScore = scoreHand(crib, starterCard, true);
            setPlayerScore(prev => Math.min(prev + cribScore, 121));
            setMessage(`Your crib: ${cribScore} points`);
            setTimeout(() => checkWinAndContinue(), 1500);
          }, 2000);
        }, 2000);
      } else {
        const playerHandScore = scoreHand(playerHand, starterCard, false);
        setPlayerScore(prev => Math.min(prev + playerHandScore, 121));
        setMessage(`Your hand: ${playerHandScore} points`);
        
        setTimeout(() => {
          const compScore = scoreHand(computerHand, starterCard, false);
          setComputerScore(prev => Math.min(prev + compScore, 121));
          setMessage(`Computer's hand: ${compScore} points`);
          
          setTimeout(() => {
            const cribScore = scoreHand(crib, starterCard, true);
            setComputerScore(prev => Math.min(prev + cribScore, 121));
            setMessage(`Computer's crib: ${cribScore} points`);
            setTimeout(() => checkWinAndContinue(), 1500);
          }, 2000);
        }, 2000);
      }
    }, 1000);
  };
  
  const checkWinAndContinue = () => {
    if (playerScore >= 121 || computerScore >= 121) {
      setGamePhase('game-over');
      setMessage(playerScore >= 121 ? 'You won the game!' : 'Computer won the game!');
    } else {
      setGamePhase('round-end');
      setMessage('Round complete. Click "Next Round"');
    }
  };
  
  const nextRound = () => {
    setDealer(dealer === 'player' ? 'computer' : 'player');
    setGamePhase('deal');
    setMessage(`${dealer === 'computer' ? 'You' : 'Computer'} will deal next. Click "Deal Cards"`);
  };
  
  const newGame = () => {
    setPlayerScore(0);
    setComputerScore(0);
    setDealer(null);
    setGamePhase('initial');
    setMessage('Click "Cut for Deal" to determine who deals first');
  };
  
  const scoreHand = (hand, starter, isCrib) => {
    const allCards = [...hand, starter];
    let points = 0;
    
    points += count15s(allCards);
    points += countPairs(allCards);
    points += countRuns(allCards);
    
    if (isCrib) {
      if (allCards.every(c => c.suit === allCards[0].suit)) {
        points += 5;
      }
    } else {
      if (hand.every(c => c.suit === hand[0].suit)) {
        points += 4;
        if (starter.suit === hand[0].suit) {
          points += 1;
        }
      }
    }
    
    const nobs = hand.find(c => c.rank === 'J' && c.suit === starter.suit);
    if (nobs) points += 1;
    
    return points;
  };
  
  const count15s = (cards) => {
    let count = 0;
    const n = cards.length;
    
    for (let mask = 1; mask < (1 << n); mask++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          sum += cards[i].value;
        }
      }
      if (sum === 15) count += 2;
    }
    
    return count;
  };
  
  const countPairs = (cards) => {
    let count = 0;
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].rank === cards[j].rank) {
          count += 2;
        }
      }
    }
    return count;
  };
  
  const countRuns = (cards) => {
    for (let len = 5; len >= 3; len--) {
      const combos = getCombinations(cards, len);
      let runCount = 0;
      
      for (let combo of combos) {
        if (isRun(combo)) {
          runCount++;
        }
      }
      
      if (runCount > 0) {
        return runCount * len;
      }
    }
    
    return 0;
  };
  
  const getCombinations = (arr, len) => {
    if (len === 1) return arr.map(item => [item]);
    
    const result = [];
    for (let i = 0; i <= arr.length - len; i++) {
      const head = arr[i];
      const tailCombos = getCombinations(arr.slice(i + 1), len - 1);
      for (let tail of tailCombos) {
        result.push([head, ...tail]);
      }
    }
    return result;
  };
  
  const renderCard = (card, index, selectable = false, selected = false) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
      <div
        key={index}
        onClick={() => selectable && toggleCardSelection(card)}
        className={`inline-block bg-white rounded-lg p-3 m-1 transition-all ${
          selected ? 'border-4 border-blue-500 -translate-y-3' : 'border-2 border-gray-400'
        } ${selectable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}
        style={{ width: '70px', height: '100px' }}
      >
        <div className={`text-center font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
          <div className="text-2xl mb-1">{card.rank}</div>
          <div className="text-3xl">{card.suit}</div>
        </div>
      </div>
    );
  };
  
  const renderBoard = () => {
    const holes = [];
    for (let i = 0; i <= 120; i++) {
      const x = 20 + (i % 30) * 18;
      const y = 20 + Math.floor(i / 30) * 25;
      
      holes.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r="4"
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="1"
        />
      );
      
      if (i === playerScore) {
        holes.push(
          <circle
            key={`p${i}`}
            cx={x}
            cy={y}
            r="5"
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth="2"
          />
        );
      }
      
      if (i === computerScore) {
        holes.push(
          <circle
            key={`c${i}`}
            cx={x}
            cy={y}
            r="5"
            fill="#EF4444"
            stroke="#991B1B"
            strokeWidth="2"
          />
        );
      }
    }
    
    return (
      <svg width="560" height="120" className="bg-amber-100 rounded-lg border-4 border-amber-800 mx-auto">
        {holes}
      </svg>
    );
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-b from-green-700 to-green-800 rounded-xl shadow-2xl">
      <h1 className="text-4xl font-bold text-white text-center mb-6">Cribbage</h1>
      
      <div className="mb-6">
        {renderBoard()}
        <div className="flex justify-around mt-2 text-white text-lg font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-800"></div>
            <span>You: {playerScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-800"></div>
            <span>Computer: {computerScore}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-100 p-4 rounded-lg mb-6 text-center font-semibold text-lg border-2 border-yellow-600">
        {message}
      </div>
      
      {gamePhase === 'cutting' && !playerCutCard && (
        <div className="mb-6 bg-green-900 p-8 rounded-lg border-4 border-yellow-600">
          <div className="text-yellow-300 mb-4 text-xl font-bold text-center">
            Click anywhere on the deck to cut!
          </div>
          <div 
            className="relative mx-auto cursor-pointer"
            style={{ width: '500px', height: '180px' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const position = (x / rect.width) * 100;
              handlePlayerCut(position);
            }}
          >
            {[...Array(52)].map((_, i) => {
              const offset = i * 9;
              return (
                <div
                  key={i}
                  className="absolute transition-all hover:scale-110 hover:-translate-y-2"
                  style={{ 
                    left: `${offset}px`,
                    top: '0px'
                  }}
                >
                  <div className="bg-blue-900 rounded-lg border-2 border-blue-700 shadow-lg" 
                       style={{ width: '70px', height: '100px', padding: '12px' }}>
                    <div className="text-center text-white text-3xl">🂠</div>
                  </div>
                </div>
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-yellow-300 text-6xl opacity-50 animate-pulse">✂️</div>
            </div>
          </div>
        </div>
      )}
      
      {gamePhase === 'cutting' && playerCutCard && (
        <div className="mb-6 bg-green-900 p-6 rounded-lg border-2 border-yellow-600">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="text-yellow-300 mb-3 text-xl font-bold">Your Cut</div>
              <div className="animate-pulse">
                {renderCard(playerCutCard, 0)}
              </div>
            </div>
            
            <div className="text-white text-6xl font-bold">VS</div>
            
            <div className="text-center">
              <div className="text-yellow-300 mb-3 text-xl font-bold">Computer's Cut</div>
              {computerCutCard ? (
                <div className="animate-pulse">
                  {renderCard(computerCutCard, 0)}
                </div>
              ) : (
                <div className="inline-block bg-red-900 rounded-lg p-3 m-1 border-2 border-red-700 animate-bounce" style={{ width: '70px', height: '100px' }}>
                  <div className="text-center text-white text-3xl">🂠</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {gamePhase === 'cut' && playerCutCard && computerCutCard && (
        <div className="mb-6 bg-green-900 p-6 rounded-lg border-2 border-yellow-600">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="text-yellow-300 mb-3 text-xl font-bold">Your Cut</div>
              <div className="animate-pulse">
                {renderCard(playerCutCard, 0)}
              </div>
            </div>
            
            <div className="text-white text-6xl font-bold">VS</div>
            
            <div className="text-center">
              <div className="text-yellow-300 mb-3 text-xl font-bold">Computer's Cut</div>
              <div className="animate-pulse">
                {renderCard(computerCutCard, 0)}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="text-yellow-300 text-lg font-semibold">
              {getRankValue(playerCutCard.rank) < getRankValue(computerCutCard.rank) ? '🎉 You win the cut!' : 
               getRankValue(computerCutCard.rank) < getRankValue(playerCutCard.rank) ? '🎲 Computer wins the cut!' : 
               '🔄 Tie - cut again!'}
            </div>
          </div>
        </div>
      )}
      
      {starterCard && (
        <div className="text-center mb-6">
          <div className="text-white mb-2 font-semibold text-lg">Starter Card:</div>
          {renderCard(starterCard, 0)}
        </div>
      )}
      
      {gamePhase === 'pegging' && (
        <div className="bg-green-900 p-4 rounded-lg mb-6 border-2 border-yellow-600">
          <div className="text-yellow-300 text-center mb-3 font-bold text-xl">
            Count: {peggingCount} / 31
          </div>
          <div className="text-center min-h-[120px] flex items-center justify-center">
            {peggingPile.length === 0 ? (
              <div className="text-white text-lg">No cards played yet</div>
            ) : (
              peggingPile.map((item, i) => (
                <div key={i} className="inline-block">
                  {renderCard(item.card, i)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {gamePhase !== 'initial' && gamePhase !== 'cut' && gamePhase !== 'cutting' && (
        <div className="mb-6">
          <div className="text-white mb-3 font-semibold text-lg">Computer's Hand:</div>
          <div className="text-center">
            {computerHand.map((card, i) => (
              <div key={i} className="inline-block bg-blue-900 rounded-lg p-3 m-1 border-2 border-blue-700" style={{ width: '70px', height: '100px' }}>
                <div className="text-center text-white text-3xl">🂠</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {gamePhase !== 'initial' && gamePhase !== 'cut' && gamePhase !== 'cutting' && (
        <div className="mb-6">
          <div className="text-white mb-3 font-semibold text-lg">Your Hand:</div>
          <div className="text-center">
            {(gamePhase === 'pegging' ? playerPeggingHand : playerHand).map((card, i) => {
              const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
              const isSelectable = gamePhase === 'discard' || (gamePhase === 'pegging' && peggingTurn === 'player');
              return renderCard(card, i, isSelectable, isSelected);
            })}
          </div>
        </div>
      )}
      
      {gamePhase === 'counting' && crib.length > 0 && (
        <div className="mb-6">
          <div className="text-white mb-3 font-semibold text-lg">
            {dealer === 'player' ? 'Your' : "Computer's"} Crib:
          </div>
          <div className="text-center">
            {crib.map((card, i) => renderCard(card, i))}
          </div>
        </div>
      )}
      
      <div className="text-center space-x-3">
        {gamePhase === 'initial' && (
          <button
            onClick={cutForDeal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all hover:scale-105"
          >
            🎴 Cut for Deal
          </button>
        )}
        
        {gamePhase === 'cut' && (
          <button
            onClick={dealHands}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            Deal Cards
          </button>
        )}
        
        {gamePhase === 'deal' && (
          <button
            onClick={dealHands}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            Deal Cards
          </button>
        )}
        
        {gamePhase === 'discard' && (
          <button
            onClick={confirmDiscard}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            Discard to Crib
          </button>
        )}
        
        {gamePhase === 'cut-starter' && (
          <button
            onClick={cutStarter}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            Cut Starter Card
          </button>
        )}
        
        {gamePhase === 'cut-starter' && starterCard && (
          <button
            onClick={startPegging}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            Start Pegging
          </button>
        )}
        
        {gamePhase === 'pegging' && peggingTurn === 'player' && (
          <button
            onClick={playerSayGo}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            Say "Go"
          </button>
        )}
        
        {gamePhase === 'round-end' && (
          <button
            onClick={nextRound}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            Next Round
          </button>
        )}
        
        {gamePhase === 'game-over' && (
          <button
            onClick={newGame}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
};

export default CribbageGame;