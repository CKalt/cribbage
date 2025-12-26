# Better Cut Deck Experience

## Table of Contents

- [x] [Overview](#overview)
- [x] [Problem Statement](#problem-statement)
- [x] [Phase 1: Visual Deck Component](#phase-1-visual-deck-component)
  - [x] [Step 1.1: Create DeckCut component 🤖](#step-11-create-deckcut-component-)
  - [x] [Step 1.2: Add cut animation CSS 🤖](#step-12-add-cut-animation-css-)
- [x] [Phase 2: Initial Cut (Determine Dealer)](#phase-2-initial-cut-determine-dealer)
  - [x] [Step 2.1: Replace cutting phase UI 🤖](#step-21-replace-cutting-phase-ui-)
  - [x] [Step 2.2: Add reveal animation 🤖](#step-22-add-reveal-animation-)
- [x] [Phase 3: Starter Card Cut](#phase-3-starter-card-cut)
  - [x] [Step 3.1: Add visual cut for starter card 🤖](#step-31-add-visual-cut-for-starter-card-)
  - [x] [Step 3.2: Integrate into deal flow 🤖](#step-32-integrate-into-deal-flow-)
- [ ] [Phase 4: Testing and Polish](#phase-4-testing-and-polish)
  - [ ] [Step 4.1: Local testing 👤](#step-41-local-testing-)
  - [ ] [Step 4.2: Deploy 🤖](#step-42-deploy-)

---

## Overview

Replace the basic "Cut Deck" button with an immersive visual experience that simulates actually cutting a deck of cards. This is a core part of the cribbage ritual and should feel tactile and satisfying.

[Back to TOC](#table-of-contents)

---

## Problem Statement

**Current Issues:**
1. **Initial cut**: Just a button that says "Cut Deck" - no visual deck, no sense of cutting
2. **Starter card cut**: Happens automatically with no player interaction
3. **Missing ritual**: Cutting the deck is an important part of cribbage - it determines luck and adds suspense

**Cut Points in Cribbage:**
1. **Initial cut** - Both players cut to determine who deals first (low card wins)
2. **Starter card cut** - Non-dealer cuts the deck to reveal the starter/turn-up card

**Goals:**
1. Show a visual deck of cards that the player can interact with
2. Let player tap/drag to indicate where to cut
3. Animate the deck splitting and card reveal
4. Make it feel like a real deck cut

[Back to TOC](#table-of-contents)

---

## Phase 1: Visual Deck Component

### Step 1.1: Create DeckCut component 🤖

**File:** `components/DeckCut.jsx`

Create a component that displays a visual deck and lets the player choose where to cut:

```jsx
Props:
- onCut(position): callback with cut position (0-1 representing where in deck)
- disabled: boolean
- label: string (e.g., "Cut for dealer" or "Cut for starter")

Visual design:
- Stack of cards shown from the side (like a real deck)
- ~52 card edges visible in a compressed stack
- Subtle gradient/shadow to show depth
- Hover indicator showing where cut will happen
- Click/tap to select cut point
```

**Interaction:**
- Player taps anywhere on the deck
- Deck animates splitting at that point
- Top portion lifts up and moves aside
- Bottom card of top portion revealed

[Back to TOC](#table-of-contents)

---

### Step 1.2: Add cut animation CSS 🤖

**File:** `components/DeckCut.jsx` (inline styles or separate CSS)

Animations needed:
- Deck split (top portion lifts and rotates slightly)
- Card reveal (flip or slide)
- Deck reassemble (for re-cuts on ties)

[Back to TOC](#table-of-contents)

---

## Phase 2: Initial Cut (Determine Dealer)

### Step 2.1: Replace cutting phase UI 🤖

**File:** `components/CribbageGame.jsx`

Replace the current cutting phase (lines ~1542-1573):
```jsx
// Current - bland button
<Button onClick={playerCutDeck}>Cut Deck</Button>

// New - visual deck cut
<DeckCut
  label="Cut for dealer (low card deals)"
  onCut={handlePlayerCut}
/>
```

Show both player and computer cuts side by side after both complete.

[Back to TOC](#table-of-contents)

---

### Step 2.2: Add reveal animation 🤖

After both cuts complete:
- Dramatic pause
- Cards flip to reveal
- Winner announcement with visual highlight
- Smooth transition to deal phase

[Back to TOC](#table-of-contents)

---

## Phase 3: Starter Card Cut

### Step 3.1: Add visual cut for starter card 🤖

**File:** `components/CribbageGame.jsx`

Currently the starter card appears automatically. Add a cut step:
- After cards dealt and crib selected
- Non-dealer (or player if they're non-dealer) cuts for starter
- Show deck, let player tap to cut
- Reveal starter card with animation

[Back to TOC](#table-of-contents)

---

### Step 3.2: Integrate into deal flow 🤖

Modify game flow:
1. Deal cards
2. Select crib cards
3. **NEW: Cut for starter** (visual deck cut)
4. Reveal starter card
5. Check for "his heels" (jack)
6. Begin play

[Back to TOC](#table-of-contents)

---

## Phase 4: Testing and Polish

### Step 4.1: Local testing 👤

Test scenarios:
1. Initial cut works with visual deck
2. Tie handling (re-cut) works smoothly
3. Starter card cut integrates properly
4. Animations feel natural on desktop and mobile
5. Touch targets are appropriate size

[Back to TOC](#table-of-contents)

---

### Step 4.2: Deploy 🤖

- Bump version
- Git add, commit, push
- Deploy to EC2

[Back to TOC](#table-of-contents)

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `components/DeckCut.jsx` | CREATE |
| `components/CribbageGame.jsx` | MODIFY |

---

## Visual Reference

```
Before cut:
┌─────────────┐
│ ░░░░░░░░░░░ │  <- Stack of card edges
│ ░░░░░░░░░░░ │
│ ░░░░░░░░░░░ │
│ ░░░░░░░░░░░ │
└─────────────┘

After cut (player tapped middle):
     ┌─────────────┐
     │ ░░░░░░░░░░░ │  <- Top portion lifted
     │ ░░░░░░░░░░░ │
     └─────────────┘
          ↓ revealed card
     ┌─────────────┐
     │    7 ♠      │
     └─────────────┘
     ┌─────────────┐
     │ ░░░░░░░░░░░ │  <- Bottom portion
     └─────────────┘
```

---

*Plan created: December 25, 2025*
