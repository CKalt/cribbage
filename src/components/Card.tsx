/**
 * Card component - Renders a playing card
 */

import { Card as CardType } from '@/types/game';

interface CardProps {
  card: CardType;
  selectable?: boolean;
  selected?: boolean;
  onClick?: (card: CardType) => void;
}

export default function Card({ card, selectable = false, selected = false, onClick }: CardProps) {
  const isRed = card.suit === '♥' || card.suit === '♦';

  const handleClick = () => {
    if (selectable && onClick) {
      onClick(card);
    }
  };

  return (
    <div
      onClick={handleClick}
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
}
