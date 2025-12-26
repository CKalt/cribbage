# Improve User Score Entry UX

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [Phase 1: Score Selector Component](#phase-1-score-selector-component)
  - [ ] [Step 1.1: Create ScoreSelector component 🤖](#step-11-create-scoreselector-component-)
  - [ ] [Step 1.2: Integrate into CribbageGame.jsx 🤖](#step-12-integrate-into-cribbagegamejsx-)
- [ ] [Phase 2: Celebration Feedback](#phase-2-celebration-feedback)
  - [ ] [Step 2.1: Create CorrectScoreCelebration component 🤖](#step-21-create-correctscorecelebration-component-)
  - [ ] [Step 2.2: Integrate celebration into counting flow 🤖](#step-22-integrate-celebration-into-counting-flow-)
- [ ] [Phase 3: Testing and Polish](#phase-3-testing-and-polish)
  - [ ] [Step 3.1: Local testing 👤](#step-31-local-testing-)
  - [ ] [Step 3.2: Deploy 🤖](#step-32-deploy-)

---

## Overview

Improve the score entry experience during the counting phase to be more intuitive and rewarding. Replace the clunky numeric input with a graphical score selector, and add celebratory feedback when the player counts correctly.

[Back to TOC](#table-of-contents)

---

## Problem Statement

**Current Issues:**
1. **Score Input**: Player must type a number using keyboard and click "Submit Count" - feels clinical and clunky
2. **Correct Feedback**: Only shows `"Correct! {score} points"` as plain text - not rewarding or celebratory
3. **UX Gap**: Counting correctly is a skill worth celebrating in cribbage, but the current UI doesn't acknowledge this

**Goals:**
1. Replace numeric input with a visual score picker (grid of clickable score buttons)
2. Add animated celebration when player counts correctly (confetti, colors, encouraging text)
3. Make the experience feel like playing a real game, not filling out a form

[Back to TOC](#table-of-contents)

---

## Phase 1: Score Selector Component

### Step 1.1: Create ScoreSelector component 🤖

**File:** `components/ScoreSelector.jsx`

Create a new component that displays possible scores as a grid of clickable buttons:

```jsx
// Score selector with visual grid layout
// Valid cribbage scores: 0-24, 28, 29 (25, 26, 27 are impossible)

Props:
- onSelect(score): callback when score is selected
- disabled: boolean to prevent selection

Layout:
- Grid of score buttons (0-29)
- Gray out impossible scores (25, 26, 27)
- Highlight on hover
- Clear visual feedback on selection
- Mobile-friendly touch targets
```

**Design Notes:**
- Use 6 columns x 5 rows grid for scores 0-29
- Each button ~48x48px for easy tapping
- Green theme to match app
- Impossible scores (25, 26, 27) shown as disabled/dimmed
- Selected score shows visual confirmation before submitting

[Back to TOC](#table-of-contents)

---

### Step 1.2: Integrate into CribbageGame.jsx 🤖

**File:** `components/CribbageGame.jsx`

Replace the current input (lines 1822-1836):
```jsx
// Current - REMOVE:
<input type="number" ... />
<Button onClick={submitPlayerCount}>Submit Count</Button>

// New - ADD:
<ScoreSelector onSelect={handleScoreSelect} />
```

Modify `submitPlayerCount` to work with the new selector or create new handler.

[Back to TOC](#table-of-contents)

---

## Phase 2: Celebration Feedback

### Step 2.1: Create CorrectScoreCelebration component 🤖

**File:** `components/CorrectScoreCelebration.jsx`

Create an animated celebration overlay:

```jsx
Props:
- score: number - the score achieved
- onComplete: callback when animation finishes

Features:
- Large animated score number (grows/pulses)
- Confetti effect (CSS-based, no library needed)
- Encouraging text variations:
  - "Perfect!"
  - "Nice count!"
  - "Well done!"
  - "You got it!"
- Green/gold color scheme
- Auto-dismiss after ~2 seconds
```

**Animation approach:**
- CSS keyframes for pulse/scale effects
- CSS-only confetti using pseudo-elements
- No external animation libraries needed

[Back to TOC](#table-of-contents)

---

### Step 2.2: Integrate celebration into counting flow 🤖

**File:** `components/CribbageGame.jsx`

Modify the correct count handling (around line 1004-1011):

```jsx
// Current:
if (claimed === score) {
  setMessage(`Correct! ${score} points`);
  // ...
}

// New:
if (claimed === score) {
  setShowCelebration(true);
  setCelebrationScore(score);
  // Message and score update happen after celebration
}
```

Add state:
- `showCelebration` - boolean
- `celebrationScore` - number

[Back to TOC](#table-of-contents)

---

## Phase 3: Testing and Polish

### Step 3.1: Local testing 👤

Test scenarios:
1. Score selector works on desktop (mouse)
2. Score selector works on mobile (touch)
3. Correct count triggers celebration
4. Celebration doesn't block game progression
5. Incorrect counts still show appropriate feedback

[Back to TOC](#table-of-contents)

---

### Step 3.2: Deploy 🤖

- Bump version
- Git add, commit, push
- Deploy to EC2

[Back to TOC](#table-of-contents)

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `components/ScoreSelector.jsx` | CREATE |
| `components/CorrectScoreCelebration.jsx` | CREATE |
| `components/CribbageGame.jsx` | MODIFY |

---

*Plan created: December 25, 2025*
