// Difficulty profiles for AI behavior

export const DIFFICULTY_PROFILES = {
  normal: {
    name: 'Normal',
    description: 'Classic AI opponent',
    discardStrategy: 'heuristic',
    peggingStrategy: 'heuristic',
    countingErrorRate: 0.10,
    countingErrorRange: 2,
  },
  expert: {
    name: 'Expert',
    description: 'Stronger AI that evaluates every possible cut card',
    discardStrategy: 'expected-value',
    peggingStrategy: 'expert',
    countingErrorRate: 0.0,
    countingErrorRange: 0,
    // Occasional overcount bluff — keeps muggins relevant without being a handicap
    overcountRate: 0.04,
    overcountRange: 2,
  },
};
