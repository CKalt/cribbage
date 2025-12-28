'use client';

// GameStatus Component - Shows current game phase and progress

/**
 * Displays the current game phase and relevant progress information
 * @param {string} gameState - Current game state
 * @param {string} dealer - Who is dealer ('player' or 'computer')
 * @param {number} playerScore - Player's current score
 * @param {number} computerScore - Computer's current score
 * @param {number} playerHandLength - Cards in player's hand
 * @param {number} selectedCardsLength - Cards selected for crib
 * @param {number} playerPlayedCards - Cards player has played in pegging
 * @param {number} computerPlayedCards - Cards computer has played in pegging
 * @param {number} handsCountedThisRound - How many hands counted so far
 * @param {boolean} counterIsComputer - Whether it's computer's turn to count
 */
export default function GameStatus({
  gameState,
  dealer,
  playerScore,
  computerScore,
  playerHandLength = 0,
  selectedCardsLength = 0,
  playerPlayedCards = 0,
  computerPlayedCards = 0,
  handsCountedThisRound = 0,
  counterIsComputer = false,
  currentPlayer = 'player',
}) {
  // Define phases and their display info
  const getPhaseInfo = () => {
    switch (gameState) {
      case 'menu':
        return null; // Don't show status on menu

      case 'cutting':
        return {
          phase: 'Cut for Dealer',
          status: 'in_progress',
          detail: 'Tap the deck to cut',
        };

      case 'cutForStarter':
        return {
          phase: 'Cut Starter Card',
          status: 'in_progress',
          detail: dealer === 'player' ? 'Computer cuts...' : 'Tap to cut starter',
        };

      case 'cribSelect':
        return {
          phase: 'Discard to Crib',
          status: selectedCardsLength >= 2 ? 'complete' : 'in_progress',
          detail: selectedCardsLength >= 2
            ? 'Ready to confirm'
            : `Select ${2 - selectedCardsLength} more card${2 - selectedCardsLength !== 1 ? 's' : ''}`,
          cribOwner: dealer === 'player' ? 'Your crib' : "Computer's crib",
        };

      case 'play':
        return {
          phase: 'Pegging',
          status: 'in_progress',
          detail: currentPlayer === 'player' ? 'Your turn to play' : "Computer's turn",
          peggingStats: {
            playerCards: 4 - playerPlayedCards,
            computerCards: 4 - computerPlayedCards,
          },
          dealerLabel: dealer === 'player' ? 'You deal' : 'Computer deals',
        };

      case 'counting':
        const countingPhases = ['Non-dealer hand', 'Dealer hand', 'Crib'];
        const currentCountPhase = countingPhases[Math.min(handsCountedThisRound, 2)];
        return {
          phase: 'Counting',
          status: 'in_progress',
          detail: counterIsComputer ? `Computer counts ${currentCountPhase}` : `Your turn: ${currentCountPhase}`,
          countProgress: `${handsCountedThisRound}/3 complete`,
        };

      case 'gameOver':
        const winner = playerScore >= 121 ? 'You' : 'Computer';
        return {
          phase: 'Game Over',
          status: 'complete',
          detail: `${winner} won!`,
        };

      default:
        return null;
    }
  };

  const phaseInfo = getPhaseInfo();

  if (!phaseInfo) return null;

  return (
    <div className="mb-4 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      {/* Phase header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className={`w-2 h-2 rounded-full ${
            phaseInfo.status === 'complete' ? 'bg-green-500' :
            phaseInfo.status === 'in_progress' ? 'bg-yellow-500 animate-pulse' :
            'bg-gray-500'
          }`} />
          <span className="font-bold text-white">{phaseInfo.phase}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${
          phaseInfo.status === 'complete' ? 'bg-green-700 text-green-200' :
          phaseInfo.status === 'in_progress' ? 'bg-yellow-700 text-yellow-200' :
          'bg-gray-700 text-gray-300'
        }`}>
          {phaseInfo.status === 'complete' ? 'Complete' : 'In Progress'}
        </span>
      </div>

      {/* Detail line */}
      <div className="text-sm text-gray-300 mb-1">{phaseInfo.detail}</div>

      {/* Additional context based on phase */}
      {phaseInfo.cribOwner && (
        <div className="text-xs text-gray-400">{phaseInfo.cribOwner}</div>
      )}

      {phaseInfo.peggingStats && (
        <div className="flex gap-4 text-xs text-gray-400 mt-1">
          <span className="text-blue-400">You: {phaseInfo.peggingStats.playerCards} cards left</span>
          <span className="text-red-400">CPU: {phaseInfo.peggingStats.computerCards} cards left</span>
          <span className="text-gray-500">({phaseInfo.dealerLabel})</span>
        </div>
      )}

      {phaseInfo.countProgress && (
        <div className="text-xs text-gray-400 mt-1">{phaseInfo.countProgress}</div>
      )}

      {/* Score summary during game */}
      {gameState !== 'menu' && gameState !== 'gameOver' && (
        <div className="flex gap-4 text-xs mt-2 pt-2 border-t border-gray-700">
          <span className="text-blue-400">You: {playerScore}/121</span>
          <span className="text-red-400">CPU: {computerScore}/121</span>
        </div>
      )}
    </div>
  );
}
