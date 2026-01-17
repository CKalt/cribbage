/**
 * Predefined test deck scenarios
 *
 * Each scenario documents a specific seed and what it produces.
 * Run with a seed once to capture the card distribution, then document here.
 *
 * Usage:
 *   const { scenarios } = require('./test-decks');
 *   await setDeckSeed(page, scenarios.standard.seed);
 */

const scenarios = {
  // Seed 12345: Standard test scenario
  standard: {
    seed: 12345,
    description: 'Standard game flow test',
    notes: 'Good for basic functionality testing',
    // Cards dealt will be documented after first run
    // Player 1 (non-dealer) gets cards 0-5
    // Player 2 (dealer) gets cards 6-11
    // Cut card is determined by cut position
  },

  // Seed 67890: High-scoring hands
  highScoring: {
    seed: 67890,
    description: 'Both players get high-scoring hands',
    notes: 'Good for testing score display and counting phase'
  },

  // Seed 11111: Many fifteens
  fifteens: {
    seed: 11111,
    description: 'Hands with many fifteen combinations',
    notes: 'Good for testing fifteen counting logic'
  },

  // Seed 22222: Run opportunities
  runs: {
    seed: 22222,
    description: 'Hands with run opportunities',
    notes: 'Good for testing run detection in counting'
  },

  // Seed 33333: Pair opportunities
  pairs: {
    seed: 33333,
    description: 'Hands with pairs and trips',
    notes: 'Good for testing pair scoring'
  },

  // Seed 44444: Pegging edge cases
  peggingEdge: {
    seed: 44444,
    description: 'Deck arranged for pegging edge cases',
    notes: 'Tests 31 exactly, go scenarios, last card'
  },

  // Seed 55555: Counting edge cases
  countingEdge: {
    seed: 55555,
    description: 'Edge cases in hand counting',
    notes: 'Tests his nobs, flushes, max score hands'
  },

  // Seed 99999: Known bug reproduction
  bugRepro: {
    seed: 99999,
    description: 'Reproduces specific known bugs',
    notes: 'Add bug-specific documentation here',
    bugs: [
      // { bugId: 44, description: 'Computer count wrong', status: 'not-a-bug', notes: 'User confusion' }
    ]
  }
};

/**
 * Get a scenario by name
 * @param {string} name - Scenario name
 * @returns {Object} Scenario configuration
 */
function getScenario(name) {
  const scenario = scenarios[name];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}. Available: ${Object.keys(scenarios).join(', ')}`);
  }
  return scenario;
}

/**
 * List all available scenarios
 * @returns {Array} Array of { name, description, seed }
 */
function listScenarios() {
  return Object.entries(scenarios).map(([name, config]) => ({
    name,
    description: config.description,
    seed: config.seed
  }));
}

module.exports = {
  scenarios,
  getScenario,
  listScenarios
};
