# Plan: Convert Cribbage Claude Artifact to Standalone Next.js Application

**Created:** 2025-11-29
**Status:** In Progress
**Objective:** Convert cribbage.jsx from a Claude artifact component to a fully functional standalone Next.js application with identical visual and functional behavior.

---

## Table of Contents

- [x] [Phase 1: Project Setup and Initialization](#phase-1-project-setup-and-initialization)
  - [x] [1.1: Create Next.js project with App Router](#step-11-create-nextjs-project-with-app-router-🤖)
  - [x] [1.2: Install and configure Tailwind CSS](#step-12-install-and-configure-tailwind-css-🤖)
  - [x] [1.3: Install and configure shadcn/ui](#step-13-install-and-configure-shadcnui-🤖)
  - [x] [1.4: Add required shadcn/ui components](#step-14-add-required-shadcnui-components-🤖)
- [x] [Phase 2: Project Structure and File Organization](#phase-2-project-structure-and-file-organization)
  - [x] [2.1: Create directory structure](#step-21-create-directory-structure-🤖)
  - [x] [2.2: Set up component file organization](#step-22-set-up-component-file-organization-🤖)
- [x] [Phase 3: Extract and Organize Game Logic](#phase-3-extract-and-organize-game-logic)
  - [x] [3.1: Create constants file for card data](#step-31-create-constants-file-for-card-data-🤖)
  - [x] [3.2: Extract scoring utility functions](#step-32-extract-scoring-utility-functions-🤖)
  - [x] [3.3: Extract deck utility functions](#step-33-extract-deck-utility-functions-🤖)
  - [x] [3.4: Extract AI logic functions](#step-34-extract-ai-logic-functions-🤖)
- [x] [Phase 4: Create React Components](#phase-4-create-react-components)
  - [x] [4.1: Create CribbageBoard component](#step-41-create-cribbageboard-component-🤖)
  - [x] [4.2: Create PlayingCard component](#step-42-create-playingcard-component-🤖)
  - [x] [4.3: Create GameMessage component](#step-43-create-gamemessage-component-🤖)
  - [x] [4.4: Create ScoreBreakdown component](#step-44-create-scorebreakdown-component-🤖)
  - [x] [4.5: Create DebugPanel component](#step-45-create-debugpanel-component-🤖)
- [x] [Phase 5: Implement Main Game Component](#phase-5-implement-main-game-component)
  - [x] [5.1: Create CribbageGame component with state management](#step-51-create-cribbagegame-component-with-state-management-🤖)
  - [x] [5.2: Implement game phase handlers](#step-52-implement-game-phase-handlers-🤖)
  - [x] [5.3: Implement useEffect hooks for AI turns](#step-53-implement-useeffect-hooks-for-ai-turns-🤖)
  - [x] [5.4: Wire up all UI interactions](#step-54-wire-up-all-ui-interactions-🤖)
- [x] [Phase 6: Create Page and Layout](#phase-6-create-page-and-layout)
  - [x] [6.1: Create root layout with proper styling](#step-61-create-root-layout-with-proper-styling-🤖)
  - [x] [6.2: Create main page that renders CribbageGame](#step-62-create-main-page-that-renders-cribbagegame-🤖)
- [ ] [Phase 7: Testing and Verification](#phase-7-testing-and-verification)
  - [ ] [7.1: Verify visual appearance matches original](#step-71-verify-visual-appearance-matches-original-👤)
  - [ ] [7.2: Test all game phases](#step-72-test-all-game-phases-👤)
  - [ ] [7.3: Test edge cases and scoring accuracy](#step-73-test-edge-cases-and-scoring-accuracy-👤)
  - [ ] [7.4: Test responsive behavior](#step-74-test-responsive-behavior-👤)
- [ ] [Phase 8: Build and Deployment Preparation](#phase-8-build-and-deployment-preparation)
  - [ ] [8.1: Run production build](#step-81-run-production-build-🤖)
  - [ ] [8.2: Fix any build errors](#step-82-fix-any-build-errors-🤖)
  - [ ] [8.3: Verify production build works correctly](#step-83-verify-production-build-works-correctly-👤)

---

## Phase 1: Project Setup and Initialization

### Step 1.1: Create Next.js project with App Router 🤖

Create a new Next.js 14+ project with the App Router, TypeScript (optional), and no src directory to keep structure simple.

**Commands:**
```bash
npx create-next-app@latest cribbage-app --app --tailwind --eslint --no-src-dir
```

**Configurations to select:**
- TypeScript: No (to match original JSX)
- Tailwind CSS: Yes
- App Router: Yes
- Import alias: @/*

**Completion Notes (2025-11-29 18:09):**
- Created Next.js 16.0.5 project with React 19.2.0
- Project created at `/Users/chris/projects/cribbage/cribbage-app/`
- Used `--js --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm` flags
- React Compiler: No (declined)

[Back to TOC](#table-of-contents)

---

### Step 1.2: Install and configure Tailwind CSS 🤖

Tailwind CSS will be installed by create-next-app. Verify the configuration matches the green felt styling used in the artifact.

**Update tailwind.config.js:**
- Ensure content paths include all component directories
- Add any custom colors if needed (green-900, green-800, green-700 for felt)

**Completion Notes (2025-11-29 18:09):**
- Tailwind CSS v4 installed automatically with Next.js
- Uses new CSS-based config via `@import "tailwindcss"` instead of tailwind.config.js
- Configuration in `postcss.config.mjs` with `@tailwindcss/postcss` plugin
- All standard Tailwind colors (green-900, green-800, etc.) available by default

[Back to TOC](#table-of-contents)

---

### Step 1.3: Install and configure shadcn/ui 🤖

Initialize shadcn/ui for the component library used in the original artifact.

**Commands:**
```bash
npx shadcn-ui@latest init
```

**Configuration choices:**
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Completion Notes (2025-11-29 18:11):**
- Used `npx shadcn@latest init -d` (new CLI, with defaults)
- Successfully detected Next.js and Tailwind CSS v4
- Created `components.json` configuration file
- Created `lib/utils.js` with `cn()` helper function
- Updated `globals.css` with CSS variables for colors, radius, etc.
- Installed dependencies: `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`

[Back to TOC](#table-of-contents)

---

### Step 1.4: Add required shadcn/ui components 🤖

Add the specific shadcn/ui components used by the cribbage game:

**Commands:**
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
```

These components map directly to:
- `@/components/ui/card` (Card, CardContent, CardHeader, CardTitle)
- `@/components/ui/button` (Button)

**Completion Notes (2025-11-29 18:12):**
- Used `npx shadcn@latest add card button -y` to add both components
- Created `components/ui/card.jsx` with Card, CardHeader, CardTitle, CardContent, etc.
- Created `components/ui/button.jsx` with Button and buttonVariants
- Installed `@radix-ui/react-slot` and `class-variance-authority` dependencies
- Production build verified successful

[Back to TOC](#table-of-contents)

---

## Phase 2: Project Structure and File Organization

### Step 2.1: Create directory structure 🤖

Create the following directory structure:

```
cribbage-app/
├── app/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   ├── ui/              (shadcn components)
│   ├── CribbageBoard.jsx
│   ├── CribbageGame.jsx
│   ├── PlayingCard.jsx
│   ├── GameMessage.jsx
│   ├── ScoreBreakdown.jsx
│   └── DebugPanel.jsx
├── lib/
│   ├── constants.js
│   ├── deck.js
│   ├── scoring.js
│   └── ai.js
└── public/
```

**Completion Notes (2025-11-29 18:15):**
- Created all lib/ files: `constants.js`, `deck.js`, `scoring.js`, `ai.js`
- Created all component files with placeholder implementations
- Files contain stub functions with JSDoc comments for Phase 3-5 implementation

[Back to TOC](#table-of-contents)

---

### Step 2.2: Set up component file organization 🤖

Determine how to split the monolithic 2140-line cribbage.jsx into manageable modules:

**Component breakdown:**
| Original Location | New File | Purpose |
|------------------|----------|---------|
| Lines 7-9 | lib/constants.js | suits, ranks, rankValues |
| Lines 12-30 | lib/deck.js | createDeck, shuffleDeck |
| Lines 208-387 | lib/scoring.js | calculateHandScore, calculatePeggingScore |
| Lines 390-501 | lib/ai.js | computerSelectCrib, computerSelectPlay |
| Lines 33-204 | components/CribbageBoard.jsx | Visual board SVG |
| Lines 504-2140 | components/CribbageGame.jsx | Main game logic/UI |

**Completion Notes (2025-11-29 18:16):**
- Created placeholder components with basic structure:
  - `CribbageBoard.jsx` - Placeholder SVG board
  - `CribbageGame.jsx` - Basic game shell with menu/playing states
  - `PlayingCard.jsx` - Card rendering component
  - `GameMessage.jsx` - Message display component
  - `ScoreBreakdown.jsx` - Score breakdown panel
  - `DebugPanel.jsx` - Debug/replay controls
- Updated `app/page.js` to render CribbageGame component
- Production build verified successful

[Back to TOC](#table-of-contents)

---

## Phase 3: Extract and Organize Game Logic

### Step 3.1: Create constants file for card data 🤖

Extract card-related constants to `lib/constants.js`:

```javascript
// Card suits and ranks
export const suits = ['♠', '♥', '♦', '♣'];
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const rankValues = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};
export const rankOrder = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};
```

**Completion Notes (2025-11-29 18:20):**
- Created `lib/constants.js` with all card constants
- Exports: `suits`, `ranks`, `rankValues`, `rankOrder`

[Back to TOC](#table-of-contents)

---

### Step 3.2: Extract scoring utility functions 🤖

Create `lib/scoring.js` with:
- `calculateHandScore(hand, cutCard, isCrib)` - Calculate hand/crib score with breakdown
- `calculatePeggingScore(playedCards, currentCount)` - Calculate pegging points

Preserve all scoring logic including:
- Fifteens (all combinations summing to 15)
- Pairs, three-of-a-kind, four-of-a-kind
- Runs (sequences of 3+)
- Flushes (4 or 5 same suit)
- Nobs (Jack matching cut card suit)

**Completion Notes (2025-11-29 18:20):**
- Created `lib/scoring.js` with 188 lines of scoring logic
- `calculateHandScore()` - Full hand scoring with breakdown array
- `calculatePeggingScore()` - Pegging scoring (15s, 31s, pairs, runs)
- Imports `rankOrder` from constants for run detection

[Back to TOC](#table-of-contents)

---

### Step 3.3: Extract deck utility functions 🤖

Create `lib/deck.js` with:
- `createDeck()` - Generate 52-card deck
- `shuffleDeck(deck)` - Fisher-Yates shuffle

**Completion Notes (2025-11-29 18:20):**
- Created `lib/deck.js` with deck utilities
- `createDeck()` - Creates 52-card deck using constants
- `shuffleDeck()` - Fisher-Yates shuffle (immutable, returns new array)
- Imports `suits`, `ranks`, `rankValues` from constants

[Back to TOC](#table-of-contents)

---

### Step 3.4: Extract AI logic functions 🤖

Create `lib/ai.js` with:
- `computerSelectCrib(hand, isDealer)` - Select cards to keep (discard 2 to crib)
- `computerSelectPlay(hand, playedCards, currentCount)` - Select card to play during pegging

Preserve AI strategy including:
- Evaluating all 4-card combinations for crib selection
- Considering fifteens, pairs, run potential, keeping 5s
- Pegging: prefer scoring plays, avoid giving opponent easy points

**Completion Notes (2025-11-29 18:21):**
- Created `lib/ai.js` with 131 lines of AI logic
- `computerSelectCrib()` - Evaluates all 15 possible 4-card keeps
- `computerSelectPlay()` - Scores each valid play considering:
  - Immediate pegging points (weighted x10)
  - Avoiding giving opponent 15 or 31
  - Keeping low cards for later
  - Random factor for unpredictability
- Imports `rankOrder` from constants, `calculatePeggingScore` from scoring

[Back to TOC](#table-of-contents)

---

## Phase 4: Create React Components

### Step 4.1: Create CribbageBoard component 🤖

Create `components/CribbageBoard.jsx`:

**Features to preserve:**
- SVG-based visual board (620x140)
- 3-row layout with 30 holes per row
- Player track (blue, above) and Computer track (red, below)
- Current and previous peg positions
- Row labels (0, 30, 60, 90, 120)
- Direction arrows
- 5-hole markers
- Score legend at bottom
- Manual score adjustment buttons (+/-)

**Props:**
- `playerScore` (number)
- `computerScore` (number)
- `onPegClick` (function)

**Completion Notes (2025-11-29 18:23):**
- Created full SVG-based board (175 lines)
- All features preserved: dual tracks, pegs, 5-hole markers, score legend
- Manual +/- buttons for score adjustment

[Back to TOC](#table-of-contents)

---

### Step 4.2: Create PlayingCard component 🤖

Create `components/PlayingCard.jsx` for consistent card rendering:

**Features:**
- Display rank and suit
- Red color for hearts/diamonds, black for spades/clubs
- Selection highlighting (yellow ring)
- Disabled/grayed state
- Face-down display (for hidden cards)
- Click handling

**Props:**
- `card` ({ rank, suit, value })
- `selected` (boolean)
- `disabled` (boolean)
- `faceDown` (boolean)
- `onClick` (function)
- `size` ('sm' | 'md' | 'lg')

**Completion Notes (2025-11-29 18:24):**
- Created main `PlayingCard` component with all states (125 lines)
- Added `revealed` prop for computer's cards during counting
- Additional exports: `PlayedCard`, `LargeCard`, `CutCard` for different contexts

[Back to TOC](#table-of-contents)

---

### Step 4.3: Create GameMessage component 🤖

Create `components/GameMessage.jsx` for game status messages:

**Features:**
- Yellow text on green background
- Centered display
- Consistent styling

**Props:**
- `message` (string)

**Completion Notes (2025-11-29 18:24):**
- Created simple message display component (24 lines)
- Added `variant` prop ('default' | 'large')
- Yellow text styling preserved

[Back to TOC](#table-of-contents)

---

### Step 4.4: Create ScoreBreakdown component 🤖

Create `components/ScoreBreakdown.jsx` for displaying score calculations:

**Features:**
- Dark background panel
- Yellow header "Score Breakdown:"
- List each scoring combination in green
- Total at bottom with border separator

**Props:**
- `breakdown` (array of strings)
- `total` (number)

**Completion Notes (2025-11-29 18:24):**
- Created breakdown display component (60 lines)
- Takes `actualScore` object with { score, breakdown }
- Added `ScoreResult` export for showing claim results

[Back to TOC](#table-of-contents)

---

### Step 4.5: Create DebugPanel component 🤖

Create `components/DebugPanel.jsx` for debug/replay features:

**Features:**
- Toggle button to show/hide debug log
- Toggle button to show/hide game event log
- Copy game log to clipboard button
- Load replay functionality
- Next event button for replay mode
- Scrollable log displays

**Props:**
- `debugLog` (array)
- `gameLog` (array)
- `replayMode` (boolean)
- `replayIndex` (number)
- `onCopyLog` (function)
- `onLoadReplay` (function)
- `onNextEvent` (function)

**Completion Notes (2025-11-29 18:24):**
- Created debug/replay panel component (100 lines)
- Internal state for show/hide toggles (useState)
- All buttons and log displays preserved
- 'use client' directive for client-side interactivity

[Back to TOC](#table-of-contents)

---

## Phase 5: Implement Main Game Component

### Step 5.1: Create CribbageGame component with state management 🤖

Create `components/CribbageGame.jsx` with all game state:

**State variables (40+ useState hooks):**
- Game flow: `gameState`, `dealer`, `currentPlayer`, `message`
- Deck/cards: `deck`, `playerHand`, `computerHand`, `crib`, `cutCard`
- Scores: `playerScore`, `computerScore`
- Selection: `selectedCards`
- Play phase: `playerPlayHand`, `computerPlayHand`, `playerPlayedCards`, `computerPlayedCards`, `allPlayedCards`, `currentCount`, `lastPlayedBy`, `lastGoPlayer`
- Counting phase: `countingTurn`, `playerCountInput`, `computerClaimedScore`, `actualScore`, `showBreakdown`, `counterIsComputer`, `handsCountedThisRound`, `isProcessingCount`
- Cutting phase: `playerCutCard`, `computerCutCard`
- Scoring: `pendingScore`
- Debug: `debugLog`, `showDebugLog`, `gameLog`, `showGameLog`, `replayMode`, `replayLog`, `replayIndex`

**Completion Notes (2025-11-29):**
- Implemented 30+ useState hooks covering all game state
- State organized into logical groups: game flow, deck/cards, scores, selection, play phase, counting phase, cutting phase, scoring, and debug
- All state from original cribbage.jsx preserved

[Back to TOC](#table-of-contents)

---

### Step 5.2: Implement game phase handlers 🤖

Implement all game phase logic functions:

**Menu/Setup:**
- `startNewGame()` - Initialize deck, reset scores, go to cutting phase

**Cutting Phase:**
- `playerCutDeck()` - Handle cut for dealer determination

**Dealing:**
- `dealHands(deck)` - Deal 6 cards each, set up crib select phase

**Crib Selection:**
- `toggleCardSelection(card)` - Handle card selection for crib
- `discardToCrib()` - Process discards, cut deck, start play

**Play Phase:**
- `playerPlay(card)` - Handle player card play
- `playerGo()` - Handle player saying "Go"
- `claimLastCard()` - Handle claiming last card point
- `acceptScoreAndContinue()` - Accept pending scores

**Counting Phase:**
- `moveToCountingPhase()` - Transition to counting
- `submitPlayerCount()` - Handle player count submission
- `computerCounts()` - Trigger computer counting
- `acceptComputerCount()` - Accept computer's count
- `objectToComputerCount()` - Challenge computer's count (Muggins)
- `proceedToNextCountingPhase()` - Move between counting turns

**Logging:**
- `addDebugLog(message)` - Add debug entry
- `logGameEvent(type, data)` - Log game event
- `copyGameLog()` - Copy log to clipboard
- `loadReplayLog()` - Load replay from JSON
- `nextReplayEvent()` - Process replay event

**Peg adjustment:**
- `handlePegClick(player, adjustment)` - Manual score adjustment

**Completion Notes (2025-11-29):**
- All 20+ game phase handlers implemented exactly as in original
- Preserved all timing (setTimeout delays for AI actions)
- Maintained all edge case handling for Go, last card, and 31

[Back to TOC](#table-of-contents)

---

### Step 5.3: Implement useEffect hooks for AI turns 🤖

Implement the useEffect hooks that drive AI behavior:

**Computer play effect:**
- Trigger when `currentPlayer === 'computer'` in play phase
- 1500ms delay before action
- Handle card play or "Go" declaration
- Clean up timer on unmount

**Computer counting effect:**
- Trigger when `counterIsComputer === true` in counting phase
- Multiple condition checks to prevent duplicate counting
- 1500ms delay before counting
- Clean up timer on unmount

**Pegging completion effect:**
- Check if both players out of cards
- Automatically transition to counting phase

**Completion Notes (2025-11-29):**
- Three useEffect hooks implemented:
  1. Computer play effect (with 1500ms delay)
  2. Computer counting effect (with all condition checks)
  3. Pegging completion effect (automatic transition)
- All cleanup functions for timers preserved

[Back to TOC](#table-of-contents)

---

### Step 5.4: Wire up all UI interactions 🤖

Implement the complete render tree:

**Conditional rendering by gameState:**
- `'menu'`: Start New Game button
- `'cutting'`: Cut deck UI with card display
- `'dealing'`: (transition state)
- `'cribSelect'`: Hand display with selection, Discard button
- `'play'`: Play area, count display, Go/Claim buttons
- `'counting'`: Count input, verification UI, breakdown display
- `'gameOver'`: Winner message, New Game button

**Always-visible elements (when not menu/cutting):**
- CribbageBoard component
- Score display
- Dealer indicator
- Cut card display
- Computer hand (face down during play)
- Player hand
- Message display
- Debug panel

**Completion Notes (2025-11-29):**
- Complete UI rendering implemented using imported components
- Uses PlayingCard, PlayedCard, LargeCard, CutCard for cards
- Uses GameMessage for status messages
- Uses ScoreBreakdown for counting phase display
- Uses DebugPanel for debug/replay controls
- All conditional rendering preserved from original

[Back to TOC](#table-of-contents)

---

## Phase 6: Create Page and Layout

### Step 6.1: Create root layout with proper styling 🤖

Create `app/layout.js`:

```javascript
import './globals.css'

export const metadata = {
  title: 'Cribbage',
  description: 'Classic cribbage card game',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

Ensure `globals.css` includes:
- Tailwind directives
- Any custom styles needed

**Completion Notes (2025-11-29):**
- Updated metadata from "Create Next App" to "Cribbage" / "Classic cribbage card game"
- Kept Geist fonts from Next.js default for clean typography
- globals.css already includes Tailwind v4 and shadcn CSS variables

[Back to TOC](#table-of-contents)

---

### Step 6.2: Create main page that renders CribbageGame 🤖

Create `app/page.js`:

```javascript
'use client';

import CribbageGame from '@/components/CribbageGame';

export default function Home() {
  return <CribbageGame />;
}
```

The `'use client'` directive is required because CribbageGame uses:
- useState, useEffect hooks
- Browser APIs (clipboard, prompt)
- Event handlers

**Completion Notes (2025-11-29):**
- page.js already correctly imports and renders CribbageGame (set up in Phase 2)
- 'use client' not needed in page.js since CribbageGame.jsx has it
- This follows Next.js pattern where server components render client components

[Back to TOC](#table-of-contents)

---

## Phase 7: Testing and Verification

### Step 7.1: Verify visual appearance matches original 👤

**Checklist:**
- [ ] Green felt background (green-900)
- [ ] Card container styling matches (green-800)
- [ ] Cribbage board appearance identical
- [ ] Card colors correct (red hearts/diamonds, black spades/clubs)
- [ ] Button styling consistent
- [ ] Score display formatting
- [ ] Message text styling (yellow-300)
- [ ] Font sizes and spacing

[Back to TOC](#table-of-contents)

---

### Step 7.2: Test all game phases 👤

**Test scenarios:**
- [ ] Cut for dealer (tie handling, correct dealer assignment)
- [ ] Dealing (6 cards each)
- [ ] Crib selection (select 2 cards, discard)
- [ ] His heels (Jack as cut card)
- [ ] Pegging (card play, Go, 31, runs, pairs, fifteens)
- [ ] Counting (player count, computer count, muggins)
- [ ] Game over (121 points victory)
- [ ] New game reset

[Back to TOC](#table-of-contents)

---

### Step 7.3: Test edge cases and scoring accuracy 👤

**Scoring tests:**
- [ ] Multiple fifteens in one hand
- [ ] Double/triple runs
- [ ] Four-of-a-kind
- [ ] Flush (4-card and 5-card)
- [ ] Nobs (correct detection)
- [ ] 29-point hand
- [ ] Pegging runs across multiple cards
- [ ] 31 for 2 points

**Edge cases:**
- [ ] Both players can't play (Go handling)
- [ ] One player runs out of cards first
- [ ] Muggins with overcounting
- [ ] Undercounting penalty

[Back to TOC](#table-of-contents)

---

### Step 7.4: Test responsive behavior 👤

**Test at various screen sizes:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Check:**
- [ ] Card layout wrapping
- [ ] Board visibility
- [ ] Button accessibility
- [ ] Text readability

[Back to TOC](#table-of-contents)

---

## Phase 8: Build and Deployment Preparation

### Step 8.1: Run production build 🤖

**Command:**
```bash
npm run build
```

**Expected output:**
- No TypeScript errors (if using JS)
- No ESLint errors
- Successful static generation
- Bundle size report

[Back to TOC](#table-of-contents)

---

### Step 8.2: Fix any build errors 🤖

Common issues to address:
- Missing 'use client' directives
- Import path errors
- Unused variables
- Missing dependencies

[Back to TOC](#table-of-contents)

---

### Step 8.3: Verify production build works correctly 👤

**Commands:**
```bash
npm run start
```

**Verify:**
- [ ] Application loads without errors
- [ ] All functionality works as in development
- [ ] No console errors
- [ ] Performance is acceptable

[Back to TOC](#table-of-contents)

---

## Technical Notes

### Dependencies Summary

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@radix-ui/react-slot": "^1.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "eslint": "^8.x",
    "eslint-config-next": "^14.x"
  }
}
```

### Key Implementation Differences

| Artifact | Next.js App |
|----------|-------------|
| Single file (~2140 lines) | Multiple modular files |
| Imports from `@/components/ui/*` | Same (shadcn pattern) |
| Auto-rendered in artifact viewer | Explicit page component |
| No routing | App Router available |
| No server components | Can add SSR later |

### Preserved Behaviors

All of the following must work identically:
1. Card shuffling and dealing
2. AI decision making
3. Score calculations (hand, pegging, muggins)
4. Turn order (non-dealer first)
5. Visual board scoring
6. Debug/replay functionality
7. All UI animations and transitions

---

## Feedback Log

### Phase 1 Completed - 2025-11-29 18:12

**Summary:** Project setup and initialization complete.

**Project Structure Created:**
```
cribbage-app/
├── app/
│   ├── globals.css      (Tailwind v4 + shadcn CSS variables)
│   ├── layout.js
│   └── page.js
├── components/
│   └── ui/
│       ├── button.jsx   (shadcn Button component)
│       └── card.jsx     (shadcn Card component)
├── lib/
│   └── utils.js         (cn() helper)
├── public/
├── components.json      (shadcn config)
├── package.json
├── postcss.config.mjs
└── next.config.mjs
```

**Key Versions:**
- Next.js: 16.0.5
- React: 19.2.0
- Tailwind CSS: 4.x
- shadcn/ui: latest (3.5.1)

**Build Status:** Successful

---

### Phase 2 Completed - 2025-11-29 18:16

**Summary:** Project structure and file organization complete.

**Files Created:**

Library files (lib/):
- `constants.js` - Card data constants (placeholder)
- `deck.js` - Deck utilities (placeholder)
- `scoring.js` - Scoring functions (placeholder)
- `ai.js` - AI logic (placeholder)

Component files (components/):
- `CribbageBoard.jsx` - Visual board (placeholder)
- `CribbageGame.jsx` - Main game component (basic shell)
- `PlayingCard.jsx` - Card rendering
- `GameMessage.jsx` - Message display
- `ScoreBreakdown.jsx` - Score breakdown panel
- `DebugPanel.jsx` - Debug/replay controls

**Updated:**
- `app/page.js` - Now renders CribbageGame component

**Build Status:** Successful

---

### Phase 3 Completed - 2025-11-29 18:21

**Summary:** Game logic extracted from original cribbage.jsx into modular lib/ files.

**Files Updated:**

| File | Lines | Exports |
|------|-------|---------|
| `lib/constants.js` | 19 | `suits`, `ranks`, `rankValues`, `rankOrder` |
| `lib/deck.js` | 31 | `createDeck`, `shuffleDeck` |
| `lib/scoring.js` | 188 | `calculateHandScore`, `calculatePeggingScore` |
| `lib/ai.js` | 131 | `computerSelectCrib`, `computerSelectPlay` |

**Dependencies:**
- `deck.js` imports from `constants.js`
- `scoring.js` imports from `constants.js`
- `ai.js` imports from `constants.js` and `scoring.js`

**Build Status:** Successful

---

### Phase 4 Completed - 2025-11-29 18:24

**Summary:** React components created for the cribbage game UI.

**Files Updated:**

| File | Lines | Description |
|------|-------|-------------|
| `components/CribbageBoard.jsx` | 175 | Full SVG board with pegs, tracks, markers |
| `components/PlayingCard.jsx` | 125 | Card rendering with multiple exports |
| `components/GameMessage.jsx` | 24 | Simple message display |
| `components/ScoreBreakdown.jsx` | 60 | Score breakdown with results |
| `components/DebugPanel.jsx` | 100 | Debug/replay controls |

**Component Exports:**
- `PlayingCard` (default) + `PlayedCard`, `LargeCard`, `CutCard`
- `ScoreBreakdown` (default) + `ScoreResult`
- `DebugPanel` with internal show/hide state

**Build Status:** Successful

---

### Phase 6 Completed - 2025-11-29

**Summary:** Page and layout configured for the cribbage game.

**Files Updated:**

| File | Change |
|------|--------|
| `app/layout.js` | Updated metadata title and description |
| `app/page.js` | Already correctly imports CribbageGame (from Phase 2) |
| `app/globals.css` | Already has Tailwind v4 and shadcn styles |

**Notes:**
- Kept Geist fonts from Next.js default for clean typography
- page.js doesn't need 'use client' since CribbageGame.jsx has it
- Build verified successful

**Build Status:** Successful

---

### Phase 5 Completed - 2025-11-29

**Summary:** Main CribbageGame component fully implemented with all game logic.

**File Updated:**

| File | Lines | Description |
|------|-------|-------------|
| `components/CribbageGame.jsx` | 1380 | Complete game component with state, handlers, effects, and UI |

**Implementation Details:**
- 30+ useState hooks for all game state
- 20+ game phase handlers (startNewGame, dealHands, discardToCrib, playerPlay, etc.)
- 3 useEffect hooks for AI behavior and game flow
- Complete UI rendering with conditional rendering for all game states
- Imports from lib/: createDeck, shuffleDeck, calculateHandScore, calculatePeggingScore, computerSelectCrib, computerSelectPlay, rankOrder
- Imports components: CribbageBoard, PlayingCard (PlayedCard, LargeCard, CutCard), GameMessage, ScoreBreakdown, DebugPanel

**Build Status:** Successful

---

[Back to TOC](#table-of-contents)
