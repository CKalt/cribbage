# Research: Improved AI Expert Mode for Cribbage

**Created**: 2026-02-18
**Author**: Claude Code
**Status**: Research Complete
**Requested by**: `prompts/improved-ai-expert-mode-research-request.md`

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [1. Current AI Baseline Analysis](#1-current-ai-baseline-analysis)
  - [1.1 Discard Logic](#11-discard-logic)
  - [1.2 Pegging Logic](#12-pegging-logic)
  - [1.3 Counting Logic](#13-counting-logic)
  - [1.4 Summary of Weaknesses](#14-summary-of-weaknesses)
- [2. Cribbage AI Strategy Improvements](#2-cribbage-ai-strategy-improvements)
  - [2.1 Discard Optimization via Expected Value](#21-discard-optimization-via-expected-value)
  - [2.2 Pegging Strategy Improvements](#22-pegging-strategy-improvements)
  - [2.3 Endgame Board-Position Strategy](#23-endgame-board-position-strategy)
  - [2.4 Card-Counting Approximation](#24-card-counting-approximation)
  - [2.5 Risk-Adjusted Play Models](#25-risk-adjusted-play-models)
- [3. Difficulty Scaling Models](#3-difficulty-scaling-models)
  - [3.1 Fixed Difficulty Tiers](#31-fixed-difficulty-tiers)
  - [3.2 Adaptive AI (ELO-like)](#32-adaptive-ai-elo-like)
  - [3.3 Player Opt-In Escalation](#33-player-opt-in-escalation)
  - [3.4 Psychological Considerations](#34-psychological-considerations)
- [4. Protecting Existing High-Skill Users](#4-protecting-existing-high-skill-users)
  - [4.1 Best Practices for Introducing Difficulty Modes](#41-best-practices-for-introducing-difficulty-modes)
  - [4.2 Avoiding Discouragement and Trust Erosion](#42-avoiding-discouragement-and-trust-erosion)
  - [4.3 Recognition Systems](#43-recognition-systems)
  - [4.4 Founding Player Approach](#44-founding-player-approach)
- [5. Architectural Considerations](#5-architectural-considerations)
  - [5.1 Modularizing AI for Tiered Difficulty](#51-modularizing-ai-for-tiered-difficulty)
  - [5.2 Feature Flags for Experimentation](#52-feature-flags-for-experimentation)
  - [5.3 Logging and Evaluation Data](#53-logging-and-evaluation-data)
- [6. SKnowball Integration Potential](#6-sknowball-integration-potential)
  - [6.1 Identity](#61-identity)
  - [6.2 Skill Tiers](#62-skill-tiers)
  - [6.3 Cross-Node Reputation](#63-cross-node-reputation)
  - [6.4 Lightweight Social Signaling](#64-lightweight-social-signaling)
- [7. Recommended Phasing](#7-recommended-phasing)
- [Sources](#sources)

---

## Overview

This document explores how to evolve the current single-player AI in the Cribbage application into a transparent "Expert Mode" difficulty tier. The research covers concrete AI strategy improvements grounded in the actual codebase (`lib/ai.js`, `lib/scoring.js`, `components/CribbageGame.jsx`), difficulty scaling models used by commercial cribbage apps, user psychology around difficulty changes, and architectural patterns to support tiered AI without disrupting the existing player base.

[Back to TOC](#table-of-contents)

---

## Problem Statement

A highly engaged user has logged 400+ wins with a ~78% win rate against the current AI. This signals two things: (1) the AI provides enough challenge to keep the player engaged over hundreds of games, and (2) the AI is meaningfully beatable by a skilled player. The goal is to offer an optional harder opponent without secretly changing the existing difficulty, eroding trust, or discouraging the player base that enjoys the current balance.

The current AI (`lib/ai.js`) uses simple heuristic scoring with no lookahead, no card memory, and no board-position awareness. There is substantial room to create a genuinely stronger opponent through well-understood cribbage strategy improvements.

[Back to TOC](#table-of-contents)

---

## 1. Current AI Baseline Analysis

### 1.1 Discard Logic

**File**: `lib/ai.js`, function `computerSelectCrib(hand, isDealer)` (lines 13-85)

The current approach evaluates all 15 possible 4-card kept hands from 6 dealt cards and scores each using a lightweight heuristic:

| Factor | Weight | Notes |
|--------|--------|-------|
| Two-card fifteens | +2 each | Only checks pairs, misses 3+ card combos |
| Pairs (matching ranks) | +2 each | Correct |
| Run potential | +1 per "close" card | Counts cards within 2 ranks of each other — imprecise |
| 5s in kept hand | +2 each | Values 5s for their fifteen-making ability |
| 5s discarded to opponent crib | -2 | Avoids giving opponent easy points |
| Face cards discarded to opponent | -1 | Mild penalty |

**Key weaknesses**:
- **No expected value calculation across all 46 possible cut cards.** The heuristic evaluates the kept hand in isolation without considering what the cut card might contribute. This is the single biggest gap — expert cribbage players always consider "average hand" value.
- **Run detection is approximate**, counting adjacent-rank proximity rather than actual runs.
- **No flush consideration** — flushes are worth 4-5 points and are completely ignored.
- **No nobs consideration** — holding a Jack matching the cut suit is worth 1 point.
- **Crib discard evaluation is primitive** — only penalizes 5s and face cards rather than evaluating expected crib value of the discard pair.

### 1.2 Pegging Logic

**File**: `lib/ai.js`, function `computerSelectPlay(hand, playedCards, currentCount)` (lines 95-180)

The pegging AI scores each playable card on a weighted heuristic:

| Strategy | Implementation | Quality |
|----------|---------------|---------|
| Immediate scoring | Simulates the play and scores 15s, 31s, pairs, runs via `calculatePeggingScore()` | Good — uses the real scoring engine |
| Leading (count=0) | Avoids 5s (-15), prefers low cards (+5), special bonus for 4 (+3) | Reasonable |
| Response play | Penalizes leaving count at 5 or 10 (-8 to -10), avoids 21 (-6) | Reasonable |
| Pair awareness | Rewards making pairs (+5), penalizes adjacent cards (-2) | Basic |
| Endgame | Saves aces for late play (-3 early) | Basic |
| Randomization | +0 to +0.5 random noise | Too small to matter |

**Key weaknesses**:
- **Zero lookahead.** The AI evaluates each card in isolation without considering what the opponent might play next. A single-ply minimax would catch many missed opportunities and traps.
- **No card tracking.** The AI doesn't remember which cards have been played in the hand, so it can't narrow down what the opponent might hold.
- **No trap plays.** Expert pegging involves playing cards that look safe but set up scoring combinations on the next play. The current AI only reacts.
- **Fixed heuristic weights.** The weights were hand-tuned and never validated against actual play data.

### 1.3 Counting Logic

**File**: `components/CribbageGame.jsx`, function `computerCounts()` (lines 1911-1977)

The computer always calculates the correct score via `calculateHandScore()` but introduces deliberate errors:

```
10% chance of error when score > 0
Error is always exactly +2 or -2 (50/50)
```

This creates the muggins mechanic where attentive players can catch the computer's "mistakes." The scoring engine itself (`lib/scoring.js`) correctly handles fifteens, pairs, runs, flushes, and nobs.

### 1.4 Summary of Weaknesses

| Area | Current Level | Expert Target | Gap |
|------|--------------|---------------|-----|
| Discard selection | Heuristic (no EV) | Expected value over all cuts | **Large** |
| Pegging play | 0-ply heuristic | 2-3 ply minimax with card tracking | **Large** |
| Counting errors | Fixed 10%, always ±2 | Configurable per difficulty | Small |
| Board position | None | Position-aware strategy | **Large** |
| Card memory | None | Track played cards | Medium |

[Back to TOC](#table-of-contents)

---

## 2. Cribbage AI Strategy Improvements

### 2.1 Discard Optimization via Expected Value

This is the highest-impact improvement. The idea: for each possible 4-card keep, iterate over all 46 remaining cards as potential cut cards and compute the average hand score. Choose the keep with the highest expected value.

**Implementation approach**:

```
For each of 15 possible (keep4, discard2) splits:
    totalScore = 0
    for each of 46 possible cut cards:
        totalScore += calculateHandScore(keep4, cutCard, isCrib=false)
    expectedHandValue = totalScore / 46

    // Also estimate expected crib contribution
    expectedCribValue = estimateCribValue(discard2, isDealer)

    combinedScore = expectedHandValue + (isDealer ? expectedCribValue : -expectedCribValue)
```

**Computational cost**: 15 keeps x 46 cuts = 690 hand evaluations per discard decision. The existing `calculateHandScore` runs in microseconds, so this is trivially fast for a web app — no precomputation needed.

**Crib value estimation** is harder because it depends on the opponent's discards (which are unknown). Two practical approaches:

1. **Static discard tables**: Precompute the average crib contribution for every possible 2-card discard pair. There are only C(13,2) = 78 rank combinations (ignoring suits). These tables are well-documented in cribbage literature and can be hardcoded. For example, discarding 5-5 to your own crib averages ~8.5 points, while discarding K-10 averages ~2.5 points.

2. **Monte Carlo sampling**: Randomly sample 100-200 possible opponent discards from the remaining 46 cards, compute crib scores for each, and average. More accurate than static tables but slower. At 200 samples x 46 cuts = 9,200 evaluations — still fast enough for real-time play.

**Expected improvement**: This single change would likely raise the AI's average hand score by 1-2 points per hand, a substantial improvement over ~26 hands per game.

### 2.2 Pegging Strategy Improvements

Pegging is where games are won and lost at the expert level. Three graduated improvements:

**Level 1 — Card tracking** (medium effort, high value):
Track which cards have been played in the current hand. This lets the AI:
- Know which ranks the opponent cannot hold
- Estimate the probability of the opponent having specific cards
- Make informed decisions about trap plays vs. safe plays

Implementation: maintain a `Set` of played card ranks during pegging, pass it to `computerSelectPlay()`.

**Level 2 — Single-ply lookahead** (medium effort, high value):
For each candidate play, simulate the opponent's best response and evaluate the resulting position. This catches cases where an apparently good play (e.g., making 15 for 2 points) sets up a devastating opponent response (e.g., a run of 4 for 4 points).

```
For each valid card c:
    myScore = immediatePoints(c)
    newCount = currentCount + c.value

    // Simulate opponent's best response
    opponentBestResponse = 0
    for each possible opponent card o:
        if newCount + o.value <= 31:
            opponentScore = immediatePoints(o, after c)
            opponentBestResponse = max(opponentBestResponse, opponentScore)

    netScore = myScore - opponentBestResponse * 0.7  // Discount uncertain opponent cards
    evaluate c based on netScore
```

**Level 3 — Multi-ply minimax** (high effort, highest value):
Full minimax with alpha-beta pruning over the remaining pegging plays. Since each player has at most 4 cards, the game tree is small (max ~4! x 4! = 576 leaf nodes per pegging round). This is entirely feasible in real-time.

With card tracking from Level 1, the AI can prune the opponent's possible hands and search much more efficiently.

### 2.3 Endgame Board-Position Strategy

In cribbage, position on the board (relative to 121) changes optimal strategy dramatically. Examples:

- **Ahead by 20+ points**: Play conservatively during pegging. Keep high-value hands even if it means giving the opponent good crib cards. The goal is to avoid giving the opponent pegging points while maintaining safe hand scoring.
- **Behind by 20+ points**: Play aggressively during pegging. Sacrifice hand value for pegging opportunity. Lead with trap cards. Challenge every count.
- **Both near 121**: Every point matters. Calculate whether opponent can win on their next count. If so, play for maximum pegging points.
- **"Pone position" advantage**: When you're the pone (non-dealer), you count first. If your hand + likely pegging gets you to 121, you win regardless of the dealer's hand. The AI should recognize this.

**Implementation**: Add a `boardPositionModifier(playerScore, computerScore, dealer)` function that adjusts the weights in both discard and pegging decisions. This function would return a strategy profile (conservative/neutral/aggressive) that scales the existing heuristic weights.

### 2.4 Card-Counting Approximation

Full card counting in cribbage means tracking all 12 played cards (6 in each hand minus the 4 kept, plus the cut card) to narrow down what the opponent might hold. In practice:

- **During pegging**: Track which cards each player has played. After pegging, you've seen 8 cards (4 from each player). Combined with the cut card and your own discards, you know 10 of 52 cards.
- **During discard**: You know your 6 cards. The cut card hasn't been revealed yet. Limited inference is possible (e.g., if you hold three 5s, the opponent is unlikely to have the fourth).

**Practical implementation**: Rather than full probabilistic inference, a "soft tracking" approach works well:

```javascript
// Track cards seen this hand
const seenCards = new Set(); // ranks+suits of all cards seen
const unknownCards = fullDeck.filter(c => !seenCards.has(c.id));

// Estimate probability opponent holds a specific rank
function probOpponentHas(rank) {
    const remaining = unknownCards.filter(c => c.rank === rank);
    const unknownToOpponent = unknownCards.length - myUnplayedCards.length;
    return remaining.length / unknownToOpponent;
}
```

This feeds directly into pegging lookahead (weight opponent responses by probability) and into discard decisions (estimate crib value based on what opponent is likely to discard).

### 2.5 Risk-Adjusted Play Models

Expert cribbage strategy is inherently risk-aware. The AI should model risk differently based on game state:

| Situation | Risk Preference | Example |
|-----------|----------------|---------|
| Comfortable lead | Risk-averse | Keep safe 8-point hand over risky 12-point speculative hand |
| Behind, mid-game | Risk-neutral | Evaluate purely on expected value |
| Behind, late game | Risk-seeking | Chase the speculative hand; sacrifice pegging defense |
| Opponent near 121 | Risk-seeking in pegging | Play aggressive trap cards to score before they count |

**Implementation**: A `riskMultiplier` applied to the variance of expected outcomes. Risk-averse play prefers the option with higher floor (minimum) score. Risk-seeking play prefers the option with higher ceiling (maximum) score.

```javascript
function adjustedScore(expectedValue, minValue, maxValue, riskProfile) {
    if (riskProfile === 'averse') return expectedValue * 0.6 + minValue * 0.4;
    if (riskProfile === 'seeking') return expectedValue * 0.6 + maxValue * 0.4;
    return expectedValue; // neutral
}
```

[Back to TOC](#table-of-contents)

---

## 3. Difficulty Scaling Models

### 3.1 Fixed Difficulty Tiers

The most common approach in commercial cribbage apps (Cribbage Pro, Cribbage Classic, Solitaired). Cards are always dealt randomly — the difficulty change is purely in the AI's decision-making quality.

**Recommended tier structure**:

| Tier | Discard | Pegging | Counting Errors | Board Awareness |
|------|---------|---------|-----------------|-----------------|
| **Normal** (current) | Heuristic | 0-ply heuristic | 10% (±2) | None |
| **Hard** | Expected value (hand only) | 1-ply lookahead + card tracking | 5% (±2) | Basic |
| **Expert** | Full EV (hand + crib) | 2-ply minimax + card tracking | 0% | Full position play |

**Key design principle from Cribbage Pro and Cribbage Classic**: The difference in difficulty is the amount of computation the AI performs — never the card distribution. Players who suspect rigged dealing will leave immediately.

### 3.2 Adaptive AI (ELO-like)

An alternative to fixed tiers: the AI continuously adjusts its strength based on the player's performance.

**How it works**:
- Assign the player an internal rating (starting at 1000)
- After each game, adjust rating based on win/loss and margin
- Map rating ranges to AI parameter sets (blending between tiers)

**Pros**: No player action needed; difficulty automatically fits skill level.

**Cons**: Players may feel manipulated. A 78% win rate player who suddenly starts losing will suspect the game changed even if they opted in. This model is particularly risky for an app where trust has already been established.

**Recommendation**: Avoid pure adaptive AI. If used at all, combine it with explicit tiers — use adaptive within a chosen tier to fine-tune, not to silently change difficulty.

### 3.3 Player Opt-In Escalation

A hybrid approach: the game tracks performance and **invites** the player to try a harder mode when they qualify.

```
After 50 wins at 70%+ win rate:
  "You've mastered Normal mode! Ready for a new challenge? Try Hard mode."
  [Try Hard Mode]  [Not Yet]
```

**Benefits**:
- Completely transparent — the player chooses
- Creates a sense of progression and achievement
- The invitation itself is a form of recognition
- Players who decline don't feel pressured

**Implementation**: Track `wins_at_difficulty`, `win_rate_at_difficulty`. When thresholds are met, show a one-time prompt. Store the player's response so it's not repeated.

### 3.4 Psychological Considerations

Research on game difficulty and player retention reveals several patterns relevant to this situation:

1. **Loss aversion is 2x stronger than gain satisfaction.** A player who goes from 78% to 50% win rate will feel the losses more intensely than they enjoyed the wins. The transition must be gradual and voluntary.

2. **Separate leaderboards per difficulty prevent demoralization.** A player who is #1 on Normal should not see their rank drop because Expert-mode players have higher scores.

3. **The "sunk cost" of 400+ wins matters.** This player has invested heavily. Any change that devalues that investment (e.g., labeling Normal mode as "Easy") will feel insulting.

4. **Frame difficulty as "new content," not "the real game."** Expert mode should feel like an expansion, not a correction. Language matters:
   - Good: "Expert Mode: A new challenge for experienced players"
   - Bad: "You've been playing on Easy. Try the real game."

5. **Immediate feedback reduces frustration.** If the Expert AI makes a brilliant play, show *why* it was brilliant. Players learn from losses when the game explains its reasoning.

[Back to TOC](#table-of-contents)

---

## 4. Protecting Existing High-Skill Users

### 4.1 Best Practices for Introducing Difficulty Modes

1. **Never rename the current difficulty.** The current mode should remain "Normal" or gain a neutral name like "Classic." Avoid retroactively labeling it "Easy" or "Beginner."

2. **Preserve all existing statistics.** Wins, losses, and leaderboard position for the current difficulty must not change or be affected by the introduction of new modes.

3. **Make it additive.** Expert Mode adds a new track alongside the existing one. It does not replace or deprecate anything.

4. **Launch quietly.** Add the mode without fanfare. Let players discover it or announce it as "new content available." Avoid language that implies the old mode was insufficient.

### 4.2 Avoiding Discouragement and Trust Erosion

The 78% win rate player has a mental model: "I'm good at cribbage and this game respects my skill." Anything that contradicts this will erode trust.

**Critical rules**:
- **Never change Normal mode behavior.** Not even slightly. The AI's discard, pegging, and error rates must remain identical.
- **Never secretly mix difficulties.** If the player selects Normal, they get Normal. Always.
- **Show the difficulty label in-game.** A small indicator (e.g., "Normal" or "Expert" near the top) reassures the player that they're in the mode they chose.
- **Separate stats per difficulty.** The player's 400+ win record is sacred. Expert mode starts its own counter.

### 4.3 Recognition Systems

High-engagement users should be recognized, not just retained. Recognition ideas:

| Recognition | Implementation | Cost |
|-------------|---------------|------|
| **Win milestone badges** | "100 Wins", "250 Wins", "500 Wins" icons on profile | Low |
| **Win streak badge** | "Best streak: 12 games" displayed on leaderboard | Low |
| **Difficulty pioneer badge** | First player to reach X wins on Expert | Low |
| **Leaderboard per difficulty** | Separate rankings for Normal vs Expert | Medium |
| **Season tracking** | Monthly win rate comparisons | Medium |

### 4.4 Founding Player Approach

For the first users who have been playing since early development:

1. **"Founding Player" badge** — visible on their profile and leaderboard entry. This can never be earned again after launch.

2. **Early access to Expert Mode** — Offer it to them first as beta testers. "You're one of our most experienced players. We'd love your feedback on a harder AI."

3. **Permanent leaderboard recognition** — A "Hall of Fame" or "Founders" section that preserves their early achievements regardless of future difficulty modes.

4. **Feedback channel** — Give founding players a direct way to report how Expert Mode feels (the existing bug report system works perfectly for this).

[Back to TOC](#table-of-contents)

---

## 5. Architectural Considerations

### 5.1 Modularizing AI for Tiered Difficulty

The current AI lives in a single file (`lib/ai.js`) with two exported functions. The refactor:

```
lib/
  ai/
    index.js              — Exports difficulty-selected AI functions
    strategies/
      discard-heuristic.js    — Current Normal mode discard (extracted)
      discard-ev.js           — Expected value discard for Hard/Expert
      pegging-heuristic.js    — Current Normal mode pegging (extracted)
      pegging-lookahead.js    — Lookahead pegging for Hard/Expert
      board-position.js       — Position-aware strategy modifiers
      card-tracker.js         — Tracks played cards during a hand
    difficulty.js         — Difficulty tier definitions and parameter sets
```

**Difficulty parameter object**:

```javascript
const DIFFICULTY_PROFILES = {
  normal: {
    discardStrategy: 'heuristic',
    peggingStrategy: 'heuristic',
    peggingLookahead: 0,
    countingErrorRate: 0.10,
    countingErrorRange: 2,
    boardPositionAware: false,
    cardTracking: false,
  },
  hard: {
    discardStrategy: 'expected-value-hand',
    peggingStrategy: 'lookahead',
    peggingLookahead: 1,
    countingErrorRate: 0.05,
    countingErrorRange: 2,
    boardPositionAware: true,
    cardTracking: true,
  },
  expert: {
    discardStrategy: 'expected-value-full',
    peggingStrategy: 'minimax',
    peggingLookahead: 2,
    countingErrorRate: 0.0,
    countingErrorRange: 0,
    boardPositionAware: true,
    cardTracking: true,
  },
};
```

The game component would receive the difficulty profile and pass it to AI functions:

```javascript
const aiProfile = DIFFICULTY_PROFILES[userDifficulty];
const discards = computerSelectCrib(hand, isDealer, aiProfile);
const play = computerSelectPlay(hand, playedCards, currentCount, aiProfile);
```

### 5.2 Feature Flags for Experimentation

Use a simple feature flag system for gradual rollout:

```javascript
// lib/features.js
export const FEATURES = {
  EXPERT_MODE_ENABLED: true,           // Show difficulty selector
  EXPERT_MODE_USERS: ['*'],            // '*' = all, or specific emails
  SHOW_AI_REASONING: false,            // Show why AI made each decision
  TRACK_HAND_ANALYTICS: false,         // Log per-hand scoring data
};
```

This allows:
- Rolling out Expert Mode to specific testers first
- A/B testing different AI parameter sets
- Enabling diagnostic features for debugging AI behavior

### 5.3 Logging and Evaluation Data

To measure AI strength and tune difficulty, track per-hand analytics:

```javascript
// Per-hand log entry
{
  handNumber: 14,
  difficulty: 'expert',
  phase: 'discard',
  dealt: ['5H', '5D', 'JC', '7S', '3H', '9D'],
  kept: ['5H', '5D', 'JC', '7S'],
  discarded: ['3H', '9D'],
  cutCard: 'KH',
  handScore: 12,
  expectedValue: 11.4,   // AI's pre-cut EV estimate
  optimalKeep: ['5H', '5D', 'JC', '7S'],  // True optimal (computed post-hoc)
  optimalEV: 11.4,
  evLoss: 0.0,           // How far from optimal
}
```

Key metrics to derive:
- **Average EV loss per discard** — measures how far the AI is from optimal play
- **Pegging points per hand** (for and against) — measures pegging strategy quality
- **Win rate by difficulty** — the ultimate measure
- **Average game length** (number of hands) — shorter games suggest more aggressive/skillful play

This data is invaluable for:
1. Validating that Expert mode is actually harder
2. Tuning Hard mode to sit between Normal and Expert
3. Identifying specific AI weaknesses (e.g., "Expert AI loses most of its EV in crib discards when opponent is dealer")

[Back to TOC](#table-of-contents)

---

## 6. SKnowball Integration Potential

### 6.1 Identity

Expert Mode ties naturally into a persistent identity system:
- The player's difficulty preference becomes part of their profile
- Difficulty-specific statistics (wins, win rate, ELO) are identity attributes
- "Cribbage Expert" could be a verifiable credential within the SKnowball ecosystem
- Authentication already exists via Cognito — SKnowball identity can map to the existing user pool

### 6.2 Skill Tiers

Cribbage skill tiers map directly to difficulty progression:

```
Bronze  → Has played 10+ games on Normal
Silver  → 50+ wins on Normal with 60%+ win rate
Gold    → 25+ wins on Hard with 50%+ win rate
Diamond → 25+ wins on Expert with 40%+ win rate
```

These tiers could be:
- Displayed as badges on the player's profile
- Used for matchmaking in multiplayer (already in development on the `multiplayer` branch)
- Exported as SKnowball skill attestations

### 6.3 Cross-Node Reputation

If SKnowball supports cross-application reputation, cribbage skill tiers become portable:
- A "Diamond Cribbage Player" badge carries weight in other SKnowball games
- Reputation could influence matchmaking priority or unlock features in partner apps
- The cribbage app becomes a "skill verification node" — proving strategic thinking ability through verifiable game outcomes

### 6.4 Lightweight Social Signaling

Expert Mode enables meaningful social signaling:
- **Leaderboard difficulty badges**: Show which difficulty each player competes at
- **Challenge system**: "Player X challenges you to an Expert Mode game" (multiplayer integration)
- **Achievement sharing**: "I just beat the Expert AI 5 times in a row" — shareable link/card
- **Spectator mode potential**: Watch how Expert-mode games unfold (educational content)

[Back to TOC](#table-of-contents)

---

## 7. Recommended Phasing

| Phase | Scope | Effort | Prerequisite |
|-------|-------|--------|--------------|
| **Phase 1** | Extract current AI into modular structure (`lib/ai/`) | Low | None |
| **Phase 2** | Implement expected-value discard strategy | Medium | Phase 1 |
| **Phase 3** | Add card tracking and 1-ply pegging lookahead | Medium | Phase 1 |
| **Phase 4** | Add board-position awareness | Low | Phase 2 |
| **Phase 5** | Create difficulty selector UI and per-difficulty stats | Medium | Phase 1 |
| **Phase 6** | Wire up Hard mode (Phase 2+3 strategies) | Low | Phases 2, 3, 5 |
| **Phase 7** | Implement 2-ply minimax pegging for Expert mode | High | Phase 3 |
| **Phase 8** | Add per-hand analytics logging | Medium | Phase 1 |
| **Phase 9** | Launch Expert Mode to founding players | Low | Phases 6, 7 |
| **Phase 10** | SKnowball skill tier integration | Medium | Phase 5, SKnowball API |

**Phases 1-3 deliver the most value.** Expected-value discarding and 1-ply pegging lookahead would create a meaningfully stronger AI that would challenge even a 78% win rate player. The remaining phases add polish, measurement, and ecosystem integration.

[Back to TOC](#table-of-contents)

---

## Sources

- [Optimal Expected Values for Cribbage Hands — Harvey Mudd College Thesis](https://scholarship.claremont.edu/cgi/viewcontent.cgi?article=1125&context=hmc_theses)
- [How to Analyze Discards, Part 1 — Cribbage Forum](http://www.cribbageforum.com/AnalyzeDiscardsPart1.htm)
- [Cribbage Discard Strategy — CribbageCorner.com](https://cribbagecorner.com/discard/)
- [Cribbage Optimal Hand Analysis — Dan Oehm / Gradient Descending](https://gradientdescending.com/cribbage-optimal-hand-part-1/)
- [Creating a Database of Every Possible Cribbage Hand — Max McQuide / Medium](https://medium.com/@mcquim26/creating-a-database-of-every-possible-cribbage-hand-f8eb0ae602a5)
- [Cribbage Discard Pro Methodology — C. Liam Brown](https://cliambrown.com/cribbage/methodology.php)
- [Genetic Algorithm for Cribbage Pegging Policy — CPSC 474 / Yale](https://github.com/briannaschuh/cpsc474)
- [Cribbage Pro — Tips, Strategy, and Difficulty Levels](https://www.cribbagepro.net/about/tips-and-strategy.html)
- [Cribbage Pro Blog — Discarding Strategy](https://blog.cribbagepro.net/2012/10/discarding.html)
- [American Cribbage Congress — Skill Tips](https://www.cribbage.org/NewSite/tips/rasmussenskill.asp)

[Back to TOC](#table-of-contents)
