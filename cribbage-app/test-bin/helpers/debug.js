/**
 * Debugging helpers for multiplayer tests
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * Ensure screenshot directory exists
 */
function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Take a screenshot of a single page
 * @param {Page} page - Playwright page
 * @param {string} name - Screenshot name
 * @param {string} suffix - Optional suffix (e.g., 'p1', 'p2')
 * @returns {Promise<string>} Path to screenshot
 */
async function screenshot(page, name, suffix = '') {
  ensureScreenshotDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = suffix ? `${name}-${suffix}-${timestamp}.png` : `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({
    path: filepath,
    fullPage: true
  });

  console.log(`[SCREENSHOT] Saved: ${filename}`);
  return filepath;
}

/**
 * Take screenshots of both player screens
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 * @param {string} name - Screenshot name prefix
 * @returns {Promise<Array<string>>} Paths to both screenshots
 */
async function screenshotBoth(page1, page2, name) {
  ensureScreenshotDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const paths = await Promise.all([
    page1.screenshot({
      path: path.join(SCREENSHOT_DIR, `${name}-p1-${timestamp}.png`),
      fullPage: true
    }).then(() => path.join(SCREENSHOT_DIR, `${name}-p1-${timestamp}.png`)),
    page2.screenshot({
      path: path.join(SCREENSHOT_DIR, `${name}-p2-${timestamp}.png`),
      fullPage: true
    }).then(() => path.join(SCREENSHOT_DIR, `${name}-p2-${timestamp}.png`))
  ]);

  console.log(`[SCREENSHOT] Saved: ${name}-p1-${timestamp}.png, ${name}-p2-${timestamp}.png`);
  return paths;
}

/**
 * Log game state from both perspectives
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 */
async function logGameState(page1, page2) {
  const getState = async (page, player) => {
    const getText = async (selector) => {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible()) {
          return await el.textContent();
        }
      } catch {
        // ignore
      }
      return 'N/A';
    };

    const score = await getText('[data-testid="score"]');
    const phase = await getText('[data-testid="phase"]');
    const isMyTurn = await page.locator('text=Your Turn').isVisible().catch(() => false);

    console.log(`[${player}] Score: ${score} | Phase: ${phase} | ${isMyTurn ? 'MY TURN' : 'waiting'}`);
  };

  await Promise.all([
    getState(page1, 'P1'),
    getState(page2, 'P2')
  ]);
}

/**
 * Create a test step marker in console
 * @param {string} step - Step description
 */
function logStep(step) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STEP: ${step}`);
  console.log('='.repeat(60));
}

/**
 * Log a section header
 * @param {string} section - Section name
 */
function logSection(section) {
  console.log(`\n--- ${section} ---`);
}

/**
 * Log with timestamp
 * @param {string} message - Message to log
 */
function logTimed(message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Get visible text content of page body
 * @param {Page} page - Playwright page
 * @returns {Promise<string>}
 */
async function getPageText(page) {
  return await page.locator('body').textContent();
}

/**
 * Check if element with text exists
 * @param {Page} page - Playwright page
 * @param {string} text - Text to find
 * @returns {Promise<boolean>}
 */
async function hasText(page, text) {
  return await page.locator(`text=${text}`).isVisible().catch(() => false);
}

/**
 * Wait for console log containing text
 * @param {Page} page - Playwright page
 * @param {string} text - Text to find in console
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<string>} The matching console message
 */
async function waitForConsoleLog(page, text, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for console log containing: ${text}`));
    }, timeout);

    const handler = (msg) => {
      if (msg.text().includes(text)) {
        clearTimeout(timer);
        page.off('console', handler);
        resolve(msg.text());
      }
    };

    page.on('console', handler);
  });
}

module.exports = {
  screenshot,
  screenshotBoth,
  logGameState,
  logStep,
  logSection,
  logTimed,
  getPageText,
  hasText,
  waitForConsoleLog
};
