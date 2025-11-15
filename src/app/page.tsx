'use client';

/**
 * Main Cribbage Game Page
 */

import { useGameContext } from '@/contexts/GameContext';
import { useGameActions } from '@/hooks/useGameActions';
import CribbageBoard from '@/components/CribbageBoard';
import MessageDisplay from '@/components/MessageDisplay';
import CuttingDeck from '@/components/CuttingDeck';
import Card from '@/components/Card';
import PeggingArea from '@/components/PeggingArea';
import Hand from '@/components/Hand';
import GameControls from '@/components/GameControls';
import CopyLogButton from '@/components/CopyLogButton';

export default function Home() {
  const context = useGameContext();
  const actions = useGameActions();

  const {
    gamePhase,
    playerScore,
    computerScore,
    message,
    playerCutCard,
    computerCutCard,
    starterCard,
    peggingPile,
    peggingCount,
    playerHand,
    computerHand,
    playerPeggingHand,
    selectedCards,
    peggingTurn,
    crib,
    dealer,
  } = context;

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-b from-green-700 to-green-800 rounded-xl shadow-2xl">
      <h1 className="text-4xl font-bold text-white text-center mb-6">Cribbage</h1>

      {/* Cribbage Board with Scores */}
      <div className="mb-6">
        <CribbageBoard playerScore={playerScore} computerScore={computerScore} />
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

      {/* Message Display */}
      <MessageDisplay message={message} />

      {/* Cutting Deck Component */}
      <CuttingDeck
        gamePhase={gamePhase}
        playerCutCard={playerCutCard}
        computerCutCard={computerCutCard}
        onPlayerCut={actions.handlePlayerCut}
      />

      {/* Starter Card */}
      {starterCard && (
        <div className="text-center mb-6">
          <div className="text-white mb-2 font-semibold text-lg">Starter Card:</div>
          <Card card={starterCard} />
        </div>
      )}

      {/* Pegging Area */}
      {gamePhase === 'pegging' && (
        <PeggingArea peggingPile={peggingPile} peggingCount={peggingCount} />
      )}

      {/* Computer's Hand */}
      {gamePhase !== 'initial' && gamePhase !== 'cut' && gamePhase !== 'cutting' && (
        <Hand title="Computer's Hand:" cards={computerHand} hidden={true} />
      )}

      {/* Player's Hand */}
      {gamePhase !== 'initial' && gamePhase !== 'cut' && gamePhase !== 'cutting' && (
        <Hand
          title="Your Hand:"
          cards={gamePhase === 'pegging' ? playerPeggingHand : playerHand}
          selectable={gamePhase === 'discard' || (gamePhase === 'pegging' && peggingTurn === 'player')}
          selectedCards={selectedCards}
          onCardClick={
            gamePhase === 'discard'
              ? actions.toggleCardSelection
              : gamePhase === 'pegging'
              ? actions.playerPeg
              : undefined
          }
        />
      )}

      {/* Crib Display */}
      {gamePhase === 'counting' && crib.length > 0 && (
        <Hand
          title={dealer === 'player' ? 'Your Crib:' : "Computer's Crib:"}
          cards={crib}
        />
      )}

      {/* Game Controls */}
      <GameControls
        gamePhase={gamePhase}
        peggingTurn={peggingTurn}
        starterCard={starterCard}
        onCutForDeal={actions.cutForDeal}
        onDealCards={actions.dealHands}
        onConfirmDiscard={actions.confirmDiscard}
        onCutStarter={actions.cutStarter}
        onStartPegging={actions.startPegging}
        onPlayerSayGo={actions.playerSayGo}
        onNextRound={actions.nextRound}
        onNewGame={actions.newGame}
      />

      {/* Copy Log Button */}
      <div className="mt-6 text-center">
        <CopyLogButton />
      </div>
    </div>
  );
}
