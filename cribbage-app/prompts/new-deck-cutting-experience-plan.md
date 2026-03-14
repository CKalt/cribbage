# New Deck Cutting Experience Plan

**Created**: 2026-03-12
**Author**: Claude Code
**Status**: Ready for Review

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Current Implementation](#current-implementation)
- [Design Options](#design-options)
  - [Option A: Lift-and-Reveal (Recommended)](#option-a-lift-and-reveal-recommended)
  - [Option B: Split-Deck Animation](#option-b-split-deck-animation)
  - [Option C: Minimal — Fix What's Broken](#option-c-minimal--fix-whats-broken)
- [Two Cut Scenarios](#two-cut-scenarios)
  - [Scenario 1: Cut for Dealer (start of game)](#scenario-1-cut-for-dealer-start-of-game)
  - [Scenario 2: Cut for Starter Card (start of each hand)](#scenario-2-cut-for-starter-card-start-of-each-hand)
- 🤖 [x] [Phase 1: Redesign the DeckCut Component](#phase-1-redesign-the-deckcut-component-🤖)
  - 🤖 [x] [Step 1.1: Create a larger card-back rendering for the deck](#step-11-create-a-larger-card-back-rendering-for-the-deck-🤖)
  - 🤖 [x] [Step 1.2: Build the 3D deck stack visual](#step-12-build-the-3d-deck-stack-visual-🤖)
  - 🤖 [x] [Step 1.3: Implement the lift-and-reveal cut animation](#step-13-implement-the-lift-and-reveal-cut-animation-🤖)
  - 🤖 [x] [Step 1.4: Implement the revealed card appearance](#step-14-implement-the-revealed-card-appearance-🤖)
- 🤖 [x] [Phase 2: Update the Cut-for-Dealer Layout](#phase-2-update-the-cut-for-dealer-layout-🤖)
  - 🤖 [x] [Step 2.1: Redesign the side-by-side dealer cut UI](#step-21-redesign-the-side-by-side-dealer-cut-ui-🤖)
- 🤖 [x] [Phase 3: Update the Cut-for-Starter Layout](#phase-3-update-the-cut-for-starter-layout-🤖)
  - 🤖 [x] [Step 3.1: Redesign the starter card cut UI](#step-31-redesign-the-starter-card-cut-ui-🤖)
- 🤖👤 [x] [Phase 4: Build, Deploy, and Verify](#phase-4-build-deploy-and-verify-🤖👤)
  - 🤖 [x] [Step 4.1: Build and deploy](#step-41-build-and-deploy-🤖)
  - 👤 [ ] [Step 4.2: Verify both cut scenarios on Android](#step-42-verify-both-cut-scenarios-on-android-👤)

---

## Overview

The deck cutting experience needs a full redesign. In real cribbage, cutting the deck means lifting a portion of cards off the top to reveal a card underneath. The current implementation looks nothing like this — it shows tiny cards that do a confusing coin-flip animation.

This plan redesigns both cut scenarios (cut for dealer, cut for starter) with a visual that actually resembles cutting a deck of cards, using a 3D card stack with a lift-and-reveal animation.

[Back to TOC](#table-of-contents)

---

## Problem Statement

### What the user sees today

1. **Cut for Dealer**: Two small card-back shapes (~48×64px) side by side. When tapped, a revealed card does a `rotateY` flip animation (like a coin spinning). Since there's no `backface-visibility: hidden`, the card face shows on BOTH sides during the flip — the user never sees an actual card back during the animation. It looks like "two cards flipping like pancakes at the same time." There is nothing that visually represents a deck being cut.

2. **Cut for Starter**: A single small card-back shape with the same coin-flip reveal. Again, no visual connection to the act of cutting a deck.

### What's wrong technically

| Issue | Detail |
|-------|--------|
| **No deck visual** | The `DeckCut` component renders a single `CardBack` at size `lg` (48×64px) with some CSS shadow layers behind it. This is too small and doesn't look like a deck. |
| **Broken flip animation** | The `deck-card-reveal` keyframe uses `rotateY(180deg→0deg)` but the div has no `backface-visibility: hidden` and no actual card-back face to show. Both sides show the card face. |
| **No "cutting" motion** | Nothing lifts, separates, or slides apart. The "cut" is just: tap → card appears with a flip. |
| **Confusing dealer cut layout** | Two identical DeckCut components side-by-side with "Your cut" / "Computer's cut" labels. User taps one, both animate, looks like two random cards appearing. |
| **Redundant labels** | Previously had 3 instructions saying "tap to cut" (partially fixed, but label/layout still cluttered). |

### Desired result

A deck that **looks like a stack of 52 cards**, rendered at a size large enough to be visually substantial (~120×168px). When tapped, the top portion **lifts up and away** like physically lifting cards off a deck, revealing the cut card underneath. No coin-flip animation. Clean, satisfying, immediately understandable as "cutting a deck."

[Back to TOC](#table-of-contents)

---

## Current Implementation

### Files involved

| File | Role |
|------|------|
| `components/DeckCut.jsx` | The `DeckCut` component (single deck) and `DualDeckCut` (side-by-side for dealer) |
| `components/CribbageGame.jsx` | Renders `DeckCut` in two game states: `cutting` (dealer) and `cutForStarter` (starter) |
| `components/CardBack.jsx` | The `CardBack` component used for the deck face; `CardBackPreview` for full-screen preview |

### Current game state flow

**Cut for Dealer** (`gameState === 'cutting'`, ~line 3028):
1. Two side-by-side DeckCut components with "Your cut" / "Computer's cut" labels
2. Player taps their deck → `playerCutDeck()` called → card assigned
3. After 800ms, computer auto-cuts → card assigned
4. Compare ranks, lower card wins → "Deal the Cards" button appears

**Cut for Starter** (`gameState === 'cutForStarter'`, ~line 3079):
1. Single DeckCut, non-dealer cuts
2. If player is non-dealer: they tap → `handleStarterCut()` called
3. If computer is non-dealer: auto-cuts after 1000ms delay
4. Card revealed → if Jack, "His heels!" celebration → transition to `play`

[Back to TOC](#table-of-contents)

---

## Design Options

### Option A: Lift-and-Reveal (Recommended)

**Concept**: A single large deck (~120×168px) rendered as the card back design with 3D depth layers. When tapped, the top portion lifts upward and tilts back (like actually lifting cards off a real deck), revealing the cut card in the gap.

**Visual sequence**:
```
BEFORE CUT:                    DURING CUT:                    AFTER CUT:
┌─────────┐                    ┌─────────┐ ← lifted portion   ┌─────────┐
│         │                    │ card    │   tilts back        │ card    │
│  card   │                    │ back    │   and fades         │ back    │
│  back   │    tap →           └─────────┘                     └─────────┘
│ design  │                         ↕ gap                          ↕
│         │                    ┌─────────┐                     ┌─────────┐
│         │                    │  7  ♠   │ ← revealed card     │  7  ♠   │
└─────────┘                    └─────────┘                     └─────────┘
  3D depth                       bottom                          bottom
  layers                         remains                         remains
```

**Pros**:
- Most realistic — matches how you actually cut a deck
- Single clear action — tap → lift → reveal
- The card back is prominently visible before the cut
- No confusing flip animation

**Cons**:
- More complex animation (multiple moving parts)
- Need to manage two halves of the deck

**For the dealer cut**: Show one deck centered. Player taps → top half lifts, player's card revealed. Then deck "resets," computer taps → same animation, computer's card revealed. Both cards then displayed side-by-side below for comparison.

[Back to TOC](#table-of-contents)

### Option B: Split-Deck Animation

**Concept**: The deck splits horizontally when tapped — top half slides left, bottom half slides right, and the cut card appears in the center gap.

**Visual sequence**:
```
BEFORE:          AFTER:
┌─────────┐     ┌────┐         ┌────┐
│         │     │top │ ┌─────┐ │bot │
│  card   │ →   │half│ │ 7 ♠ │ │half│
│  back   │     │    │ └─────┘ │    │
└─────────┘     └────┘         └────┘
```

**Pros**: Dramatic, clearly shows "splitting"
**Cons**: Less realistic to actual cribbage, horizontal space required, more complex

[Back to TOC](#table-of-contents)

### Option C: Minimal — Fix What's Broken

**Concept**: Keep the current layout but fix the actual bugs: add `backface-visibility`, use a proper card back face during flip, increase card size, remove redundant text.

**Pros**: Least work
**Cons**: Still doesn't look like cutting a deck — just a bigger, less broken version of the current design

[Back to TOC](#table-of-contents)

---

## Two Cut Scenarios

### Scenario 1: Cut for Dealer (start of game)

**When**: At the very beginning of a new game, before any cards are dealt.

**Purpose**: Each player cuts the deck. Lowest card becomes the dealer (and the opponent leads first).

**Proposed UX (Option A)**:

1. **Initial state**: One large deck in the center. Message: "Cut the deck to determine dealer (low card deals)". Below the deck: "Tap to cut".

2. **Player taps**: The top portion of the deck lifts up and tilts back, revealing the player's cut card. The lifted portion fades out. The player's card stays visible, slightly above the remaining deck.

3. **Brief pause** (800ms), then the deck "resets" visually (the lifted portion returns / deck looks whole again).

4. **Computer cuts**: Same lift animation auto-plays. Computer's card is revealed.

5. **Result display**: Both cards shown side-by-side with labels ("You: 7♠" / "Computer: 3♥"), message announces the result ("Computer cut lower — Computer deals first"), and a "Continue" button appears.

**Alternative for dealer cut**: Instead of one deck cutting twice, show two smaller decks side-by-side (like today but with better visuals — each is a proper 3D stack that does the lift-and-reveal). This is simpler to implement but the user found two decks confusing.

### Scenario 2: Cut for Starter Card (start of each hand)

**When**: After the discard phase, before pegging begins. The non-dealer cuts.

**Purpose**: Reveal the starter card (shared community card).

**Proposed UX (Option A)**:

1. **Initial state**: One deck in the center. Message: "Cut for the starter card". The player's hand is shown above for reference.

2. **Player taps** (or computer auto-cuts after 1s): Top portion lifts, starter card revealed.

3. **Card revealed**: The cut card appears cleanly from the gap. If it's a Jack, the "His heels!" celebration fires.

4. **Transition**: After a brief pause, the game proceeds to the play phase with the starter card displayed in its usual position.

[Back to TOC](#table-of-contents)

---

## Phase 1: Redesign the DeckCut Component 🤖

### Step 1.1: Create a larger card-back rendering for the deck 🤖

The current `CardBack` component maxes out at `lg` = 48×64px — far too small for a deck visual. Rather than adding an `xl` size to CardBack (which could affect other places it's used), the DeckCut component will render the card back directly at a custom size.

Create a `DeckCardFace` internal component within DeckCut.jsx that:
- Accepts `width` and `height` props (default: 120×168px)
- Reads the card back design from `useCardBack()` context
- Renders the card back at that custom size using the same logic as CardBack.jsx:
  - **Painting** (`sceneImage`): Image with `object-contain`, cream bg
  - **SVG fullcard** (`sceneSvg`): Pattern + inline SVG
  - **Icon fullcard**: Pattern + large centered emoji
  - **Icon standard**: Pattern + center icon + corner icons

This ensures the deck shows the full card back design at a substantial size.

[Back to TOC](#table-of-contents)

### Step 1.2: Build the 3D deck stack visual 🤖

Render the deck as:
- **Top card**: Full card-back design at 120×168px via `DeckCardFace`
- **Depth layers**: 6-8 thin offset rectangles behind the top card using `translateZ` and slight `translateX`/`translateY` offsets, creating a visible 3D thickness
- **Container**: `perspective: 600px`, slight `rotateX(3deg)` tilt to enhance 3D appearance
- **Shadow**: Bottom-most layer has a `box-shadow` for grounding

The overall visual should clearly read as "a stack of cards" rather than "a single card."

[Back to TOC](#table-of-contents)

### Step 1.3: Implement the lift-and-reveal cut animation 🤖

When the user taps:

1. **Lifted portion** (0-400ms): A copy of the `DeckCardFace` translates upward (`translateY(-80px)`) and rotates slightly (`rotateZ(-5deg) rotateX(15deg)`). This is the "top half" being lifted off the deck.

2. **Gap reveal** (200-600ms): The revealed card fades in / scales up from the gap between the lifted portion and the remaining deck. No rotateY flip — just a clean `opacity: 0→1` with slight `scale(0.9→1)` for a smooth appearance.

3. **Lifted portion fades** (400-800ms): The lifted portion fades to `opacity: 0` and is removed.

4. **Final state**: The revealed card sits prominently with the remaining deck visible behind/below it.

**No `rotateY` flip animation.** The card simply appears face-up from the cut gap, as it would in real life.

[Back to TOC](#table-of-contents)

### Step 1.4: Implement the revealed card appearance 🤖

The revealed card renders as:
- White card face with rank + suit
- Yellow border (border-2 border-yellow-400) to highlight it
- Subtle shadow for depth
- Size: ~80×112px (slightly smaller than the deck)
- Red text for hearts/diamonds, black for spades/clubs

[Back to TOC](#table-of-contents)

---

## Phase 2: Update the Cut-for-Dealer Layout 🤖

### Step 2.1: Redesign the side-by-side dealer cut UI 🤖

Replace the current two-side-by-side DeckCut layout in CribbageGame.jsx (`gameState === 'cutting'`, ~line 3028).

**New layout — Sequential cuts from one deck**:

The dealer-cut uses a single centered deck. The flow is:

1. **State: waiting for player cut**
   - One deck centered, "Tap the deck to cut" prompt
   - "Your cut" / "Computer's cut" labels are NOT shown yet

2. **State: player has cut**
   - Lift animation plays, player's card appears
   - Player's card labeled "Your cut: [rank][suit]" displayed to the left
   - Deck resets (lifted portion returns), brief 800ms pause

3. **State: computer cuts**
   - Lift animation auto-plays
   - Computer's card labeled "Computer's cut: [rank][suit]" displayed to the right

4. **State: both have cut**
   - Both cards shown side-by-side below the deck
   - Result message: "You cut lower — You deal first" (or Computer)
   - "Deal the Cards" / "Let Computer Deal" button

This requires managing internal state within the dealer-cut section to track which phase we're in: `playerCut → computerCut → showResult`.

**Files to modify**: `components/DeckCut.jsx` (core component), `components/CribbageGame.jsx` (dealer cut section ~lines 3028-3076)

[Back to TOC](#table-of-contents)

---

## Phase 3: Update the Cut-for-Starter Layout 🤖

### Step 3.1: Redesign the starter card cut UI 🤖

Update the CribbageGame.jsx `cutForStarter` section (~lines 3079-3130).

This is simpler since it's always a single cut:
- Show one centered deck with prompt "Cut for the starter card"
- Player (or computer) cuts → lift animation → card revealed
- After reveal + celebration (if Jack), transition to play

No layout changes needed beyond using the redesigned DeckCut component — the single-deck flow already works for this scenario.

**Files to modify**: `components/CribbageGame.jsx` (starter cut section ~lines 3079-3130, may need minor prop adjustments)

[Back to TOC](#table-of-contents)

---

## Phase 4: Build, Deploy, and Verify 🤖👤

### Step 4.1: Build and deploy 🤖

- Bump version in `lib/version.js`
- `rm -rf .next && npm run build`
- Git add, commit, push, deploy to production

[Back to TOC](#table-of-contents)

### Step 4.2: Verify both cut scenarios on Android 👤

Test on Android:

1. **Cut for Dealer**: Start a new game. Verify:
   - Single large deck visible with card back design
   - Tap → top portion lifts, your card revealed cleanly (no coin flip)
   - Deck resets, computer cuts with same animation
   - Both cards shown with result message
   - "Deal the Cards" button works

2. **Cut for Starter**: Play through to the discard phase. Verify:
   - Single deck shown with "Cut for the starter card"
   - Tap → lift animation → starter card revealed
   - If Jack: "His heels!" celebration fires
   - Transition to play phase works normally

3. **Card back variety**: Test with different card back types (painting, SVG fullcard, icon) to ensure the deck renders correctly for each.

4. **Resume**: Verify that resuming a saved game at the cut phase works correctly.

[Back to TOC](#table-of-contents)
