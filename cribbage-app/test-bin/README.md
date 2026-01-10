# Multiplayer Cribbage Playwright Tests

End-to-end tests for the multiplayer cribbage game at https://beta.cribbage.chrisk.com

## Prerequisites

```bash
# Install Playwright (from cribbage-app directory)
npm install -D @playwright/test

# Install browsers
npx playwright install chromium
```

## Test Accounts

The tests use two pre-configured accounts:
- **User 1:** chris+one@chrisk.com / Hello123$
- **User 2:** chris+two@chrisk.com / Hello123$

## Quick Start

```bash
cd test-bin

# Recommended: Reset game state and run all tests
./run-tests.sh all
```

## Running Tests

### Reset Game State

Before running tests, reset the game state to ensure a fresh game:

```bash
./run-tests.sh reset
```

**What reset does:**
1. Logs in as both test users
2. Forfeits any existing active games
3. Declines/cancels any pending invitations
4. Creates a fresh game invitation from User 1 to User 2
5. Accepts the invitation
6. Verifies the new game is in "discarding" phase with 6 cards each

### Run All Tests

```bash
# Reset + run all tests (recommended)
./run-tests.sh all

# Run tests without resetting (use existing game state)
./run-tests.sh
```

### Run Specific Test Suites

```bash
./run-tests.sh reset      # Reset game state only
./run-tests.sh api        # API endpoint tests (15 tests)
./run-tests.sh gameplay   # Gameplay UI tests (21 tests)
./run-tests.sh multiplayer # Login, lobby, invite tests (7 tests)
./run-tests.sh join       # Join game tests (7 tests)
```

### Run a Single Test

```bash
# Run by test name pattern
npx playwright test --grep "Can search for players" --config=playwright.config.js

# Run by file
npx playwright test gameplay.spec.js --config=playwright.config.js
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test --headed --config=playwright.config.js
```

### Run with Debug Mode

```bash
npx playwright test --debug --config=playwright.config.js
```

## Viewing Test Results

### Console Summary

After each test run, you'll see a summary like:
```
  1 failed
  15 skipped
  28 passed (3.4m)
```

- **passed** - Tests that succeeded
- **skipped** - Tests that were skipped (game not in correct phase for that test)
- **failed** - Tests that failed (actual problems to investigate)

### HTML Report (Detailed Results)

Playwright generates a detailed HTML report with screenshots and videos:

```bash
# View the HTML report in your browser
npx playwright show-report
```

The HTML report shows:
- All test results organized by file
- Execution time for each test
- Screenshots at point of failure
- Video recordings of failed tests
- Full error messages and stack traces

### Test Artifacts

Test artifacts are saved to `../test-results/`:

```
test-results/
├── multiplayer-Can-search-for-players-chromium/
│   ├── test-failed-1.png      # Screenshot at failure
│   ├── video.webm             # Video recording
│   └── error-context.md       # Error details
└── ...
```

### Investigating Failures

1. **Check the console output** for the error message:
   ```
   Error: expect(received).toBeTruthy()
   Received: false
   ```

2. **View the HTML report** for detailed info:
   ```bash
   npx playwright show-report
   ```

3. **Check screenshots** in `../test-results/[test-name]/`

4. **Watch the video** to see exactly what happened

5. **Re-run the specific test** in headed mode to debug:
   ```bash
   npx playwright test --grep "Test name" --headed --config=playwright.config.js
   ```

## Test Files

| File | Description | Tests |
|------|-------------|-------|
| `reset-game.spec.js` | Reset game state (forfeit games, create fresh game) | 1 |
| `multiplayer.spec.js` | Login, lobby, search, invite/accept flows | 7 |
| `join-game.spec.js` | Join existing game tests | 7 |
| `gameplay.spec.js` | Discard, cut, and play phase UI tests | 21 |
| `api.spec.js` | API endpoint validation tests | 15 |

**Total: 45 tests** (44 main tests + 1 reset)

## Test Coverage

### Authentication & Lobby
- User login (both test accounts)
- Game lobby navigation
- Find Players tab
- Search for players
- Invitations tab
- My Games tab

### Discard Phase
- Card display (6 cards)
- Card selection (tap to select/deselect)
- Discard button state (0/2, 1/2, 2/2)
- Discard submission
- "You've discarded" confirmation
- Two-player discard synchronization

### Cut Phase
- Cut Deck button display
- Waiting for opponent message
- Cut card display after cut

### Play Phase
- Count display (0-31)
- Played cards area
- Remaining cards count
- Playable card highlighting
- Card play interaction
- "Go" button (when no playable cards)
- Opponent "Go" indicator
- Count highlighting at 15/31
- Two-player turn management

### API Validation
- Players endpoint
- Games endpoint
- Invitations endpoint
- Game state structure
- Move validation (discard, play, go)
- playState structure
- cutCard presence
- Pegging points tracking
- Score tracking

## Understanding Skipped Tests

Tests skip when the game isn't in the correct phase. This is **expected behavior**:

- Play phase tests skip if game is in discard phase
- Cut phase tests skip if game hasn't reached cut yet
- Discard tests skip if player already discarded

To test different phases:
1. Run `./run-tests.sh reset` to get a fresh game in discard phase
2. Run discard phase tests
3. Manually play through to cut phase (or use the app)
4. Run cut phase tests
5. Continue to play phase, etc.

Or use `./run-tests.sh all` to reset and run everything - tests for later phases will skip gracefully.

## Typical Workflow

### Full Test Run
```bash
./run-tests.sh all
```

### Focused Testing
```bash
# Reset to discard phase
./run-tests.sh reset

# Test discard features
./run-tests.sh gameplay

# Manually discard in browser, cut the deck

# Test play phase features
./run-tests.sh gameplay
```

### Debugging a Failure
```bash
# Run the failing test in headed mode
npx playwright test --grep "failing test name" --headed --config=playwright.config.js

# Or use debug mode for step-by-step
npx playwright test --grep "failing test name" --debug --config=playwright.config.js
```

## Configuration

Test configuration is in `playwright.config.js`:
- **Timeout:** 60 seconds per test
- **Browser:** Chromium
- **Base URL:** https://beta.cribbage.chrisk.com
- **Screenshots:** On failure
- **Video:** On failure
