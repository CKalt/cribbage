# prompts/ai-rich-compliments-full-plan-request.md

You are Claude Code working inside the Cribbage app repo.

## Goal

Design a full implementation plan for a **Rich Compliment + Banter +
Micro-Animation System** that makes the Cribbage experience lively,
authentic, varied, and emotionally engaging.

Cribbage players *love* big hands and clever pegging. We want the AI and
UI to celebrate exceptional moments with a deep, varied, table-authentic
reaction system that includes:

-   Text reactions (compliments, banter, deadpan, etc.)
-   **Cool little micro-animations** (subtle, fun, non-blocking) pulled
    from a pool to avoid repetition

This plan must include:

-   A complete implementation architecture
-   A 300--500 phrase compliment library
-   A "Classic Cribbage Table Banter" tone pack (Maine lodge, 1958 vibe)
-   A pool of micro-animations with variety + anti-repetition selection
-   Context-aware reactions (text + animation)
-   Deterministic seeded compatibility
-   Toggleable celebration levels
-   Testing strategy
-   Performance safety

This is a PLAN document only --- do not implement code yet.

------------------------------------------------------------------------

## Output File

Write your response to:

-   prompts/ai-rich-compliments-plan.md

------------------------------------------------------------------------

# Requirements

## 1. Event Taxonomy

Define structured trigger events including:

-   BIG_HAND_20_PLUS
-   MONSTER_HAND_24
-   NEAR_PERFECT_28
-   PERFECT_29
-   DOUBLE_RUN
-   TRIPLE_RUN
-   FOUR_OF_A\_KIND
-   HUGE_CRIB
-   PEG_31
-   PEG_GO_STEAL
-   PEG_TRAP
-   SKUNK
-   COMEBACK_WIN
-   CLOSE_GAME_WIN
-   CUT_JACK
-   ZERO_HAND
-   BACK_TO_BACK_BIG_HANDS

Provide exact trigger logic thresholds for each.

------------------------------------------------------------------------

## 2. Full Compliment Library (300--500 phrases)

Generate a structured phrase library with:

-   At least 300--500 total phrases
-   20--40 phrases per major category
-   Tone diversity:
    -   Playful
    -   Respectful
    -   Competitive
    -   Classic cribbage-table slang
    -   Light humor
    -   Rare Easter egg lines (\<1% probability)

Structure example:

``` javascript
{
  MONSTER_HAND_24: {
    intensity: "high",
    toneVariants: {
      classic: [...],
      playful: [...],
      competitive: [...],
      understated: [...]
    }
  }
}
```

No profanity. No modern meme slang. Authentic cribbage feel.

------------------------------------------------------------------------

## 3. Classic Cribbage Table Banter Tone Pack

Create a distinct tone pack inspired by:

"Cribbage in a Maine lodge in 1958."

Tone characteristics:

-   Warm but competitive
-   Dry humor
-   Old-school card slang
-   Subtle pride
-   Respect for big hands
-   Understated reactions to disaster

Provide at least 100--150 phrases in this tone pack alone.

------------------------------------------------------------------------

## 4. Micro-Animation Pool (Cool Little Animations)

Design a pool of **micro-animations** that can be triggered alongside
text reactions.

### Requirements

-   At least **20--40** distinct micro-animations
-   Short and subtle (typical duration 300ms--1200ms)
-   Non-blocking (never pauses gameplay)
-   Works on mobile and desktop
-   Uses CSS animations or lightweight animation libs already in the
    repo (do not add heavy dependencies)
-   Must have **accessibility fallbacks** and respect
    prefers-reduced-motion

### Examples (inspiration, not constraints)

-   Peg "sparkle pop" near the scoring track
-   Tiny confetti burst for 24+ hand (very small)
-   Card "wink" bounce on a 31
-   Score number "stamp" effect (old-school ink stamp)
-   "Woo!" speech bubble pop with slight wobble
-   Subtle "glow" pulse around the hand score panel
-   A tiny "gold star" flicker for a perfect cut jack
-   "Deadpan" minimal animation: small eyebrow raise icon, or subtle
    nudge

### Animation metadata structure

Define an object structure like:

``` javascript
{
  id: "score_sparkle",
  intensity: "low|medium|high",
  compatibleEvents: ["BIG_HAND_20_PLUS","PEG_31"],
  durationMs: 700,
  cooldownMs: 4000,
  reducedMotionFallback: "none|staticIcon|simpleFade",
}
```

### Pool selection rules

-   Avoid repeating the same animation within last N triggers (default
    8)
-   Enforce cooldowns (don't spam)
-   Weight selection by intensity vs event magnitude
-   Deterministic selection under seeded mode (use aiRandom())

------------------------------------------------------------------------

## 5. Anti-Repetition System (Text + Animations)

Design a system that:

-   Tracks last N used phrases (default 10) and animations (default 8)
-   Prevents immediate repeats
-   Applies weighted random selection
-   Uses aiRandom() for deterministic seeded mode
-   Allows rare Easter egg lines/animations at \<1% rate

Define data structures and selection algorithms.

------------------------------------------------------------------------

## 6. Context Awareness (Text + Animation)

Reactions must adapt based on:

-   Who scored (player vs AI)
-   Score differential
-   Near-win state (\<= 8 pts to win)
-   Comeback scenario
-   Skunk risk
-   Game closeness

Define intensity escalation rules and how both text and animations scale
together.

------------------------------------------------------------------------

## 7. Celebration Level Settings

Add configurable settings:

Celebration Level: - Off - Minimal - Classic - Lively - Full Banter

Motion Level: - Off - Subtle - Standard - Extra (still tasteful)

Define how often events trigger under each level, and how the Motion
Level gates animations.

------------------------------------------------------------------------

## 8. Delivery Mechanism (Minimal UI Integration)

Propose minimal integration into existing UI:

-   Toast popup
-   Speech bubble
-   Score banner accent
-   Small animation anchor points near:
    -   Score track
    -   Hand score panel
    -   Pegging count indicator
-   Optional future voice hook
-   Log-style commentary line

Must not block gameplay. Must not impact performance.

------------------------------------------------------------------------

## 9. Determinism & Testing

Design:

-   Seeded RNG integration
-   Unit tests for event triggers
-   Tests for repetition avoidance (text + animations)
-   Golden tests for deterministic selection (seeded)
-   Harness compatibility (celebrations disabled by default)

------------------------------------------------------------------------

## 10. Performance, Safety, Accessibility

-   Must execute under 1ms per event (selection logic)
-   Must not allocate large arrays per trigger (preload pools once)
-   Must not affect mobile performance
-   Must gracefully disable in test mode
-   Must respect prefers-reduced-motion
-   Must ensure screen readers aren't spammed (aria-live strategy)
-   Provide a clear on/off toggle for celebrations

------------------------------------------------------------------------

## Extra Credit

Include:

-   Streak escalation (multiple big hands increase excitement)
-   AI personality confidence shifts
-   Rare celebratory animations (e.g., tiny "victory jig" icon) with
    \<0.5% rate
-   "Deadpan mode" personality option (text + animations subdued)
-   A theme-able animation pack system (future): "Classic", "Neon",
    "Minimal"

------------------------------------------------------------------------

## Quality Bar

This should feel like:

-   Playing across from a seasoned, lively cribbage player
-   Never robotic
-   Never repetitive
-   Not childish
-   Not obnoxious

Players should smile when big hands land.

Deliver a structured, implementation-ready plan.
