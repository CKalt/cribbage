# Prevent User No-Option Stuck States - Architectural Fix Plan

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [Root Cause Analysis](#root-cause-analysis)
- [x] [Phase 1: Create Action Button Controller](#phase-1-create-action-button-controller) ✅ *Completed 2025-12-28*
  - [x] [1.1: Define all possible user actions by game state 🤖](#step-11-define-all-possible-user-actions-by-game-state-🤖)
  - [x] [1.2: Create useRequiredAction hook 🤖](#step-12-create-userequiredaction-hook-🤖)
  - [x] [1.3: Add development-mode stuck detection 🤖](#step-13-add-development-mode-stuck-detection-🤖)
- [x] [Phase 2: Centralize Action Button Rendering](#phase-2-centralize-action-button-rendering) ✅ *Completed 2025-12-28*
  - [x] [2.1: Create ActionButtons component 🤖](#step-21-create-actionbuttons-component-🤖)
  - [x] [2.2: Replace scattered button conditionals 🤖](#step-22-replace-scattered-button-conditionals-🤖)
  - [x] [2.3: Add sticky action bar for mobile 🤖](#step-23-add-sticky-action-bar-for-mobile-🤖)
- [x] [Phase 3: Fix Current Bug and Add Safeguards](#phase-3-fix-current-bug-and-add-safeguards) ✅ *Completed 2025-12-28*
  - [x] [3.1: Fix the pendingCountContinue rendering bug 🤖](#step-31-fix-the-pendingcountcontinue-rendering-bug-🤖) ✅ *Fixed by sticky bar*
  - [x] [3.2: Add fallback "Continue" button 🤖](#step-32-add-fallback-continue-button-🤖) ✅ *Changed to "I'm Stuck" menu option*
  - [x] [3.3: Add automated stuck state recovery 🤖](#step-33-add-automated-stuck-state-recovery-🤖) ✅ *In handleStuckRecovery()*
  - [x] [3.4: Auto-submit bug report when Stuck button used 🤖](#step-34-auto-submit-bug-report-when-stuck-button-used-🤖) ✅ *Implemented early with Phase 1*
- [x] [Phase 4: Testing and Deployment](#phase-4-testing-and-deployment) ✅ *Completed 2025-12-28*
  - [ ] [4.1: Test all game states 👤](#step-41-test-all-game-states-👤) *(User testing)*
  - [x] [4.2: Commit and deploy 🤖](#step-42-commit-and-deploy-🤖) ✅ *Deployed b47*

---

## Overview

This plan addresses a recurring architectural bug where the user gets stuck on a screen with no available action to continue the game. The screenshot shows a counting phase where the message says "Review the breakdown and click Continue" but no Continue button is visible.

This bug has occurred 20+ times in various forms because the current architecture:
1. Scatters action button rendering across many independent conditionals
2. Has no single source of truth for "what action should the user take now"
3. Has no safeguard to detect when the user is stuck

[Back to TOC](#table-of-contents)

---

## Problem Statement

**Bug Example (from screenshot):**
- Game state: `counting`
- Message: "You undercounted! You claimed 8 but it's 9 - You only get 8. Review the breakdown and click Continue."
- Expected: A "Continue" button should be visible
- Actual: No Continue button visible - user is stuck

**Why This Keeps Happening:**
The current code has 15+ separate conditional blocks for rendering action buttons:
- `{pendingScore && ...}` - Accept score button
- `{pendingCountContinue && ...}` - Continue button
- `{gameState === 'counting' && counterIsComputer && ...}` - Accept/Muggins buttons
- `{gameState === 'cribSelect' && selectedCards.length === 2 && ...}` - Discard button
- `{gameState === 'play' && currentPlayer === 'player' && ...}` - Play/Go buttons
- etc.

Each of these conditionals can fail independently, and there's no verification that at least one action is always available.

[Back to TOC](#table-of-contents)

---

## Root Cause Analysis

Looking at `CribbageGame.jsx`:

1. **Line 2194**: Continue button renders when `pendingCountContinue` is truthy
2. **Line 1191**: `setPendingCountContinue(...)` is called after undercount
3. **But**: The button may render below the visible viewport with no way to scroll to it

The deeper issue: **Action buttons are positioned inline with content**, not in a fixed/guaranteed-visible location.

**Current button locations in JSX:**
- Line 2063: Accept score button (inside content flow)
- Line 2151-2155: Accept/Muggins buttons (inside content flow)
- Line 2173-2178: Muggins preference buttons (inside content flow)
- Line 2196-2201: Continue button (inside content flow)
- Line 2208-2213: Discard button (inside content flow)
- Line 2222-2239: Play phase buttons (inside content flow)

All these buttons can be pushed off-screen by preceding content.

[Back to TOC](#table-of-contents)

---

## Phase 1: Create Action Button Controller

### Step 1.1: Define all possible user actions by game state 🤖

Create a single source of truth for what action the user needs to take in each game state.

**File:** `lib/gameActions.js`

```javascript
// Define the action required for each game state + sub-state combination
export const GAME_ACTIONS = {
  menu: { type: 'menu_choice', label: null }, // Menu buttons handle this
  cutting: { type: 'cut_deck', label: 'Tap deck to cut' },
  cutForStarter: { type: 'cut_starter', label: 'Tap to cut starter' },
  cribSelect: { type: 'select_cards', label: 'Select 2 cards' },
  cribSelect_ready: { type: 'confirm_discard', label: 'Discard to Crib' },
  play_player_turn: { type: 'play_card', label: 'Play a card' },
  play_player_go: { type: 'say_go', label: 'Say "Go"' },
  play_waiting: { type: 'wait', label: null }, // Computer's turn
  counting_player_input: { type: 'enter_score', label: 'Enter your count' },
  counting_player_continue: { type: 'continue', label: 'Continue' },
  counting_computer_verify: { type: 'verify', label: 'Accept or Muggins' },
  counting_muggins_choice: { type: 'muggins_pref', label: 'Choose penalty' },
  counting_waiting: { type: 'wait', label: null }, // Computer counting
  gameOver: { type: 'game_over', label: 'Play Again' },
};

// Determine current required action from game state
export function getRequiredAction(state) {
  const {
    gameState, currentPlayer, selectedCards, playerHand,
    pendingScore, pendingCountContinue, counterIsComputer,
    actualScore, computerClaimedScore, playerMadeCountDecision,
    showMugginsPreferenceDialog, playerPlayHand, currentCount
  } = state;

  switch (gameState) {
    case 'menu':
      return GAME_ACTIONS.menu;

    case 'cutting':
      return GAME_ACTIONS.cutting;

    case 'cutForStarter':
      return GAME_ACTIONS.cutForStarter;

    case 'cribSelect':
      if (selectedCards.length >= 2 && playerHand.length === 6) {
        return GAME_ACTIONS.cribSelect_ready;
      }
      return GAME_ACTIONS.cribSelect;

    case 'play':
      if (pendingScore) {
        return { type: 'accept_score', label: `Accept ${pendingScore.points} Points` };
      }
      if (currentPlayer !== 'player') {
        return GAME_ACTIONS.play_waiting;
      }
      // Check if player can play any card
      const canPlay = playerPlayHand.some(c => currentCount + c.value <= 31);
      if (!canPlay && playerPlayHand.length > 0) {
        return GAME_ACTIONS.play_player_go;
      }
      return GAME_ACTIONS.play_player_turn;

    case 'counting':
      if (pendingCountContinue) {
        return GAME_ACTIONS.counting_player_continue;
      }
      if (showMugginsPreferenceDialog) {
        return GAME_ACTIONS.counting_muggins_choice;
      }
      if (counterIsComputer) {
        if (computerClaimedScore !== null && !playerMadeCountDecision) {
          return GAME_ACTIONS.counting_computer_verify;
        }
        return GAME_ACTIONS.counting_waiting;
      }
      if (!actualScore) {
        return GAME_ACTIONS.counting_player_input;
      }
      return GAME_ACTIONS.counting_player_continue;

    case 'gameOver':
      return GAME_ACTIONS.gameOver;

    default:
      return { type: 'unknown', label: 'Continue' };
  }
}
```

[Back to TOC](#table-of-contents)

---

### Step 1.2: Create useRequiredAction hook 🤖

Create a React hook that computes the required action and provides the action handler.

**File:** `hooks/useRequiredAction.js`

```javascript
import { useMemo } from 'react';
import { getRequiredAction } from '@/lib/gameActions';

export function useRequiredAction(gameState, handlers) {
  return useMemo(() => {
    const action = getRequiredAction(gameState);

    // Map action types to handlers
    const handlerMap = {
      confirm_discard: handlers.discardToCrib,
      accept_score: handlers.acceptScoreAndContinue,
      continue: handlers.handleCountContinue,
      verify: null, // Multiple buttons, handled separately
      muggins_pref: null, // Multiple buttons, handled separately
      say_go: handlers.playerGo,
      game_over: handlers.resetGame,
    };

    return {
      ...action,
      handler: handlerMap[action.type] || null,
      requiresButton: action.label !== null && handlerMap[action.type] !== null,
    };
  }, [gameState, handlers]);
}
```

[Back to TOC](#table-of-contents)

---

### Step 1.3: Add development-mode stuck detection 🤖

Add a useEffect that warns in development when no action is available but one should be.

```javascript
// In CribbageGame.jsx
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const action = getRequiredAction(currentState);
    if (action.type === 'unknown' || (action.label && !action.handler)) {
      console.error('STUCK STATE DETECTED:', { gameState, action, currentState });
    }
  }
}, [gameState, /* other relevant state */]);
```

[Back to TOC](#table-of-contents)

---

## Phase 2: Centralize Action Button Rendering

### Step 2.1: Create ActionButtons component 🤖

Create a single component responsible for rendering all action buttons.

**File:** `components/ActionButtons.jsx`

```javascript
'use client';

import { Button } from '@/components/ui/button';

export default function ActionButtons({
  requiredAction,
  handlers,
  pendingScore,
  computerClaimedScore,
  showMugginsPreferenceDialog,
}) {
  const { type, label, handler } = requiredAction;

  // Handle multi-button cases
  if (type === 'verify') {
    return (
      <div className="flex gap-2 justify-center">
        <Button onClick={handlers.acceptComputerCount} className="bg-green-600 hover:bg-green-700">
          Accept
        </Button>
        <Button onClick={handlers.objectToComputerCount} className="bg-red-600 hover:bg-red-700">
          Muggins!
        </Button>
      </div>
    );
  }

  if (type === 'muggins_pref') {
    return (
      <div className="flex gap-2 justify-center">
        <Button onClick={() => handlers.handleMugginsPreferenceChoice('no-penalty')} className="bg-green-600">
          No Penalty
        </Button>
        <Button onClick={() => handlers.handleMugginsPreferenceChoice('2-points')} className="bg-red-600">
          2 Point Penalty
        </Button>
      </div>
    );
  }

  // Single button cases
  if (handler && label) {
    return (
      <Button onClick={handler} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
        {label}
      </Button>
    );
  }

  return null;
}
```

[Back to TOC](#table-of-contents)

---

### Step 2.2: Replace scattered button conditionals 🤖

Remove the individual button conditionals throughout CribbageGame.jsx and replace with a single ActionButtons render.

**Changes to CribbageGame.jsx:**
1. Remove lines 2061-2066 (pendingScore button)
2. Remove lines 2141-2160 (computer count verification)
3. Remove lines 2163-2185 (muggins preference dialog)
4. Remove lines 2193-2203 (Continue button)
5. Remove lines 2205-2215 (Discard button)
6. Remove lines 2218-2240 (Play phase buttons)

Replace with single ActionButtons component placed in a guaranteed-visible location.

[Back to TOC](#table-of-contents)

---

### Step 2.3: Add sticky action bar for mobile 🤖

Create a sticky bottom bar that always shows the current required action.

```jsx
{/* Sticky action bar - always visible at bottom */}
{gameState !== 'menu' && requiredAction.label && (
  <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
    <div className="max-w-md mx-auto text-center">
      <ActionButtons
        requiredAction={requiredAction}
        handlers={handlers}
        pendingScore={pendingScore}
        computerClaimedScore={computerClaimedScore}
        showMugginsPreferenceDialog={showMugginsPreferenceDialog}
      />
    </div>
  </div>
)}

{/* Add bottom padding to main content to account for sticky bar */}
<div className="pb-24">
  {/* ... rest of game content ... */}
</div>
```

[Back to TOC](#table-of-contents)

---

## Phase 3: Fix Current Bug and Add Safeguards

### Step 3.1: Fix the pendingCountContinue rendering bug 🤖

The immediate bug: Continue button is not visible when `pendingCountContinue` is set.

**Investigation needed:**
1. Verify `pendingCountContinue` is being set correctly
2. Check if button is rendering but off-screen
3. Add debug logging to trace state changes

**Quick fix while implementing full solution:**
Add the Continue button in multiple locations to ensure visibility:
- After message display
- After score breakdown
- In sticky bottom bar (Phase 2.3)

[Back to TOC](#table-of-contents)

---

### Step 3.2: Add fallback "Continue" button 🤖

Add a safety net: if no action button is visible for more than 5 seconds during a state that requires user action, show a fallback Continue button.

```javascript
const [showFallbackContinue, setShowFallbackContinue] = useState(false);

useEffect(() => {
  const action = getRequiredAction(currentState);

  if (action.requiresButton) {
    const timer = setTimeout(() => {
      setShowFallbackContinue(true);
    }, 5000);
    return () => clearTimeout(timer);
  } else {
    setShowFallbackContinue(false);
  }
}, [gameState, pendingCountContinue, /* other deps */]);

// Render fallback
{showFallbackContinue && (
  <div className="fixed bottom-20 left-0 right-0 text-center z-50">
    <Button onClick={handleFallbackContinue} className="bg-orange-600 animate-pulse">
      Stuck? Click to Continue
    </Button>
  </div>
)}
```

[Back to TOC](#table-of-contents)

---

### Step 3.3: Add automated stuck state recovery 🤖

Add logic to automatically recover from known stuck states:

```javascript
const handleFallbackContinue = () => {
  addDebugLog('Fallback continue triggered');

  // Try to recover based on current state
  if (pendingCountContinue) {
    handleCountContinue();
  } else if (pendingScore) {
    acceptScoreAndContinue();
  } else if (gameState === 'counting' && counterIsComputer && computerClaimedScore !== null) {
    acceptComputerCount();
  } else {
    // Last resort: advance to next logical state
    addDebugLog('Unknown stuck state, attempting recovery');
    // ... recovery logic based on gameState
  }

  setShowFallbackContinue(false);
};
```

[Back to TOC](#table-of-contents)

---

### Step 3.4: Auto-submit bug report when Stuck button used 🤖

When the user clicks the "Stuck? Click to Continue" fallback button, automatically submit a bug report containing the full game state and flow history. This captures the exact conditions that caused the stuck state so it can be debugged and fixed.

**Information to capture:**
1. Current game state (`gameState`, `dealer`, `currentPlayer`, etc.)
2. Required action that should have been available (`requiredAction`)
3. All relevant boolean flags (`pendingCountContinue`, `pendingScore`, `counterIsComputer`, etc.)
4. Recent game log entries (last 20 actions)
5. Debug log entries (last 50 entries)
6. Hands and cards state (player hand, computer hand, crib, cut card)
7. Scores at time of stuck state
8. Timestamp and app version

**Implementation:**

```javascript
const handleFallbackContinue = async () => {
  addDebugLog('Fallback continue triggered - auto-submitting bug report');

  // Capture full state for bug report
  const stuckStateReport = {
    timestamp: new Date().toISOString(),
    appVersion: APP_VERSION,
    requiredAction: requiredAction,
    gameState: {
      state: gameState,
      dealer,
      currentPlayer,
      playerScore,
      computerScore,
      handsCountedThisRound,
      counterIsComputer,
      countingTurn,
      pendingCountContinue: !!pendingCountContinue,
      pendingScore: !!pendingScore,
      computerClaimedScore,
      playerMadeCountDecision,
      showMugginsPreferenceDialog,
      actualScore,
    },
    cards: {
      playerHand: playerHand?.map(c => `${c.rank}${c.suit}`),
      computerHand: computerHand?.map(c => `${c.rank}${c.suit}`),
      crib: crib?.map(c => `${c.rank}${c.suit}`),
      cutCard: cutCard ? `${cutCard.rank}${cutCard.suit}` : null,
    },
    recentGameLog: gameLog.slice(-20),
    recentDebugLog: debugLog.slice(-50),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  // Auto-submit bug report
  try {
    await fetch('/api/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'AUTO_STUCK_STATE',
        description: `User clicked "Stuck" button. Required action was: ${requiredAction.type} (${requiredAction.label})`,
        stuckStateReport,
      }),
    });
    addDebugLog('Auto bug report submitted successfully');
  } catch (err) {
    addDebugLog(`Failed to submit auto bug report: ${err.message}`);
  }

  // Then proceed with recovery
  clearStuck();
  if (pendingCountContinue) {
    handleCountContinue();
  } else if (pendingScore) {
    acceptScoreAndContinue();
  } else if (gameState === 'counting' && counterIsComputer && computerClaimedScore !== null) {
    acceptComputerCount();
  } else if (gameState === 'gameOver') {
    startNewGame();
  } else {
    setMessage('Recovery attempted. If still stuck, please use menu to report a bug.');
  }
};
```

**Bug report API update:**
The `/api/bug-report` endpoint should recognize `type: 'AUTO_STUCK_STATE'` and store these reports separately for easy identification and analysis.

[Back to TOC](#table-of-contents)

---

## Phase 4: Testing and Deployment

### Step 4.1: Test all game states 👤

User should test these scenarios:
- [ ] Undercount during player counting (the bug case)
- [ ] Overcount during player counting
- [ ] Correct count during player counting
- [ ] Computer counting - Accept
- [ ] Computer counting - Muggins (correct)
- [ ] Computer counting - Muggins (wrong)
- [ ] Crib selection and discard
- [ ] Play phase - play cards
- [ ] Play phase - say Go
- [ ] Game over - new game

[Back to TOC](#table-of-contents)

---

### Step 4.2: Commit and deploy 🤖

1. Bump version to next build number
2. Git add specific files
3. Git commit with descriptive message
4. Push and deploy to EC2

[Back to TOC](#table-of-contents)

---

*Plan created: December 28, 2025*
