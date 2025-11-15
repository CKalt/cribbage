/**
 * Hand component - Renders a hand of cards
 */

import { Card as CardType } from '@/types/game';
import Card from './Card';

interface HandProps {
  title: string;
  cards: CardType[];
  hidden?: boolean;
  selectable?: boolean;
  selectedCards?: CardType[];
  onCardClick?: (card: CardType) => void;
}

export default function Hand({
  title,
  cards,
  hidden = false,
  selectable = false,
  selectedCards = [],
  onCardClick,
}: HandProps) {
  return (
    <div className="mb-6">
      <div className="text-white mb-3 font-semibold text-lg">{title}</div>
      <div className="text-center">
        {hidden ? (
          // Render face-down cards
          cards.map((_, i) => (
            <div
              key={i}
              className="inline-block bg-blue-900 rounded-lg p-3 m-1 border-2 border-blue-700"
              style={{ width: '70px', height: '100px' }}
            >
              <div className="text-center text-white text-3xl">🂠</div>
            </div>
          ))
        ) : (
          // Render face-up cards
          cards.map((card, i) => {
            const isSelected = selectedCards.some(
              (c) => c.suit === card.suit && c.rank === card.rank
            );
            return (
              <Card
                key={i}
                card={card}
                selectable={selectable}
                selected={isSelected}
                onClick={onCardClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
