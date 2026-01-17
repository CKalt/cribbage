/**
 * Dual Browser Test Harness
 * Manages two browser contexts for multiplayer testing
 */

const config = require('../test-config');

class DualBrowserHarness {
  constructor(browser) {
    this.browser = browser;
    this.context1 = null;
    this.context2 = null;
    this.page1 = null;
    this.page2 = null;
  }

  /**
   * Set up both browser contexts and pages
   * @returns {Object} { page1, page2 }
   */
  async setup() {
    // Create separate browser contexts (like incognito windows)
    this.context1 = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    this.context2 = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    // Create pages
    this.page1 = await this.context1.newPage();
    this.page2 = await this.context2.newPage();

    // Add console logging for debugging
    this.page1.on('console', msg => {
      if (msg.type() === 'error' || process.env.VERBOSE) {
        console.log(`[P1] ${msg.type()}: ${msg.text()}`);
      }
    });

    this.page2.on('console', msg => {
      if (msg.type() === 'error' || process.env.VERBOSE) {
        console.log(`[P2] ${msg.type()}: ${msg.text()}`);
      }
    });

    // Log page errors
    this.page1.on('pageerror', err => {
      console.error(`[P1 ERROR] ${err.message}`);
    });

    this.page2.on('pageerror', err => {
      console.error(`[P2 ERROR] ${err.message}`);
    });

    return { page1: this.page1, page2: this.page2 };
  }

  /**
   * Clean up both browser contexts
   */
  async teardown() {
    if (this.context1) await this.context1.close();
    if (this.context2) await this.context2.close();
  }

  /**
   * Execute action on both pages in parallel
   * @param {Function} action - Async function(page, playerKey) to execute
   * @returns {Promise<Array>} Results from both actions
   */
  async both(action) {
    return Promise.all([
      action(this.page1, 'player1'),
      action(this.page2, 'player2')
    ]);
  }

  /**
   * Execute actions sequentially: player 1 then player 2
   * @param {Function} action1 - Async function for player 1
   * @param {Function} action2 - Async function for player 2
   * @returns {Promise<Array>} [result1, result2]
   */
  async sequential(action1, action2) {
    const result1 = await action1(this.page1);
    const result2 = await action2(this.page2);
    return [result1, result2];
  }

  /**
   * Get page for a specific player
   * @param {'player1' | 'player2'} playerKey
   * @returns {Page}
   */
  getPage(playerKey) {
    return playerKey === 'player1' ? this.page1 : this.page2;
  }
}

module.exports = { DualBrowserHarness };
