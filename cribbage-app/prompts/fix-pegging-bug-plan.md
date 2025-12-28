# Fix Pegging Bug Plan

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [Bug Report Analysis](#bug-report-analysis)
- [x] [Phase 1: Fix handsCountedThisRound Reset](#phase-1-fix-handscountedthisround-reset)
  - [x] [1.1: Locate dealHands function](#step-11-locate-dealhands-function-🤖)
  - [x] [1.2: Add handsCountedThisRound reset](#step-12-add-handscountedthisround-reset-🤖)
- [x] [Phase 2: Fix Computer Double-Play After Last Card](#phase-2-fix-computer-double-play-after-last-card)
  - [x] [2.1: Analyze turn transition after last card](#step-21-analyze-turn-transition-after-last-card-🤖) (NOT A BUG)
  - [x] [2.2: Fix computer play timing](#step-22-fix-computer-play-timing-🤖) (SKIPPED)
- [ ] [Phase 3: Test and Deploy](#phase-3-test-and-deploy)
  - [ ] [3.1: Build and verify](#step-31-build-and-verify-🤖)
  - [ ] [3.2: Deploy to EC2](#step-32-deploy-to-ec2-👤)

---

## Overview

This plan addresses pegging bugs reported on 2025-12-28 where the computer played out of turn and the game state became corrupted.

[Back to TOC](#table-of-contents)

---

## Problem Statement

User reported: "The pegging got all messed up and the system allowed both the user and computer to play out of turn."

**Bug Report:** `bug-report-2025-12-28T21-00-44-227Z.json`

**Symptoms:**
1. Computer played twice in a row after count reset (10♦ then 8♠)
2. `handsCountedThisRound` stuck at 3 even after dealing new hands
3. Turn transitions not working correctly after "last card" points

[Back to TOC](#table-of-contents)

---

## Bug Report Analysis

### Pegging History from Bug Report

```
1. computer plays J♦ → count: 10
2. player plays 3♠ → count: 13
3. computer plays 10♣ → count: 23
4. player plays A♦ → count: 24
5. computer Go (at 24)
6. player plays 3♦ → count: 27
7. computer Go (at 27)
8. player plays A♠ → count: 28
9. computer Go (at 28)
10. player gets 1 for last card - COUNT RESETS TO 0
11. computer plays 10♦ → count: 10  ← PROBLEM: No pause for accept
12. computer plays 8♠ → count: 18   ← PROBLEM: Computer plays twice in a row
```

### State Corruption Evidence

From debug log:
```
[3:58:00 PM] All counting complete - dealing next hand
[3:58:01 PM] GAME EVENT: DEAL_HANDS - {...}
[3:58:01 PM] useEffect check - handsCountedThisRound: 3, state: cribSelect  ← SHOULD BE 0!
[3:58:35 PM] useEffect check - handsCountedThisRound: 3, state: play        ← STILL 3!
```

**Root Cause #1:** `handsCountedThisRound` is not being reset to 0 when dealing new hands.

**Root Cause #2:** After player accepts "last card" point, computer immediately plays without proper turn transition or allowing player to respond.

### Cards at Time of Bug

- **Player hand:** 3♦, A♠, A♦, 3♠ (all 4 cards played in first round)
- **Computer hand:** 10♦, J♦, 8♠, 10♣ (J♦ and 10♣ played, 10♦ and 8♠ remaining)
- **Player play hand:** EMPTY (all cards played)
- **Computer play hand:** 10♦, 8♠ (2 cards remaining)

The computer playing twice IS technically valid since player has no cards left. However:
1. There should be a pause/accept between plays
2. The `handsCountedThisRound: 3` bug is a separate issue that may cause other problems

[Back to TOC](#table-of-contents)

---

## Phase 1: Fix handsCountedThisRound Reset

### Step 1.1: Locate dealHands function 🤖

**Task:** Find where `dealHands` is called and verify `handsCountedThisRound` is being reset.

**Expected location:** `components/CribbageGame.jsx`

**Status:** COMPLETED 2025-12-28

Found that `dealHands()` was NOT resetting `handsCountedThisRound`. The reset only happened in `moveToCountingPhase()`.

[Back to TOC](#table-of-contents)

---

### Step 1.2: Add handsCountedThisRound reset 🤖

**Task:** Ensure `setHandsCountedThisRound(0)` is called when dealing new hands.

**Verification:** Check debug log shows `handsCountedThisRound: 0` after DEAL_HANDS event.

**Status:** COMPLETED 2025-12-28

Added `setHandsCountedThisRound(0);` to `dealHands()` function at line 616.

[Back to TOC](#table-of-contents)

---

## Phase 2: Fix Computer Double-Play After Last Card

### Step 2.1: Analyze turn transition after last card 🤖

**Task:** Trace the code path when player accepts "last card" point:
1. What triggers the count reset?
2. How is the next player determined?
3. Why does computer play immediately and twice?

**Key functions to examine:**
- `acceptScoreAndContinue`
- `handlePlayEnd`
- `computerPlayCard` (or equivalent)

**Status:** COMPLETED 2025-12-28 - ANALYSIS RESULT: NOT A BUG

Analyzed the code and bug report timestamps:
- Computer plays at 3:59:10, then 3:59:12 (2 seconds apart)
- The 1500ms delay in the useEffect IS working
- When player is out of cards, computer correctly plays remaining cards one at a time

This is **expected cribbage behavior**. When one player runs out of cards, the other player plays their remaining cards. The delays between plays are working correctly.

The actual bug was `handsCountedThisRound: 3` not being reset, which may have caused confusion or other issues.

[Back to TOC](#table-of-contents)

---

### Step 2.2: Fix computer play timing 🤖

**Task:** ~~Ensure proper pause between computer plays, even when player has no cards.~~

**Status:** SKIPPED - No fix needed. The existing 1500ms delay between computer plays is working correctly. The "double play" is expected cribbage behavior when player is out of cards.

[Back to TOC](#table-of-contents)

---

## Phase 3: Test and Deploy

### Step 3.1: Build and verify 🤖

**Task:**
- Run `npm run build`
- Verify no errors
- Bump version

[Back to TOC](#table-of-contents)

---

### Step 3.2: Deploy to EC2 👤

**Task:** User deploys to EC2 server.

```bash
# From Mac:
git push origin main

# Deploy command:
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
  "cd cribbage && git pull && cd cribbage-app && npm run build && pm2 restart cribbage"
```

[Back to TOC](#table-of-contents)

---

*Plan created: 2025-12-28*
