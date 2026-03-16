# Cutting Experience Sampling Plan

**Created**: 2026-03-16
**Updated**: 2026-03-16
**Author**: Claude Code
**Status**: Ready for Review (v2 — Book-Open Reveal)

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Design: Book-Open Reveal](#design-book-open-reveal)
  - [Visual Sequence](#visual-sequence)
  - [The Deck at Rest](#the-deck-at-rest)
  - [The Split](#the-split)
  - [The Flip-Over Reveal](#the-flip-over-reveal)
  - [CSS 3D Implementation Strategy](#css-3d-implementation-strategy)
- 🤖 [x] [Phase 1: Build the Book-Open DeckCut](#phase-1-build-the-book-open-deckcut-🤖)
  - 🤖 [x] [Step 1.1: Render the deck at rest — side-profile card stack](#step-11-render-the-deck-at-rest--side-profile-card-stack-🤖)
  - 🤖 [x] [Step 1.2: Implement the split — two stacks separate](#step-12-implement-the-split--two-stacks-separate-🤖)
  - 🤖 [x] [Step 1.3: Implement the flip-over reveal](#step-13-implement-the-flip-over-reveal-🤖)
  - 🤖 [x] [Step 1.4: Wire up to CuttingSampler and game DeckCut](#step-14-wire-up-to-cuttingsampler-and-game-deckcut-🤖)
- 🤖 [x] [Phase 2: Polish and Test](#phase-2-polish-and-test-🤖)
  - 🤖 [x] [Step 2.1: Test with Playwright on localhost](#step-21-test-with-playwright-on-localhost-🤖)
  - 🤖 [x] [Step 2.2: Test with all card back types](#step-22-test-with-all-card-back-types-🤖)
- 🤖👤 [x] [Phase 3: Build, Deploy, and Verify](#phase-3-build-deploy-and-verify-🤖👤)
  - 🤖 [x] [Step 3.1: Build and deploy](#step-31-build-and-deploy-🤖)
  - 👤 [ ] [Step 3.2: Verify on Android](#step-32-verify-on-android-👤)

---

## Overview

Replace the current deck-cut variants with a single, authentic **book-open reveal** animation. Instead of lifting a portion straight up, the deck splits at a random point and the top stack **rotates open like a book being opened** — but unlike a book, it's not connected at the binding, so both stacks separate completely. As the top stack rotates over, the bottom card of that stack (the cut card) is gradually revealed.

This matches how a real person cuts a deck: grab the top portion, separate it from the bottom, and turn it over to show what's underneath.

[Back to TOC](#table-of-contents)

---

## Problem Statement

All previous deck-cut attempts lack **authenticity** because they treat the deck as a flat image that slides or lifts away. Real deck cutting has a distinctive physical motion:

1. A whole deck sits on the table
2. A hand grabs the top portion and lifts it slightly
3. The two halves separate — a visible gap appears
4. The top portion rotates/flips over in one fluid motion
5. The bottom card of the top portion is revealed face-up

No previous variant captures this **rotation** — they all just translate (move) the top portion without turning it. The key missing element is `rotateX` — the top stack must rotate around its bottom edge to reveal the underside card.

[Back to TOC](#table-of-contents)

---

## Design: Book-Open Reveal

### Visual Sequence

The animation tells a story in 4 beats:

```
BEAT 1 — Deck at rest:           BEAT 2 — Split:

  ┌───────────────────┐            ┌───────────────────┐ ← top stack
  │  card back face   │            │  card back face   │    lifts slightly
  │                   │            └───────────────────┘
  │┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄│                    ↕ gap
  │  edge  edge  edge │            ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  │  edge  edge  edge │            │  edge  edge  edge │ ← bottom stack
  └───────────────────┘            └───────────────────┘


BEAT 3 — Rotating over:          BEAT 4 — Revealed:

       ╱─────────────╲              ┌───────────────────┐
      ╱  card back    ╲             │   7 ♠             │
     ╱   (rotating)    ╲            │                   │ ← revealed card
    ╱___________________╲           └───────────────────┘
         visible card                      ↕
    ┌───────────────────┐            ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐
    │  edge  edge  edge │            │  edge  edge  edge │
    └───────────────────┘            └───────────────────┘
```

### The Deck at Rest

The deck is shown from a slightly elevated viewing angle — we see:
- **Top**: The card back design (full `DeckCardFace` at ~130×90px, landscape-ish aspect for the "top surface" perspective)
- **Front edge**: A thick band (~20-25px) of stacked card edges (alternating cream `#f5f0e8` / shadow `#e0d8c8` horizontal stripes), showing the deck's thickness
- **Shadow**: Soft shadow beneath the deck, grounding it on the "table"

The card back design is rendered with a slight `rotateX` perspective tilt (about 15-20 degrees) so it reads as lying flat on a table rather than facing the viewer.

**Size**: The whole deck visual is approximately 150px wide × 130px tall (card face + edge band + shadow).

### The Split

On tap, the deck splits at a random visual point within the edge band:
- The top stack (card face + upper portion of edges) lifts upward ~15px and separates from the bottom
- A visible gap appears between the two halves
- This happens over ~300ms with an ease-out transition

The split point is randomized (30-70% through the edge band) so it looks different each time — sometimes a thin top stack, sometimes a thick one.

### The Flip-Over Reveal

After the split, the top stack rotates around its **bottom edge** (the edge closest to the gap):

1. **Rotation** (0→180 degrees on X axis): The top stack rotates like opening a book face-down — `rotateX(0deg)` → `rotateX(-180deg)`. The `transform-origin` is set to `bottom center` so it pivots at the gap edge.

2. **During rotation**: At ~90 degrees, the top stack is edge-on (nearly invisible). Past 90 degrees, we start seeing the **underside** — which shows the revealed card face (rank + suit on white background).

3. **CSS 3D trick**: The top stack is a two-sided element:
   - **Front face** (`backface-visibility: hidden`): The card back design + edge thickness
   - **Back face** (`backface-visibility: hidden`, `rotateX(180deg)`): The revealed card (rank + suit)

   This way, as the stack rotates past 90 degrees, the card back naturally disappears and the revealed card naturally appears — no opacity tricks needed.

4. **Timing**: The rotation takes ~600-800ms with an `ease-in-out` curve (slow start as the "hand" lifts, fast through the middle, slow landing).

5. **Final state**: The revealed card sits face-up above the bottom stack, both resting on the table. The top-stack card back is now face-down (hidden) on top of the revealed card.

### CSS 3D Implementation Strategy

```
Container:
  perspective: 1000px
  perspective-origin: center 30%  (viewing from slightly above)

Deck at rest:
  transform: rotateX(20deg)  — tilted to show table perspective

Top stack (pre-split):
  transform-origin: bottom center
  transform: rotateX(0deg)     — lying flat
  transition: transform 0.7s ease-in-out

Top stack (post-split, pre-flip):
  transform: translateY(-15px)  — lift slightly

Top stack (flipping):
  transform: rotateX(-180deg)   — rotate around bottom edge

Top stack structure:
  <div class="top-stack" style="transform-style: preserve-3d">
    <!-- Front: card back -->
    <div style="backface-visibility: hidden">
      <DeckCardFace />
      <EdgeBand count={topEdges} />
    </div>
    <!-- Back: revealed card (pre-rotated 180) -->
    <div style="backface-visibility: hidden; transform: rotateX(180deg); position: absolute; inset: 0">
      <RevealedCard />
    </div>
  </div>
```

The edge band (front of stack) uses the same alternating stripe pattern from the Side-Edge variant: horizontal lines of `#f5f0e8` and `#e0d8c8`, with the number of stripes proportional to the split point (more stripes = thicker top stack).

[Back to TOC](#table-of-contents)

---

## Phase 1: Build the Book-Open DeckCut 🤖

### Step 1.1: Render the deck at rest — side-profile card stack 🤖

In `components/DeckCutVariants.jsx`, create a `BookOpenDeck` component:

- Render the card back at ~130×90px with `rotateX(20deg)` perspective tilt (lying on table)
- Below it, render a 20-25px edge band with alternating cream/shadow stripes
- Wrap in a container with `perspective: 1000px`
- Add soft `box-shadow` beneath for table grounding
- "TAP TO CUT" prompt on the card face

The card back image needs to be rendered in a slightly compressed vertical space (due to the perspective tilt) — this is handled automatically by CSS `rotateX`.

**File**: `components/DeckCutVariants.jsx`

[Back to TOC](#table-of-contents)

### Step 1.2: Implement the split — two stacks separate 🤖

On tap:
1. Choose a random split point (30-70% of the edge band)
2. The edge band splits into top-edges and bottom-edges
3. The top stack (card face + top-edges) translates `translateY(-15px)` over 300ms
4. A visible gap appears between top and bottom stacks

State machine: `idle` → `splitting` → `split` → `flipping` → `revealed`

**File**: `components/DeckCutVariants.jsx`

[Back to TOC](#table-of-contents)

### Step 1.3: Implement the flip-over reveal 🤖

After the split (300ms delay), the top stack rotates:
- `transform-origin: bottom center`
- `rotateX(0deg)` → `rotateX(-180deg)` over 700ms ease-in-out
- Front face: card back + edge stripes (with `backface-visibility: hidden`)
- Back face: the `RevealedCard` component (pre-rotated 180 degrees, also `backface-visibility: hidden`)
- The CSS 3D `preserve-3d` on the container makes the card naturally flip from showing the back design to showing the cut card

**File**: `components/DeckCutVariants.jsx`

[Back to TOC](#table-of-contents)

### Step 1.4: Wire up to CuttingSampler and game DeckCut 🤖

- Add `BookOpenDeck` to the `CuttingSampler` variant list (replace or add alongside existing variants)
- Add `'book-open'` as a variant option in `DeckCut.jsx` dispatcher
- Update the `VARIANTS` array in `CuttingSampler.jsx`

**Files**: `components/CuttingSampler.jsx`, `components/DeckCut.jsx`

[Back to TOC](#table-of-contents)

---

## Phase 2: Polish and Test 🤖

### Step 2.1: Test with Playwright on localhost 🤖

- Start dev server
- Login, open Admin Panel → Cutting tab
- Verify `BookOpenDeck` renders without errors
- Tap to cut, verify the flip animation plays
- Take screenshots at each animation phase
- Verify no console errors

**File**: Test script (temporary, not committed)

[Back to TOC](#table-of-contents)

### Step 2.2: Test with all card back types 🤖

Use the "Shuffle Card Back" button to verify the book-open animation works correctly with:
- Painting card backs (WebP images)
- SVG fullcard backs (inline SVG)
- Icon fullcard backs (large emoji)
- Standard icon backs (pattern + emoji + corners)

The `backface-visibility: hidden` must work correctly with all render types.

[Back to TOC](#table-of-contents)

---

## Phase 3: Build, Deploy, and Verify 🤖👤

### Step 3.1: Build and deploy 🤖

- Bump version in `lib/version.js`
- `rm -rf .next && npm run build`
- Git add, commit, push, deploy to production

[Back to TOC](#table-of-contents)

### Step 3.2: Verify on Android 👤

1. Open Admin Panel → Cutting tab
2. Find the Book-Open variant
3. Tap the deck — verify:
   - Deck splits at a random point in the edge band
   - Top stack rotates over (like opening a book)
   - Card back disappears as it rotates past 90 degrees
   - Cut card face appears on the underside
   - Final state: revealed card resting above the bottom stack
4. Tap "Shuffle Card Back" and try with different card types
5. Tap "Use This" to set as active
6. Start a new game — verify the book-open animation plays for both cut-for-dealer and cut-for-starter

[Back to TOC](#table-of-contents)

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `components/DeckCutVariants.jsx` | Modify | Add `BookOpenDeck` component |
| `components/DeckCutShared.jsx` | Read only | Shared `DeckCardFace` and `RevealedCard` |
| `components/CuttingSampler.jsx` | Modify | Add book-open to variant list |
| `components/DeckCut.jsx` | Modify | Add `'book-open'` to variant dispatcher |
| `lib/version.js` | Modify | Bump version |
