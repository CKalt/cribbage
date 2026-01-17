/**
 * Bug Reproduction Scenarios
 *
 * Documents known bugs with the deck seeds needed to reproduce them.
 * Each bug includes:
 * - Bug ID (from bug reports)
 * - Description
 * - Deck seed that reproduces it
 * - Expected vs actual behavior
 * - Steps to reproduce
 * - Status (open, fixed, not-a-bug)
 */

const bugScenarios = {
  // Bug #44: Computer count wrong
  bug44: {
    id: 44,
    title: 'Computer count wrong claim',
    status: 'not-a-bug',
    description: 'User reported computer claimed wrong count for crib',
    analysis: 'User confused the crib (8♣,Q♣,3♠,10♥) with computer hand. The crib had no scoring combinations. Computer hand (with 7♥,7♦) scored 4 points correctly.',
    seed: null,  // Not reproducible - was user confusion
    resolution: 'User education - crib is separate from hand',
    dateReported: '2026-01-16',
    dateResolved: '2026-01-17'
  },

  // Bug #43: Computer count correct but user clicked muggins accidentally
  bug43: {
    id: 43,
    title: 'Accidental muggins click',
    status: 'not-a-bug',
    description: 'User meant to click Accept but clicked Muggins',
    analysis: 'UI/UX issue - buttons are too close together',
    seed: null,
    resolution: 'Consider adding confirmation for Muggins',
    suggestion: 'Add confirmation dialog before muggins claim',
    dateReported: '2026-01-16',
    dateResolved: '2026-01-17'
  },

  // Bug #46: Pegging auto-Go behavior
  bug46: {
    id: 46,
    title: 'Pegging not waiting for Go',
    status: 'feature-request',
    description: 'Game auto-determines when player cannot play, skipping explicit Go click',
    analysis: 'Current behavior is intentional optimization but user wants explicit control',
    seed: null,
    resolution: 'Consider optional setting for explicit Go mode',
    dateReported: '2026-01-16',
    dateResolved: '2026-01-17'
  },

  // Template for new bugs
  template: {
    id: null,
    title: 'Bug title',
    status: 'open',  // 'open', 'fixed', 'not-a-bug', 'feature-request'
    description: 'What the user reported',
    analysis: 'What we found when investigating',
    seed: null,  // Deck seed to reproduce, or null if not applicable
    stepsToReproduce: [
      '1. Start a new game with seed X',
      '2. Discard cards A and B',
      '3. ...'
    ],
    expectedBehavior: 'What should happen',
    actualBehavior: 'What actually happens',
    resolution: 'How it was fixed or why it is not a bug',
    dateReported: null,
    dateResolved: null
  }
};

/**
 * Get all bugs with a specific status
 * @param {string} status - 'open', 'fixed', 'not-a-bug', 'feature-request'
 * @returns {Array} Matching bugs
 */
function getBugsByStatus(status) {
  return Object.values(bugScenarios)
    .filter(bug => bug.status === status && bug.id !== null);
}

/**
 * Get all open bugs
 * @returns {Array}
 */
function getOpenBugs() {
  return getBugsByStatus('open');
}

/**
 * Get bugs that have reproducible seeds
 * @returns {Array}
 */
function getReproducibleBugs() {
  return Object.values(bugScenarios)
    .filter(bug => bug.seed !== null);
}

/**
 * Add a new bug scenario
 * @param {Object} bug - Bug configuration
 */
function addBug(bug) {
  const key = `bug${bug.id}`;
  bugScenarios[key] = {
    ...bugScenarios.template,
    ...bug,
    dateReported: bug.dateReported || new Date().toISOString().split('T')[0]
  };
  return bugScenarios[key];
}

module.exports = {
  bugScenarios,
  getBugsByStatus,
  getOpenBugs,
  getReproducibleBugs,
  addBug
};
