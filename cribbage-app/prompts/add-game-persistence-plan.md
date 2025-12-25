# Game Persistence Plan

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [x] [Phase 1: Data Schema Design](#phase-1-data-schema-design)
  - [x] [Step 1.1: Define game_sessions table DDL 🤖](#step-11-define-game_sessions-table-ddl-🤖)
  - [x] [Step 1.2: Define game_stats table DDL 🤖](#step-12-define-game_stats-table-ddl-🤖)
  - [x] [Step 1.3: Create combined dml-ast schema file 🤖](#step-13-create-combined-dml-ast-schema-file-🤖)
- [x] [Phase 2: Server-Side API Routes](#phase-2-server-side-api-routes)
  - [x] [Step 2.1: Create GET /api/game-state route 🤖](#step-21-create-get-apigame-state-route-🤖)
  - [x] [Step 2.2: Create POST /api/game-state route 🤖](#step-22-create-post-apigame-state-route-🤖)
  - [x] [Step 2.3: Create POST /api/game-stats route 🤖](#step-23-create-post-apigame-stats-route-🤖)
  - [x] [Step 2.4: Create data directory and .gitignore 🤖](#step-24-create-data-directory-and-gitignore-🤖)
- [x] [Phase 3: Game State Serialization](#phase-3-game-state-serialization)
  - [x] [Step 3.1: Create game state serialization utilities 🤖](#step-31-create-game-state-serialization-utilities-🤖)
  - [x] [Step 3.2: Add auto-save on state changes 🤖](#step-32-add-auto-save-on-state-changes-🤖)
  - [x] [Step 3.3: Add game state loading on mount 🤖](#step-33-add-game-state-loading-on-mount-🤖)
- [x] [Phase 4: Forfeit Feature](#phase-4-forfeit-feature)
  - [x] [Step 4.1: Add forfeit button to game UI 🤖](#step-41-add-forfeit-button-to-game-ui-🤖)
  - [x] [Step 4.2: Implement forfeit logic with stats recording 🤖](#step-42-implement-forfeit-logic-with-stats-recording-🤖)
- [ ] [Phase 5: Game Completion Stats](#phase-5-game-completion-stats)
  - [ ] [Step 5.1: Record win/loss on game completion 🤖](#step-51-record-winloss-on-game-completion-🤖)
  - [ ] [Step 5.2: Display win/loss/forfeit stats in menu 🤖](#step-52-display-winlossforfeit-stats-in-menu-🤖)
- [ ] [Phase 6: Testing](#phase-6-testing)
  - [ ] [Step 6.1: Test game persistence across refresh 👤](#step-61-test-game-persistence-across-refresh-👤)
  - [ ] [Step 6.2: Test forfeit functionality 👤](#step-62-test-forfeit-functionality-👤)
  - [ ] [Step 6.3: Test stats tracking 👤](#step-63-test-stats-tracking-👤)
- [ ] [Phase 7: Deployment](#phase-7-deployment)
  - [ ] [Step 7.1: Git add and commit changes 🤖](#step-71-git-add-and-commit-changes-🤖)
  - [ ] [Step 7.2: User pushes to remote 👤](#step-72-user-pushes-to-remote-👤)
  - [ ] [Step 7.3: Deploy to EC2 👤](#step-73-deploy-to-ec2-👤)

---

## Overview

This plan implements game state persistence for the Cribbage app using the pgdb2 dml-ast JSON schema format. Each user's game data is stored in individual JSON files named by their Cognito user ID. The feature includes:

1. **Game State Persistence** - Save current game in progress so refreshing the browser resumes the game
2. **Game Statistics** - Track wins, losses, and forfeits per user
3. **Forfeit Option** - Allow users to "toss in the towel" and record it as a loss

[Back to TOC](#table-of-contents)

---

## Problem Statement

Currently, when a user refreshes their browser during a cribbage game:
- All game progress is lost
- The game restarts from the menu
- No record of wins/losses is maintained

Users need:
1. Games to persist across browser refreshes
2. Ability to voluntarily end a game (forfeit) when they're losing badly
3. Historical tracking of wins, losses, and forfeits

[Back to TOC](#table-of-contents)

---

## Phase 1: Data Schema Design

Design the dml-ast JSON schema with two tables: `game_sessions` for current game state and `game_stats` for win/loss/forfeit tracking.

### Step 1.1: Define game_sessions table DDL 🤖

Create DDL for the `game_sessions` table to store in-progress game state.

**Table Structure:**
| Column | Type | Key | Description |
|--------|------|-----|-------------|
| user_id | VARCHAR | PK | Cognito user ID |
| game_state_json | TEXT | - | Serialized game state (JSON string) |
| updated_at | VARCHAR | - | ISO timestamp of last update |
| version | VARCHAR | - | App version (e.g., "0.1.0-b23") |

**Notes:**
- Only one active game per user (user_id is PK)
- game_state_json contains all ~30 React state variables serialized
- Row is deleted when game completes or is forfeited

**Implementation Notes (2025-12-25):**
- Completed in `lib/game-schema.js`
- Exported as `GAME_SESSIONS_DDL` and `GAME_SESSIONS_COLS` constants

[Back to TOC](#table-of-contents)

---

### Step 1.2: Define game_stats table DDL 🤖

Create DDL for the `game_stats` table to track cumulative statistics.

**Table Structure:**
| Column | Type | Key | Description |
|--------|------|-----|-------------|
| user_id | VARCHAR | PK | Cognito user ID |
| wins | INTEGER | - | Number of games won |
| losses | INTEGER | - | Number of games lost |
| forfeits | INTEGER | - | Number of games forfeited |
| last_played | VARCHAR | - | ISO timestamp of last completed game |

**Implementation Notes (2025-12-25):**
- Completed in `lib/game-schema.js`
- Exported as `GAME_STATS_DDL` and `GAME_STATS_COLS` constants

[Back to TOC](#table-of-contents)

---

### Step 1.3: Create combined dml-ast schema file 🤖

Create `/Users/chris/projects/cribbage/cribbage-app/lib/game-schema.js` exporting the dml-ast schema definition.

**File Purpose:**
- Export the DDL definitions for both tables
- Provide helper functions to create empty dml-ast structures
- Used by API routes to initialize new user data files

**Implementation Notes (2025-12-25):**
- Created `lib/game-schema.js` with:
  - `createEmptyUserData()` - Creates empty dml-ast structure
  - `getColumnIndex(tableName, columnName)` - Column index lookup
  - `createGameSessionRow(userId, gameStateJson, version)` - Row factory
  - `createGameStatsRow(userId)` - Row factory with defaults
  - Constants: `GAME_SESSIONS_DDL`, `GAME_STATS_DDL`, `GAME_SESSIONS_COLS`, `GAME_STATS_COLS`

[Back to TOC](#table-of-contents)

---

## Phase 2: Server-Side API Routes

Create Next.js API routes to read/write game data from JSON files.

### Step 2.1: Create GET /api/game-state route 🤖

**File:** `app/api/game-state/route.js`

**Functionality:**
1. Extract user ID from auth token (cookie)
2. Read `data/<user-id>-dml-ast.json`
3. Return `game_sessions` data if exists, null otherwise
4. Create empty dml-ast file if user has no data yet

**Implementation Notes (2025-12-25):**
- Created `app/api/game-state/route.js` with GET handler
- JWT token decoded from 'token' cookie to extract user ID (sub claim)
- Also returns user's stats in response for convenience

[Back to TOC](#table-of-contents)

---

### Step 2.2: Create POST /api/game-state route 🤖

**File:** `app/api/game-state/route.js` (same file, POST handler)

**Functionality:**
1. Extract user ID from auth token
2. Parse game state from request body
3. Update/insert row in `game_sessions` table
4. Write to `data/<user-id>-dml-ast.json`
5. Include `action: 'delete'` option to remove saved game

**Implementation Notes (2025-12-25):**
- POST handler added to same file as GET
- Supports `{ gameState, version }` for saving and `{ action: 'delete' }` for clearing

[Back to TOC](#table-of-contents)

---

### Step 2.3: Create POST /api/game-stats route 🤖

**File:** `app/api/game-stats/route.js`

**Functionality:**
1. Extract user ID from auth token
2. Accept `result`: 'win' | 'loss' | 'forfeit'
3. Increment appropriate counter in `game_stats` table
4. Update `last_played` timestamp
5. Write to `data/<user-id>-dml-ast.json`

**Implementation Notes (2025-12-25):**
- Created `app/api/game-stats/route.js` with GET and POST handlers
- GET returns current stats, POST increments win/loss/forfeit counter
- Returns updated stats in POST response

[Back to TOC](#table-of-contents)

---

### Step 2.4: Create data directory and .gitignore 🤖

**Tasks:**
1. Create `data/` directory in project root
2. Add `data/*.json` to `.gitignore` (user data should not be committed)
3. Add `data/.gitkeep` to ensure directory exists in repo

**Implementation Notes (2025-12-25):**
- Created `data/` directory with `.gitkeep` placeholder
- Added `/data/*.json` to `.gitignore` to exclude user data files

[Back to TOC](#table-of-contents)

---

## Phase 3: Game State Serialization

Integrate save/load functionality into CribbageGame component.

### Step 3.1: Create game state serialization utilities 🤖

**File:** `lib/gameStateSerializer.js`

**Functions:**
```javascript
// Serialize all game state variables to JSON
export function serializeGameState(stateVars) { ... }

// Deserialize JSON back to state variables
export function deserializeGameState(json) { ... }

// List of state variable names to persist
export const PERSISTED_STATE_KEYS = [
  'gameState', 'dealer', 'currentPlayer', 'message',
  'deck', 'playerHand', 'computerHand', 'crib', 'cutCard',
  'playerScore', 'computerScore', 'selectedCards',
  'playerPlayHand', 'computerPlayHand',
  'playerPlayedCards', 'computerPlayedCards',
  'allPlayedCards', 'currentCount', 'lastPlayedBy', 'lastGoPlayer',
  'peggingHistory', 'countingHistory', 'computerCountingHand',
  'countingTurn', 'handsCountedThisRound',
  'playerCutCard', 'computerCutCard', 'cutResultReady',
  'pendingScore'
  // Note: UI-only state like showBreakdown not persisted
];
```

**Implementation Notes (2025-12-25):**
- Created `lib/gameStateSerializer.js` with all functions
- Added `hasSignificantChange()` to prevent excessive saves
- Added `shouldSaveGame()` to skip saving in menu/gameOver states

[Back to TOC](#table-of-contents)

---

### Step 3.2: Add auto-save on state changes 🤖

**Modify:** `components/CribbageGame.jsx`

**Changes:**
1. Add `useAuth()` hook to get current user
2. Add debounced save effect that triggers on relevant state changes
3. Save to server after each meaningful state transition (not every keystroke)
4. Only save when `gameState !== 'menu'` and `gameState !== 'gameOver'`

**Debounce Strategy:**
- Use 500ms debounce to avoid excessive API calls
- Immediate save on phase transitions (deal → play → count)

**Implementation Notes (2025-12-25):**
- Added `useRef` for `lastSavedStateRef` and `saveTimeoutRef`
- Added `useCallback` for `createCurrentSnapshot()` and `saveGameState()`
- Auto-save triggers on significant state changes with 500ms debounce
- Uses `hasSignificantChange()` to avoid redundant saves

[Back to TOC](#table-of-contents)

---

### Step 3.3: Add game state loading on mount 🤖

**Modify:** `components/CribbageGame.jsx`

**Changes:**
1. On component mount, fetch `/api/game-state`
2. If saved game exists, show "Resume Game" option in menu
3. "Resume Game" button restores all state from saved data
4. "New Game" button clears saved state and starts fresh

**Implementation Notes (2025-12-25):**
- Added `isLoadingGame` state to show loading indicator
- Added `savedGameExists` and `savedGameData` state
- Added `userStats` state for displaying win/loss/forfeit record
- Menu shows: stats (if any), Resume Game (if saved), New Game button
- `resumeGame()` restores all 26 persisted state variables
- `deleteSavedGame()` clears saved game when starting new

[Back to TOC](#table-of-contents)

---

## Phase 4: Forfeit Feature

Add ability for users to voluntarily end a game as a loss.

### Step 4.1: Add forfeit button to game UI 🤖

**Modify:** `components/CribbageGame.jsx`

**Changes:**
1. Add "Forfeit" button (red, positioned near Logout)
2. Show only when game is in progress (`gameState !== 'menu'` and `gameState !== 'gameOver'`)
3. Button shows confirmation dialog before forfeiting

**Implementation Notes (2025-12-25):**
- Added `showForfeitConfirm` state for confirmation modal
- Forfeit button: fixed position top-right, red styling, only shows during active game
- Excluded from cutting phase (game hasn't really started yet)

[Back to TOC](#table-of-contents)

---

### Step 4.2: Implement forfeit logic with stats recording 🤖

**Modify:** `components/CribbageGame.jsx`

**Forfeit Flow:**
1. User clicks "Forfeit" → Confirmation dialog
2. On confirm:
   - Call `POST /api/game-stats` with `result: 'forfeit'`
   - Call `POST /api/game-state` with `action: 'delete'`
   - Set `gameState = 'gameOver'`
   - Show message "You forfeited. Computer wins!"

**Implementation Notes (2025-12-25):**
- Added `handleForfeit()` function using existing `recordGameResult()` and `deleteSavedGame()`
- Confirmation modal with Cancel/Yes buttons
- Uses same modal styling as bug report dialog

[Back to TOC](#table-of-contents)

---

## Phase 5: Game Completion Stats

Record wins/losses when games end naturally and display stats.

### Step 5.1: Record win/loss on game completion 🤖

**Modify:** `components/CribbageGame.jsx`

**Changes:**
1. Find where `gameState` is set to `'gameOver'`
2. Before transitioning, determine winner (playerScore >= 121 or computerScore >= 121)
3. Call `POST /api/game-stats` with appropriate result
4. Call `POST /api/game-state` with `action: 'delete'` to clear saved game

[Back to TOC](#table-of-contents)

---

### Step 5.2: Display win/loss/forfeit stats in menu 🤖

**Modify:** `components/CribbageGame.jsx`

**Changes:**
1. Fetch stats on component mount
2. Display in menu screen:
   ```
   Your Record:
   Wins: X | Losses: Y | Forfeits: Z
   ```
3. Style to match existing green theme

[Back to TOC](#table-of-contents)

---

## Phase 6: Testing

### Step 6.1: Test game persistence across refresh 👤

**Test Cases:**
1. Start new game, deal cards, refresh browser → Should see "Resume Game" option
2. Click "Resume Game" → Game state fully restored
3. Click "New Game" → Saved game cleared, fresh start

[Back to TOC](#table-of-contents)

---

### Step 6.2: Test forfeit functionality 👤

**Test Cases:**
1. Start game, click "Forfeit" → Confirmation appears
2. Cancel confirmation → Game continues
3. Confirm forfeit → Game ends, stats updated

[Back to TOC](#table-of-contents)

---

### Step 6.3: Test stats tracking 👤

**Test Cases:**
1. Win a game → Wins counter increments
2. Lose a game → Losses counter increments
3. Forfeit a game → Forfeits counter increments
4. Refresh/re-login → Stats persist

[Back to TOC](#table-of-contents)

---

## Phase 7: Deployment

### Step 7.1: Git add and commit changes 🤖

Add all new and modified files:
- `lib/game-schema.js`
- `lib/gameStateSerializer.js`
- `app/api/game-state/route.js`
- `app/api/game-stats/route.js`
- `components/CribbageGame.jsx`
- `data/.gitkeep`
- `.gitignore`

[Back to TOC](#table-of-contents)

---

### Step 7.2: User pushes to remote 👤

User runs: `git push origin main`

[Back to TOC](#table-of-contents)

---

### Step 7.3: Deploy to EC2 👤

1. SSH to EC2 instance
2. `git pull origin main`
3. `npm run build`
4. `pm2 restart cribbage`

[Back to TOC](#table-of-contents)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/game-schema.js` | Create | DML-AST schema definitions |
| `lib/gameStateSerializer.js` | Create | State serialization utilities |
| `app/api/game-state/route.js` | Create | GET/POST game state API |
| `app/api/game-stats/route.js` | Create | POST game stats API |
| `components/CribbageGame.jsx` | Modify | Add persistence + forfeit |
| `data/.gitkeep` | Create | Placeholder for data dir |
| `.gitignore` | Modify | Exclude data/*.json |

---

## State Variables to Persist

From `components/CribbageGame.jsx` lines 27-85:

**Always Persist:**
- `gameState`, `dealer`, `currentPlayer`, `message`
- `deck`, `playerHand`, `computerHand`, `crib`, `cutCard`
- `playerScore`, `computerScore`
- `selectedCards`
- `playerPlayHand`, `computerPlayHand`
- `playerPlayedCards`, `computerPlayedCards`
- `allPlayedCards`, `currentCount`, `lastPlayedBy`, `lastGoPlayer`
- `peggingHistory`, `countingHistory`, `computerCountingHand`
- `countingTurn`, `handsCountedThisRound`
- `playerCutCard`, `computerCutCard`, `cutResultReady`
- `pendingScore`

**Do Not Persist (UI-only):**
- `showBreakdown`, `showPeggingSummary`, `showCountingHistory`
- `isProcessingCount`, `pendingCountContinue`, `playerMadeCountDecision`
- `showMugginsPreferenceDialog`, `pendingWrongMugginsResult`
- `debugLog`, `gameLog`
- `playerCountInput`, `computerClaimedScore`, `actualScore`
- `counterIsComputer`
