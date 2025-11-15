/**
 * PeggingArea component - Shows the pegging play area with count and played cards
 */

import { PeggingPlay } from '@/types/game';
import Card from './Card';

interface PeggingAreaProps {
  peggingPile: PeggingPlay[];
  peggingCount: number;
}

export default function PeggingArea({ peggingPile, peggingCount }: PeggingAreaProps) {
  return (
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
              <Card card={item.card} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
