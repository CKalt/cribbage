# prompts/ai-expert-upgrade-plan-request.md

You are Claude Code working inside the Cribbage app repo.

## Context (read this first)
We already produced a read-only research document that describes the current AI behavior and exact code locations:

- prompts/ai-mode-decision-research.md

Read it fully and treat it as the baseline “as-built” truth before proposing changes.

Player results that triggered this work:
- Shawn vs Normal: 534 games, Shawn won 78%
- Shawn vs Expert: 35 games, Shawn won 74%
Conclusion: Expert is not materially harder in practice.

## Goal
Create a concrete, implementation-ready plan to make **Expert mode meaningfully stronger** (especially in pegging), while keeping:
- responsiveness acceptable on mobile/browser
- code testable and deterministic for debugging
- changes localized and maintainable

Target outcome (directionally):
- Expert should clearly outperform Normal in self-play benchmarks
- Expert should stop “giving away” advantage to strong players via avoidable handicaps
- Expert should make fewer obviously exploitable pegging mistakes

## Output file
Write your plan to:
- prompts/ai-expert-upgrade-plan.md

## Rules
- This is a PLAN, not an implementation.
- Do not change any code in this task.
- You may inspect code and quote SMALL snippets (keep quotes short).
- Be explicit about tradeoffs, performance budgets, and risks.
- The plan must be broken into phases that can ship incrementally.

## What to include (use a TOC with checkboxes)
Use a table of contents with checkboxes:

- [ ] 1. ...
- [ ] 2. ...

## Required sections

### 1) Diagnosis: why Expert isn’t much stronger (with hypotheses)
Use the research doc + quick code inspection to propose 3–6 plausible causes.
You MUST include (if confirmed in code):
- Expert “muggins bluff” / overcount behavior (and how it impacts strong players)
- Pegging depth limitation (1-ply heuristic, no lookahead)
- Lack of board-position / race awareness

For each hypothesis:
- “How to validate” (instrumentation or a benchmark that would confirm/refute)

### 2) Non-negotiable quick wins (highest ROI fixes)
Propose a minimal set of changes that should immediately make Expert stronger and less exploitable.
At minimum, cover:
- Removing or gating Expert overcount bluffing so Expert is not handicapped vs muggins-capable players
  - Options: set overcountRate=0 for Expert; or make bluff rate adaptive based on player muggins-call rate; or split into separate “Muggins Practice” toggle/mode
- Deterministic debug capability (seeded RNG) so we can reproduce decisions and write golden tests

Provide acceptance criteria for each quick win.

### 3) Benchmarking & measurement plan (must include a headless harness)
We need a way to measure strength improvements without waiting for human games.

Propose a headless simulation harness that can run thousands of AI vs AI games in Node:
- Compare: Normal vs Expert (current), New Expert vs Old Expert, etc.
- Metrics: win rate, average margin, pegging points per hand, hand points per hand, crib points per hand
- Determinism: seedable so CI can run it and produce stable results

If game logic is currently tied to UI, propose the smallest extraction/refactor to enable headless simulation without rewriting the app.

Deliverables for this section:
- Proposed script name(s), e.g. `scripts/simulate-ai.js`
- What modules it uses
- Seed strategy
- Example CLI usage
- Runtime expectations (e.g., 2k games < 60s on dev machine)

### 4) Expert pegging upgrade plan (core difficulty improvement)
Design a stronger pegging brain.

You MUST propose at least one of these approaches (preferably #1):
1) **Depth-limited lookahead (2-ply or 3-ply) using sampling of opponent hands**
   - Use expectimax or minimax over sampled opponent hands consistent with known cards
   - Incorporate *go* and *last-card* points correctly (not just immediate `calculatePeggingScore`)
   - Use memoization/transposition caching to keep it fast
   - Deterministic sampling via seeded RNG

2) If you argue against lookahead, propose an alternative that is comparably strong:
   - a tuned evaluation function with tactical pattern library,
   - plus an automated tuning workflow driven by self-play.

For the chosen approach, specify:
- Data model of “known cards” at pegging time (our hand, our discards, cut card, played cards)
- How you represent game state for recursion
- How you score terminal states (total pegging points differential)
- How you keep performance bounded (sample count, depth, pruning, time budget)
- Fallback behavior if computation exceeds budget

Acceptance criteria:
- New Expert pegging should outperform old Expert pegging in harness metrics
- Deterministic decision in debug mode
- Unit tests for go/last scoring edge cases

### 5) Expert discard improvements (secondary, but include options)
Expert discard currently uses full cut-card EV for the hand, but crib EV comes from a static table.

Propose one of:
- Keep static table but improve integration (dealer/pone weighting, board position)
- Replace/augment crib EV with Monte Carlo simulation:
  - sample opponent discards + cut cards
  - score crib exactly using `calculateHandScore(cribCards, cut, true)`
  - optionally model opponent discard behavior (e.g., “opponent tries to maximize their hand EV and minimize giving crib points”)

Specify sample sizes and caching so it stays fast.

### 6) Board-position / race awareness
Add “game context” to AI decisions:
- myScore, oppScore, targetScore (121)
- isDealer, who leads pegging
- “need points to go out” thresholds

Describe how this changes both discard and pegging:
- When behind: prefer higher-variance / higher-ceiling lines
- When ahead near finish: prefer safe lines that deny opponent points

Keep it practical: show how to integrate without rewriting everything (e.g., optional context object).

### 7) Instrumentation plan (debug logs without spamming)
Propose structured logs for:
- discard: top N splits with handEV, cribEV, combined score
- pegging: top N cards with score breakdown + lookahead EV
- include seed + context so we can reproduce

Include a JSON schema and where it plugs in.

### 8) Testing plan
Must include:
- Unit tests for new pegging engine (including go/last, 15/31, pairs/runs)
- Golden tests for deterministic “given seed + state -> chosen move”
- Regression tests that ensure “New Expert is not weaker than Old Expert” on a fixed benchmark set

Include 10 concrete test vectors (specific hands / played sequences / counts / expected choice).

### 9) Rollout plan & risk management
Break into incremental phases that can ship:
- Phase 1: remove Expert self-handicap + deterministic RNG
- Phase 2: add harness + baseline benchmarks in CI
- Phase 3: new pegging strategy behind a feature flag
- Phase 4: discard crib EV improvements
- Phase 5: board-position awareness tuning

For each phase:
- files to touch
- risks
- how to measure improvement
- rollback plan (feature flags)

## Strong hints (don’t ignore)
- The current Expert “overcount bluff” can make Expert weaker vs skilled muggins callers. Prioritize addressing that.
- The biggest gameplay skill gap in cribbage AI is often pegging (lookahead, go/last control, trap avoidance).
- Do not rely on hand-wavy “tuning”; propose measurable benchmarks and deterministic tests.

## Deliverable quality bar
When you’re done, the plan should be something a developer can follow to implement in 1–3 PRs, with clear acceptance tests and measurable strength improvements.
