# Pegging Two-Click Card Play

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [ ] [Phase 1: Single-Player — Select-Then-Play for Pegging](#phase-1-single-player--select-then-play-for-pegging) 🤖
  - [ ] [1.1: Add pegging selection state to CribbageGame.jsx](#11-add-pegging-selection-state-to-cribbagegamejsx-🤖)
  - [ ] [1.2: Change card onClick during play phase to select instead of play](#12-change-card-onclick-during-play-phase-to-select-instead-of-play-🤖)
  - [ ] [1.3: Add "Play Card" button to ActionButtons.jsx](#13-add-play-card-button-to-actionbuttonsjsx-🤖)
  - [ ] [1.4: Update gameActions.js for new action type](#14-update-gameactionsjs-for-new-action-type-🤖)
  - [ ] [1.5: Wire up useRequiredAction for confirm_play](#15-wire-up-userequiredaction-for-confirm_play-🤖)
  - [ ] [1.6: Clear pegging selection on phase/turn changes](#16-clear-pegging-selection-on-phaseturn-changes-🤖)
- [ ] [Phase 2: Multiplayer — Select-Then-Play for Pegging](#phase-2-multiplayer--select-then-play-for-pegging) 🤖
  - [ ] [2.1: Add pegging selection state to MultiplayerGame.jsx](#21-add-pegging-selection-state-to-multiplayergamejsx-🤖)
  - [ ] [2.2: Change card onClick during play phase to select instead of play](#22-change-card-onclick-during-play-phase-to-select-instead-of-play-🤖)
  - [ ] [2.3: Add "Play Card" button to multiplayer UI](#23-add-play-card-button-to-multiplayer-ui-🤖)
  - [ ] [2.4: Clear pegging selection on phase/turn changes](#24-clear-pegging-selection-on-phaseturn-changes-🤖)
- [ ] [Phase 3: Build, Version Bump & Commit](#phase-3-build-version-bump--commit) 🤖
  - [ ] [3.1: Run npm run build and fix any errors](#31-run-npm-run-build-and-fix-any-errors-🤖)
  - [ ] [3.2: Bump version in lib/version.js](#32-bump-version-in-libversionjs-🤖)
  - [ ] [3.3: Git add and commit](#33-git-add-and-commit-🤖)
- [ ] [Phase 4: Deploy & Test](#phase-4-deploy--test) 🤖👤
  - [ ] [4.1: Deploy to both production and beta](#41-deploy-to-both-production-and-beta-🤖)
  - [ ] [4.2: Manual testing checklist](#42-manual-testing-checklist-👤)

---

## Overview

Currently, tapping a card during pegging immediately plays it. This causes "fat finger" errors where the wrong card is played because the user's tap lands on an adjacent card. The fix is to adopt a two-step select-then-play pattern — identical to how discard-to-crib already works — where the first tap raises the card and a second tap (or a "Play Card" button) confirms the play.

[Back to TOC](#table-of-contents)

---

## Problem Statement

During the pegging (play) phase, a single tap on a card immediately plays it with no way to undo. On mobile devices, cards are close together and it's easy to accidentally tap the wrong card. The discard phase already solves this problem with a two-step flow: tap to select (card rises with cyan glow), then tap "Discard to Crib" to confirm. Pegging should use the same pattern.

**Desired UX:**
1. **First tap** on a playable card → card rises up with cyan glow (same visual as discard selection)
2. **Second tap** on the raised card → card is played (flies to play area)
3. **Tap a different card** → selection switches to the new card
4. **"Play Card" button** appears in the action bar when a card is selected (alternative to tapping the raised card)
5. Only **one card** can be selected at a time (unlike discard which allows two)

**Key constraint:** The animation source rect must come from the selected card's DOM position, so the flight animation still works correctly.

[Back to TOC](#table-of-contents)

---

## Phase 1: Single-Player — Select-Then-Play for Pegging

### 1.1: Add pegging selection state to CribbageGame.jsx 🤖

**File:** `components/CribbageGame.jsx`

Add a new state variable for the card selected during pegging (separate from `selectedCards` which is used for discard):

```javascript
const [peggingSelectedCard, setPeggingSelectedCard] = useState(null);
```

This holds a single card object `{ rank, suit, value }` or `null` when nothing is selected.

[Back to TOC](#table-of-contents)

---

### 1.2: Change card onClick during play phase to select instead of play 🤖

**File:** `components/CribbageGame.jsx`

**Current code (line ~3046):**
```javascript
else if (gameState === 'play' && currentPlayer === 'player' && !pendingScore) playerPlay(card, e);
```

**New behavior:**
- First click on an unselected playable card → set `peggingSelectedCard` to that card
- Click on the already-selected (raised) card → call `playerPlay(card, e)` to play it
- Click on a different playable card → switch selection to the new card
- Click on an unplayable card → show "can't play" message (unchanged)

```javascript
else if (gameState === 'play' && currentPlayer === 'player' && !pendingScore) {
  if (currentCount + card.value > 31) {
    setMessage("Can't play that card - total would exceed 31");
    return;
  }
  if (peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit) {
    // Second click on same card — play it
    playerPlay(card, e);
    setPeggingSelectedCard(null);
  } else {
    // First click — select/switch
    setPeggingSelectedCard(card);
  }
}
```

Also update the `selected` prop on the PlayingCard to include pegging selection:
```javascript
selected={
  (!showCribHere && !isBeingDiscarded && selectedCards.some(c => c.rank === card.rank && c.suit === card.suit)) ||
  (gameState === 'play' && peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit)
}
```

Remove the `>31` validation from inside `playerPlay()` since it's now handled at the selection step. Keep it as a safety check but the user will never see it trigger.

[Back to TOC](#table-of-contents)

---

### 1.3: Add "Play Card" button to ActionButtons.jsx 🤖

**File:** `components/ActionButtons.jsx`

Add a new action type `confirm_play` that renders a "Play Card" button. This appears in the sticky action bar when a card is selected during pegging, providing a tap target alternative to clicking the raised card itself.

```javascript
// Confirm pegging play
if (type === 'confirm_play') {
  return (
    <Button
      onClick={handlers.confirmPeggingPlay}
      className="bg-green-600 hover:bg-green-700 px-6 py-3"
    >
      Play Card
    </Button>
  );
}
```

Add `'confirm_play'` to the null-return exclusion list at line 28 (remove `play_card` from it or keep it — `play_card` is the "no card selected" state, `confirm_play` is the "card selected, confirm?" state).

[Back to TOC](#table-of-contents)

---

### 1.4: Update gameActions.js for new action type 🤖

**File:** `lib/gameActions.js`

Add a new action definition and update `getRequiredAction()`:

```javascript
// In GAME_ACTIONS (line 13):
play_player_selected: { type: 'confirm_play', label: 'Play Card' },
```

In `getRequiredAction()` play phase (line 98), check for pegging selection:

```javascript
// After checking canPlay, before returning play_player_turn:
if (state.peggingSelectedCard) {
  return { ...GAME_ACTIONS.play_player_selected };
}
return { ...GAME_ACTIONS.play_player_turn };
```

Add `'confirm_play'` to the `buttonTypes` array in `actionRequiresButton()` (line 165).

Also add `peggingSelectedCard` to the dependency list in `useRequiredAction.js` (line 14).

[Back to TOC](#table-of-contents)

---

### 1.5: Wire up useRequiredAction for confirm_play 🤖

**File:** `hooks/useRequiredAction.js`

Add the handler mapping:

```javascript
confirm_play: handlers.confirmPeggingPlay,
```

**File:** `components/CribbageGame.jsx`

Add a `confirmPeggingPlay` handler that:
1. Finds the selected card's DOM element to get its position for animation
2. Calls `playerPlay(card, syntheticEvent)` with the position data
3. Clears `peggingSelectedCard`

```javascript
const confirmPeggingPlay = () => {
  if (!peggingSelectedCard) return;
  // Find the selected card's DOM element for animation
  const selectedEl = document.querySelector('[class*="ring-cyan-400"]');
  const startRect = selectedEl?.getBoundingClientRect();
  const areaRect = playerPlayAreaRef.current?.getBoundingClientRect();
  if (startRect && areaRect) {
    const endRect = {
      top: areaRect.top,
      left: areaRect.left + areaRect.width / 2 - startRect.width / 2,
      width: areaRect.width,
      height: areaRect.height,
    };
    setFlyingCard({
      card: peggingSelectedCard,
      startRect,
      endRect,
      isComputer: false,
      onComplete: () => {
        setFlyingCard(null);
        applyPlayerPlay(peggingSelectedCard);
      },
    });
  } else {
    applyPlayerPlay(peggingSelectedCard);
  }
  setPeggingSelectedCard(null);
};
```

Pass `confirmPeggingPlay` in the handlers object given to `useRequiredAction`.

[Back to TOC](#table-of-contents)

---

### 1.6: Clear pegging selection on phase/turn changes 🤖

**File:** `components/CribbageGame.jsx`

Add a useEffect to clear the pegging selection when:
- Game state changes away from `'play'`
- Turn switches to computer (`currentPlayer !== 'player'`)
- A pending score appears

```javascript
useEffect(() => {
  if (gameState !== 'play' || currentPlayer !== 'player' || pendingScore) {
    setPeggingSelectedCard(null);
  }
}, [gameState, currentPlayer, pendingScore]);
```

[Back to TOC](#table-of-contents)

---

## Phase 2: Multiplayer — Select-Then-Play for Pegging

### 2.1: Add pegging selection state to MultiplayerGame.jsx 🤖

**File:** `components/MultiplayerGame.jsx`

```javascript
const [peggingSelectedCard, setPeggingSelectedCard] = useState(null);
```

[Back to TOC](#table-of-contents)

---

### 2.2: Change card onClick during play phase to select instead of play 🤖

**File:** `components/MultiplayerGame.jsx`

**Current code (line ~1246):**
```javascript
} else if (phase === GAME_PHASE.PLAYING && isMyTurn && !hasPending) {
  handlePlayCard(card, e);
}
```

**New behavior** (same as single-player):
```javascript
} else if (phase === GAME_PHASE.PLAYING && isMyTurn && !hasPending) {
  if (!isCardPlayable(card)) return;
  if (peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit) {
    handlePlayCard(card, e);
    setPeggingSelectedCard(null);
  } else {
    setPeggingSelectedCard(card);
  }
}
```

Update the `selected` prop to include pegging selection:
```javascript
selected={
  (phase === GAME_PHASE.DISCARDING && !hasDiscarded() && isSelected) ||
  (phase === GAME_PHASE.PLAYING && peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit)
}
```

[Back to TOC](#table-of-contents)

---

### 2.3: Add "Play Card" button to multiplayer UI 🤖

**File:** `components/MultiplayerGame.jsx`

The multiplayer game doesn't use `ActionButtons.jsx` — it renders its own buttons inline. Update the play phase message area (line ~1169) to show a "Play Card" button when a card is selected:

**Current (line 1171-1173):**
```javascript
{canPlayAnyCard() ? (
  <div className="text-yellow-400">
    Tap a highlighted card to play it
  </div>
```

**New:**
```javascript
{canPlayAnyCard() ? (
  peggingSelectedCard ? (
    <div className="space-y-2">
      <div className="text-cyan-400">
        Tap the raised card again or press Play
      </div>
      <Button
        onClick={() => {
          const selectedEl = document.querySelector('[class*="ring-cyan-400"]');
          if (selectedEl && peggingSelectedCard) {
            handlePlayCard(peggingSelectedCard, { currentTarget: selectedEl });
            setPeggingSelectedCard(null);
          }
        }}
        className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
      >
        Play Card
      </Button>
    </div>
  ) : (
    <div className="text-yellow-400">
      Tap a card to select it
    </div>
  )
```

Also update the hint text from "Tap a highlighted card to play it" to "Tap a card to select it" since the flow is now two-step.

[Back to TOC](#table-of-contents)

---

### 2.4: Clear pegging selection on phase/turn changes 🤖

**File:** `components/MultiplayerGame.jsx`

```javascript
useEffect(() => {
  if (phase !== GAME_PHASE.PLAYING || !isMyTurn) {
    setPeggingSelectedCard(null);
  }
}, [phase, isMyTurn]);
```

Also clear when a pending pegging score appears (detected via polling).

[Back to TOC](#table-of-contents)

---

## Phase 3: Build, Version Bump & Commit

### 3.1: Run npm run build and fix any errors 🤖

Run `npm run build` and resolve any compilation errors.

[Back to TOC](#table-of-contents)

---

### 3.2: Bump version in lib/version.js 🤖

Update version for both production and beta deploys.

[Back to TOC](#table-of-contents)

---

### 3.3: Git add and commit 🤖

Git add each modified file individually:
- `components/CribbageGame.jsx`
- `components/MultiplayerGame.jsx`
- `components/ActionButtons.jsx`
- `lib/gameActions.js`
- `hooks/useRequiredAction.js`
- `lib/version.js`

[Back to TOC](#table-of-contents)

---

## Phase 4: Deploy & Test

### 4.1: Deploy to both production and beta 🤖

Since both single-player and multiplayer are affected:
- Deploy `main` to production (`cribbage.chrisk.com`)
- Merge into `multiplayer` and deploy to beta (`beta.cribbage.chrisk.com`)

[Back to TOC](#table-of-contents)

---

### 4.2: Manual testing checklist 👤

**Single-player pegging:**
- [ ] Tap a card → card rises with cyan glow (NOT immediately played)
- [ ] Tap the raised card again → card flies to play area and is played
- [ ] Tap a different card while one is raised → selection switches
- [ ] "Play Card" button appears in action bar when card is selected
- [ ] Tap "Play Card" button → card flies to play area and is played
- [ ] Unplayable cards (would exceed 31) → cannot be selected
- [ ] Computer's turn → no card can be selected
- [ ] Pending score → no card can be selected
- [ ] Selection clears when turn switches to computer
- [ ] Selection clears when phase changes (e.g., counting starts)
- [ ] Card flight animation still works correctly from raised position

**Multiplayer pegging:**
- [ ] Same tap-to-select, tap-again-to-play flow
- [ ] "Play Card" button works
- [ ] Selection clears when opponent's turn
- [ ] Selection clears on phase change
- [ ] No regression in discard selection flow

**Regression:**
- [ ] Discard-to-crib flow unchanged (still two cards, "Discard to Crib" button)
- [ ] Counting phase unchanged
- [ ] Card animations still smooth

[Back to TOC](#table-of-contents)

---

## Files Summary

| File | Change | Risk |
|------|--------|------|
| `components/CribbageGame.jsx` | Add pegging selection state, modify onClick, add handler | MEDIUM |
| `components/MultiplayerGame.jsx` | Same pattern as single-player | MEDIUM |
| `components/ActionButtons.jsx` | Add `confirm_play` button type | LOW |
| `lib/gameActions.js` | Add `play_player_selected` action, update play logic | LOW |
| `hooks/useRequiredAction.js` | Add `confirm_play` handler mapping + dependency | LOW |
| `lib/version.js` | Version bump | LOW |
