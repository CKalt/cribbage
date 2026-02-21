# AI Mode Decision Research

**Created**: 2026-02-20
**Author**: Claude Code
**Status**: Research (read-only — no code changes)
**Purpose**: Document how the AI makes decisions today, contrasting Normal vs Expert modes

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Where the AI Lives in the Code](#2-where-the-ai-lives-in-the-code)
- [3. Decision Pipeline Overview](#3-decision-pipeline-overview)
  - [3a. Discard Phase](#3a-discard-phase)
  - [3b. Play/Pegging Phase](#3b-playpegging-phase)
- [4. Normal vs Expert Comparison](#4-normal-vs-expert-comparison)
- [5. Heuristics & Scoring Details](#5-heuristics--scoring-details)
  - [5.1 Hand Scoring (calculateHandScore)](#51-hand-scoring-calculatehandscore)
  - [5.2 Pegging Scoring (calculatePeggingScore)](#52-pegging-scoring-calculatepeggingscore)
  - [5.3 Discard Evaluation — Normal](#53-discard-evaluation--normal)
  - [5.4 Discard Evaluation — Expert](#54-discard-evaluation--expert)
  - [5.5 Counting/Claiming Behavior](#55-countingclaiming-behavior)
- [6. Randomness & Determinism](#6-randomness--determinism)
- [7. Known Limitations / Likely Regressions](#7-known-limitations--likely-regressions)
- [8. Instrumentation Recommendations](#8-instrumentation-recommendations)
- [9. Testing Implications](#9-testing-implications)
- [10. Appendix](#10-appendix)

---

## 1. Executive Summary

[Back to TOC](#table-of-contents)

The AI has two modes — **Normal** and **Expert** — that differ across three decision domains: discarding, pegging, and hand counting. Here is the current state:

- The AI code lives in `lib/ai/` (dispatcher + strategies) and `lib/scoring.js` (shared scoring)
- **Normal discard** uses a lightweight heuristic: counts 2-card fifteens, pairs, run proximity, 5-retention, and a crib penalty — does NOT evaluate cut cards
- **Expert discard** evaluates all 15 keep/discard splits × 46 possible cut cards = 690 hand score calculations per decision, using `calculateHandScore` for exact expected value
- Expert discard also uses a static crib value table (Colvert-style) to estimate the value of discards going to/against the crib
- **Normal pegging** uses heuristic scoring with leading strategy, count-avoidance, pair/run awareness, and a small random jitter (`Math.random() * 0.5`)
- **Expert pegging** uses the same structure but with higher weights, more nuanced count control, opponent hand estimation, trap plays, better endgame card retention, and **no randomness** (fully deterministic)
- **Normal counting** has a 10% error rate (can over- or undercount by up to 2 points)
- **Expert counting** never makes errors, but deliberately **overcounts 15% of the time** by 1-2 points as a muggins bluff
- The difficulty profile is selected at game start via menu and can be switched mid-game via the ⋮ menu
- The game result is recorded under whatever mode is active when the game ends
- Neither mode considers: board position/race, opponent tendencies, pegging history across rounds, or adaptive strategy

---

## 2. Where the AI Lives in the Code

[Back to TOC](#table-of-contents)

| File | Responsibility | Key Exports |
|------|---------------|-------------|
| `lib/ai/index.js` | Dispatcher — routes to strategy based on difficulty profile | `computerSelectCrib(hand, isDealer, difficulty)`, `computerSelectPlay(hand, playedCards, currentCount, difficulty)`, `DIFFICULTY_PROFILES` |
| `lib/ai/difficulty.js` | Defines Normal and Expert profiles (strategy names, error rates, bluff rates) | `DIFFICULTY_PROFILES` |
| `lib/ai/strategies/discard-heuristic.js` | Normal mode discard — lightweight evaluation of kept hand quality + crib penalty | `computerSelectCrib(hand, isDealer)` |
| `lib/ai/strategies/discard-ev.js` | Expert mode discard — expected value over all 46 cuts + static crib table | `computerSelectCrib(hand, isDealer)` |
| `lib/ai/strategies/pegging-heuristic.js` | Normal mode pegging — heuristic scoring with randomness | `computerSelectPlay(hand, playedCards, currentCount)` |
| `lib/ai/strategies/pegging-expert.js` | Expert mode pegging — deterministic with deeper positional awareness | `computerSelectPlay(hand, playedCards, currentCount)` |
| `lib/scoring.js` | Shared scoring engine — calculates hand scores and pegging scores | `calculateHandScore(hand, cutCard, isCrib)`, `calculatePeggingScore(playedCards, currentCount)` |
| `lib/constants.js` | Card definitions — suits, ranks, values, rank order | `suits`, `ranks`, `rankValues`, `rankOrder` |

**Mode flags flow:**
1. User selects `aiDifficulty` ('normal' or 'expert') on menu or via ⋮ menu
2. Stored in `localStorage('aiDifficulty')` and React state
3. Passed to `computerSelectCrib(hand, isDealer, aiDifficulty)` and `computerSelectPlay(hand, playedCards, currentCount, aiDifficulty)`
4. Dispatcher in `lib/ai/index.js` looks up `DIFFICULTY_PROFILES[difficulty]` and routes to the matching strategy
5. Counting errors/bluffs read from the profile in `CribbageGame.jsx` lines ~2047-2057

---

## 3. Decision Pipeline Overview

[Back to TOC](#table-of-contents)

### 3a. Discard Phase

**Both modes follow this flow:**
1. Computer receives 6-card hand
2. Enumerate all C(6,2) = 15 possible discard pairs (equivalently, 15 possible 4-card keeps)
3. Score each keep/discard combination
4. Choose the highest-scoring split
5. Return the 4 kept cards (the 2 discards go to the crib)

**Normal scoring (per split):**
1. Count 2-card fifteens among the 4 kept cards (+2 each)
2. Count pairs among the 4 kept cards (+2 each)
3. Estimate run potential: for each 3-card window in sorted rank order, if span ≤ 2, add +1
4. Bonus for keeping 5s (+2 per 5 in kept hand)
5. Crib penalty on discards: 5s penalized (−2×crib_penalty), face cards penalized (−1×crib_penalty)
   - `crib_penalty` = 0.3 if dealer (our crib), 1.0 if pone (opponent's crib)

**Expert scoring (per split):**
1. Build remaining deck (52 − 6 = 46 cards)
2. For each of 46 possible cut cards:
   - Call `calculateHandScore(kept, cutCard, false)` — full exact scoring (fifteens, pairs, runs, flushes, nobs)
3. Average all 46 scores → `expectedHandValue`
4. Look up estimated crib contribution from `CRIB_DISCARD_VALUES` table → `expectedCribValue`
5. `combinedScore = expectedHandValue + (isDealer ? +cribValue : −cribValue)`
6. Choose the split with highest `combinedScore`

### 3b. Play/Pegging Phase

**Both modes follow this flow:**
1. Filter hand to valid plays (card.value + currentCount ≤ 31)
2. If 0 valid: return null (Go)
3. If 1 valid: return that card (no choice)
4. For each valid card, compute a heuristic score
5. Choose the card with the highest score

**Normal pegging evaluation (per card):**
1. Calculate immediate pegging points × 10 (using `calculatePeggingScore`)
2. Leading strategy (count=0): penalize 5s (−15), prefer <5 (+5), prefer 4 (+3), face cards (+1)
3. Danger avoidance: penalize if remaining=10 (−8), remaining=5 (−10), count=21 (−6), remaining 1-4 (−3)
4. Pair bonus: +5 if card matches opponent's last card
5. Run avoidance: −2 if adjacent to opponent's last card
6. Endgame: save low cards (−2 if value≤4 and count<20), save aces (−3 if hand.length>2)
7. **Random jitter**: `+Math.random() * 0.5` — makes play less predictable
8. Choose highest score

**Expert pegging evaluation (per card):**
1. Calculate immediate pegging points × **15** (heavier weight than Normal's ×10)
2. Leading strategy (count=0): penalize 5s (−20), prefer 4 (+8), 3 (+6), 2 (+5), A (+4), penalize 10-value (−2)
3. Count control (more nuanced): penalize count=5 (−14), remaining=5 (−12), count=21 (−10), remaining=10 (−8), bonus for exactly 15 (+12) or 31 (+10), remaining 1-4 (−5)
4. Pair/triple awareness: checks `playedRanks` — pair (+4), trips (+8)
5. Run avoidance: −3 if adjacent to opponent's last card
6. Trap plays: if count=11 and card.value=4, +3 (sets up scoring sequence)
7. Endgame retention: save low cards when count<15 (−4), save aces (−5), when count≥22 bonus for low cards (+10−value)
8. Opponent estimation: if playing 10-value card, reduced penalty based on how many 10s already played (+0.5 per)
9. **No randomness** — fully deterministic
10. Choose highest score

---

## 4. Normal vs Expert Comparison

[Back to TOC](#table-of-contents)

| Aspect | Normal Mode | Expert Mode |
|--------|------------|-------------|
| **Discard: method** | Heuristic (2-card fifteens, pairs, run proximity) | Expected value over all 46 cuts + crib table |
| **Discard: cut card awareness** | None — does not evaluate any cut cards | Full — evaluates every possible cut |
| **Discard: crib estimation** | Simple penalty on 5s and face cards | Static table of average crib values by rank pair (Colvert) |
| **Discard: flush/nobs** | Not considered | Considered (via `calculateHandScore`) |
| **Discard: search space** | 15 splits × inline heuristic | 15 splits × 46 cuts = 690 full score calculations |
| **Pegging: immediate point weight** | ×10 | ×15 |
| **Pegging: leading penalty for 5** | −15 | −20 |
| **Pegging: count control** | Basic (avoid remaining=5,10; avoid 21) | Deeper (also avoids count=5; bonuses for hitting 15/31) |
| **Pegging: pair awareness** | Simple pair bonus (+5) | Distinguishes pair (+4) vs trips (+8) based on play history |
| **Pegging: trap plays** | None | Yes (e.g., count=11 → play 4) |
| **Pegging: opponent estimation** | None | Tracks 10-value density from played cards |
| **Pegging: endgame retention** | Basic (save low when count<20) | Deeper (save low when count<15; active preference for low cards when count≥22) |
| **Pegging: randomness** | `+Math.random() * 0.5` per card | None — fully deterministic |
| **Counting: error rate** | 10% chance of ±2 error | 0% error rate |
| **Counting: bluffing** | None | 15% chance of +1 to +2 deliberate overcount (muggins trap) |
| **Board position awareness** | None | None |
| **Adaptive/learning** | None | None |

---

## 5. Heuristics & Scoring Details

[Back to TOC](#table-of-contents)

### 5.1 Hand Scoring (calculateHandScore)

**File**: `lib/scoring.js:13-112`

Used by Expert discard to evaluate every possible cut. Scores 5-card hands (4 kept + 1 cut):

- **Fifteens**: Enumerate all 2^5 = 32 subsets; if sum=15, +2 points
- **Pairs**: All C(5,2) = 10 pairs checked; matching rank = +2
- **Runs**: Check subsets of size 5 down to 3; uses `rankOrder` for consecutive check; only longest runs counted (but multiple runs of same length count separately — e.g., double run)
- **Flush**: 4 hand cards same suit = +4; if cut also matches = +5 total. Crib requires all 5 for any flush credit
- **Nobs**: Jack in hand matching cut suit = +1

**Concepts modeled**: fifteens, pairs, runs (including double/triple runs), flushes, nobs
**Concepts NOT modeled**: his heels (Jack cut), go, last card — these are pegging-only

### 5.2 Pegging Scoring (calculatePeggingScore)

**File**: `lib/scoring.js:121-188`

Used by both pegging strategies to evaluate immediate points from playing a card:

- **Fifteen**: count=15 → +2
- **Thirty-one**: count=31 → +2
- **Pairs/Trips/Quads**: Count consecutive matching ranks from the end of played cards; pair=+2, trips=+6, quads=+12
- **Runs**: Check from longest possible (7) down to 3; recent N cards must form consecutive ranks

**NOT modeled**: Go (1 point) — this is handled by the game engine, not the scoring function

### 5.3 Discard Evaluation — Normal

**File**: `lib/ai/strategies/discard-heuristic.js`

Evaluation of the 4 kept cards only (no cut card consideration):

| Factor | Weight |
|--------|--------|
| 2-card fifteen in kept hand | +2 per |
| Pair in kept hand | +2 per |
| 3-card run proximity (span ≤ 2) | +1 per window |
| Keeping a 5 | +2 per 5 |
| Discarding a 5 | −2 × crib_penalty |
| Discarding a face card | −1 × crib_penalty |

Where `crib_penalty` = 0.3 (dealer, our crib) or 1.0 (pone, opponent's crib)

**Key limitation**: Only evaluates 2-card subsets for fifteens. A hand with 3-card fifteens (e.g., 2+3+10=15) is not detected. Runs are estimated by proximity, not actually verified. Flushes and nobs are completely ignored.

### 5.4 Discard Evaluation — Expert

**File**: `lib/ai/strategies/discard-ev.js`

| Factor | Method |
|--------|--------|
| Hand expected value | Average of `calculateHandScore(kept, cut)` over all 46 possible cuts |
| Crib expected value | Static lookup table `CRIB_DISCARD_VALUES[rank_pair]` |
| Combined | `handEV + (isDealer ? +cribEV : −cribEV)` |

The crib table contains 91 entries covering all rank pairs (A-A through K-K). Values range from 3.4 (8-K) to 8.5 (5-5). This is a published reference table, not computed dynamically.

**Key strength**: Full exact scoring over all cuts means it correctly values hands that Normal would miss — e.g., a hand that scores 0 without cuts but averages 8 across all cuts.

**Key limitation**: Crib value is estimated from a static table, not computed. The table gives average values assuming random other discards, which may not reflect the actual game situation.

### 5.5 Counting/Claiming Behavior

**File**: `components/CribbageGame.jsx` lines ~2047-2057

After computing the true hand score, the AI decides what to claim:

```
Normal: 10% of the time (when score > 0), adds a random error of +2 or −2
Expert: 0% counting error, but 15% of the time (when score > 0),
        deliberately overcounts by ceil(random * 2) = +1 or +2
```

The overcount is a muggins strategy: if the player accepts, Expert gets extra points. If the player calls muggins, Expert gets 0 and the player gets the overcount as penalty points.

---

## 6. Randomness & Determinism

[Back to TOC](#table-of-contents)

| Source of Randomness | Normal | Expert |
|---------------------|--------|--------|
| Pegging card selection | `+Math.random() * 0.5` added to each candidate's score | None — fully deterministic |
| Discard selection | None (deterministic heuristic, but heuristic is weak) | None (deterministic EV calculation) |
| Counting errors | 10% chance, random ±2 | None |
| Overcount bluffs | None | 15% chance, random +1 or +2 |

**No RNG seeding anywhere** — all uses are `Math.random()` which is unseeded.

**Implication for testing**: Normal pegging is non-reproducible (different card selected each run for close scores). Expert pegging IS reproducible for a given game state (deterministic), but the overcount bluff in counting introduces per-game variance.

**Recommended "deterministic debug mode"** (not implemented, just described):
- Add a `debug: { seed: number, noBluffs: boolean }` option to the difficulty profile
- Replace `Math.random()` calls with a seeded PRNG (e.g., mulberry32)
- When `noBluffs: true`, skip the overcount logic
- This would make all AI decisions reproducible from a given seed, enabling golden tests

---

## 7. Known Limitations / Likely Regressions

[Back to TOC](#table-of-contents)

### Strategic Weaknesses

1. **No board position awareness**: Neither mode considers the score (e.g., "I'm at 115 and need 6 to win — play aggressively" or "opponent is at 119 — play defensively to deny pegging points"). This is arguably the biggest gap for competitive play.

2. **No pegging lookahead**: Both modes evaluate one card at a time. Neither considers "if I play this card now, what can opponent do, and what can I follow up with?" True lookahead would require a game tree search.

3. **Normal discard ignores 3+ card combinations**: Only checks 2-card fifteens. A hand of 2-3-5-5 would score the 2-card fifteens but miss that 2+3+10(cut) scenarios or the interaction between the 5s. Expert handles this correctly through `calculateHandScore`.

4. **Normal discard ignores flushes entirely**: A 4-card flush (+4 minimum, +5 with matching cut) is never detected.

5. **Static crib table (Expert)**: The crib estimation doesn't account for: what the opponent likely discarded (e.g., if opponent is pone, they probably didn't discard 5s), what cards remain in the deck, or suit-based effects (nobs in the crib).

6. **No opponent modeling**: Neither mode tracks what the opponent has done in previous hands/games. A player who always leads 4s, or who never calls muggins, is treated identically to any other player.

7. **Expert pegging trap plays are minimal**: Only one trap play is coded (count=11 → play 4). Real expert cribbage has dozens of standard trap sequences.

8. **Pegging run creation is penalized, not pursued**: Both modes penalize playing adjacent cards (run avoidance) but never actively try to CREATE runs. An expert player might deliberately play into a run knowing they hold the extending card.

9. **No "go" strategy**: Neither mode considers the strategic value of forcing a Go (getting 1 point) or avoiding giving a Go. When count is high, the AI just picks the lowest card that fits.

10. **Muggins bluff is static**: Expert always overcounts at 15% rate regardless of game situation. A human expert would vary bluff frequency based on whether the opponent has been calling muggins, the score situation, and the stakes of the overcount.

### Code Fragility Risks

1. **Difficulty profile expansion**: Adding a new difficulty would require new strategy files + updating the dispatcher. No plugin architecture.

2. **calculateHandScore is called 690 times per Expert discard**: Performance is fine (~10ms) but if this function gets slower (e.g., adding diagnostic logging), Expert discard would degrade.

3. **Crib table is hardcoded**: No test verifies these values match published references. A typo would silently degrade Expert discard quality.

4. **Pegging weights are magic numbers**: The heuristic weights (−20 for leading 5, +15 per immediate point, etc.) were hand-tuned. No automated tuning or validation against known optimal play.

5. **Counting error/bluff in CribbageGame.jsx, not in AI module**: The claiming logic is in the UI component rather than the AI strategy module. This makes it harder to test in isolation and could drift if the component is refactored.

---

## 8. Instrumentation Recommendations

[Back to TOC](#table-of-contents)

*These are recommendations only — no code changes.*

### Proposed AI Decision Log (JSON)

```json
{
  "phase": "discard",
  "mode": "expert",
  "hand": ["5♠", "5♥", "6♦", "7♣", "J♠", "Q♥"],
  "isDealer": true,
  "candidates": [
    {
      "kept": ["5♠", "5♥", "6♦", "7♣"],
      "discarded": ["J♠", "Q♥"],
      "handEV": 12.43,
      "cribEV": 3.90,
      "combinedScore": 16.33,
      "rank": 1
    },
    {
      "kept": ["5♠", "5♥", "6♦", "J♠"],
      "discarded": ["7♣", "Q♥"],
      "handEV": 10.15,
      "cribEV": 3.60,
      "combinedScore": 13.75,
      "rank": 2
    }
  ],
  "chosen": 0,
  "reason": "highest combinedScore"
}
```

```json
{
  "phase": "pegging",
  "mode": "expert",
  "hand": ["3♠", "7♥", "J♦"],
  "currentCount": 14,
  "playedCards": ["K♠", "4♥"],
  "candidates": [
    { "card": "3♠", "score": 5.0, "breakdown": {"immediate": 0, "countControl": -5, "endgame": +10} },
    { "card": "7♥", "score": 17.0, "breakdown": {"immediate": 15, "countControl": +2, "endgame": 0} },
    { "card": "J♦", "score": 3.0, "breakdown": {"immediate": 0, "countControl": -2, "endgame": -5} }
  ],
  "chosen": "7♥",
  "reason": "immediate 15 for 2"
}
```

### Minimal hooks needed:
1. In `discard-ev.js` and `discard-heuristic.js`: collect all candidate scores and return them alongside the chosen cards
2. In `pegging-expert.js` and `pegging-heuristic.js`: collect per-card score breakdowns
3. In `CribbageGame.jsx` claiming logic: log actual score, claimed score, and reason (error/bluff/clean)
4. A global `AI_LOG_ENABLED` flag (off by default) to avoid performance overhead

---

## 9. Testing Implications

[Back to TOC](#table-of-contents)

### Best Seams for Testing

1. **Unit tests for `calculateHandScore`**: Pure function, no dependencies. Feed hand + cut → verify score + breakdown.
2. **Unit tests for `calculatePeggingScore`**: Pure function. Feed played cards + count → verify score + reason.
3. **Unit tests for `discard-ev.js`**: Given a specific 6-card hand + dealer flag, verify the chosen 4 cards.
4. **Unit tests for `pegging-expert.js`**: Given hand + played cards + count, verify chosen card.
5. **Golden tests**: Freeze a set of known game states with known-correct AI decisions. Run on every build.

### Concrete Test Vectors

**Discard tests:**

1. **Hand**: 5♠ 5♥ 6♦ 7♣ J♠ Q♥, **Dealer**: yes
   - Expert should keep 5-5-6-7 (strong hand with fifteens and run potential). Normal might also get this right.

2. **Hand**: A♠ 2♥ 3♦ 4♣ 5♠ K♥, **Dealer**: no
   - Expert should keep A-2-3-4 (guaranteed run) and dump 5+K to opponent's crib (though 5 is costly). Test that the EV calculation outweighs the crib penalty.

3. **Hand**: 4♠ 4♥ 4♦ 5♣ 6♠ 6♥, **Dealer**: yes
   - Triple 4s + 6s — Expert should evaluate whether to keep all three 4s or split. Tests combinatorial scoring.

4. **Hand**: 2♠ 3♠ 4♠ 5♠ 8♥ K♦, **Dealer**: no
   - Flush potential (4 spades) — Expert should detect this via `calculateHandScore`. Normal will miss it entirely.

**Pegging tests:**

5. **Hand**: [4♠, 8♥], **Count**: 0, **Played**: []
   - Expert should lead with 4 (safe leader). Normal should also prefer 4 over 8.

6. **Hand**: [5♠, 7♥, J♦], **Count**: 10, **Played**: [K♣]
   - Playing 5 makes 15 (+2 immediate). Both modes should strongly prefer 5.

7. **Hand**: [A♠, 3♥], **Count**: 27, **Played**: [K♣, Q♥, 7♦]
   - Only A is valid (27+1=28). Expert should return A. Regression test for "no valid play" edge cases.

8. **Hand**: [2♠, 3♥, 4♦], **Count**: 0, **Played**: []
   - Expert should prefer 4 (+8) over 3 (+6) over 2 (+5). Tests leading preference weights.

**Counting tests:**

9. **Score**: 12, **Mode**: expert, **Seed**: fixed
   - With bluff rate 0.15, verify over 1000 runs: ~85% claim 12, ~15% claim 13 or 14. Tests bluff distribution.

10. **Score**: 0, **Mode**: expert
    - Should never bluff (guard: `score > 0` check). Verify claimed = 0 always.

### Regression Suite Strategy

- Maintain a `test-fixtures/ai-golden.json` file with 50+ game states and expected AI choices
- On every build, replay all states through both Normal and Expert
- Flag any change in Expert decisions as a regression (deterministic, so any change = code change)
- For Normal pegging (non-deterministic), run each state 100 times and verify the most-chosen card matches the expected "best" card at least 80% of the time

---

## 10. Appendix

[Back to TOC](#table-of-contents)

### Key Code Excerpts

**Difficulty profiles** (`lib/ai/difficulty.js`):
```javascript
normal: {
  discardStrategy: 'heuristic',
  peggingStrategy: 'heuristic',
  countingErrorRate: 0.10,
  countingErrorRange: 2,
},
expert: {
  discardStrategy: 'expected-value',
  peggingStrategy: 'expert',
  countingErrorRate: 0.0,
  overcountRate: 0.15,
  overcountRange: 2,
}
```

**Expert EV discard core** (`lib/ai/strategies/discard-ev.js:106-118`):
```javascript
let totalHandScore = 0;
for (const cutCard of remainingCards) {
  const { score } = calculateHandScore(kept, cutCard, false);
  totalHandScore += score;
}
const expectedHandValue = totalHandScore / remainingCards.length;
const expectedCribValue = estimateCribValue(discarded);
const combinedScore = expectedHandValue + (isDealer ? expectedCribValue : -expectedCribValue);
```

**Normal pegging randomness** (`lib/ai/strategies/pegging-heuristic.js:90`):
```javascript
score += Math.random() * 0.5;
```

**Expert pegging — no randomness** (`lib/ai/strategies/pegging-expert.js:148-152`):
```javascript
// No randomness — deterministic optimal play
if (score > bestScore) {
  bestScore = score;
  bestCard = card;
}
```

**Overcount bluff logic** (`components/CribbageGame.jsx:2049-2053`):
```javascript
if (profile.overcountRate && Math.random() < profile.overcountRate && score > 0) {
  const bluff = Math.ceil(Math.random() * profile.overcountRange);
  claimed = score + bluff;
}
```

### Open Questions for Player-Adaptive Mode Design

1. **What data do we collect?** Do we store per-player stats beyond W/L (e.g., average hand score, muggins call rate, pegging points per game)?
2. **Where does adaptation happen?** Should the AI adjust discard/pegging weights per player, or just change difficulty parameters (like error rate)?
3. **Target win rate**: Is 50% the goal for all players, or should Expert have a fixed difficulty and only a "Tuned" mode adapts?
4. **Coaching mode scope**: Should the AI explain decisions after the fact (post-hand review) or provide hints during play?
5. **Performance budget**: Is the current ~10ms per discard acceptable, or would lookahead search (hundreds of ms) be too slow on mobile?
6. **Crib table accuracy**: Should we compute dynamic crib expected values instead of using the static table? This would require evaluating all possible 4-card crib hands — computationally heavier but more accurate.
7. **Pegging search depth**: Would a 2-ply lookahead (consider opponent's likely response) be feasible? Would require estimating opponent hand from remaining cards.

[Back to TOC](#table-of-contents)
