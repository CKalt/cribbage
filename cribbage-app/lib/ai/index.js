// AI module — selects strategy based on difficulty profile

import { computerSelectCrib as heuristicDiscard } from './strategies/discard-heuristic';
import { computerSelectCrib as evDiscard } from './strategies/discard-ev';
import { computerSelectPlay as heuristicPegging } from './strategies/pegging-heuristic';
import { computerSelectPlay as expertPegging } from './strategies/pegging-expert';
import { DIFFICULTY_PROFILES } from './difficulty';

export { DIFFICULTY_PROFILES };

export const computerSelectCrib = (hand, isDealer, difficulty = 'normal') => {
  const profile = DIFFICULTY_PROFILES[difficulty] || DIFFICULTY_PROFILES.normal;
  if (profile.discardStrategy === 'expected-value') {
    return evDiscard(hand, isDealer);
  }
  return heuristicDiscard(hand, isDealer);
};

export const computerSelectPlay = (hand, playedCards, currentCount, difficulty = 'normal') => {
  const profile = DIFFICULTY_PROFILES[difficulty] || DIFFICULTY_PROFILES.normal;
  if (profile.peggingStrategy === 'expert') {
    return expertPegging(hand, playedCards, currentCount);
  }
  return heuristicPegging(hand, playedCards, currentCount);
};
