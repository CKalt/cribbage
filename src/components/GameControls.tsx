/**
 * GameControls component - Renders game control buttons based on game phase
 */

import { GamePhase, Player, Card } from '@/types/game';

interface GameControlsProps {
  gamePhase: GamePhase;
  peggingTurn: Player | null;
  starterCard: Card | null;
  onCutForDeal: () => void;
  onDealCards: () => void;
  onConfirmDiscard: () => void;
  onCutStarter: () => void;
  onStartPegging: () => void;
  onPlayerSayGo: () => void;
  onNextRound: () => void;
  onNewGame: () => void;
}

export default function GameControls({
  gamePhase,
  peggingTurn,
  starterCard,
  onCutForDeal,
  onDealCards,
  onConfirmDiscard,
  onCutStarter,
  onStartPegging,
  onPlayerSayGo,
  onNextRound,
  onNewGame,
}: GameControlsProps) {
  return (
    <div className="text-center space-x-3">
      {gamePhase === 'initial' && (
        <button
          onClick={onCutForDeal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all hover:scale-105"
        >
          🎴 Cut for Deal
        </button>
      )}

      {gamePhase === 'cut' && (
        <button
          onClick={onDealCards}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          Deal Cards
        </button>
      )}

      {gamePhase === 'deal' && (
        <button
          onClick={onDealCards}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          Deal Cards
        </button>
      )}

      {gamePhase === 'discard' && (
        <button
          onClick={onConfirmDiscard}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          Discard to Crib
        </button>
      )}

      {gamePhase === 'cut-starter' && (
        <button
          onClick={onCutStarter}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          Cut Starter Card
        </button>
      )}

      {gamePhase === 'cut-starter' && starterCard && (
        <button
          onClick={onStartPegging}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          Start Pegging
        </button>
      )}

      {gamePhase === 'pegging' && peggingTurn === 'player' && (
        <button
          onClick={onPlayerSayGo}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          Say &quot;Go&quot;
        </button>
      )}

      {gamePhase === 'round-end' && (
        <button
          onClick={onNextRound}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          Next Round
        </button>
      )}

      {gamePhase === 'game-over' && (
        <button
          onClick={onNewGame}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all"
        >
          New Game
        </button>
      )}
    </div>
  );
}
