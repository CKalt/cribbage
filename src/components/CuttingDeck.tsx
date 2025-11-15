/**
 * CuttingDeck component - Shows the deck cutting interface for dealer determination
 */

import { Card as CardType, GamePhase } from '@/types/game';
import Card from './Card';
import { getRankValue } from '@/lib/cardUtils';

interface CuttingDeckProps {
  gamePhase: GamePhase;
  playerCutCard: CardType | null;
  computerCutCard: CardType | null;
  onPlayerCut: (position: number) => void;
}

export default function CuttingDeck({
  gamePhase,
  playerCutCard,
  computerCutCard,
  onPlayerCut,
}: CuttingDeckProps) {
  // Initial cutting phase - show deck spread
  if (gamePhase === 'cutting' && !playerCutCard) {
    return (
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
            onPlayerCut(position);
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
                  top: '0px',
                }}
              >
                <div
                  className="bg-blue-900 rounded-lg border-2 border-blue-700 shadow-lg"
                  style={{ width: '70px', height: '100px', padding: '12px' }}
                >
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
    );
  }

  // After player cut - showing comparison
  if (gamePhase === 'cutting' && playerCutCard) {
    return (
      <div className="mb-6 bg-green-900 p-6 rounded-lg border-2 border-yellow-600">
        <div className="flex justify-around items-center">
          <div className="text-center">
            <div className="text-yellow-300 mb-3 text-xl font-bold">Your Cut</div>
            <div className="animate-pulse">
              <Card card={playerCutCard} />
            </div>
          </div>

          <div className="text-white text-6xl font-bold">VS</div>

          <div className="text-center">
            <div className="text-yellow-300 mb-3 text-xl font-bold">Computer&apos;s Cut</div>
            {computerCutCard ? (
              <div className="animate-pulse">
                <Card card={computerCutCard} />
              </div>
            ) : (
              <div
                className="inline-block bg-red-900 rounded-lg p-3 m-1 border-2 border-red-700 animate-bounce"
                style={{ width: '70px', height: '100px' }}
              >
                <div className="text-center text-white text-3xl">🂠</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // After both cuts - showing result
  if (gamePhase === 'cut' && playerCutCard && computerCutCard) {
    const playerRank = getRankValue(playerCutCard.rank);
    const computerRank = getRankValue(computerCutCard.rank);
    let resultMessage = '';

    if (playerRank < computerRank) {
      resultMessage = '🎉 You win the cut!';
    } else if (computerRank < playerRank) {
      resultMessage = '🎲 Computer wins the cut!';
    } else {
      resultMessage = '🔄 Tie - cut again!';
    }

    return (
      <div className="mb-6 bg-green-900 p-6 rounded-lg border-2 border-yellow-600">
        <div className="flex justify-around items-center">
          <div className="text-center">
            <div className="text-yellow-300 mb-3 text-xl font-bold">Your Cut</div>
            <div className="animate-pulse">
              <Card card={playerCutCard} />
            </div>
          </div>

          <div className="text-white text-6xl font-bold">VS</div>

          <div className="text-center">
            <div className="text-yellow-300 mb-3 text-xl font-bold">Computer&apos;s Cut</div>
            <div className="animate-pulse">
              <Card card={computerCutCard} />
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-yellow-300 text-lg font-semibold">{resultMessage}</div>
        </div>
      </div>
    );
  }

  // Don't render if not in cutting phases
  return null;
}
