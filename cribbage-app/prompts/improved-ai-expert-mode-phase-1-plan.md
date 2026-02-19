# Improved AI Expert Mode — Phase 1 Implementation Plan

**Created**: 2026-02-19
**Author**: Claude Code
**Status**: Proposed
**Research**: `prompts/improved-ai-expert-mode-research.md`

---

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [Phase 1.1: Modularize AI Structure 🤖](#phase-11-modularize-ai-structure-🤖)
- [ ] [Phase 1.2: Implement Expected-Value Discard Strategy 🤖](#phase-12-implement-expected-value-discard-strategy-🤖)
- [ ] [Phase 1.3: Add Difficulty Selector to Menu 🤖](#phase-13-add-difficulty-selector-to-menu-🤖)
- [ ] [Phase 1.4: Wire Difficulty Setting to AI Functions 🤖](#phase-14-wire-difficulty-setting-to-ai-functions-🤖)
- [ ] [Phase 1.5: Configurable Counting Error Rate 🤖](#phase-15-configurable-counting-error-rate-🤖)
- [ ] [Phase 1.6: Per-Difficulty Stats Tracking 🤖](#phase-16-per-difficulty-stats-tracking-🤖)
- [ ] [Phase 1.7: Deploy & Test 👤🤖](#phase-17-deploy--test-👤🤖)

---

## Overview

This plan implements Phase 1 of the Expert Mode feature: a meaningfully harder AI opponent that challenges high-skill players like Shawn (404 wins, 117 losses, ~78% win rate). The single highest-impact improvement is **expected-value discard optimization** — evaluating all 46 possible cut cards for each keep/discard split, rather than the current heuristic scoring. This alone is estimated to raise the AI's average hand score by 1-2 points per hand over ~26 hands per game.

Phase 1 scope:
- Modular AI architecture (`lib/ai/`) to support multiple difficulty tiers
- Expected-value discard strategy for Expert mode (690 evaluations per decision — trivially fast)
- Difficulty selector on the main menu (Normal / Expert)
- Zero counting errors in Expert mode
- Per-difficulty stats tracking (Normal wins don't mix with Expert wins)
- **Normal mode remains 100% unchanged** — same heuristic discard, same pegging, same 10% counting errors

Phase 1 does NOT include: pegging improvements (lookahead, card tracking, minimax), board-position awareness, or adaptive difficulty. Those are Phase 2+ work per the research document.

[Back to TOC](#table-of-contents)

---

## Problem Statement

Shawn has logged 400+ wins with a ~78% win rate. The current AI (`lib/ai.js`) uses a simple heuristic that evaluates kept hands in isolation without considering cut card probability. An expert cribbage player always considers "average hand" value across all possible cuts. By implementing expected-value discard calculation, the Expert AI will make significantly better discard decisions — the area where the current AI loses the most ground.

The key constraint: **Normal mode must not change.** Shawn's 400+ win record was earned against Normal AI and must remain valid. Expert mode is additive — a new challenge, not a correction.

[Back to TOC](#table-of-contents)

---

## Phase 1.1: Modularize AI Structure 🤖

**Goal**: Extract current AI from single `lib/ai.js` into a modular `lib/ai/` directory that supports multiple strategy implementations.

**Current state**: `lib/ai.js` exports two functions:
- `computerSelectCrib(hand, isDealer)` — discard selection (lines 13-85)
- `computerSelectPlay(hand, playedCards, currentCount)` — pegging play (lines 95-180)

**New structure**:
```
lib/ai/
  index.js                    — Exports difficulty-aware AI functions
  difficulty.js               — DIFFICULTY_PROFILES definitions
  strategies/
    discard-heuristic.js      — Current Normal mode discard (extracted verbatim)
    discard-ev.js             — Expected-value discard for Expert (Phase 1.2)
    pegging-heuristic.js      — Current pegging logic (extracted verbatim)
```

**Steps**:
1. Create `lib/ai/strategies/discard-heuristic.js` — move `computerSelectCrib` here unchanged
2. Create `lib/ai/strategies/pegging-heuristic.js` — move `computerSelectPlay` here unchanged
3. Create `lib/ai/difficulty.js` — define difficulty profile objects
4. Create `lib/ai/index.js` — export wrapper functions that select strategy based on difficulty
5. Update `components/CribbageGame.jsx` imports from `lib/ai` to `lib/ai/index`
6. Verify Normal mode works identically (no behavioral change)

**`lib/ai/difficulty.js`**:
```javascript
export const DIFFICULTY_PROFILES = {
  normal: {
    name: 'Normal',
    description: 'Classic AI opponent',
    discardStrategy: 'heuristic',
    peggingStrategy: 'heuristic',
    countingErrorRate: 0.10,
    countingErrorRange: 2,
  },
  expert: {
    name: 'Expert',
    description: 'Stronger AI that evaluates every possible cut card',
    discardStrategy: 'expected-value',
    peggingStrategy: 'heuristic',    // Same pegging for Phase 1
    countingErrorRate: 0.0,
    countingErrorRange: 0,
  },
};
```

**`lib/ai/index.js`**:
```javascript
import { computerSelectCrib as heuristicDiscard } from './strategies/discard-heuristic';
import { computerSelectCrib as evDiscard } from './strategies/discard-ev';
import { computerSelectPlay as heuristicPegging } from './strategies/pegging-heuristic';
import { DIFFICULTY_PROFILES } from './difficulty';

export { DIFFICULTY_PROFILES };

export const computerSelectCrib = (hand, isDealer, difficulty = 'normal') => {
  const profile = DIFFICULTY_PROFILES[difficulty];
  if (profile.discardStrategy === 'expected-value') {
    return evDiscard(hand, isDealer);
  }
  return heuristicDiscard(hand, isDealer);
};

export const computerSelectPlay = (hand, playedCards, currentCount, difficulty = 'normal') => {
  return heuristicPegging(hand, playedCards, currentCount);
};
```

[Back to TOC](#table-of-contents)

---

## Phase 1.2: Implement Expected-Value Discard Strategy 🤖

**Goal**: Create `lib/ai/strategies/discard-ev.js` that evaluates each keep/discard split against all 46 possible cut cards.

**Algorithm** (from research section 2.1):
```
For each of 15 possible (keep4, discard2) splits:
    totalScore = 0
    for each of 46 remaining cards (52 - 6 in hand):
        totalScore += calculateHandScore(keep4, cutCard, isCrib=false)
    expectedHandValue = totalScore / 46

    // Estimate crib contribution using static discard tables
    expectedCribValue = estimateCribValue(discard2)

    combinedScore = expectedHandValue + (isDealer ? expectedCribValue : -expectedCribValue)

Choose the split with the highest combinedScore
```

**Computational cost**: 15 keeps x 46 cuts = 690 hand evaluations. `calculateHandScore` runs in microseconds. Total: < 10ms. No precomputation needed.

**Crib value estimation**: Use a static lookup table of average crib contributions for all 78 rank-pair combinations (ignoring suits). These values are well-documented in cribbage literature. Examples:

| Discard Pair | Avg Crib Value |
|-------------|----------------|
| 5-5 | ~8.5 |
| 5-J | ~6.5 |
| 5-10/Q/K | ~6.0 |
| 7-8 | ~5.5 |
| A-4 | ~5.0 |
| K-10 | ~2.5 |
| K-K | ~4.5 |
| 9-K | ~2.0 |

**Steps**:
1. Create `lib/ai/strategies/discard-ev.js` with `computerSelectCrib(hand, isDealer)`
2. Build the expected-value evaluation loop using `calculateHandScore` from `lib/scoring.js`
3. Add static crib discard value table (`CRIB_DISCARD_VALUES`) for 78 rank-pair combinations
4. Test against known optimal discard scenarios from cribbage literature
5. Add debug logging: `[AI Expert] EV discard: kept=[...], ev=X.X, cribEv=Y.Y, combined=Z.Z`

**Key detail**: The 46-card iteration must exclude all 6 cards in hand (not just the 4 kept), since the remaining 2 are in the crib and can't be the cut card.

**Flush consideration**: The EV calculation should include flush detection — if all 4 kept cards share a suit, add 4 points. If the cut card also matches, add 5 points. The current heuristic ignores flushes entirely.

**Nobs consideration**: If a kept Jack matches the cut card's suit, add 1 point. This is automatically handled by `calculateHandScore`.

[Back to TOC](#table-of-contents)

---

## Phase 1.3: Add Difficulty Selector to Menu 🤖

**Goal**: Add a difficulty toggle to the main menu so players can choose Normal or Expert before starting a new game.

**Current menu** (`CribbageGame.jsx` lines 2596-2644):
- Shows stats (wins/losses/forfeits)
- "Resume Game" button (if saved game exists)
- "Start New Game" button (if no saved game)

**New menu layout**:
```
        Your Record:
   Wins: 404  Losses: 117

     ┌─────────────────────┐
     │    Resume Game       │    (if saved game exists)
     └─────────────────────┘

     Difficulty:
     [  Normal  ] [ Expert ]    ← Toggle selector

     ┌─────────────────────┐
     │   Start New Game     │
     └─────────────────────┘
```

**Design decisions**:
- Difficulty selector is a pair of styled buttons (pill toggle), not a dropdown
- Selected difficulty is highlighted (green for Normal, orange/red for Expert)
- Expert shows a brief subtitle: "Stronger AI — evaluates every possible cut"
- Difficulty is stored in `localStorage` as `'aiDifficulty'` (persists across sessions)
- When resuming a saved game, use the difficulty stored WITH the game (not the menu selector)
- When starting a new game, use the currently selected difficulty

**State**:
```javascript
const [aiDifficulty, setAiDifficulty] = useState('normal');
```

**Persistence** (follows existing muggins preference pattern):
```javascript
const getAiDifficulty = () => localStorage.getItem('aiDifficulty') || 'normal';
const saveAiDifficulty = (d) => localStorage.setItem('aiDifficulty', d);
```

**Difficulty saved with game state**: Add `aiDifficulty` to the persisted state keys in `lib/gameStateSerializer.js` so a resumed game uses the same difficulty it was started with.

**In-game indicator**: Show a small label near the top bar (e.g., "Expert" in orange) when playing on Expert difficulty. This follows the research recommendation (section 4.2): "Show the difficulty label in-game."

[Back to TOC](#table-of-contents)

---

## Phase 1.4: Wire Difficulty Setting to AI Functions 🤖

**Goal**: Thread the difficulty setting through to all AI decision points.

**Call sites in CribbageGame.jsx**:

1. **Discard selection** (line ~870, during deal):
   ```javascript
   // Before:
   const kept = computerSelectCrib(computerCards, activeDealer === 'computer');
   // After:
   const kept = computerSelectCrib(computerCards, activeDealer === 'computer', aiDifficulty);
   ```

2. **Discard selection fallback** (line ~1094, during crib selection):
   ```javascript
   // Before:
   const newComputerHand = computerKeptHand || computerSelectCrib(computerHand, dealer === 'computer');
   // After:
   const newComputerHand = computerKeptHand || computerSelectCrib(computerHand, dealer === 'computer', aiDifficulty);
   ```

3. **Pegging play** (line ~1509, during play phase):
   ```javascript
   // Before:
   const card = computerSelectPlay(computerPlayHand, allPlayedCards, currentCount);
   // After:
   const card = computerSelectPlay(computerPlayHand, allPlayedCards, currentCount, aiDifficulty);
   ```

**Steps**:
1. Add `aiDifficulty` to component state, initialize from `localStorage`
2. Add `aiDifficulty` to `PERSISTED_STATE_KEYS` in `lib/gameStateSerializer.js`
3. Pass `aiDifficulty` to all three `computerSelectCrib` / `computerSelectPlay` call sites
4. Update imports from `import { computerSelectCrib, computerSelectPlay } from '../lib/ai'` to `'../lib/ai/index'`

[Back to TOC](#table-of-contents)

---

## Phase 1.5: Configurable Counting Error Rate 🤖

**Goal**: Expert AI makes zero counting errors (currently fixed 10% for all games).

**Current code** (`CribbageGame.jsx`, `computerCounts()` ~line 1984):
```javascript
let claimed = score;
if (Math.random() < 0.1 && score > 0) {
  const error = Math.random() < 0.5 ? -2 : 2;
  claimed = Math.max(0, score + error);
}
```

**Change**: Import the difficulty profile and use its `countingErrorRate`:
```javascript
import { DIFFICULTY_PROFILES } from '../lib/ai';

// In computerCounts():
const profile = DIFFICULTY_PROFILES[aiDifficulty];
let claimed = score;
if (Math.random() < profile.countingErrorRate && score > 0) {
  const error = Math.random() < 0.5 ? -profile.countingErrorRange : profile.countingErrorRange;
  claimed = Math.max(0, score + error);
}
```

**Effect**: Normal mode keeps 10% error rate with +/-2. Expert mode has 0% errors — the AI always counts perfectly. This removes the muggins opportunity from Expert games, which is realistic (expert players don't miscount).

[Back to TOC](#table-of-contents)

---

## Phase 1.6: Per-Difficulty Stats Tracking 🤖

**Goal**: Track wins/losses separately for each difficulty level so Shawn's 404-win Normal record is preserved and Expert mode starts fresh.

**Current stats structure** (`game-stats` API):
```json
{ "wins": 404, "losses": 117, "forfeits": 0, "lastPlayed": "..." }
```

**New stats structure**:
```json
{
  "wins": 404, "losses": 117, "forfeits": 0, "lastPlayed": "...",
  "expertWins": 0, "expertLosses": 0, "expertForfeits": 0, "expertLastPlayed": null
}
```

**Approach**: Add `expertWins`, `expertLosses`, `expertForfeits`, `expertLastPlayed` columns to the `game_stats` table schema. Existing Normal-mode stats remain untouched in the original columns. The `POST /api/game-stats` endpoint receives the difficulty alongside the result.

**Menu display**:
```
     Your Record (Normal):
   Wins: 404  Losses: 117

     Your Record (Expert):
   Wins: 3  Losses: 7
```

Only show the Expert record section if the player has any Expert games.

**Steps**:
1. Add expert stat columns to `game_stats` DDL in the data schema
2. Update `POST /api/game-stats` to accept `{ result, difficulty }` and increment the right counters
3. Update `GET /api/game-stats` to return both stat blocks
4. Update menu display to show per-difficulty stats
5. Update `recordGameResult` calls in CribbageGame.jsx to pass `aiDifficulty`

[Back to TOC](#table-of-contents)

---

## Phase 1.7: Deploy & Test 👤🤖

**Goal**: Deploy to production and validate with real play.

**Steps**:
1. 🤖 Run local build to catch compilation errors
2. 🤖 Bump version to next build number
3. 🤖 Git add, commit, push, deploy to production
4. 👤 Test Normal mode — verify behavior is identical (same AI quality, same counting errors, same stats)
5. 👤 Test Expert mode — start new game on Expert, verify:
   - Difficulty selector works on menu
   - In-game difficulty label visible
   - AI makes noticeably better discard decisions
   - AI never miscounts (0% error rate)
   - Stats track separately from Normal
   - Resuming a saved Expert game stays on Expert
6. 👤 Invite Shawn to try Expert mode and gather feedback

**Validation criteria**:
- Normal mode win rate unchanged
- Expert mode AI makes correct EV-optimal discards (can verify by checking debug logs)
- No counting errors in Expert mode
- Stats are separate and both display correctly
- Game save/restore preserves difficulty setting

[Back to TOC](#table-of-contents)

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking Normal mode | Extract current AI verbatim — no logic changes to heuristic |
| EV discard too slow | 690 evaluations x microseconds = <10ms. Not a risk. |
| Crib value table inaccurate | Use published values from cribbage literature; refine later |
| Stats migration breaks existing data | Additive columns only — never modify existing columns |
| Expert mode too hard / not hard enough | Tune later with pegging improvements (Phase 2) |

[Back to TOC](#table-of-contents)
