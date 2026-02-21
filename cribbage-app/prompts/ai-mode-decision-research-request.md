Here you go — a Claude Code **request prompt** you can drop into:

`prompts/ai-mode-decision-research-request.md`

It asks Claude to produce:

`prompts/ai-mode-decision-research.md`

and it’s aimed exactly at: **document how the AI decides today**, clearly contrasting **Normal vs Expert**, plus setting you up for the next step (a plan-request to build a better, player-tuned opponent/coach).

```markdown
# prompts/ai-mode-decision-research-request.md

You are Claude Code working inside the Cribbage app repo.

## Goal
Create a *research document* (not a plan yet) that precisely explains how the AI makes decisions today, especially the differences between **Normal** and **Expert** modes.

This document will be read by Chris + ChatGPT, and then we will write a separate plan-request to improve the AI (including potentially player-tuned behavior and coaching explanations).

## Output file
Write your response to:
- prompts/ai-mode-decision-research.md

## Rules
- This is **read-only research/documentation**. Do **not** change code.
- If you need to inspect code, do so by reading the relevant files and quoting small snippets (keep quotes short).
- Be explicit about uncertainty: if something is not implemented in code and you’re inferring, clearly label it as inference.
- Avoid “entering plan mode” behavior. Deliver the document directly.

## What to include (use a TOC with checkboxes)
Include a table of contents with checkboxes like:

- [ ] 1. ...
- [ ] 2. ...

### Required sections

1) **Executive summary**
   - In 10-15 bullets: what the AI is doing today and what differs between Normal vs Expert.

2) **Where the AI lives in the code**
   - List the key files/modules/classes/functions involved in AI decisions.
   - For each, include: file path, the primary responsibility, and the key exported entry points.
   - If there are mode flags or config toggles, list them and where they flow.

3) **Decision pipeline overview**
   - Describe the AI decision pipeline end-to-end for:
     - a) Discard phase (choosing crib)
     - b) Play/pegging phase (card-by-card during play)
   - Present this as step-by-step numbered flow.
   - Call out any evaluation functions, scoring heuristics, search depth, randomization, tie-breakers, pruning, etc.

4) **Normal vs Expert**
   - Make a two-column comparison table:
     - “Normal Mode” vs “Expert Mode”
   - For each phase (discard + pegging), document exactly what changes:
     - search depth
     - heuristic weights
     - randomness / exploration
     - “lookahead” behavior
     - risk preference
     - any special-case rules

5) **Heuristics & scoring details**
   - Document the scoring/evaluation function(s) used to rank candidate moves.
   - Include:
     - which cribbage concepts are modeled (pairs, runs, fifteens, go, last card, etc.)
     - whether it estimates opponent response
     - whether it estimates crib value differently depending on dealer
   - If there are weights/constants, list them.

6) **Randomness & determinism**
   - Is there RNG? If so:
     - where seeded (if at all)
     - how it affects choices
     - whether Expert reduces randomness
   - Recommend a simple “deterministic debug mode” switch if it would help analysis (do not implement, just describe).

7) **Known limitations / likely regressions**
   - List current weaknesses you can infer from the code:
     - e.g., “doesn’t account for opponent tendencies”
     - “undervalues keeping flexible pegging cards”
     - “discard strategy ignores cut-card distribution” (only if true)
   - Also list code fragility risks: places where future changes could cause regressions.

8) **Instrumentation recommendations (no code changes)**
   - Propose minimal logging hooks we *could* add later (not now) to explain AI decisions:
     - what it considered
     - top N candidate moves with scores
     - why it chose the winner
   - Include a suggested structured log shape (JSON) that would be easy to diff.

9) **Testing implications (no code changes)**
   - Identify the best seams for tests:
     - unit tests for scoring functions
     - golden tests for known board states
     - regression suite strategy for “don’t get worse”
   - Provide 5-10 concrete test vectors (describe the game states) that would catch regressions.

10) **Appendix**
   - Short code excerpts (small) that justify the claims.
   - Any TODOs or open questions you’d want answered before designing a player-adaptive mode.

## Extra context (why we’re doing this)
We have a highly engaged player (“Shawn”) who has played 400-500 games and is now around ~70% win rate on Expert. We want to evolve the AI to better hit a fair challenge target (around 50%), potentially by:
- improving core strategy, and/or
- optionally learning/adapting to a player over time,
- and eventually explaining itself like a friendly coach.

But for this task: **document the current behavior** accurately and concretely.
```
