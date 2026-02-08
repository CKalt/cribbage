# Discard-to-Crib Experience Plan

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [x] [Phase 1: Early Computer Decision & State Setup](#phase-1-early-computer-decision--state-setup) 🤖
  - [x] [1.1: Move computerSelectCrib call into dealHands](#11-move-computerselectcrib-call-into-dealhands-🤖)
  - [x] [1.2: Add new state variables for discard tracking](#12-add-new-state-variables-for-discard-tracking-🤖)
  - [x] [1.3: Random moment selection on each deal](#13-random-moment-selection-on-each-deal-🤖)
- [x] [Phase 2: Progressive Crib Pile Rendering](#phase-2-progressive-crib-pile-rendering) 🤖
  - [x] [2.1: Replace static 4-card pile with dynamic pile based on card count](#21-replace-static-4-card-pile-with-dynamic-pile-based-on-card-count-🤖)
  - [x] [2.2: Add crib pile placeholder showing empty crib location](#22-add-crib-pile-placeholder-showing-empty-crib-location-🤖)
- [x] [Phase 3: Face-Down Flying Card Support](#phase-3-face-down-flying-card-support) 🤖
  - [x] [3.1: Add faceDown prop to FlyingCard component](#31-add-facedown-prop-to-flyingcard-component-🤖)
- [x] [Phase 4: Computer Discard Animation](#phase-4-computer-discard-animation) 🤖
  - [x] [4.1: Create animateComputerDiscard function](#41-create-animatecomputerdiscard-function-🤖)
  - [x] [4.2: Update computer hand display to reflect post-discard count](#42-update-computer-hand-display-to-reflect-post-discard-count-🤖)
- [x] [Phase 5: Moment Triggers](#phase-5-moment-triggers) 🤖
  - [x] [5.1: Moment 1 — Shortly after dealing](#51-moment-1--shortly-after-dealing-🤖)
  - [x] [5.2: Moment 2 — When player selects first card](#52-moment-2--when-player-selects-first-card-🤖)
  - [x] [5.3: Moment 3 — When player selects second card](#53-moment-3--when-player-selects-second-card-🤖)
  - [x] [5.4: Moment 4 — Simultaneously with player's discard](#54-moment-4--simultaneously-with-players-discard-🤖)
  - [x] [5.5: Moment 5 — After player's discard completes](#55-moment-5--after-players-discard-completes-🤖)
- [x] [Phase 6: Adjust Player Discard Flow](#phase-6-adjust-player-discard-flow) 🤖
  - [x] [6.1: Update applyCribDiscard to use pre-computed computer discards](#61-update-applycribdiscard-to-use-pre-computed-computer-discards-🤖)
  - [x] [6.2: Build crib from stored discards instead of computing on-the-fly](#62-build-crib-from-stored-discards-instead-of-computing-on-the-fly-🤖)
- [x] [Phase 7: Build, Commit & Deploy](#phase-7-build-commit--deploy) 🤖👤
  - [x] [7.1: Build and verify](#71-build-and-verify-🤖)
  - [x] [7.2: Git add and commit](#72-git-add-and-commit-🤖)
  - [x] [7.3: Push and deploy to production](#73-push-and-deploy-to-production-🤖👤)
- [ ] [Phase 8: Manual Testing](#phase-8-manual-testing) 👤

---

## Overview

This plan adds a realistic computer discard animation to the crib selection phase. Currently the computer's discard is invisible — it happens silently inside `applyCribDiscard()` at the same instant the player discards. In a real cribbage game, both players deliberate and discard at different times. This plan makes the computer visibly "think" and discard its two cards face-down to the crib pile, with the timing randomly chosen from 5 possible moments to feel natural and human.

Additionally, the crib pile currently renders as a full 4-card stack from the start of the `cribSelect` phase, even before any cards have been discarded. This plan makes the pile build progressively — empty at first, then 2 cards after the computer or player discards, then 4 cards once both have discarded.

**Branch:** `main` | **Deploy target:** `cribbage.chrisk.com`

[Back to TOC](#table-of-contents)

---

## Problem Statement

1. **Computer discard is invisible** — `computerSelectCrib()` is called inside `applyCribDiscard()` only after the player clicks "Discard to Crib." The computer's cards silently vanish from its hand and appear in the crib array. No animation, no sense of the computer making a decision.

2. **Crib pile appears fully formed** — The 4-card stacked face-down pile renders immediately during `cribSelect`, before any cards have been discarded. This is unrealistic — the pile should start empty and grow as each player contributes.

3. **No timing variety** — In a real game, one player might discard quickly while the other deliberates. The computer should sometimes discard before the player, sometimes during, sometimes after — chosen randomly each round.

**Current flow:**
```
dealHands() → cribSelect state → player selects 2 → clicks Discard →
  animation (player cards fly) → applyCribDiscard() → computerSelectCrib() called →
  crib populated → cutForStarter
```

**Desired flow:**
```
dealHands() → computerSelectCrib() called (decision stored) → cribSelect state →
  [random moment: computer cards animate face-down to crib pile] →
  player selects 2 → clicks Discard →
  animation (player cards fly to pile) → applyCribDiscard() →
  crib populated from stored decisions → cutForStarter
```

[Back to TOC](#table-of-contents)

---

## Phase 1: Early Computer Decision & State Setup

### 1.1: Move computerSelectCrib call into dealHands 🤖

**File:** `components/CribbageGame.jsx` — `dealHands()` (line ~738)

Currently `computerSelectCrib()` is called inside `applyCribDiscard()` (line ~803). Move it to `dealHands()` so the computer's decision is made at deal time, enabling independent animation timing.

```javascript
// In dealHands(), after setting computerHand:
const computerKept = computerSelectCrib(computerCards, dealer === 'computer');
const compDiscards = computerCards.filter(card =>
  !computerKept.some(c => c.rank === card.rank && c.suit === card.suit)
);
setComputerKeptHand(computerKept);
setComputerDiscards(compDiscards);
setComputerDiscardComplete(false);
setCribCardsInPile(0);
```

[Back to TOC](#table-of-contents)

---

### 1.2: Add new state variables for discard tracking 🤖

**File:** `components/CribbageGame.jsx` — state declarations (~line 120)

```javascript
// Computer discard tracking
const [computerKeptHand, setComputerKeptHand] = useState(null);    // 4 cards computer will keep
const [computerDiscards, setComputerDiscards] = useState([]);       // 2 cards computer will discard
const [computerDiscardComplete, setComputerDiscardComplete] = useState(false); // Animation done
const [cribCardsInPile, setCribCardsInPile] = useState(0);         // 0, 2, or 4 — drives pile rendering
const [computerDiscardMoment, setComputerDiscardMoment] = useState(null); // 1-5
```

[Back to TOC](#table-of-contents)

---

### 1.3: Random moment selection on each deal 🤖

**File:** `components/CribbageGame.jsx` — `dealHands()` (line ~738)

After computing the computer's decision, pick a random discard moment:

```javascript
const moment = [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)];
setComputerDiscardMoment(moment);
```

**Moment definitions:**

| Moment | Trigger | Delay after trigger | Description |
|--------|---------|-------------------|-------------|
| 1 | Deal completes | 1.5–3s random | Computer "decides fast" |
| 2 | Player selects 1st card | 0.5–1.5s random | Computer decides as player starts |
| 3 | Player selects 2nd card | 0.3–1s random | Computer decides at same time as player |
| 4 | Player clicks Discard | 0ms (interleaved) | Both discard together |
| 5 | Player discard animation ends | 0.5–1s random | Computer "deliberates longer" |

If moment 1 fires and the computer discards before the player even selects a card, the player will see the crib pile grow from 0 to 2 — a nice visual cue that the computer is playing.

[Back to TOC](#table-of-contents)

---

## Phase 2: Progressive Crib Pile Rendering

### 2.1: Replace static 4-card pile with dynamic pile based on card count 🤖

**File:** `components/CribbageGame.jsx` — crib pile render sections (lines ~2481 and ~2597)

Currently the pile always shows 4 stacked cards. Replace with a dynamic render based on `cribCardsInPile`:

| `cribCardsInPile` | Visual |
|-------------------|--------|
| 0 | Empty placeholder (subtle dashed outline, "Crib" label) |
| 2 | 2 stacked face-down cards |
| 4 | 4 stacked face-down cards (current appearance) |

```jsx
{cribCardsInPile === 0 && (
  <div className="w-12 h-16 border-2 border-dashed border-green-600 rounded
                  flex items-center justify-center">
    <span className="text-[10px] text-green-600">Crib</span>
  </div>
)}
{cribCardsInPile >= 2 && (
  <>
    <div className="absolute top-0 left-0 bg-blue-900 border-2 border-blue-700 rounded w-12 h-16 shadow-md" />
    <div className="absolute top-1 left-0.5 bg-blue-800 border-2 border-blue-600 rounded w-12 h-16 shadow-md" />
  </>
)}
{cribCardsInPile >= 4 && (
  <>
    <div className="absolute top-2 left-1 bg-blue-700 border-2 border-blue-500 rounded w-12 h-16 shadow-lg" />
    <div className="absolute top-3 left-1.5 bg-blue-900 border-2 border-blue-400 rounded w-12 h-16 shadow-lg
                    flex items-center justify-center font-bold text-xs text-blue-200">Crib</div>
  </>
)}
```

The crib pile must now be visible starting from `cribSelect` phase even when `cribCardsInPile === 0` (to show the placeholder and serve as the animation target).

[Back to TOC](#table-of-contents)

---

### 2.2: Add crib pile placeholder showing empty crib location 🤖

**File:** `components/CribbageGame.jsx` — both crib pile render locations

Update the visibility condition to always show the pile container during `cribSelect`, `play`, and `counting` phases. The container itself renders differently based on `cribCardsInPile` (Step 2.1). The `ref={cribPileRef}` must be on the outer container so animations always have a valid target.

[Back to TOC](#table-of-contents)

---

## Phase 3: Face-Down Flying Card Support

### 3.1: Add faceDown prop to FlyingCard component 🤖

**File:** `components/FlyingCard.jsx`

The computer's discard should fly face-down (blue card back), not showing the actual rank/suit. Add a `faceDown` prop:

```jsx
export default function FlyingCard({ card, startRect, endRect, onComplete, faceDown = false }) {
  // ... existing logic ...

  const overlay = (
    <div ref={ref} className="flying-card" style={...} onAnimationEnd={...}>
      {faceDown ? (
        <div className="bg-blue-900 border-2 border-blue-700 text-blue-300 rounded
                        w-full h-full flex items-center justify-center font-bold text-lg">
          ?
        </div>
      ) : (
        <div className={`bg-white rounded p-2 text-xl font-bold w-full h-full
                        flex items-center justify-center ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.rank}{card.suit}
        </div>
      )}
    </div>
  );
}
```

The `flyingCard` state in CribbageGame will now accept an optional `faceDown` field, passed through to the component.

[Back to TOC](#table-of-contents)

---

## Phase 4: Computer Discard Animation

### 4.1: Create animateComputerDiscard function 🤖

**File:** `components/CribbageGame.jsx`

New function that animates two face-down cards from the computer's hand to the crib pile:

```javascript
const animateComputerDiscard = () => {
  if (computerDiscardComplete) return;

  // Get start position: first card in computer hand
  const firstCard = computerHandRef.current?.querySelector(':scope > *');
  const startRect = firstCard?.getBoundingClientRect();
  const endRect = cribPileRef.current?.getBoundingClientRect();

  if (!startRect || !endRect) {
    // Fallback: complete without animation
    setComputerDiscardComplete(true);
    setCribCardsInPile(prev => prev + 2);
    return;
  }

  // Animate first face-down card
  setFlyingCard({
    card: computerDiscards[0],  // Card data needed for key uniqueness
    startRect,
    endRect,
    faceDown: true,
    onComplete: () => {
      setCribCardsInPile(prev => prev + 1);
      // Animate second face-down card
      const secondCard = computerHandRef.current?.querySelector(':scope > *:nth-child(2)');
      const startRect2 = secondCard?.getBoundingClientRect() || startRect;
      setFlyingCard({
        card: computerDiscards[1],
        startRect: startRect2,
        endRect,
        faceDown: true,
        onComplete: () => {
          setFlyingCard(null);
          setCribCardsInPile(prev => prev + 1);
          setComputerDiscardComplete(true);
        }
      });
    }
  });
};
```

**Key details:**
- Cards fly face-down (blue card back) — computer's cards are secret
- Pile grows by 1 after each card lands (0→1→2)
- Computer hand visually shrinks from 6 to 4 face-down cards
- `computerDiscardComplete` prevents re-triggering

[Back to TOC](#table-of-contents)

---

### 4.2: Update computer hand display to reflect post-discard count 🤖

**File:** `components/CribbageGame.jsx` — computer hand render (~line 2492)

During `cribSelect`, the computer's hand currently always shows all 6 cards face-down. After the computer discard animation completes, it should show only 4 cards.

```jsx
{(gameState === 'cribSelect' ?
  (computerDiscardComplete ? computerKeptHand || computerHand : computerHand) :
  gameState === 'play' ? computerPlayHand :
  computerHand).map((card, idx) => (
```

This makes the hand shrink from 6 to 4 face-down cards after the computer's discard animation, matching the visual of 2 cards having been moved to the crib.

[Back to TOC](#table-of-contents)

---

## Phase 5: Moment Triggers

Each moment is implemented as a trigger that calls `animateComputerDiscard()` at the right time. A guard (`computerDiscardComplete`) prevents double-firing if the player's actions move through multiple moments.

### 5.1: Moment 1 — Shortly after dealing 🤖

**File:** `components/CribbageGame.jsx` — `dealHands()` or a `useEffect`

When `computerDiscardMoment === 1`, schedule the animation with a random delay (1.5–3s) after the deal:

```javascript
useEffect(() => {
  if (gameState === 'cribSelect' && computerDiscardMoment === 1 && !computerDiscardComplete) {
    const delay = 1500 + Math.random() * 1500;
    const timer = setTimeout(() => animateComputerDiscard(), delay);
    return () => clearTimeout(timer);
  }
}, [gameState, computerDiscardMoment, computerDiscardComplete]);
```

Player sees the crib pile grow from 0→2 while still studying their hand.

[Back to TOC](#table-of-contents)

---

### 5.2: Moment 2 — When player selects first card 🤖

**File:** `components/CribbageGame.jsx` — `toggleCardSelection()`

When `computerDiscardMoment === 2` and the player selects their first card (`selectedCards` goes from 0→1):

```javascript
// Inside toggleCardSelection, after adding first card:
if (computerDiscardMoment === 2 && !computerDiscardComplete && newSelectedCards.length === 1) {
  const delay = 500 + Math.random() * 1000;
  setTimeout(() => animateComputerDiscard(), delay);
}
```

[Back to TOC](#table-of-contents)

---

### 5.3: Moment 3 — When player selects second card 🤖

**File:** `components/CribbageGame.jsx` — `toggleCardSelection()`

When `computerDiscardMoment === 3` and the player selects their second card (`selectedCards` goes from 1→2):

```javascript
if (computerDiscardMoment === 3 && !computerDiscardComplete && newSelectedCards.length === 2) {
  const delay = 300 + Math.random() * 700;
  setTimeout(() => animateComputerDiscard(), delay);
}
```

[Back to TOC](#table-of-contents)

---

### 5.4: Moment 4 — Simultaneously with player's discard 🤖

**File:** `components/CribbageGame.jsx` — `discardToCrib()`

When `computerDiscardMoment === 4`, trigger the computer discard at the same time as the player's first card animation. The animations interleave naturally since FlyingCard handles one at a time — the computer's cards can be queued after the player's:

```javascript
// In discardToCrib(), when moment === 4 and !computerDiscardComplete:
// Modified chain: player card 1 → computer card 1 → computer card 2 → player card 2 → applyCribDiscard
```

This creates an interleaved sequence where cards from both sides mix together heading to the crib. This is the most complex moment but the most realistic.

[Back to TOC](#table-of-contents)

---

### 5.5: Moment 5 — After player's discard completes 🤖

**File:** `components/CribbageGame.jsx` — `discardToCrib()` or `applyCribDiscard()`

When `computerDiscardMoment === 5`, the computer discards after the player's animation finishes but before the cut phase transition:

```javascript
// In the discardToCrib chain, after player's card 2 lands:
onComplete: () => {
  setFlyingCard(null);
  if (computerDiscardMoment === 5 && !computerDiscardComplete) {
    // Delay, then animate computer discard, then applyCribDiscard
    const delay = 500 + Math.random() * 500;
    setTimeout(() => {
      animateComputerDiscardThen(() => applyCribDiscard());
    }, delay);
  } else {
    applyCribDiscard();
  }
}
```

A variant `animateComputerDiscardThen(callback)` chains the callback after the computer's animation completes, then proceeds to `applyCribDiscard()`.

[Back to TOC](#table-of-contents)

---

## Phase 6: Adjust Player Discard Flow

### 6.1: Update applyCribDiscard to use pre-computed computer discards 🤖

**File:** `components/CribbageGame.jsx` — `applyCribDiscard()` (~line 787)

Currently calls `computerSelectCrib()` inside this function. Replace with the stored values:

```javascript
const applyCribDiscard = useCallback(() => {
  const newPlayerHand = playerHand.filter(card =>
    !selectedCards.some(s => s.rank === card.rank && s.suit === card.suit)
  );

  // Use pre-computed computer decision instead of computing here
  const newComputerHand = computerKeptHand || computerSelectCrib(computerHand, dealer === 'computer');
  const discards = computerDiscards.length === 2 ? computerDiscards :
    computerHand.filter(card => !newComputerHand.some(c => c.rank === card.rank && c.suit === card.suit));

  const newCrib = [...selectedCards, ...discards];
  // ... rest unchanged ...
}, [playerHand, selectedCards, computerKeptHand, computerDiscards, computerHand, dealer]);
```

[Back to TOC](#table-of-contents)

---

### 6.2: Build crib from stored discards instead of computing on-the-fly 🤖

**File:** `components/CribbageGame.jsx` — `applyCribDiscard()`

Also ensure `setCribCardsInPile(4)` is set when the player's discard completes, so the pile shows all 4 cards. If the computer already discarded (moments 1-3), the pile grows from 2→4. If they discard simultaneously or after (moments 4-5), the pile state is managed by the animation chain.

```javascript
// At the end of applyCribDiscard:
setCribCardsInPile(4);
```

[Back to TOC](#table-of-contents)

---

## Phase 7: Build, Commit & Deploy

### 7.1: Build and verify 🤖

Run `npm run build` and fix any compilation errors. Bump version in `lib/version.js`.

[Back to TOC](#table-of-contents)

---

### 7.2: Git add and commit 🤖

Git add specific modified files:
- `components/CribbageGame.jsx`
- `components/FlyingCard.jsx`
- `lib/version.js`

Commit with version in message.

[Back to TOC](#table-of-contents)

---

### 7.3: Push and deploy to production 🤖👤

Push to `main` branch and deploy to `cribbage.chrisk.com`:
```bash
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
  "cd cribbage && git pull && cd cribbage-app && rm -rf .next && npm run build && pm2 restart cribbage"
```

[Back to TOC](#table-of-contents)

---

## Phase 8: Manual Testing 👤

- [ ] Moment 1: Start new game, watch computer discard before you select anything
- [ ] Moment 2: Start new game, select first card, watch computer discard shortly after
- [ ] Moment 3: Start new game, select both cards, watch computer discard shortly after
- [ ] Moment 4: Start new game, click Discard, watch interleaved animation
- [ ] Moment 5: Start new game, click Discard, watch computer discard after yours
- [ ] Crib pile starts empty (dashed outline) each round
- [ ] Crib pile grows progressively: 0 → 2 → 4 cards
- [ ] Computer's flying cards are face-down (blue card back)
- [ ] Player's flying cards are face-up (current behavior preserved)
- [ ] Computer hand shrinks from 6 → 4 face-down cards after its discard
- [ ] Multiple rounds show different random moments
- [ ] Crib reveal animation still works correctly after pile changes
- [ ] No console errors or broken state transitions

[Back to TOC](#table-of-contents)

---

## Files Modified

| File | Changes |
|------|---------|
| `components/CribbageGame.jsx` | Early computer decision, new state variables, moment triggers, progressive pile, animation chain changes |
| `components/FlyingCard.jsx` | Add `faceDown` prop for blue card-back rendering |
| `lib/version.js` | Version bump |

## Reusable Components (no changes needed)

| Component | Notes |
|-----------|-------|
| `lib/ai.js` — `computerSelectCrib()` | Called earlier but logic unchanged |
| `app/globals.css` — `cardFly` animation | Same animation keyframes reused |
