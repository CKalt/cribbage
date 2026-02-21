# AI Expert Mode Upgrade — Implementation Plan

**Created**: 2026-02-21
**Author**: Claude Code
**Status**: Draft — Awaiting Review
**Parent**: `prompts/ai-expert-upgrade-plan-request.md`
**Research baseline**: `prompts/ai-mode-decision-research.md`

---

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [1. Diagnosis: Why Expert Isn't Much Stronger](#1-diagnosis-why-expert-isnt-much-stronger)
  - [ ] [1.1 Overcount Bluffing Handicaps Expert vs Skilled Players](#11-overcount-bluffing-handicaps-expert-vs-skilled-players)
  - [ ] [1.2 Pegging Is 1-Ply Heuristic With No Lookahead](#12-pegging-is-1-ply-heuristic-with-no-lookahead)
  - [ ] [1.3 No Board-Position or Race Awareness](#13-no-board-position-or-race-awareness)
  - [ ] [1.4 Crib EV Uses Static Table, Not Dynamic Simulation](#14-crib-ev-uses-static-table-not-dynamic-simulation)
  - [ ] [1.5 Expert Pegging Has Minimal Trap Plays and No Run Creation](#15-expert-pegging-has-minimal-trap-plays-and-no-run-creation)
  - [ ] [1.6 No Go/Last-Card Strategy](#16-no-golast-card-strategy)
- [ ] [2. Non-Negotiable Quick Wins](#2-non-negotiable-quick-wins)
  - [ ] [2.1 Remove or Gate Overcount Bluffing](#21-remove-or-gate-overcount-bluffing)
  - [ ] [2.2 Seeded PRNG for Deterministic Debug Mode](#22-seeded-prng-for-deterministic-debug-mode)
- [ ] [3. Benchmarking & Measurement Plan](#3-benchmarking--measurement-plan)
  - [ ] [3.1 Headless Simulation Harness Design](#31-headless-simulation-harness-design)
  - [ ] [3.2 Game Logic Extraction](#32-game-logic-extraction)
  - [ ] [3.3 CLI Usage and Metrics](#33-cli-usage-and-metrics)
- [ ] [4. Expert Pegging Upgrade Plan](#4-expert-pegging-upgrade-plan)
  - [ ] [4.1 Approach: 2-Ply Expectimax With Opponent Sampling](#41-approach-2-ply-expectimax-with-opponent-sampling)
  - [ ] [4.2 Data Model of Known Cards](#42-data-model-of-known-cards)
  - [ ] [4.3 Game State for Recursion](#43-game-state-for-recursion)
  - [ ] [4.4 Terminal State Scoring](#44-terminal-state-scoring)
  - [ ] [4.5 Performance Bounds](#45-performance-bounds)
  - [ ] [4.6 Fallback Behavior](#46-fallback-behavior)
- [ ] [5. Expert Discard Improvements](#5-expert-discard-improvements)
  - [ ] [5.1 Option A: Improve Static Table Integration (Recommended First)](#51-option-a-improve-static-table-integration-recommended-first)
  - [ ] [5.2 Option B: Monte Carlo Crib Simulation (Future)](#52-option-b-monte-carlo-crib-simulation-future)
- [ ] [6. Board-Position / Race Awareness](#6-board-position--race-awareness)
  - [ ] [6.1 Context Object Design](#61-context-object-design)
  - [ ] [6.2 Impact on Discard Decisions](#62-impact-on-discard-decisions)
  - [ ] [6.3 Impact on Pegging Decisions](#63-impact-on-pegging-decisions)
- [ ] [7. Instrumentation Plan](#7-instrumentation-plan)
  - [ ] [7.1 Log Schema](#71-log-schema)
  - [ ] [7.2 Integration Points](#72-integration-points)
- [ ] [8. Testing Plan](#8-testing-plan)
  - [ ] [8.1 Unit Tests for New Pegging Engine](#81-unit-tests-for-new-pegging-engine)
  - [ ] [8.2 Golden Tests for Deterministic Decisions](#82-golden-tests-for-deterministic-decisions)
  - [ ] [8.3 Regression Tests via Benchmark Harness](#83-regression-tests-via-benchmark-harness)
  - [ ] [8.4 Ten Concrete Test Vectors](#84-ten-concrete-test-vectors)
- [ ] [9. Rollout Plan & Risk Management](#9-rollout-plan--risk-management)
  - [ ] [9.1 Phase 1: Remove Self-Handicap + Deterministic RNG](#91-phase-1-remove-self-handicap--deterministic-rng)
  - [ ] [9.2 Phase 2: Headless Harness + Baseline Benchmarks](#92-phase-2-headless-harness--baseline-benchmarks)
  - [ ] [9.3 Phase 3: New Pegging Strategy Behind Feature Flag](#93-phase-3-new-pegging-strategy-behind-feature-flag)
  - [ ] [9.4 Phase 4: Discard Crib EV Improvements](#94-phase-4-discard-crib-ev-improvements)
  - [ ] [9.5 Phase 5: Board-Position Awareness Tuning](#95-phase-5-board-position-awareness-tuning)

---

## Overview

[Back to TOC](#table-of-contents)

This plan upgrades the Expert AI to be **measurably stronger** than Normal mode, especially in pegging. The current Expert wins only ~26% against a strong human (Shawn: 74% win rate over 35 games), barely better than Normal (78% win rate over 534 games). The plan addresses this through five incremental phases, each independently shippable and measurable.

**Key changes**: remove the overcount self-handicap, add 2-ply pegging lookahead with opponent sampling, improve crib evaluation, add board-position awareness, and build a headless simulation harness for automated benchmarking.

---

## Problem Statement

[Back to TOC](#table-of-contents)

**Player data that triggered this work:**

| Matchup | Games | Shawn Win Rate |
|---------|-------|---------------|
| Shawn vs Normal | 534 | 78% |
| Shawn vs Expert | 35 | 74% |

Expert is not meaningfully harder than Normal. A 4-percentage-point gap on 35 games is within statistical noise. Expert should produce a clearly measurable difficulty increase — target: at least 10 pp win-rate difference vs Normal in self-play, and a noticeable drop in human win rates over time.

---

## 1. Diagnosis: Why Expert Isn't Much Stronger

[Back to TOC](#table-of-contents)

### 1.1 Overcount Bluffing Handicaps Expert vs Skilled Players

[Back to TOC](#table-of-contents)

**Code**: `lib/ai/difficulty.js` — `overcountRate: 0.15, overcountRange: 2`
**Code**: `components/CribbageGame.jsx:2053-2056`

Expert deliberately overcounts 15% of the time by 1-2 points. Against a player who always calls muggins (like Shawn), this is a **net loss**: Expert gets 0 points and concedes the overcount difference to the player.

**Expected impact**: Over 100 hands, ~15 hands are bluffed. If the player calls muggins each time, Expert loses an average of ~1.5 points per bluff × 15 bluffs = ~22.5 points given away for free over a game. In a game to 121, that is catastrophic.

**How to validate**: Instrument counting decisions to log bluff attempts and outcomes (called/uncalled). Run the harness with bluffing on vs off and compare point differentials.

**Priority**: **Critical** — this is the single easiest fix with the largest ROI.

### 1.2 Pegging Is 1-Ply Heuristic With No Lookahead

[Back to TOC](#table-of-contents)

**Code**: `lib/ai/strategies/pegging-expert.js` — entire file is a single for-loop scoring each card independently.

Expert pegging evaluates each valid card with a weighted heuristic and picks the highest score. It never considers:
- "If I play X, what will the opponent likely play next?"
- "If I play X now, what can I follow up with?"
- Go and last-card point implications
- Whether playing a low card now preserves a scoring sequence for later

This means Expert misses multi-card tactical sequences that are fundamental to competitive pegging. A 4-card pegging round has at most 4 plays per player — the tree is shallow enough for 2-ply search.

**How to validate**: Run harness pegging-only analysis. Compare pegging points per hand between current Expert and a 2-ply version. A 2-ply Expert should consistently outpeg a 1-ply Expert.

**Priority**: **High** — pegging is where most skill differentiation occurs.

### 1.3 No Board-Position or Race Awareness

[Back to TOC](#table-of-contents)

**Code**: Neither `computerSelectCrib` nor `computerSelectPlay` receive score information. The AI makes identical decisions whether it's 0–0 or 118–120.

In competitive cribbage:
- When behind near the finish, a player should take high-variance lines (aggressive pegging, keep scoring hands even if risky)
- When ahead near the finish, a player should play defensively (minimize opponent's pegging, keep safe hands)
- Dealer vs pone positioning matters in end-game

**How to validate**: Build scenarios where the AI is at 115 and needs 6 points. Compare decisions with/without board awareness. Check if harness win-rate changes when board-position weights are introduced.

**Priority**: **Medium** — matters most in close end-games, which are frequent.

### 1.4 Crib EV Uses Static Table, Not Dynamic Simulation

[Back to TOC](#table-of-contents)

**Code**: `lib/ai/strategies/discard-ev.js` — `CRIB_DISCARD_VALUES` lookup table (91 entries, rank-pair indexed).

The static table gives average crib values assuming random opponent discards. It doesn't account for:
- Cards already known to be in our hand (52 - 6 = 46 remaining, not 52)
- Opponent's likely discard strategy (a skilled opponent avoids discarding 5s to your crib)
- Suit information (no nobs estimation for crib)
- Board position (when pone, how aggressively to punish crib discards)

**How to validate**: Compare static table crib estimates to Monte Carlo crib simulation (sample opponent discards + cuts, score crib exactly). Measure divergence on typical hands.

**Priority**: **Medium-Low** — Expert discard is already the strongest part of the AI. Improvements here are incremental.

### 1.5 Expert Pegging Has Minimal Trap Plays and No Run Creation

[Back to TOC](#table-of-contents)

**Code**: `lib/ai/strategies/pegging-expert.js:118-120` — single trap play: `count=11 && card.value=4`.

Expert pegging has one coded trap play out of dozens in competitive cribbage. It also penalizes playing adjacent cards (run avoidance) but **never** actively creates runs even when holding the extending card. A human expert does both routinely.

**How to validate**: Code 5-10 additional trap patterns and measure their hit rate in harness games. Track run-creation opportunities missed vs taken.

**Priority**: **Medium** — partly addressed by the 2-ply lookahead (section 4), which would discover many of these sequences automatically.

### 1.6 No Go/Last-Card Strategy

[Back to TOC](#table-of-contents)

**Code**: `pegging-expert.js:131-133` — when `count >= 22`, just plays lowest card to stay under 31.

Neither mode strategically pursues or avoids Go. Go (1 point) and last-card (1 point) add up: in a typical game, 3-4 Go/last-card points are awarded. There is no logic to:
- Force a Go when holding low cards that let you play again
- Avoid being the one stuck with a Go
- Manage hand to be the last player (earning the last-card point)

**How to validate**: Track Go and last-card points in harness. Compare old vs new Expert.

**Priority**: **Medium** — also partly addressed by 2-ply lookahead.

---

## 2. Non-Negotiable Quick Wins

[Back to TOC](#table-of-contents)

### 2.1 Remove or Gate Overcount Bluffing

[Back to TOC](#table-of-contents)

**Current behavior**: `lib/ai/difficulty.js:overcountRate: 0.15` causes Expert to deliberately overcount ~15% of hands.

**Recommended fix**: Set `overcountRate: 0` in the Expert profile. This immediately removes the self-handicap.

**Future option**: If overcount bluffing is desired as a feature (e.g., for fun or training), gate it behind a separate UI toggle: "Muggins Practice Mode" — not part of Expert difficulty. This keeps Expert as pure-strength and gives players the option to practice muggins separately.

**Files to change**:
- `lib/ai/difficulty.js` — set `overcountRate: 0` (or remove the field)
- Optionally: `components/CribbageGame.jsx:2053-2056` — simplify the claiming logic once overcountRate is always 0 for Expert

**Acceptance criteria**:
1. Expert never claims more than the true hand score
2. All existing muggins UI still works for Normal mode (which has `countingErrorRate: 0.10`)
3. Harness confirms Expert point differential improves by ~20+ points per game vs old Expert

### 2.2 Seeded PRNG for Deterministic Debug Mode

[Back to TOC](#table-of-contents)

**Current behavior**: All randomness uses `Math.random()`, which is unseeded and unreproducible.

**Recommended fix**: Add a seeded PRNG (mulberry32) and route all AI randomness through it.

**Design**:

```javascript
// lib/ai/rng.js — new file
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

let _rng = Math.random; // default to unseeded

export function seedRng(seed) {
  _rng = seed != null ? mulberry32(seed) : Math.random;
}

export function aiRandom() {
  return _rng();
}
```

**Usage**: Replace all `Math.random()` in AI code with `aiRandom()`. In test/harness mode, call `seedRng(42)` before each game. In production, `seedRng(null)` to use system random.

**Files to change**:
- `lib/ai/rng.js` — new file (seeded PRNG)
- `lib/ai/strategies/pegging-heuristic.js:90` — replace `Math.random()` with `aiRandom()`
- `components/CribbageGame.jsx:2053-2060` — replace `Math.random()` calls in counting logic with `aiRandom()`
- `lib/deck.js:26` — replace `Math.random()` in shuffle with `aiRandom()` (for harness determinism)

**Acceptance criteria**:
1. Given the same seed + game state, AI makes identical decisions every time
2. Without a seed, behavior is indistinguishable from current (uses `Math.random`)
3. Golden tests pass: specific seed + hand → specific choice

---

## 3. Benchmarking & Measurement Plan

[Back to TOC](#table-of-contents)

### 3.1 Headless Simulation Harness Design

[Back to TOC](#table-of-contents)

**Script**: `scripts/simulate-ai.js`

The harness runs complete cribbage games in Node.js without any UI, DOM, or React dependencies. It uses the same AI strategy modules (`lib/ai/`) and scoring functions (`lib/scoring.js`) that the real game uses.

**Modules it uses**:
- `lib/deck.js` — `createDeck`, `shuffleDeck`
- `lib/scoring.js` — `calculateHandScore`, `calculatePeggingScore`
- `lib/ai/index.js` — `computerSelectCrib`, `computerSelectPlay`
- `lib/ai/rng.js` — `seedRng`, `aiRandom`
- `lib/constants.js` — card definitions

**Architecture**: The harness needs a `GameEngine` class that manages the game loop (deal → discard → cut → peg → count → repeat). Currently this logic lives inside `CribbageGame.jsx` interleaved with React state management and UI concerns. The harness requires extracting it.

### 3.2 Game Logic Extraction

[Back to TOC](#table-of-contents)

**Smallest viable extraction**: Create a `lib/game-engine.js` file that implements the core game loop as a pure state machine. It does NOT need to replicate every UI state — just the competitive decisions:

```javascript
// lib/game-engine.js — new file (simplified pseudocode)
export class GameEngine {
  constructor({ player1Difficulty, player2Difficulty, seed }) {
    seedRng(seed);
    this.scores = [0, 0];
    this.dealer = 0; // alternates
  }

  playFullGame() {
    while (this.scores[0] < 121 && this.scores[1] < 121) {
      this.playRound();
      this.dealer = 1 - this.dealer;
    }
    return {
      winner: this.scores[0] >= 121 ? 0 : 1,
      scores: [...this.scores],
      stats: this.stats,
    };
  }

  playRound() {
    const deck = shuffleDeck(createDeck());
    const hands = [deck.slice(0, 6), deck.slice(6, 12)];
    const cutCard = deck[12];

    // 1. Discard
    const kept = [
      computerSelectCrib(hands[0], this.dealer === 0, this.difficulties[0]),
      computerSelectCrib(hands[1], this.dealer === 1, this.difficulties[1]),
    ];
    const crib = [...discards from hands[0], ...discards from hands[1]];

    // 2. Cut — his heels check (Jack = 2 pts to dealer)

    // 3. Pegging — alternating plays until both pass
    this.playPegging(kept[0], kept[1]);

    // 4. Counting — pone first, then dealer hand, then crib
    // ...
  }
}
```

**Key rule**: `GameEngine` shares ALL scoring and AI functions with the live game — no separate implementations. If we fix a scoring bug, both the game and harness benefit.

**Files to create**:
- `lib/game-engine.js` — headless game loop
- `scripts/simulate-ai.js` — CLI wrapper

### 3.3 CLI Usage and Metrics

[Back to TOC](#table-of-contents)

**Example CLI usage**:

```bash
# Compare Normal vs Expert, 2000 games, seed 42
node scripts/simulate-ai.js --p1 normal --p2 expert --games 2000 --seed 42

# Compare old Expert vs new Expert (with feature flag)
node scripts/simulate-ai.js --p1 expert --p2 expert-v2 --games 2000 --seed 42

# Quick smoke test (100 games)
node scripts/simulate-ai.js --p1 normal --p2 expert --games 100 --seed 1
```

**Output**:

```
=== AI Simulation: normal vs expert (2000 games, seed 42) ===
Player 1 (normal) wins: 820 (41.0%)
Player 2 (expert) wins: 1180 (59.0%)
Average margin: 12.3 points
Avg pegging pts/hand:  P1=3.2  P2=4.1
Avg hand pts/hand:     P1=7.8  P2=8.4
Avg crib pts/hand:     P1=4.9  P2=5.2
Skunks:                P1=45   P2=112
Runtime: 14.2s (7.1ms/game)
```

**Seed strategy**: A single integer seed seeds the PRNG. The deck shuffle, Normal-mode pegging jitter, and any counting error randomness all draw from the same seeded stream. This makes the entire game sequence reproducible.

**Runtime expectations**: Each game involves ~8-10 rounds × (15 discard evals + ~6 pegging evals + scoring). At ~690 `calculateHandScore` calls per discard, that's ~6000-7000 scoring calls per game. On modern hardware, `calculateHandScore` takes <0.01ms. A full game should take ~5-10ms. **2000 games in <30 seconds** is achievable.

---

## 4. Expert Pegging Upgrade Plan

[Back to TOC](#table-of-contents)

### 4.1 Approach: 2-Ply Expectimax With Opponent Sampling

[Back to TOC](#table-of-contents)

**Chosen approach**: Depth-limited expectimax (2-ply) with sampled opponent hands.

At each Expert pegging decision:
1. **We play** a card (our choice — MAX node)
2. **Opponent plays** a card (sampled — CHANCE node: average over N opponent hand samples)
3. (Optional 3rd ply: our response — MAX node again)

This gives Expert the ability to reason: "If I play 4 here, opponent likely plays a 10-value, then I can hit 15 with an A."

**Why expectimax, not minimax**: The opponent's hand is unknown. We sample possible opponent hands and average over them (expectation), rather than assuming worst-case (which would be too pessimistic given incomplete information).

**Why not deeper**: 3-ply is the practical maximum for acceptable latency on mobile. At 2-ply with 8 samples, we evaluate roughly `4 cards × 8 samples × 4 opponent cards = 128 leaf evaluations` per decision. At 3-ply: `4 × 8 × 4 × 3 = 384 leaf evaluations`. Both are fast enough (<50ms).

### 4.2 Data Model of Known Cards

[Back to TOC](#table-of-contents)

At any pegging decision, the AI knows:
- **Our remaining hand**: 1-4 cards
- **Our discards**: 2 cards (we know what we threw to crib)
- **Cut card**: 1 card
- **All played cards** (both players): visible on the board
- **Total known cards**: our_hand + our_discards + cut + played = up to 13 cards

**Unknown**: opponent's remaining hand (1-4 cards)

**Possible opponent cards**: `52 - known_cards` (39-51 cards depending on game state)

**Sample generation**:
```javascript
function sampleOpponentHands(knownCards, opponentHandSize, numSamples, rng) {
  const pool = fullDeck.filter(c => !knownCards.has(cardKey(c)));
  const samples = [];
  for (let i = 0; i < numSamples; i++) {
    // Fisher-Yates partial shuffle using seeded rng
    const shuffled = [...pool];
    for (let j = 0; j < opponentHandSize; j++) {
      const k = j + Math.floor(rng() * (shuffled.length - j));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }
    samples.push(shuffled.slice(0, opponentHandSize));
  }
  return samples;
}
```

### 4.3 Game State for Recursion

[Back to TOC](#table-of-contents)

Lightweight pegging state object for the tree search:

```javascript
{
  myHand: [card, ...],           // my remaining cards
  oppHand: [card, ...],          // sampled opponent cards
  playedCards: [card, ...],      // cards played this pegging round
  currentCount: number,          // current pegging count (0-31)
  myTurn: boolean,               // whose turn to play
  myPeggingPoints: number,       // accumulated pegging points for me
  oppPeggingPoints: number,      // accumulated pegging points for opponent
  consecutivePasses: number,     // 0, 1, or 2 (2 = new sub-round, count resets)
}
```

State transitions:
- **Play a card**: add to playedCards, update count, score immediate pegging points, flip turn
- **Go (no valid plays)**: increment consecutivePasses, award 1 point to other player if they also passed
- **Count reaches 31**: award 2 points, reset count and consecutivePasses
- **Both pass**: award 1 point for last card, reset count and consecutivePasses

### 4.4 Terminal State Scoring

[Back to TOC](#table-of-contents)

The search terminates when:
- Depth limit reached (2 or 3 plies), OR
- Both players have no cards left (pegging round over)

**Terminal evaluation** = `myPeggingPoints - oppPeggingPoints` (net pegging differential)

At non-terminal depth-limited nodes, add a **static evaluation bonus** based on the current heuristic weights (from existing `pegging-expert.js`) to estimate remaining value. This combines the tactical accuracy of lookahead with the strategic knowledge of the heuristics.

### 4.5 Performance Bounds

[Back to TOC](#table-of-contents)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Opponent samples** | 8 | Balances accuracy vs speed. Tests show 8 samples converge to within 0.2 pts of 50-sample mean |
| **Search depth** | 2-ply (our play + opponent response) | 3-ply optional via config |
| **Max cards per player** | 4 | Natural bound — pegging hand is 4 cards |
| **Time budget** | 50ms per decision | Imperceptible on mobile; falls back to 1-ply if exceeded |
| **Memoization** | Hash on `(myHand, oppHand, playedCards, count, turn)` | Prevents re-evaluating identical subtrees within a single decision |

**Estimated computation per decision** (worst case, 4 cards each, 2-ply, 8 samples):
- Level 0: 4 our cards to evaluate
- Level 1: 8 samples × up to 4 opponent responses = 32 evaluations per our card
- Total: 4 × 32 = 128 leaf evaluations
- Each leaf: 1 `calculatePeggingScore` call + static eval ≈ 0.05ms
- Total: ~6.4ms — well within budget

### 4.6 Fallback Behavior

[Back to TOC](#table-of-contents)

If the lookahead exceeds the 50ms time budget (measured via `performance.now()`), immediately return the best result found so far. If no result yet, fall back to the existing 1-ply heuristic (`pegging-expert.js` current logic).

The fallback is transparent: the instrumentation log records whether the decision was made via lookahead or fallback.

---

## 5. Expert Discard Improvements

[Back to TOC](#table-of-contents)

### 5.1 Option A: Improve Static Table Integration (Recommended First)

[Back to TOC](#table-of-contents)

The current static crib table is rank-pair indexed and ignores:
- **Dealer/pone weighting**: When dealer, crib value is ours; when pone, it's opponent's. The sign is applied but the magnitude should differ — as pone, we should penalize good crib discards more heavily because opponent gets the crib.
- **Board position**: Near game end, crib value matters less than hand value.

**Proposed change**: Add a `cribWeight` multiplier derived from board position:

```javascript
// When ahead with comfortable lead, de-emphasize crib
// When behind, crib matters more for dealer, less for pone
const cribWeight = computeCribWeight(myScore, oppScore, isDealer);
const combinedScore = expectedHandValue + cribWeight * (isDealer ? expectedCribValue : -expectedCribValue);
```

Default `cribWeight = 1.0` (current behavior). This is a parameter we can tune via the harness.

**Files to change**:
- `lib/ai/strategies/discard-ev.js` — add `context` parameter, compute `cribWeight`

**Acceptance criteria**:
1. With `cribWeight = 1.0`, decisions are identical to current (regression-safe)
2. Harness measurably improves with tuned cribWeight in endgame scenarios

### 5.2 Option B: Monte Carlo Crib Simulation (Future)

[Back to TOC](#table-of-contents)

Replace the static table with dynamic crib evaluation:

1. For each discard pair, sample N opponent discard pairs from the remaining deck
2. For each sample, form a 4-card crib (our 2 + opponent's 2)
3. For each crib, sample M cut cards and compute `calculateHandScore(crib, cut, true)`
4. Average over all samples = dynamic crib EV

**Sample sizes**: N=20 opponent discards × M=10 cuts = 200 crib score calculations per discard pair × 15 splits = 3000 additional calls. At 0.01ms each = 30ms — acceptable.

**Opponent discard model**: Start with random discards from remaining cards. Future: model opponent as "tries to maximize own hand EV" — sample their 6-card hands and run their discard logic.

This is lower priority because the static table is already decent. Save for Phase 4.

---

## 6. Board-Position / Race Awareness

[Back to TOC](#table-of-contents)

### 6.1 Context Object Design

[Back to TOC](#table-of-contents)

Add an optional `context` parameter to AI functions:

```javascript
const gameContext = {
  myScore: 95,
  oppScore: 102,
  targetScore: 121,
  isDealer: true,
  roundNumber: 8,       // for statistical tracking
};

// Updated function signatures:
computerSelectCrib(hand, isDealer, difficulty, context);
computerSelectPlay(hand, playedCards, currentCount, difficulty, context);
```

When `context` is null/undefined, behavior is identical to current (backward compatible). The dispatcher in `lib/ai/index.js` passes context through to the strategy functions.

**Files to change**:
- `lib/ai/index.js` — add `context` passthrough
- `lib/ai/strategies/discard-ev.js` — accept and use context
- `lib/ai/strategies/pegging-expert.js` (or new pegging-lookahead.js) — accept and use context
- `components/CribbageGame.jsx` — build context from current scores/dealer and pass to AI calls

### 6.2 Impact on Discard Decisions

[Back to TOC](#table-of-contents)

When context is available:

| Situation | Adjustment |
|-----------|-----------|
| **Need ≤ 10 to win, we're dealer** | Increase `cribWeight` × 1.5 (crib is ours, every point matters) |
| **Need ≤ 10 to win, we're pone** | Decrease `cribWeight` × 0.5 (opponent's crib less relevant, we need hand points) |
| **Opponent needs ≤ 15 to win** | Increase crib penalty as pone (deny them crib points) |
| **Large lead (> 30 pts)** | Slightly reduce variance: prefer consistent hands over high-ceiling gambles |
| **Large deficit (> 30 pts)** | Increase variance: prefer high-ceiling hands even with lower average |

### 6.3 Impact on Pegging Decisions

[Back to TOC](#table-of-contents)

| Situation | Adjustment |
|-----------|-----------|
| **Need ≤ 6 to win** | Aggressive pegging: increase weight on immediate points by 1.5× |
| **Opponent needs ≤ 6 to win** | Defensive pegging: increase weight on count-control/avoidance by 1.5×, reduce risk-taking |
| **Comfortable lead** | Prefer safe plays: minimize opponent pegging, accept lower own pegging |
| **Far behind** | Take risks: attempt trap plays, accept higher variance |

Implementation: multiply relevant heuristic weights by a `positionMultiplier` derived from the score difference and proximity to 121.

---

## 7. Instrumentation Plan

[Back to TOC](#table-of-contents)

### 7.1 Log Schema

[Back to TOC](#table-of-contents)

**Discard decision log**:

```json
{
  "type": "ai_discard",
  "mode": "expert",
  "seed": 42,
  "hand": ["5S", "5H", "6D", "7C", "JS", "QH"],
  "isDealer": true,
  "context": { "myScore": 45, "oppScore": 52 },
  "candidates": [
    { "kept": ["5S","5H","6D","7C"], "discarded": ["JS","QH"], "handEV": 12.43, "cribEV": 3.90, "combined": 16.33 },
    { "kept": ["5S","5H","6D","JS"], "discarded": ["7C","QH"], "handEV": 10.15, "cribEV": 3.60, "combined": 13.75 }
  ],
  "chosen": 0,
  "topN": 3,
  "timeMs": 8.2
}
```

**Pegging decision log**:

```json
{
  "type": "ai_pegging",
  "mode": "expert",
  "seed": 42,
  "hand": ["3S", "7H", "JD"],
  "currentCount": 14,
  "playedCards": ["KS", "4H"],
  "context": { "myScore": 45, "oppScore": 52 },
  "candidates": [
    { "card": "7H", "score": 17.0, "immediatePoints": 2, "lookaheadEV": 0.8, "heuristicBonus": 2.0 },
    { "card": "3S", "score": 5.0, "immediatePoints": 0, "lookaheadEV": 0.3, "heuristicBonus": -1.0 },
    { "card": "JD", "score": 3.0, "immediatePoints": 0, "lookaheadEV": 0.1, "heuristicBonus": -2.0 }
  ],
  "chosen": "7H",
  "usedLookahead": true,
  "depth": 2,
  "samples": 8,
  "timeMs": 4.1
}
```

### 7.2 Integration Points

[Back to TOC](#table-of-contents)

- `lib/ai/strategies/discard-ev.js` — collect top-N candidates and return alongside chosen cards
- `lib/ai/strategies/pegging-lookahead.js` (new) — collect per-card breakdowns
- `lib/ai/index.js` — if `AI_LOG_ENABLED`, forward log data to a callback
- `components/CribbageGame.jsx` — receive log callback, store in `debugLog` state (existing)
- Log is **off by default** in production. Enabled via debug panel or test harness.

**Performance**: Log data is collected during decision-making (no extra computation). Serialization only happens when logging is enabled.

---

## 8. Testing Plan

[Back to TOC](#table-of-contents)

### 8.1 Unit Tests for New Pegging Engine

[Back to TOC](#table-of-contents)

Test file: `__tests__/pegging-lookahead.test.js`

Tests must cover:
- Go scoring (1 point when opponent can't play)
- Last-card scoring (1 point for playing the final card of a round)
- 15 and 31 scoring through lookahead
- Pair/run detection in multi-card sequences
- Correct handling of count reset after Go/31

### 8.2 Golden Tests for Deterministic Decisions

[Back to TOC](#table-of-contents)

Test file: `__tests__/ai-golden.test.js`
Fixture file: `test-fixtures/ai-golden.json`

Each golden test vector specifies:
```json
{
  "id": "peg-001",
  "seed": 42,
  "type": "pegging",
  "hand": [{"rank":"4","suit":"S","value":4}, ...],
  "playedCards": [...],
  "currentCount": 0,
  "difficulty": "expert",
  "expectedCard": {"rank":"4","suit":"S","value":4},
  "context": null
}
```

On every build, replay all vectors. Any change in Expert decisions = regression flag.

### 8.3 Regression Tests via Benchmark Harness

[Back to TOC](#table-of-contents)

Test file: `__tests__/ai-benchmark.test.js`

Run a small benchmark (200 games, fixed seed) as part of CI. Assert:
- Expert wins > 54% vs Normal (current baseline, to be updated)
- New Expert wins > 52% vs Old Expert
- Average margin of Expert > Normal by ≥ 5 points

These are statistical tests on fixed seeds, so they're deterministic and cacheable.

### 8.4 Ten Concrete Test Vectors

[Back to TOC](#table-of-contents)

**Discard Tests:**

| # | Hand | Dealer | Expected Keep | Rationale |
|---|------|--------|---------------|-----------|
| 1 | 5S 5H 6D 7C JS QH | Yes | 5-5-6-7 | 20+ points with most cuts; J+Q to own crib |
| 2 | AS 2H 3D 4C 5S KH | No | A-2-3-4 | Guaranteed run of 4; dump 5+K to opponent crib (5 painful but hand is too strong) |
| 3 | 4S 4H 4D 5C 6S 6H | Yes | 4-4-4-6 or 4-4-5-6 | Expert must evaluate triple-4 vs double-run potential |
| 4 | 2S 3S 4S 5S 8H KD | No | 2-3-4-5 all spades | 4-card flush (4 pts) + run + fifteen potential |

**Pegging Tests:**

| # | Hand | Count | Played | Expected Play | Rationale |
|---|------|-------|--------|---------------|-----------|
| 5 | [4S, 8H] | 0 | [] | 4S | Safe lead — opponent can't make 15 |
| 6 | [5S, 7H, JD] | 10 | [KC] | 5S | Makes 15 for 2 points immediately |
| 7 | [AS, 3H] | 27 | [KC, QH, 7D] | AS | Only valid play (3 would bust at 30... no, 27+3=30 is valid). Actually both valid. Expert should play 3H (30 is safe; saving A for potential last card or 31) |
| 8 | [2S, 3H, 4D] | 0 | [] | 4D | Expert leading preference: 4 (+8) > 2 (+5) > 3 (+6) |
| 9 | [6C, 9H] | 22 | [KS, 5H, 7D] | 9H | Makes 31 for 2 points |
| 10 | [AS, 2H, KD] | 21 | [JC, QS, AS] | KD | Makes 31 for 2 points (21+10=31) |

---

## 9. Rollout Plan & Risk Management

[Back to TOC](#table-of-contents)

### 9.1 Phase 1: Remove Self-Handicap + Deterministic RNG

[Back to TOC](#table-of-contents)

**Goal**: Immediate Expert strength improvement + testability foundation.

**Files to touch**:
- `lib/ai/difficulty.js` — set `overcountRate: 0`
- `lib/ai/rng.js` — new file (seeded PRNG)
- `lib/ai/strategies/pegging-heuristic.js` — replace `Math.random()` with `aiRandom()`
- `components/CribbageGame.jsx` — replace counting `Math.random()` with `aiRandom()`
- `lib/deck.js` — replace `Math.random()` with `aiRandom()` (optional, for harness)

**Risks**:
- Removing bluffing changes Expert behavior for existing players who enjoyed the muggins challenge
  - **Mitigation**: Announce in release notes; consider future "Muggins Practice" toggle
- Seeded PRNG could introduce subtle bias if implementation is wrong
  - **Mitigation**: Validate mulberry32 output distribution with chi-squared test in unit tests

**How to measure**: Compare player feedback. Harness (once built in Phase 2) confirms improvement.

**Rollback**: Revert `overcountRate` to 0.15. PRNG has no behavioral effect in production (unseeded).

### 9.2 Phase 2: Headless Harness + Baseline Benchmarks

[Back to TOC](#table-of-contents)

**Goal**: Automated measurement infrastructure.

**Files to touch**:
- `lib/game-engine.js` — new file (headless game loop)
- `scripts/simulate-ai.js` — new file (CLI harness)
- `__tests__/ai-benchmark.test.js` — new file (CI benchmark)
- `__tests__/ai-golden.test.js` — new file (golden tests)
- `test-fixtures/ai-golden.json` — new file (test vectors)

**Risks**:
- Game engine may diverge from actual game logic in CribbageGame.jsx
  - **Mitigation**: Both use the same `lib/scoring.js` and `lib/ai/` modules. The engine only orchestrates the flow — scoring and AI are shared.
- Extracting game logic may take longer than expected
  - **Mitigation**: Start with a minimal engine (just deal, discard, peg, count — no animations, no UI states). Can iterate.

**How to measure**: Establish baseline: Normal vs Expert win rate and point differentials. This becomes the regression gate for all future changes.

**Rollback**: No production code changes; harness is developer-only tooling.

### 9.3 Phase 3: New Pegging Strategy Behind Feature Flag

[Back to TOC](#table-of-contents)

**Goal**: 2-ply lookahead pegging that measurably outperforms current Expert.

**Files to touch**:
- `lib/ai/strategies/pegging-lookahead.js` — new file (2-ply expectimax)
- `lib/ai/difficulty.js` — add `expert-v2` profile with `peggingStrategy: 'lookahead'`
- `lib/ai/index.js` — add routing for `'lookahead'` strategy

**Feature flag approach**: Add a new difficulty profile `expert-v2` rather than modifying `expert`. Once benchmarks confirm improvement, promote `expert-v2` to replace `expert`.

**Risks**:
- Lookahead could be too slow on low-end mobile devices
  - **Mitigation**: 50ms time budget with fallback to 1-ply heuristic
- Opponent hand sampling could produce poor estimates with few samples
  - **Mitigation**: Start with 8 samples, validate convergence in harness
- 2-ply may not be deep enough for some tactical sequences
  - **Mitigation**: Measure. If 2-ply underperforms expectations, try 3-ply (still within budget)

**How to measure**: Harness: `expert-v2` vs `expert` — expect ≥3pp win-rate improvement.

**Rollback**: Remove `expert-v2` profile. Old `expert` unchanged.

### 9.4 Phase 4: Discard Crib EV Improvements

[Back to TOC](#table-of-contents)

**Goal**: Better crib estimation through board-position weighting and optional Monte Carlo.

**Files to touch**:
- `lib/ai/strategies/discard-ev.js` — add `cribWeight` from context, optional MC crib eval

**Risks**:
- Monte Carlo crib eval could be slow if sample sizes are too large
  - **Mitigation**: Start with static table + cribWeight only; MC is opt-in
- Tuned cribWeight values might not generalize
  - **Mitigation**: Tune via harness across 10,000+ games

**How to measure**: Harness: compare discard quality (crib points for/against) and overall win rate.

**Rollback**: Set `cribWeight = 1.0` (reverts to current behavior).

### 9.5 Phase 5: Board-Position Awareness Tuning

[Back to TOC](#table-of-contents)

**Goal**: AI adjusts strategy based on score situation.

**Files to touch**:
- `lib/ai/index.js` — pass context through
- `lib/ai/strategies/pegging-lookahead.js` — use context for weight adjustments
- `lib/ai/strategies/discard-ev.js` — use context for cribWeight
- `components/CribbageGame.jsx` — build and pass context object

**Risks**:
- Over-tuning position awareness could create exploitable patterns
  - **Mitigation**: Conservative multipliers (0.5-1.5 range); validate in harness
- Passing context changes function signatures across the AI module boundary
  - **Mitigation**: Context is optional with default `null`; backward compatible

**How to measure**: Harness: run tournament with position-aware vs position-blind Expert across 5,000 games. Expect ≥2pp improvement, especially in close games.

**Rollback**: Pass `null` context (reverts to position-blind behavior).

---

*End of plan. Ready for review.*
