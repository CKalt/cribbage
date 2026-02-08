# Pegging Card Flight Animation - Production

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [ ] [Phase 1: CSS Keyframes & Animation Infrastructure](#phase-1-css-keyframes--animation-infrastructure) 🤖
  - [ ] [1.1: Add card-fly keyframe to globals.css](#11-add-card-fly-keyframe-to-globalscss-🤖)
  - [ ] [1.2: Add flying-card overlay styles](#12-add-flying-card-overlay-styles-🤖)
- [ ] [Phase 2: FlyingCard Component](#phase-2-flyingcard-component) 🤖
  - [ ] [2.1: Create FlyingCard overlay component](#21-create-flyingcard-overlay-component-🤖)
- [ ] [Phase 3: Integrate into CribbageGame.jsx](#phase-3-integrate-into-cribbagegamejsx) 🤖
  - [ ] [3.1: Add refs to hand container and play area](#31-add-refs-to-hand-container-and-play-area-🤖)
  - [ ] [3.2: Add flying card state and trigger logic](#32-add-flying-card-state-and-trigger-logic-🤖)
  - [ ] [3.3: Modify playerPlay to animate before state update](#33-modify-playerplay-to-animate-before-state-update-🤖)
  - [ ] [3.4: Add computer card animation](#34-add-computer-card-animation-🤖)
  - [ ] [3.5: Render FlyingCard in the component tree](#35-render-flyingcard-in-the-component-tree-🤖)
- [ ] [Phase 4: Polish & Tuning](#phase-4-polish--tuning) 🤖
  - [ ] [4.1: Add subtle arc to the flight path](#41-add-subtle-arc-to-the-flight-path-🤖)
  - [ ] [4.2: Add landing impact effect on the played pile](#42-add-landing-impact-effect-on-the-played-pile-🤖)
  - [ ] [4.3: Card shrink during flight to match PlayedCard size](#43-card-shrink-during-flight-to-match-playedcard-size-🤖)
- [ ] [Phase 5: Build, Commit & Deploy to Production](#phase-5-build-commit--deploy-to-production) 🤖👤
  - [ ] [5.1: Build and verify](#51-build-and-verify-🤖)
  - [ ] [5.2: Git add and commit](#52-git-add-and-commit-🤖)
  - [ ] [5.3: Push and deploy to production](#53-push-and-deploy-to-production-🤖👤)
- [ ] [Phase 6: Testing](#phase-6-testing) 👤
  - [ ] [6.1: Visual testing on desktop and mobile](#61-visual-testing-on-desktop-and-mobile-👤)

---

## Overview

This plan adds a satisfying card-flight animation to the single-player pegging phase at `cribbage.chrisk.com` (production, `main` branch). When a player taps a card, it visually flies from their hand up to the played-cards pile, shrinking along the way. The computer's cards will fly from the top (face-down area) down to the pile. This creates a tactile, exciting feel that makes pegging more engaging.

**Branch:** `main` | **Deploy target:** `cribbage.chrisk.com`

**Approach:** A fixed-position overlay card "ghost" animates from the source card's screen position to the played-pile's screen position using CSS `@keyframes` with custom properties (`--fly-x`, `--fly-y`). The real card is hidden during flight, then the state update adds it to the played pile once the animation completes. No layout changes, no DOM restructuring — just a visual overlay during the ~400ms flight.

[Back to TOC](#table-of-contents)

---

## Problem Statement

During the pegging phase, playing a card feels abrupt. The card instantly disappears from the hand and appears in the played pile with no visual transition. Players have no sense of movement or continuity — the card simply vanishes and reappears. This makes the game feel flat, especially compared to a physical card game where you physically slide a card to the table. Adding a flight animation creates visual continuity and a small dopamine hit on each play.

[Back to TOC](#table-of-contents)

---

## Phase 1: CSS Keyframes & Animation Infrastructure

### 1.1: Add card-fly keyframe to globals.css 🤖

**File:** `app/globals.css`

Add a new `@keyframes cardFly` animation after the existing `slideUp` keyframe (line 138). This animation uses CSS custom properties so each flight can have a unique trajectory:

```css
@keyframes cardFly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(calc(var(--fly-x) * 0.5), calc(var(--fly-y) * 0.5 - 30px)) scale(0.85);
    opacity: 1;
  }
  100% {
    transform: translate(var(--fly-x), var(--fly-y)) scale(0.6);
    opacity: 0.9;
  }
}
```

Key characteristics:
- **Custom properties** `--fly-x` and `--fly-y` set per-instance so the same keyframe works for any source→target path
- **Arc at 50%**: The `-30px` Y offset at midpoint creates a gentle upward arc (card lifts before landing)
- **Scale 1 → 0.6**: Card shrinks from full PlayingCard size to approximate PlayedCard size
- **Duration**: 400ms (set on the element, not in the keyframe)
- **No opacity fade-out** at end — the card stays visible until the real PlayedCard renders

[Back to TOC](#table-of-contents)

---

### 1.2: Add flying-card overlay styles 🤖

**File:** `app/globals.css`

Add a utility class for the flying card:

```css
.flying-card {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  animation: cardFly 400ms ease-out forwards;
}
```

[Back to TOC](#table-of-contents)

---

## Phase 2: FlyingCard Component

### 2.1: Create FlyingCard overlay component 🤖

**File:** `components/FlyingCard.jsx` (new file)

A lightweight component that renders a card at a fixed screen position and animates it to a target position. It self-destructs via an `onComplete` callback when the animation ends.

**Props:**
- `card` — The card object `{ rank, suit, value }`
- `startRect` — Source element's `getBoundingClientRect()` `{ top, left, width, height }`
- `endRect` — Target element's `getBoundingClientRect()` `{ top, left }`
- `onComplete` — Called when animation finishes (triggers state update in parent)
- `isComputerCard` — If true, render face-down during flight, reveal on landing (optional enhancement)

**Implementation notes:**
- Renders a `div` with `position: fixed`, placed at `startRect.top/left`
- Sets `--fly-x` and `--fly-y` CSS custom properties: `endRect.left - startRect.left`, `endRect.top - startRect.top`
- Uses `onAnimationEnd` event to call `onComplete`
- The card content matches PlayingCard styling (white bg, colored text, same padding) so it looks identical to the card it's replacing
- Render via React Portal into `document.body` to avoid clipping by overflow containers

[Back to TOC](#table-of-contents)

---

## Phase 3: Integrate into CribbageGame.jsx

### 3.1: Add refs to hand container and play area 🤖

**File:** `components/CribbageGame.jsx`

Add two refs to track DOM positions:

```javascript
const playerPlayAreaRef = useRef(null);   // "Your plays:" div
const computerPlayAreaRef = useRef(null); // "Computer's plays:" div
```

Attach `playerPlayAreaRef` to the "Your plays:" container (line 2512 area):
```jsx
<div ref={playerPlayAreaRef} className="flex flex-wrap gap-1 min-h-[40px]">
```

Attach `computerPlayAreaRef` to the "Computer's plays:" container (line 2503 area):
```jsx
<div ref={computerPlayAreaRef} className="flex flex-wrap gap-1 min-h-[40px]">
```

[Back to TOC](#table-of-contents)

---

### 3.2: Add flying card state and trigger logic 🤖

**File:** `components/CribbageGame.jsx`

Add state for the flying card:

```javascript
const [flyingCard, setFlyingCard] = useState(null);
// Shape: { card, startRect, endRect, onComplete, isComputer }
```

Add a helper that captures a card element's position:

```javascript
const getCardRect = (cardElement) => {
  if (!cardElement) return null;
  return cardElement.getBoundingClientRect();
};
```

[Back to TOC](#table-of-contents)

---

### 3.3: Modify playerPlay to animate before state update 🤖

**File:** `components/CribbageGame.jsx` — `playerPlay()` (line 1121)

The key insight: we need the animation to play **before** the card is removed from the hand. The approach:

1. When player clicks a card, capture the clicked card element's position via `event.currentTarget.getBoundingClientRect()`
2. Capture the target play area position via `playerPlayAreaRef.current.getBoundingClientRect()`
3. Set `flyingCard` state (starts the animation overlay)
4. **Hide** the source card visually (add a `flyingAway` class that sets `opacity: 0`)
5. In `onComplete` callback: perform the actual state updates (remove from hand, add to played, etc.)

Changes to `playerPlay()`:
```javascript
const playerPlay = (card, cardEvent) => {
  if (currentPlayer !== 'player' || pendingScore) return;
  if (currentCount + card.value > 31) { ... }

  // Get positions for animation
  const startRect = cardEvent?.currentTarget?.getBoundingClientRect();
  const endRect = playerPlayAreaRef.current?.getBoundingClientRect();

  if (startRect && endRect) {
    // Start animation, defer state update
    setFlyingCard({
      card,
      startRect,
      endRect,
      isComputer: false,
      onComplete: () => {
        setFlyingCard(null);
        applyPlayerPlay(card);  // Extracted state update logic
      }
    });
  } else {
    // Fallback: no animation (e.g., ref not available)
    applyPlayerPlay(card);
  }
};
```

Extract the actual state mutations into a new `applyPlayerPlay(card)` function containing the existing body of `playerPlay` (lines 1128-1182), minus the guard clauses at the top.

Update the card onClick to pass the event:
```jsx
onClick={(e) => {
  if (gameState === 'play' && currentPlayer === 'player' && !pendingScore) playerPlay(card, e);
}}
```

[Back to TOC](#table-of-contents)

---

### 3.4: Add computer card animation 🤖

**File:** `components/CribbageGame.jsx`

The computer's card play happens via `useEffect` (around lines 1008-1118). Currently the computer card appears instantly. To animate:

1. When the computer plays a card, before updating state:
   - Get the computer's face-down hand area position (the "Computer's hand" area already rendered — add a ref `computerHandRef`)
   - Get `computerPlayAreaRef` position
   - Set `flyingCard` with `isComputer: true`
   - The FlyingCard renders as face-down (blue `?` card) flying from the computer hand area to the computer played pile
   - On `onComplete`, apply the actual state update

This gives visual continuity to the computer's play too.

[Back to TOC](#table-of-contents)

---

### 3.5: Render FlyingCard in the component tree 🤖

**File:** `components/CribbageGame.jsx`

At the top level of the return (outside the scrollable game area, so it's not clipped):

```jsx
{flyingCard && (
  <FlyingCard
    card={flyingCard.card}
    startRect={flyingCard.startRect}
    endRect={flyingCard.endRect}
    isComputerCard={flyingCard.isComputer}
    onComplete={flyingCard.onComplete}
  />
)}
```

[Back to TOC](#table-of-contents)

---

## Phase 4: Polish & Tuning

### 4.1: Add subtle arc to the flight path 🤖

**File:** `app/globals.css`

The `cardFly` keyframe already includes a `-30px` Y offset at the 50% mark to create an arc. Tune this value:
- Player cards fly **upward** (hand is below play area), so the arc should go slightly left or right for a natural toss feel
- Computer cards fly **downward**, so the arc should dip slightly

Optionally add a slight rotation during flight:
```css
50% {
  transform: translate(...) scale(0.85) rotate(-5deg);
}
```

[Back to TOC](#table-of-contents)

---

### 4.2: Add landing impact effect on the played pile 🤖

**File:** `components/CribbageGame.jsx`

When the flying card lands, briefly pulse the newest card in the played pile:

1. Track `newestPlayedIndex` state
2. In `applyPlayerPlay`, set it to the new card's index
3. Apply `animate-[cardLand_0.3s_ease-out]` class to the newest PlayedCard
4. Clear after 300ms

Add `cardLand` keyframe to `globals.css`:
```css
@keyframes cardLand {
  0% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
```

[Back to TOC](#table-of-contents)

---

### 4.3: Card shrink during flight to match PlayedCard size 🤖

**File:** `components/FlyingCard.jsx`

The PlayingCard in-hand is `p-2 text-xl` (~50x36px). The PlayedCard in the pile is `p-1 text-sm` (~30x22px). The `cardFly` animation scales from `1 → 0.6`, which visually approximates this size change. Verify the ratio looks right and adjust if needed.

If the landing position doesn't align perfectly with where the new PlayedCard appears, offset `endRect` by the half-width difference so the card appears to land exactly where it will sit.

[Back to TOC](#table-of-contents)

---

## Phase 5: Build, Commit & Deploy to Production

### 5.1: Build and verify 🤖

Run `npm run build` and fix any compilation errors.

[Back to TOC](#table-of-contents)

---

### 5.2: Git add and commit 🤖

Git add all modified/new files (specific names, no wildcards):
- `app/globals.css`
- `components/FlyingCard.jsx`
- `components/CribbageGame.jsx`

[Back to TOC](#table-of-contents)

---

### 5.3: Push and deploy to production 🤖👤

Push to `main` branch and deploy to `cribbage.chrisk.com` via:
```bash
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
  "cd cribbage && git pull && cd cribbage-app && npm run build && pm2 restart cribbage"
```

[Back to TOC](#table-of-contents)

---

## Phase 6: Testing

### 6.1: Visual testing on desktop and mobile 👤

- [ ] Player card flies from hand to "Your plays" pile on click
- [ ] Computer card flies from face-down hand to "Computer's plays" pile
- [ ] Flight path has a gentle arc (not a straight line)
- [ ] Card shrinks during flight (matches PlayedCard size on landing)
- [ ] Landing has a brief scale pulse
- [ ] Animation timing feels snappy (~400ms) not sluggish
- [ ] No layout shift during animation (game stays stable)
- [ ] Cards still play correctly if animation is interrupted (e.g., fast tap)
- [ ] Score acceptance still works (animation completes before pending score appears)
- [ ] Mobile: animation looks good on small screens (shorter distances)
- [ ] No jank or dropped frames on mid-tier phones

[Back to TOC](#table-of-contents)

---

## Files Modified

| File | Changes |
|------|---------|
| `app/globals.css` | `cardFly` and `cardLand` keyframes, `.flying-card` class |
| `components/FlyingCard.jsx` | **New file** — animated card overlay component |
| `components/CribbageGame.jsx` | Refs for play areas, `flyingCard` state, `applyPlayerPlay` extraction, event passing, computer animation |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `getBoundingClientRect()` returns wrong position if page scrolled | FlyingCard uses `position: fixed` which is relative to viewport — `getBoundingClientRect()` already returns viewport-relative coordinates |
| Animation looks choppy on slow devices | CSS animations are GPU-accelerated (transform + opacity only). 400ms is short enough to not block interaction. Fallback: no animation if refs are null |
| Fast double-tap plays two cards | `playerPlay` guard: `if (flyingCard) return;` — blocks play while animation is in progress |
| Card position shifts between render cycles | Capture positions synchronously in the click handler before any state update |
