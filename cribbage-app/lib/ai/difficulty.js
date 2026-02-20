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
    // Expert deliberately overcounts sometimes as a bluff (muggins strategy)
    overcountRate: 0.15,
    overcountRange: 2,
  },
};
