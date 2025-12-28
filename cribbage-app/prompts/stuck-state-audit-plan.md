# Stuck State Audit Plan

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [Known Bugs - Fixed](#known-bugs---fixed)
- [x] [Phase 1: Audit getRequiredAction Logic](#phase-1-audit-getrequiredaction-logic)
  - [x] [1.1: Review all "wait" return paths](#step-11-review-all-wait-return-paths-🤖)
  - [x] [1.2: Review all state combinations in counting phase](#step-12-review-all-state-combinations-in-counting-phase-🤖)
  - [x] [1.3: Review all state combinations in play phase](#step-13-review-all-state-combinations-in-play-phase-🤖)
- [x] [Phase 2: Audit State Persistence/Restore](#phase-2-audit-state-persistencerestore)
  - [x] [2.1: List all state variables saved](#step-21-list-all-state-variables-saved-🤖)
  - [x] [2.2: Identify state variables NOT saved that should be](#step-22-identify-state-variables-not-saved-that-should-be-🤖)
  - [x] [2.3: Check for stale state after restore](#step-23-check-for-stale-state-after-restore-🤖)
- [x] [Phase 3: Audit handleStuckRecovery Coverage](#phase-3-audit-handlestuckrecovery-coverage)
  - [x] [3.1: List all recovery paths](#step-31-list-all-recovery-paths-🤖)
  - [x] [3.2: Identify gaps in recovery coverage](#step-32-identify-gaps-in-recovery-coverage-🤖)
- [x] [Phase 4: Audit State Resets on Phase Transitions](#phase-4-audit-state-resets-on-phase-transitions)
  - [x] [4.1: Check dealHands resets](#step-41-check-dealhands-resets-🤖)
  - [x] [4.2: Check moveToCountingPhase resets](#step-42-check-movetocountingphase-resets-🤖)
  - [x] [4.3: Check play phase transitions](#step-43-check-play-phase-transitions-🤖)
- [x] [Phase 5: Document Findings and Fix](#phase-5-document-findings-and-fix)
  - [x] [5.1: Create issue list](#step-51-create-issue-list-🤖)
  - [x] [5.2: Implement fixes](#step-52-implement-fixes-🤖)
  - [x] [5.3: Test and deploy](#step-53-test-and-deploy-👤)

---

## Overview

This plan systematically audits all possible stuck states in the cribbage game where a user might not have a visible button or action to take.

[Back to TOC](#table-of-contents)

---

## Problem Statement

Users have reported getting "stuck" where no button is visible and they cannot proceed. The root causes have been:

1. `getRequiredAction()` returning "wait" when it should return a button action
2. State variables not being saved/restored properly on game reload
3. State variables not being reset properly on phase transitions
4. `handleStuckRecovery()` not covering all stuck scenarios

This audit will systematically check for all such cases.

[Back to TOC](#table-of-contents)

---

## Known Bugs - Fixed

### Bug 1: Continue button missing after restore during counting (Kandi's bug)

**Symptoms:**
- `gameState: 'counting'`
- `counterIsComputer: true` (computer's turn to count)
- `actualScore` still set from player's previous count
- `computerClaimedScore: null` (computer hasn't started)
- No Continue button shown

**Root Cause:** `getRequiredAction()` returned "wait" when `counterIsComputer` was true and `computerClaimedScore` was null, assuming computer was "processing". But with `actualScore` set, the computer useEffect couldn't fire.

**Fix Applied (b54→b55):**
- `lib/gameActions.js` lines 120-127: Added check for `actualScore` before returning "wait"
- Now shows Continue button when `actualScore` blocks computer count

**Status:** ✅ FIXED in b55

---

### Bug 2: "I'm Stuck" recovery didn't work for Kandi's scenario

**Symptoms:**
- User clicked "I'm Stuck"
- Got message "Bug report sent. If still stuck, use menu to forfeit."
- No automatic recovery occurred

**Root Cause:** `handleStuckRecovery()` didn't have a recovery path for when `actualScore` was set but `pendingCountContinue` was null.

**Fix Applied (b54→b55):**
- `components/CribbageGame.jsx` lines 1777-1788: Added recovery for `gameState === 'counting' && actualScore && computerClaimedScore === null`
- Clears `actualScore` and lets computer proceed

**Status:** ✅ FIXED in b55

---

### Bug 3: handsCountedThisRound not reset on new deal

**Symptoms:**
- `handsCountedThisRound: 3` persisted through new deal
- State showed counting complete even in new hand
- Potential for various logic errors

**Root Cause:** `dealHands()` function didn't reset `handsCountedThisRound` to 0.

**Fix Applied (b55):**
- `components/CribbageGame.jsx` line 616: Added `setHandsCountedThisRound(0)` to `dealHands()`

**Status:** ✅ FIXED in b55

---

### Bug 4: pendingCountContinue not saved/restored

**Symptoms:**
- Game restored during counting
- `actualScore` was set but `pendingCountContinue` was null
- Continue button did nothing

**Root Cause:** `pendingCountContinue` wasn't being saved/restored with game state.

**Fix Applied (earlier, b49):**
- Added `pendingCountContinue` to saved/restored state
- Added fallback logic in `handleCountContinue` for when `pendingCountContinue` is null but `actualScore` is set

**Status:** ✅ FIXED in b49

---

### Bug 5: Back peg missing at score 0

**Symptoms:**
- Only one peg showing per player when score was 0

**Root Cause:** `getHolePosition()` returned null for score 0

**Fix Applied (b50):**
- Return start position for score 0 instead of null

**Status:** ✅ FIXED in b50

---

### Bug 6: Back peg missing for restored games

**Symptoms:**
- Computer only showed one peg after restore

**Root Cause:** Back pegs initialized to 0 regardless of current score on restore

**Fix Applied (b52):**
- Initialize back pegs to `score - 1` on component mount for restored games

**Status:** ✅ FIXED in b52

---

### Bug 7: Cribbage board S-pattern incorrect for scores 61+

**Symptoms:**
- Pegs jumped incorrectly when crossing from 60 to 61
- Scores 61-90 were on wrong row

**Root Cause:** `getHolePosition()` mapped scores 61-90 to row 1 instead of row 0

**Fix Applied (b53→b55):**
- Corrected entire S-pattern layout in `getHolePosition()`

**Status:** ✅ FIXED in b53/b55

[Back to TOC](#table-of-contents)

---

## Phase 1: Audit getRequiredAction Logic

### Step 1.1: Review all "wait" return paths 🤖

**Task:** Find every place in `getRequiredAction()` that returns `type: 'wait'` and verify each has a valid reason or needs a fallback.

**Files to check:**
- `lib/gameActions.js`

**Questions to answer:**
- Under what conditions does each "wait" return occur?
- Is there a scenario where the condition is met but no action will ever change it?
- Should there be a timeout or fallback?

[Back to TOC](#table-of-contents)

---

### Step 1.2: Review all state combinations in counting phase 🤖

**Task:** Enumerate all possible state combinations during counting phase and verify each has a valid action.

**State variables to consider:**
- `counterIsComputer` (true/false/null)
- `actualScore` (set/null)
- `computerClaimedScore` (number/null)
- `pendingCountContinue` (object/null)
- `playerMadeCountDecision` (true/false)
- `showMugginsPreferenceDialog` (true/false)
- `handsCountedThisRound` (0/1/2/3)

**Create truth table of all combinations and expected action.**

[Back to TOC](#table-of-contents)

---

### Step 1.3: Review all state combinations in play phase 🤖

**Task:** Enumerate all possible state combinations during play phase and verify each has a valid action.

**State variables to consider:**
- `currentPlayer` ('player'/'computer')
- `pendingScore` (object/null)
- `playerPlayHand.length` (0-4)
- `computerPlayHand.length` (0-4)
- `currentCount` (0-31)
- Player can play (any card fits under 31)
- Computer can play (any card fits under 31)

**Create truth table of critical combinations and expected action.**

[Back to TOC](#table-of-contents)

---

## Phase 2: Audit State Persistence/Restore

### Step 2.1: List all state variables saved 🤖

**Task:** Extract complete list of state variables that are saved to server and restored on page load.

**Files to check:**
- `components/CribbageGame.jsx` - `createCurrentSnapshot()` function
- `components/CribbageGame.jsx` - restore logic in useEffect

[Back to TOC](#table-of-contents)

---

### Step 2.2: Identify state variables NOT saved that should be 🤖

**Task:** Compare saved state list against all useState variables. Identify any that could cause stuck states if not persisted.

**High-risk variables to verify:**
- `pendingScore`
- `pendingCountContinue`
- `actualScore`
- `isProcessingCount`
- `lastPlayedBy`
- `lastGoPlayer`

[Back to TOC](#table-of-contents)

---

### Step 2.3: Check for stale state after restore 🤖

**Task:** Identify state combinations that are invalid after restore because dependent state wasn't saved.

**Example scenarios:**
- `counterIsComputer: true` but `actualScore` set (computer can't proceed)
- `pendingScore` set but action handlers don't know context
- `currentPlayer: 'computer'` but computer useEffect doesn't fire due to other state

[Back to TOC](#table-of-contents)

---

## Phase 3: Audit handleStuckRecovery Coverage

### Step 3.1: List all recovery paths 🤖

**Task:** Document every recovery path in `handleStuckRecovery()` and what scenario it handles.

**Current recovery paths:**
1. `pendingCountContinue` set → call `handleCountContinue()`
2. `pendingScore` set → call `acceptScoreAndContinue()`
3. `counting && counterIsComputer && computerClaimedScore !== null` → call `acceptComputerCount()`
4. `counting && actualScore && computerClaimedScore === null` → clear actualScore
5. `gameOver` → call `startNewGame()`
6. else → "Unknown stuck state"

[Back to TOC](#table-of-contents)

---

### Step 3.2: Identify gaps in recovery coverage 🤖

**Task:** For each stuck scenario identified in Phase 1, verify there's a recovery path.

**Potential gaps to check:**
- Play phase with `pendingScore` but wrong `currentPlayer`
- Counting phase with `showMugginsPreferenceDialog` stuck
- `cutForStarter` state with computer as dealer but no auto-cut happening
- `cribSelect` state after restore with wrong card count

[Back to TOC](#table-of-contents)

---

## Phase 4: Audit State Resets on Phase Transitions

### Step 4.1: Check dealHands resets 🤖

**Task:** Verify all state that should reset when dealing new hands is actually reset.

**Variables that should reset:**
- `handsCountedThisRound` ✅ (fixed in b55)
- `selectedCards`
- `crib`
- `cutCard`
- `peggingHistory`
- `countingHistory`
- `actualScore`
- `computerClaimedScore`
- `pendingScore`
- `pendingCountContinue`

[Back to TOC](#table-of-contents)

---

### Step 4.2: Check moveToCountingPhase resets 🤖

**Task:** Verify all pegging state is properly cleared when moving to counting.

**Variables that should reset:**
- `pendingScore`
- `computerClaimedScore`
- `actualScore`
- `isProcessingCount`
- `pendingCountContinue`
- `playerMadeCountDecision`
- `showMugginsPreferenceDialog`

[Back to TOC](#table-of-contents)

---

### Step 4.3: Check play phase transitions 🤖

**Task:** Verify state is correct when:
- Transitioning from cribSelect to play
- Resetting count after 31 or Go
- One player runs out of cards

[Back to TOC](#table-of-contents)

---

## Phase 5: Document Findings and Fix

### Step 5.1: Create issue list 🤖

**Task:** Compile all issues found into a prioritized list with severity ratings.

[Back to TOC](#table-of-contents)

---

### Step 5.2: Implement fixes 🤖

**Task:** Fix all identified issues.

[Back to TOC](#table-of-contents)

---

### Step 5.3: Test and deploy 👤

**Task:** Build, test, and deploy fixes.

[Back to TOC](#table-of-contents)

---

---

## Audit Results - New Bugs Found and Fixed (b56)

### Bug 8: Player stuck with "play card" when they have 0 cards

**Found in:** Phase 1, Step 1.3

**Symptoms:**
- `gameState: 'play'`
- `currentPlayer: 'player'`
- `playerPlayHand.length === 0` (no cards left)
- `computerPlayHand.length > 0` (computer still has cards)
- getRequiredAction returns `play_player_turn` ("click a card")
- But player has no cards to click!

**Root Cause:** getRequiredAction didn't check for empty player hand in play phase.

**Fix Applied (b56):**
- `lib/gameActions.js` lines 89-91: Added check for `playerPlayHand.length === 0` before checking canPlay
- Now returns "wait" with `noCardsLeft: true` flag

**Status:** ✅ FIXED in b56

---

### Bug 9: No stuck recovery for computer stuck in play phase

**Found in:** Phase 3, Step 3.2

**Symptoms:**
- `gameState: 'play'`
- `currentPlayer: 'computer'`
- Computer useEffect not firing
- User clicks "I'm Stuck" but gets "Unknown stuck state"

**Root Cause:** handleStuckRecovery didn't have recovery for play phase computer turns.

**Fix Applied (b56):**
- `components/CribbageGame.jsx` lines 1793-1797: Added recovery that switches turn to player

**Status:** ✅ FIXED in b56

---

### Bug 10: No stuck recovery for both players out of cards

**Found in:** Phase 3, Step 3.2

**Symptoms:**
- `gameState: 'play'`
- Both `playerPlayHand` and `computerPlayHand` are empty
- Should have transitioned to counting but didn't
- User clicks "I'm Stuck" but gets "Unknown stuck state"

**Root Cause:** handleStuckRecovery didn't check for this scenario.

**Fix Applied (b56):**
- `components/CribbageGame.jsx` lines 1798-1801: Added recovery that calls moveToCountingPhase()

**Status:** ✅ FIXED in b56

---

### Bug 11: No stuck recovery for computer cut stuck

**Found in:** Phase 3, Step 3.2

**Symptoms:**
- `gameState: 'cutForStarter'`
- `dealer: 'player'` (so computer should cut)
- Computer auto-cut useEffect not firing
- User clicks "I'm Stuck" but gets "Unknown stuck state"

**Root Cause:** handleStuckRecovery didn't have recovery for cutForStarter phase.

**Fix Applied (b56):**
- `components/CribbageGame.jsx` lines 1802-1806: Added recovery that triggers handleStarterCut manually

**Status:** ✅ FIXED in b56

---

*Plan created: 2025-12-28*
*Audit completed: 2025-12-28*
