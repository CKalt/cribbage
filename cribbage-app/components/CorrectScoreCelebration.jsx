'use client';

// Celebration overlay for correct score counts

import { useEffect, useState } from 'react';
import { aiRandom } from '@/lib/ai/rng';

// Fallback messages (used when no celebration phrase is provided)
const CELEBRATION_MESSAGES = [
  'Perfect!',
  'Nice count!',
  'Well done!',
  'You got it!',
  'Nailed it!',
  'Sharp!',
  'Spot on!',
];

/**
 * Animated celebration overlay for correct counts
 * @param {number} score - The score achieved
 * @param {string} [phrase] - Optional phrase from the celebration engine
 * @param {Function} onComplete - Callback when animation finishes
 */
export default function CorrectScoreCelebration({ score, phrase, onComplete }) {
  const [message] = useState(() =>
    phrase || CELEBRATION_MESSAGES[Math.floor(aiRandom() * CELEBRATION_MESSAGES.length)]
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300); // Wait for fade out
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left: `${aiRandom() * 100}%`,
              animationDelay: `${aiRandom() * 0.5}s`,
              backgroundColor: ['#22c55e', '#eab308', '#3b82f6', '#ec4899', '#f97316'][i % 5],
            }}
          />
        ))}
      </div>

      {/* Main celebration content */}
      <div className="text-center animate-celebration-bounce">
        {/* Score number */}
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-300 to-green-400 animate-celebration-pulse mb-4">
          {score}
        </div>

        {/* Points label */}
        <div className="text-2xl text-green-300 font-bold mb-2">
          points
        </div>

        {/* Celebration message */}
        <div className="text-4xl font-black text-yellow-400 animate-celebration-shake">
          {message}
        </div>
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes celebration-bounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes celebration-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes celebration-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-celebration-bounce {
          animation: celebration-bounce 0.6s ease-out forwards;
        }

        .animate-celebration-pulse {
          animation: celebration-pulse 0.5s ease-in-out infinite;
        }

        .animate-celebration-shake {
          animation: celebration-shake 0.3s ease-in-out infinite;
        }

        .confetti-particle {
          position: absolute;
          top: -20px;
          width: 12px;
          height: 12px;
          border-radius: 2px;
          animation: confetti-fall 2.5s linear forwards;
        }
      `}</style>
    </div>
  );
}
