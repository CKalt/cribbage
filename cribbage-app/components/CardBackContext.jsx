'use client';

import { createContext, useContext } from 'react';

// Default fallback (classic blue — matches the original look)
const DEFAULT_BACK = {
  id: 'classic-blue',
  bg: 'bg-blue-900',
  border: 'border-blue-400',
  pattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(59,130,246,0.15) 3px, rgba(59,130,246,0.15) 6px)',
  centerIcon: '♠',
  iconColor: 'text-blue-300',
  accentColor: 'rgba(59,130,246,0.3)',
};

export const CardBackContext = createContext(DEFAULT_BACK);

export function useCardBack() {
  return useContext(CardBackContext);
}
