# prompts/ai-rich-celebrations-polish-addendum.md

## Purpose

This addendum refines the Rich Compliment + Banter + Micro-Animation
plan to improve pacing, restraint, emotional timing, and long-term
player delight.

This document supplements: - prompts/ai-rich-compliments-plan.md

------------------------------------------------------------------------

## 1. Micro-Timing Choreography

For medium+ intensity events, stagger visual elements:

Example timing pattern:

0ms → Subtle score glow 150ms → Toast fades in 300ms → Sparkle pop /
small accent animation 900ms → Wobble settles 2000ms → Fade out

Avoid triggering all effects simultaneously.

------------------------------------------------------------------------

## 2. Phrase + Animation Decoupling

Not every event should trigger both text and animation.

Suggested probabilities (before celebration-level gating):

-   70% phrase
-   60% animation
-   30% both
-   10% phrase only
-   10% animation only

This creates organic variety.

------------------------------------------------------------------------

## 3. Legendary Intensity Gating

Legendary animations (full confetti, golden frame, crown) should trigger
only for:

-   PERFECT_29
-   NEAR_PERFECT_28
-   SKUNK
-   3+ streak escalation

Do NOT trigger for every 24.

------------------------------------------------------------------------

## 4. Maine Lodge Tone Moderation

Maine Lodge pack usage rates:

-   Classic: 0%
-   Lively: 10%
-   Full Banter: 30%

Prevent tone fatigue by blending packs.

------------------------------------------------------------------------

## 5. Lazy Loading Strategy

Lazy-load phrase and animation libraries on first celebration trigger:

``` javascript
const celebrations = await import('lib/celebrations');
```

Prevents unnecessary bundle weight on initial load.

------------------------------------------------------------------------

## 6. Emotional Design Principle

The celebration system should feel like:

-   A nod across the table
-   A raised eyebrow
-   A quiet chuckle
-   A clap on wood

Never like a slot machine.

Restraint preserves delight.
