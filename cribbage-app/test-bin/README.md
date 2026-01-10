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
- **User 1:** chris@chrisk.com / Hello123$
- **User 2:** chris+two@chrisk.com / Hello123$

## Running Tests

### Run All Tests
```bash
cd test-bin
./run-tests.sh
```

### Run Specific Test Suites

```bash
# API endpoint tests
./run-tests.sh api

# Gameplay UI tests (discard, cut, play phases)
./run-tests.sh gameplay

# Multiplayer flow tests (login, lobby, invite/accept)
./run-tests.sh multiplayer

# Join game tests
./run-tests.sh join
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

## Test Files

| File | Description | Tests |
|------|-------------|-------|
| `multiplayer.spec.js` | Login, lobby, search, invite/accept flows | 7 |
| `join-game.spec.js` | Join existing game tests | 7 |
| `gameplay.spec.js` | Discard, cut, and play phase UI tests | 21 |
| `api.spec.js` | API endpoint validation tests | 15 |

**Total: 44 tests**

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

## Viewing Test Results

```bash
# View HTML report after test run
npx playwright show-report

# Screenshots and videos are saved to:
# ../test-results/
```

## Notes

- Tests that require specific game phases will skip if not applicable
- Some tests require an active game between the two test accounts
- The `--headed` flag is useful for debugging failing tests
- Test timeout is 60 seconds per test (configurable in playwright.config.js)
