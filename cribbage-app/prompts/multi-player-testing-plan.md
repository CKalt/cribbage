# Multiplayer Testing Plan - Playwright with Deterministic Deck

**Created**: 2026-01-17
**Author**: Claude Code
**Status**: Draft - Awaiting Approval
**Branch**: multiplayer

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Phase 1: Test Infrastructure Setup](#phase-1-test-infrastructure-setup)
  - [ ] [Step 1.1: Update Playwright config for localhost](#step-11-update-playwright-config-for-localhost-🤖)
  - [ ] [Step 1.2: Update test-config.js with both users](#step-12-update-test-configjs-with-both-users-🤖)
  - [ ] [Step 1.3: Create test runner with dev server integration](#step-13-create-test-runner-with-dev-server-integration-🤖)
- [Phase 2: Deterministic Deck Implementation](#phase-2-deterministic-deck-implementation)
  - [ ] [Step 2.1: Create seeded random number generator](#step-21-create-seeded-random-number-generator-🤖)
  - [ ] [Step 2.2: Add TEST_DECK_SEED environment variable support](#step-22-add-test_deck_seed-environment-variable-support-🤖)
  - [ ] [Step 2.3: Create predefined test deck scenarios](#step-23-create-predefined-test-deck-scenarios-🤖)
  - [ ] [Step 2.4: Add API endpoint to set test deck](#step-24-add-api-endpoint-to-set-test-deck-🤖)
- [Phase 3: Two-Player Browser Session Framework](#phase-3-two-player-browser-session-framework)
  - [ ] [Step 3.1: Create dual-browser test harness](#step-31-create-dual-browser-test-harness-🤖)
  - [ ] [Step 3.2: Implement login helpers for both users](#step-32-implement-login-helpers-for-both-users-🤖)
  - [ ] [Step 3.3: Create game synchronization utilities](#step-33-create-game-synchronization-utilities-🤖)
  - [ ] [Step 3.4: Add screenshot and logging helpers](#step-34-add-screenshot-and-logging-helpers-🤖)
- [Phase 4: Core Game Flow Tests](#phase-4-core-game-flow-tests)
  - [ ] [Step 4.1: Create game setup test (invite, accept, start)](#step-41-create-game-setup-test-invite-accept-start-🤖)
  - [ ] [Step 4.2: Create discard phase tests](#step-42-create-discard-phase-tests-🤖)
  - [ ] [Step 4.3: Create cut phase tests](#step-43-create-cut-phase-tests-🤖)
  - [ ] [Step 4.4: Create pegging phase tests](#step-44-create-pegging-phase-tests-🤖)
  - [ ] [Step 4.5: Create counting phase tests](#step-45-create-counting-phase-tests-🤖)
- [Phase 5: Bug Reproduction Tests](#phase-5-bug-reproduction-tests)
  - [ ] [Step 5.1: Document known bugs with deck scenarios](#step-51-document-known-bugs-with-deck-scenarios-🤖)
  - [ ] [Step 5.2: Create regression test for each bug](#step-52-create-regression-test-for-each-bug-🤖)
  - [ ] [Step 5.3: Add assertion helpers for scoring validation](#step-53-add-assertion-helpers-for-scoring-validation-🤖)
- [Phase 6: Test Execution and Verification](#phase-6-test-execution-and-verification)
  - [ ] [Step 6.1: Run full test suite locally](#step-61-run-full-test-suite-locally-👤)
  - [ ] [Step 6.2: Verify deterministic behavior](#step-62-verify-deterministic-behavior-👤)
  - [ ] [Step 6.3: Document test results](#step-63-document-test-results-🤖)

---

## Overview

This plan establishes a robust Playwright testing framework for multiplayer cribbage games with the following key features:

1. **Localhost Development Testing**: Tests run against `localhost:3000` with `npm run dev`, allowing real-time log monitoring and debugging.

2. **Two-Player Browser Sessions**: Simultaneous browser contexts simulating two players (`chris+one@chrisk.com` and `chris+two@chrisk.com`) interacting in the same game.

3. **Deterministic Deck**: A seeded shuffle mechanism that produces the same card distribution every time, enabling:
   - Reproducible bug scenarios
   - Predictable test assertions
   - Consistent regression testing

### Why Deterministic Decks Matter

Without deterministic decks:
- Tests may pass or fail randomly depending on card distribution
- Bug reproduction is inconsistent ("it worked on my machine")
- Scoring edge cases are difficult to test reliably

With deterministic decks:
- Same seed = same cards = same expected behavior
- Bugs can be captured as "Seed X produces bug Y"
- Tests verify exact scores, exact card plays, exact outcomes

### Test Account Setup

| User | Email | Password | Role in Tests |
|------|-------|----------|---------------|
| Player 1 | chris+one@chrisk.com | Hello123$ | Initiates games, dealer in odd rounds |
| Player 2 | chris+two@chrisk.com | Hello123$ | Accepts invites, dealer in even rounds |

[Back to TOC](#table-of-contents)

---

## Problem Statement

The current test suite has several limitations:

1. **Hardcoded Production URL**: Tests target `beta.cribbage.chrisk.com` instead of localhost, preventing:
   - Real-time log observation during test runs
   - Quick iteration during development
   - Testing unreleased code

2. **Non-Deterministic Games**: Each test run produces different card distributions, causing:
   - Flaky tests that pass/fail randomly
   - Inability to reproduce specific bugs
   - Difficulty testing edge cases (e.g., "what happens with four 5s?")

3. **Outdated Configuration**: `test-config.js` doesn't match actual test users

4. **Limited Debugging**: No headed mode by default, no log correlation

### Goals

| Goal | Current State | Target State |
|------|---------------|--------------|
| Test URL | beta.cribbage.chrisk.com | localhost:3000 |
| Dev server | Not integrated | Auto-start with tests |
| Deck shuffle | Random (Math.random) | Seeded (deterministic) |
| Log visibility | None | Console output during tests |
| Browser visibility | Headless | Headed mode option |
| Test users | Hardcoded in specs | Centralized config |

[Back to TOC](#table-of-contents)

---

## Phase 1: Test Infrastructure Setup

### Step 1.1: Update Playwright config for localhost 🤖

**File**: `test-bin/playwright.config.js`

Update configuration to:
- Default to `localhost:3000`
- Add webServer config to auto-start `npm run dev`
- Enable headed mode via environment variable
- Increase timeout for dev server startup

```javascript
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  fullyParallel: false,  // Sequential for multiplayer
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html'], ['list']],  // Show progress in console
  timeout: 60000,

  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.HEADED !== 'true',  // HEADED=true for visible browser
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start dev server when testing locally
  webServer: process.env.TEST_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,  // 2 minutes to start
    stdout: 'pipe',   // Show server output
    stderr: 'pipe',
  },
});
```

[Back to TOC](#table-of-contents)

---

### Step 1.2: Update test-config.js with both users 🤖

**File**: `test-bin/test-config.js`

```javascript
/**
 * Test configuration for Playwright multiplayer tests
 */
module.exports = {
  // Test accounts
  users: {
    player1: {
      email: process.env.TEST_USER1_EMAIL || 'chris+one@chrisk.com',
      password: process.env.TEST_USER1_PASSWORD || 'Hello123$',
      name: 'Player One'
    },
    player2: {
      email: process.env.TEST_USER2_EMAIL || 'chris+two@chrisk.com',
      password: process.env.TEST_USER2_PASSWORD || 'Hello123$',
      name: 'Player Two'
    }
  },

  // URLs
  urls: {
    local: 'http://localhost:3000',
    beta: 'https://beta.cribbage.chrisk.com',
    production: 'https://cribbage.chrisk.com'
  },

  // Deterministic deck seeds for specific test scenarios
  deckSeeds: {
    default: 12345,           // Standard test seed
    highScoring: 67890,       // Produces high-scoring hands
    fifteens: 11111,          // Many 15-combinations
    runs: 22222,              // Many run opportunities
    pairs: 33333,             // Many pair opportunities
    peggingEdge: 44444,       // Edge cases in pegging
    countingEdge: 55555,      // Edge cases in counting
  },

  // Timeouts
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
    gameAction: 3000,  // Wait for game state updates
  }
};
```

[Back to TOC](#table-of-contents)

---

### Step 1.3: Create test runner with dev server integration 🤖

**File**: `test-bin/run-local-tests.sh`

```bash
#!/bin/bash
# Run Playwright tests against localhost with dev server

cd "$(dirname "$0")/.."

echo "=========================================="
echo "Multiplayer Playwright Tests (Local)"
echo "Target: http://localhost:3000"
echo "=========================================="

# Set deterministic deck seed if not provided
export TEST_DECK_SEED=${TEST_DECK_SEED:-12345}
echo "Deck Seed: $TEST_DECK_SEED"
echo ""

# Parse arguments
HEADED=""
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --headed)
      HEADED="true"
      shift
      ;;
    --test)
      SPECIFIC_TEST="$2"
      shift 2
      ;;
    --seed)
      export TEST_DECK_SEED="$2"
      shift 2
      ;;
    *)
      SPECIFIC_TEST="$1"
      shift
      ;;
  esac
done

# Run tests
if [ -n "$HEADED" ]; then
  echo "Running in HEADED mode (browser visible)"
  export HEADED=true
fi

if [ -n "$SPECIFIC_TEST" ]; then
  echo "Running specific test: $SPECIFIC_TEST"
  npx playwright test "$SPECIFIC_TEST" --config=test-bin/playwright.config.js
else
  echo "Running all multiplayer tests..."
  npx playwright test --config=test-bin/playwright.config.js
fi

echo ""
echo "=========================================="
echo "Test run complete!"
echo ""
echo "Usage:"
echo "  ./test-bin/run-local-tests.sh                    # Run all tests"
echo "  ./test-bin/run-local-tests.sh --headed           # With visible browser"
echo "  ./test-bin/run-local-tests.sh --seed 67890       # Custom deck seed"
echo "  ./test-bin/run-local-tests.sh gameplay.spec.js   # Specific test file"
echo ""
echo "View HTML report: npx playwright show-report"
echo "=========================================="
```

[Back to TOC](#table-of-contents)

---

## Phase 2: Deterministic Deck Implementation

### Step 2.1: Create seeded random number generator 🤖

**File**: `lib/seeded-random.js`

Implement a seeded PRNG (Pseudo-Random Number Generator) that produces consistent results for the same seed:

```javascript
/**
 * Seeded Random Number Generator
 * Uses Mulberry32 algorithm for fast, reproducible randomness
 */

export function createSeededRandom(seed) {
  let state = seed;

  return function() {
    // Mulberry32 algorithm
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle array using seeded random
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Random seed
 * @returns {Array} - Shuffled array (new array, original unchanged)
 */
export function seededShuffle(array, seed) {
  const random = createSeededRandom(seed);
  const shuffled = [...array];

  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Get a deterministic deck for testing
 * @param {number} seed - Random seed
 * @returns {Array} - Array of 52 cards in deterministic order
 */
export function getDeterministicDeck(seed) {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }

  return seededShuffle(deck, seed);
}
```

[Back to TOC](#table-of-contents)

---

### Step 2.2: Add TEST_DECK_SEED environment variable support 🤖

**File**: `lib/deck.js` (or wherever deck shuffling occurs)

Modify the existing deck shuffling to use seeded random when `TEST_DECK_SEED` is set:

```javascript
import { seededShuffle, getDeterministicDeck } from './seeded-random';

/**
 * Create and shuffle a deck of cards
 * Uses TEST_DECK_SEED for deterministic shuffling in test mode
 */
export function createShuffledDeck() {
  const testSeed = typeof process !== 'undefined'
    ? process.env.TEST_DECK_SEED
    : null;

  if (testSeed) {
    console.log(`[TEST MODE] Using deterministic deck with seed: ${testSeed}`);
    return getDeterministicDeck(parseInt(testSeed, 10));
  }

  // Normal random shuffle for production
  return shuffleDeck(createDeck());
}

// Existing shuffle function for production use
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

**Server-side consideration**: Since Next.js runs on the server, the environment variable will be available. For client-side testing, we'll use the API endpoint approach in Step 2.4.

[Back to TOC](#table-of-contents)

---

### Step 2.3: Create predefined test deck scenarios 🤖

**File**: `test-bin/test-decks.js`

Document specific seeds and their resulting hands for predictable testing:

```javascript
/**
 * Predefined test deck scenarios
 * Each scenario documents the exact cards dealt with a specific seed
 */

module.exports = {
  // Seed 12345: Standard test scenario
  standard: {
    seed: 12345,
    description: 'Standard game flow test',
    // Document what cards are dealt (run once to capture)
    player1Hand: null,  // Will be filled after first run
    player2Hand: null,
    cutCard: null,
    expectedScores: {
      player1Hand: null,
      player2Hand: null,
      crib: null,
    }
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
      // { bugId: 44, description: 'Computer count wrong', fixed: false }
    ]
  }
};
```

[Back to TOC](#table-of-contents)

---

### Step 2.4: Add API endpoint to set test deck 🤖

**File**: `app/api/test/set-deck/route.js`

Create an API endpoint that allows tests to set a specific deck seed for the next game:

```javascript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Only available in development/test
const isTestMode = process.env.NODE_ENV !== 'production' ||
                   process.env.ALLOW_TEST_ENDPOINTS === 'true';

const TEST_STATE_FILE = path.join(process.cwd(), 'data', '.test-state.json');

export async function POST(request) {
  if (!isTestMode) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    const { seed, scenario } = await request.json();

    const testState = {
      deckSeed: seed,
      scenario: scenario || 'custom',
      setAt: new Date().toISOString(),
      usedForGames: []
    };

    // Ensure data directory exists
    const dataDir = path.dirname(TEST_STATE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(testState, null, 2));

    return NextResponse.json({
      success: true,
      message: `Deck seed set to ${seed}`,
      testState
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  if (!isTestMode) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    if (fs.existsSync(TEST_STATE_FILE)) {
      const testState = JSON.parse(fs.readFileSync(TEST_STATE_FILE, 'utf8'));
      return NextResponse.json({ success: true, testState });
    }

    return NextResponse.json({ success: true, testState: null });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!isTestMode) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
    return NextResponse.json({ success: true, message: 'Test state cleared' });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

[Back to TOC](#table-of-contents)

---

## Phase 3: Two-Player Browser Session Framework

### Step 3.1: Create dual-browser test harness 🤖

**File**: `test-bin/helpers/dual-browser.js`

```javascript
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

    return { page1: this.page1, page2: this.page2 };
  }

  async teardown() {
    if (this.context1) await this.context1.close();
    if (this.context2) await this.context2.close();
  }

  // Execute action on both pages in parallel
  async both(action) {
    return Promise.all([
      action(this.page1, 'player1'),
      action(this.page2, 'player2')
    ]);
  }

  // Execute action on player 1, then player 2
  async sequential(action1, action2) {
    const result1 = await action1(this.page1);
    const result2 = await action2(this.page2);
    return [result1, result2];
  }
}

module.exports = { DualBrowserHarness };
```

[Back to TOC](#table-of-contents)

---

### Step 3.2: Implement login helpers for both users 🤖

**File**: `test-bin/helpers/auth.js`

```javascript
/**
 * Authentication helpers for multiplayer tests
 */

const { expect } = require('@playwright/test');
const config = require('../test-config');

/**
 * Login as a specific user
 * @param {Page} page - Playwright page
 * @param {'player1' | 'player2'} userKey - Which user to login as
 */
async function login(page, userKey) {
  const user = config.users[userKey];
  const baseUrl = process.env.TEST_URL || config.urls.local;

  await page.goto(`${baseUrl}/login`);

  // Fill login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit and wait for redirect
  await page.click('button[type="submit"]');
  await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });

  // Verify logged in
  await expect(page.locator('text=Cribbage')).toBeVisible({ timeout: 10000 });

  console.log(`[${userKey}] Logged in as ${user.email}`);
  return user;
}

/**
 * Login both users in parallel
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 */
async function loginBothUsers(page1, page2) {
  await Promise.all([
    login(page1, 'player1'),
    login(page2, 'player2')
  ]);
}

/**
 * Logout current user
 * @param {Page} page - Playwright page
 */
async function logout(page) {
  // Click menu
  await page.click('button:has-text("⋮")');
  await page.waitForTimeout(300);

  // Click logout
  await page.click('text=Logout');
  await page.waitForTimeout(500);

  // Verify on login page
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

module.exports = { login, loginBothUsers, logout };
```

[Back to TOC](#table-of-contents)

---

### Step 3.3: Create game synchronization utilities 🤖

**File**: `test-bin/helpers/game-sync.js`

```javascript
/**
 * Game synchronization utilities for multiplayer tests
 */

const { expect } = require('@playwright/test');
const config = require('../test-config');

/**
 * Wait for game state to update after an action
 * @param {Page} page - Playwright page
 * @param {string} expectedState - Expected state text or indicator
 */
async function waitForGameUpdate(page, expectedState, timeout = 10000) {
  await page.waitForFunction(
    (state) => document.body.innerText.includes(state),
    expectedState,
    { timeout }
  );
}

/**
 * Wait for it to be this player's turn
 * @param {Page} page - Playwright page
 */
async function waitForMyTurn(page, timeout = 30000) {
  await expect(
    page.locator('text=Your Turn').or(page.locator('[data-testid="my-turn"]'))
  ).toBeVisible({ timeout });
}

/**
 * Wait for opponent's turn
 * @param {Page} page - Playwright page
 */
async function waitForOpponentTurn(page, timeout = 30000) {
  await expect(
    page.locator('text=Waiting for').or(page.locator('[data-testid="opponent-turn"]'))
  ).toBeVisible({ timeout });
}

/**
 * Get current game phase
 * @param {Page} page - Playwright page
 * @returns {Promise<string>} - 'discarding', 'cutting', 'pegging', 'counting'
 */
async function getGamePhase(page) {
  const phaseIndicators = {
    discarding: 'Select 2 cards',
    cutting: 'Cut',
    pegging: 'Count:',
    counting: 'Count your hand'
  };

  for (const [phase, indicator] of Object.entries(phaseIndicators)) {
    if (await page.locator(`text=${indicator}`).isVisible()) {
      return phase;
    }
  }

  return 'unknown';
}

/**
 * Synchronize both players to same game state
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 */
async function syncPlayers(page1, page2) {
  // Refresh both pages
  await Promise.all([
    page1.reload(),
    page2.reload()
  ]);

  // Wait for game to load
  await Promise.all([
    page1.waitForTimeout(2000),
    page2.waitForTimeout(2000)
  ]);
}

/**
 * Set deterministic deck seed before starting a game
 * @param {Page} page - Any page (just needs to make API call)
 * @param {number} seed - Deck seed
 */
async function setDeckSeed(page, seed) {
  const baseUrl = process.env.TEST_URL || config.urls.local;

  const response = await page.request.post(`${baseUrl}/api/test/set-deck`, {
    data: { seed }
  });

  if (!response.ok()) {
    throw new Error(`Failed to set deck seed: ${response.status()}`);
  }

  console.log(`[TEST] Deck seed set to ${seed}`);
}

module.exports = {
  waitForGameUpdate,
  waitForMyTurn,
  waitForOpponentTurn,
  getGamePhase,
  syncPlayers,
  setDeckSeed
};
```

[Back to TOC](#table-of-contents)

---

### Step 3.4: Add screenshot and logging helpers 🤖

**File**: `test-bin/helpers/debug.js`

```javascript
/**
 * Debugging helpers for multiplayer tests
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * Take screenshots of both player screens
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 * @param {string} name - Screenshot name prefix
 */
async function screenshotBoth(page1, page2, name) {
  // Ensure directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  await Promise.all([
    page1.screenshot({
      path: path.join(SCREENSHOT_DIR, `${name}-p1-${timestamp}.png`),
      fullPage: true
    }),
    page2.screenshot({
      path: path.join(SCREENSHOT_DIR, `${name}-p2-${timestamp}.png`),
      fullPage: true
    })
  ]);

  console.log(`[DEBUG] Screenshots saved: ${name}-p1/p2-${timestamp}.png`);
}

/**
 * Log game state from both perspectives
 * @param {Page} page1 - Player 1's page
 * @param {Page} page2 - Player 2's page
 */
async function logGameState(page1, page2) {
  const getState = async (page, player) => {
    const score = await page.locator('[data-testid="score"]').textContent().catch(() => 'N/A');
    const phase = await page.locator('[data-testid="phase"]').textContent().catch(() => 'N/A');
    const turn = await page.locator('text=Your Turn').isVisible() ? 'MY TURN' : 'waiting';

    console.log(`[${player}] Score: ${score} | Phase: ${phase} | ${turn}`);
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
  console.log(`\n${'='.repeat(50)}`);
  console.log(`STEP: ${step}`);
  console.log('='.repeat(50));
}

module.exports = { screenshotBoth, logGameState, logStep };
```

[Back to TOC](#table-of-contents)

---

## Phase 4: Core Game Flow Tests

### Step 4.1: Create game setup test (invite, accept, start) 🤖

**File**: `test-bin/multiplayer-flow.spec.js`

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');
const { DualBrowserHarness } = require('./helpers/dual-browser');
const { loginBothUsers } = require('./helpers/auth');
const { setDeckSeed } = require('./helpers/game-sync');
const { logStep, screenshotBoth } = require('./helpers/debug');
const config = require('./test-config');

test.describe('Multiplayer Game Flow', () => {
  let harness;

  test.beforeEach(async ({ browser }) => {
    harness = new DualBrowserHarness(browser);
    await harness.setup();
  });

  test.afterEach(async () => {
    await harness.teardown();
  });

  test('Complete game setup: invite, accept, start with deterministic deck', async () => {
    const { page1, page2 } = harness;

    logStep('1. Login both users');
    await loginBothUsers(page1, page2);

    logStep('2. Set deterministic deck seed');
    await setDeckSeed(page1, config.deckSeeds.default);

    logStep('3. Player 1 opens lobby and invites Player 2');
    await page1.click('button:has-text("⋮")');
    await page1.click('text=Play vs Friend');
    await page1.fill('input[placeholder*="Search"]', 'chris+two');
    await page1.click('button:has-text("Search")');
    await page1.waitForTimeout(2000);

    const inviteBtn = page1.locator('button:has-text("Invite")').first();
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await expect(page1.locator('text=Invitation sent')).toBeVisible();
    }

    logStep('4. Player 2 accepts invitation');
    await page2.click('button:has-text("⋮")');
    await page2.click('text=Play vs Friend');
    await page2.click('text=Invitations');
    await page2.waitForTimeout(1000);

    const acceptBtn = page2.locator('button:has-text("Accept")').first();
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();

    logStep('5. Verify game started in discard phase');
    await page2.waitForTimeout(2000);
    await screenshotBoth(page1, page2, 'game-started');

    // Both should see 6 cards
    // (Exact selectors depend on your card rendering)
  });
});
```

[Back to TOC](#table-of-contents)

---

### Step 4.2: Create discard phase tests 🤖

Test the discard phase with known card distributions:

- Verify each player sees their 6 cards
- Verify correct cards can be selected
- Verify discard submission works
- Verify waiting for opponent state

[Back to TOC](#table-of-contents)

---

### Step 4.3: Create cut phase tests 🤖

Test the cut phase:

- Verify cut deck button appears for correct player
- Verify cut card is displayed to both players
- Verify game advances to pegging phase

[Back to TOC](#table-of-contents)

---

### Step 4.4: Create pegging phase tests 🤖

Test pegging with deterministic cards:

- Verify turn alternation
- Verify count updates correctly
- Verify "Go" scenarios
- Verify 31 scenarios
- Verify points awarded correctly

[Back to TOC](#table-of-contents)

---

### Step 4.5: Create counting phase tests 🤖

Test counting phase:

- Verify hand scores are calculated correctly
- Verify crib scoring
- Verify muggins opportunities
- Verify score advancement

[Back to TOC](#table-of-contents)

---

## Phase 5: Bug Reproduction Tests

### Step 5.1: Document known bugs with deck scenarios 🤖

**File**: `test-bin/bug-scenarios.js`

Document each known bug with:
- Bug ID
- Description
- Deck seed that reproduces it
- Expected vs actual behavior
- Steps to reproduce

```javascript
module.exports = {
  bugs: [
    {
      id: 44,
      description: 'Computer count wrong - user confused crib with hand',
      seed: null,  // Need to find reproducing seed
      status: 'not-a-bug',  // Was user error
      notes: 'User thought crib cards were in computer hand'
    },
    // Add more bugs as discovered
  ]
};
```

[Back to TOC](#table-of-contents)

---

### Step 5.2: Create regression test for each bug 🤖

Create specific tests that:
- Set the deck seed that reproduces the bug
- Play through the exact scenario
- Assert correct behavior
- Fail if bug regresses

[Back to TOC](#table-of-contents)

---

### Step 5.3: Add assertion helpers for scoring validation 🤖

**File**: `test-bin/helpers/scoring.js`

Create helpers to validate:
- Hand scores (given specific cards)
- Pegging points (given play sequence)
- Crib scores
- Running totals

[Back to TOC](#table-of-contents)

---

## Phase 6: Test Execution and Verification

### Step 6.1: Run full test suite locally 👤

Execute the test suite:

```bash
# Start dev server in one terminal
npm run dev

# Run tests in another terminal
./test-bin/run-local-tests.sh --headed
```

Verify:
- Dev server logs are visible
- Both browser windows are visible
- Tests progress through game phases

[Back to TOC](#table-of-contents)

---

### Step 6.2: Verify deterministic behavior 👤

Run the same test twice with the same seed:

```bash
./test-bin/run-local-tests.sh --seed 12345
./test-bin/run-local-tests.sh --seed 12345
```

Verify:
- Same cards are dealt both times
- Same game progression occurs
- Same final scores

[Back to TOC](#table-of-contents)

---

### Step 6.3: Document test results 🤖

Update this plan with:
- Captured deck scenarios (seed → cards dealt)
- Bug reproduction seeds
- Test coverage summary

[Back to TOC](#table-of-contents)

---

*Plan created: 2026-01-17*
*Last updated: 2026-01-17*
