# Cutting Experience Sampling Plan

**Created**: 2026-03-16
**Author**: Claude Code
**Status**: Ready for Review

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Design: Three Visual Variants](#design-three-visual-variants)
  - [Variant A: Angled Perspective](#variant-a-angled-perspective)
  - [Variant B: Side-Edge Stack](#variant-b-side-edge-stack)
  - [Variant C: Isometric Clean](#variant-c-isometric-clean)
- 🤖 [x] [Phase 1: Create Variant Components](#phase-1-create-variant-components-🤖)
  - 🤖 [x] [Step 1.1: Export shared internals from DeckCut.jsx](#step-11-export-shared-internals-from-decutjsx-🤖)
  - 🤖 [x] [Step 1.2: Build Variant A — Angled Perspective](#step-12-build-variant-a--angled-perspective-🤖)
  - 🤖 [x] [Step 1.3: Build Variant B — Side-Edge Stack](#step-13-build-variant-b--side-edge-stack-🤖)
  - 🤖 [x] [Step 1.4: Build Variant C — Isometric Clean](#step-14-build-variant-c--isometric-clean-🤖)
- 🤖 [x] [Phase 2: Add Cutting Tab to Admin Panel](#phase-2-add-cutting-tab-to-admin-panel-🤖)
  - 🤖 [x] [Step 2.1: Add the tab button and routing](#step-21-add-the-tab-button-and-routing-🤖)
  - 🤖 [x] [Step 2.2: Build the CuttingSampler component](#step-22-build-the-cuttingsampler-component-🤖)
  - 🤖 [x] [Step 2.3: Wire up "Use This Style" persistence](#step-23-wire-up-use-this-style-persistence-🤖)
- 🤖 [x] [Phase 3: Integrate Chosen Style into Game](#phase-3-integrate-chosen-style-into-game-🤖)
  - 🤖 [x] [Step 3.1: DeckCut variant dispatcher](#step-31-deckcut-variant-dispatcher-🤖)
  - 🤖 [x] [Step 3.2: Pass variant prop from CribbageGame](#step-32-pass-variant-prop-from-cribbagegame-🤖)
- 🤖👤 [x] [Phase 4: Build, Deploy, and Verify](#phase-4-build-deploy-and-verify-🤖👤)
  - 🤖 [x] [Step 4.1: Build and deploy](#step-41-build-and-deploy-🤖)
  - 👤 [ ] [Step 4.2: Compare variants in Admin Panel and select one](#step-42-compare-variants-in-admin-panel-and-select-one-👤)

---

## Overview

Add a **"Cutting" tab** to the Admin Panel that shows 2-3 visual variants of the deck-cutting experience side by side. Each variant renders a 3D deck stack using a randomly-selected card back (via the existing 2-stage type/instance selection), with a tap-to-cut cycle that plays the lift-and-reveal animation. The user can compare approaches and select one as the active style for gameplay.

[Back to TOC](#table-of-contents)

---

## Problem Statement

The deck cut visual has gone through several iterations (thin bars → tiny CardBack → 120px DeckCardFace), none of which have felt authentic. The core issue is that there's no way to iterate on the visual design without playing through a game. The user needs a sampling tool to preview and compare different 3D deck rendering approaches, then lock in the one that looks best.

[Back to TOC](#table-of-contents)

---

## Design: Three Visual Variants

All variants share the same `DeckCardFace` component (renders card back at custom size) and `RevealedCard` component (white card with rank/suit). They differ in how the deck stack is rendered and how the cut animation plays.

### Variant A: Angled Perspective

The deck viewed from above-right at ~25 degrees. CSS 3D perspective creates a realistic viewing angle with visible card-edge thickness on two sides.

```
     ┌─────────────┐ ← top card (full card back design)
    ╱│            ╱│
   ╱ │           ╱ │ ← right edge (12-15 layers, cream card-edge color)
  ╱  │          ╱  │
 └───┼─────────┘   │
     └─────────────┘ ← bottom edge (visible due to rotateX tilt)
       soft shadow on "table"
```

**CSS approach**:
- Container: `perspective: 800px`
- Deck: `transform: rotateX(25deg) rotateY(-8deg)`
- 12-15 depth layers offset by 1px vertical + 0.3px horizontal each
- Edge layers use card-edge color `#f5f0e8` (cream, like real card stock)
- Card size: **140×196px**

**Cut animation**:
- Top lifts `translateY(-90px) translateX(15px) rotateZ(-8deg)` — hand pulling cards off
- Fade: 1→0.6→0 over 400ms
- Revealed card: opacity 0→1 with scale(0.9→1), 300ms delay

[Back to TOC](#table-of-contents)

### Variant B: Side-Edge Stack

Deck viewed from near eye-level (~30° above). Emphasis is on the thick stack of card edges visible below the top card face.

```
  ┌─────────────────┐
  │                 │ ← top card face (fully visible)
  │   card back     │
  │   design        │
  ├─────────────────┤
  ║ ═══════════════ ║ ← thick band of card edges
  ║ ═══════════════ ║   (15-20 lines alternating cream/shadow)
  ╚═════════════════╝
       table shadow
```

**CSS approach**:
- No CSS 3D — achieved with 2D layering
- Top card: `DeckCardFace` at **130×182px**
- Below the card: 20px-tall band of horizontal stripes (alternating `#f5f0e8` and `#e8e0d0`) for laminated-edge look
- Subtle `rotateX(5deg)` on whole assembly
- Card size: **130×182px** + 20px edge band

**Cut animation**:
- Top card lifts straight up: `translateY(-100px) rotateZ(-4deg)`
- Edge band splits visually (top half goes with lifted card)
- Revealed card slides up from within the gap

[Back to TOC](#table-of-contents)

### Variant C: Isometric Clean

A graphic-design-style isometric stack. No CSS 3D — depth created by stacking offset card copies with a strong drop shadow. Polished and app-like.

```
  ┌─────────────┐
  │ card back   │
  │ design      │  ← top card
  └─┬───────────┘
    └─┬───────────┐
      └─┬─────────┘  ← 8-10 offset copies creating depth
        └─────────┘
         soft shadow
```

**CSS approach**:
- 8-10 stacked `DeckCardFace` elements, each offset by `(2px, 2px)`
- Each layer at decreasing opacity
- Top card with `box-shadow: 0 4px 12px rgba(0,0,0,0.3)`
- Large soft shadow beneath entire stack
- Card size: **130×182px**

**Cut animation**:
- Top card lifts `translateY(-80px) translateX(10px) rotateZ(3deg)`
- Clean opacity fade
- Revealed card pops in with slight bounce: `scale(0.8→1.05→1)` via keyframes

[Back to TOC](#table-of-contents)

---

## Phase 1: Create Variant Components 🤖

### Step 1.1: Export shared internals from DeckCut.jsx 🤖

Add `export` keyword to `DeckCardFace` and `RevealedCard` functions in `components/DeckCut.jsx` so the variant file can import them.

**File**: `components/DeckCut.jsx`

[Back to TOC](#table-of-contents)

### Step 1.2: Build Variant A — Angled Perspective 🤖

Create `components/DeckCutVariants.jsx` with `AngledDeck` component:
- Uses CSS 3D `perspective` + `rotateX(25deg) rotateY(-8deg)`
- 12-15 card-edge layers at `#f5f0e8`
- `DeckCardFace` at 140×196px as top card
- Self-contained lift animation state machine (idle→lifting→lifted→fading→done)
- Accepts `onCut`, `disabled`, `revealedCard`, `showCutAnimation` props (same as DeckCut)

[Back to TOC](#table-of-contents)

### Step 1.3: Build Variant B — Side-Edge Stack 🤖

Add `SideEdgeDeck` component to `DeckCutVariants.jsx`:
- 2D layering approach
- `DeckCardFace` at 130×182px + 20px card-edge band below
- Edge band uses alternating horizontal stripes for realism
- Lift animation: straight-up pull with edge band split

[Back to TOC](#table-of-contents)

### Step 1.4: Build Variant C — Isometric Clean 🤖

Add `IsometricDeck` component to `DeckCutVariants.jsx`:
- 8-10 offset copies, no CSS 3D
- `DeckCardFace` at 130×182px
- Strong drop shadow, clean offset layering
- Bounce reveal animation via keyframes

[Back to TOC](#table-of-contents)

---

## Phase 2: Add Cutting Tab to Admin Panel 🤖

### Step 2.1: Add the tab button and routing 🤖

In `components/AdminPanel.jsx`:
- Add a `"Cutting"` tab button after `"Card Backs"`, value `'cutting'`
- Add `activeTab === 'cutting'` content branch that renders `<CuttingSampler />`
- No API fetch needed on tab open

**File**: `components/AdminPanel.jsx`

[Back to TOC](#table-of-contents)

### Step 2.2: Build the CuttingSampler component 🤖

Create `components/CuttingSampler.jsx`:

**CardBackContext wrapping**: AdminPanel renders outside the game's CardBackContext. CuttingSampler must:
1. Call `pickCardBack(Date.now())` to get a random card back design
2. Wrap variants in `<CardBackContext.Provider value={design}>`
3. Provide a **"Shuffle Card Back"** button that picks a new random design — so the user can see how each variant looks with different card types (painting, SVG, icon)

**Layout**:
- Vertically stacked on mobile (each variant in its own card)
- Each variant card contains:
  - Title: "Angled Perspective" / "Side Edge" / "Isometric"
  - The variant component with tap-to-cut behavior
  - **"Reset"** button to reset the cut state
  - **"Use This Style"** button (green checkmark if currently active)

**Self-contained cut cycle**: Each variant manages its own internal state. On tap, it runs its lift animation and reveals a locally-generated random card (random rank + random suit). Reset button clears the state.

**Files**: `components/CuttingSampler.jsx` (new), `components/AdminPanel.jsx` (modified)

[Back to TOC](#table-of-contents)

### Step 2.3: Wire up "Use This Style" persistence 🤖

**localStorage key**: `cribbage-deckcut-style`
**Values**: `'angled'` | `'side-edge'` | `'isometric'` | `'classic'`
**Default**: `'classic'` (current DeckCut unchanged)

On CuttingSampler mount, read from localStorage to highlight the active style. On "Use This Style" click, write to localStorage. No API endpoint needed — client-side only.

[Back to TOC](#table-of-contents)

---

## Phase 3: Integrate Chosen Style into Game 🤖

### Step 3.1: DeckCut variant dispatcher 🤖

Modify `components/DeckCut.jsx` to accept a `variant` prop:
- `'angled'` → render `AngledDeck` from `DeckCutVariants.jsx`
- `'side-edge'` → render `SideEdgeDeck`
- `'isometric'` → render `IsometricDeck`
- `'classic'` or `undefined` → render current implementation (unchanged)

All variants receive the same props (`onCut`, `disabled`, `label`, `revealedCard`, `showCutAnimation`).

**File**: `components/DeckCut.jsx`

[Back to TOC](#table-of-contents)

### Step 3.2: Pass variant prop from CribbageGame 🤖

In `components/CribbageGame.jsx`:
- Read `localStorage.getItem('cribbage-deckcut-style')` on mount
- Store in state: `const [deckCutStyle, setDeckCutStyle] = useState('classic')`
- Pass `variant={deckCutStyle}` to all `<DeckCut>` renderings (both `cutting` and `cutForStarter` game states)

**File**: `components/CribbageGame.jsx`

[Back to TOC](#table-of-contents)

---

## Phase 4: Build, Deploy, and Verify 🤖👤

### Step 4.1: Build and deploy 🤖

- Bump version in `lib/version.js`
- `rm -rf .next && npm run build`
- Git add, commit, push, deploy to production

[Back to TOC](#table-of-contents)

### Step 4.2: Compare variants in Admin Panel and select one 👤

1. Open Admin Panel → Cutting tab
2. Tap "Shuffle Card Back" a few times to see variants with different card types
3. Tap each deck to test the cut animation
4. Tap "Reset" to try again
5. Select "Use This Style" on the preferred variant
6. Start a new game — verify the game uses the selected cutting style
7. Test both cut-for-dealer and cut-for-starter scenarios

[Back to TOC](#table-of-contents)

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `components/DeckCut.jsx` | Modify | Export `DeckCardFace`/`RevealedCard`, add `variant` prop dispatcher |
| `components/DeckCutVariants.jsx` | **Create** | Three variant components: `AngledDeck`, `SideEdgeDeck`, `IsometricDeck` |
| `components/CuttingSampler.jsx` | **Create** | Admin tab content with CardBackContext wrapping, shuffle, reset, style selection |
| `components/AdminPanel.jsx` | Modify | Add "Cutting" tab button and content routing |
| `components/CribbageGame.jsx` | Modify | Read persisted style from localStorage, pass as `variant` prop |
| `lib/version.js` | Modify | Bump version |
