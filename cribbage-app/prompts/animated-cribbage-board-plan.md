# Animated Cribbage Board Plan

## Table of Contents

- [x] [Overview](#overview)
- [x] [Problem Statement](#problem-statement)
- [x] [Phase 1: Board Component Foundation](#phase-1-board-component-foundation)
  - [x] [1.1: Create SVG cribbage board layout 🤖](#step-11-create-svg-cribbage-board-layout-🤖)
  - [x] [1.2: Implement dual-peg state management 🤖](#step-12-implement-dual-peg-state-management-🤖)
  - [x] [1.3: Add basic peg rendering 🤖](#step-13-add-basic-peg-rendering-🤖)
- [x] [Phase 2: Pegging Animation System](#phase-2-pegging-animation-system)
  - [x] [2.1: Create peg movement animation 🤖](#step-21-create-peg-movement-animation-🤖)
  - [x] [2.2: Implement leapfrog peg logic 🤖](#step-22-implement-leapfrog-peg-logic-🤖)
  - [x] [2.3: Add point-by-point sequential animation 🤖](#step-23-add-point-by-point-sequential-animation-🤖)
- [x] [Phase 3: Zoom and Focus Effects](#phase-3-zoom-and-focus-effects)
  - [x] [3.1: Implement board zoom on scoring 🤖](#step-31-implement-board-zoom-on-scoring-🤖)
  - [x] [3.2: Add focus tracking to follow pegs 🤖](#step-32-add-focus-tracking-to-follow-pegs-🤖)
  - [x] [3.3: Create smooth zoom transitions 🤖](#step-33-create-smooth-zoom-transitions-🤖)
- [x] [Phase 4: Integration with Game Logic](#phase-4-integration-with-game-logic)
  - [x] [4.1: Hook into addPoints function 🤖](#step-41-hook-into-addpoints-function-🤖)
  - [x] [4.2: Add animation completion callbacks 🤖](#step-42-add-animation-completion-callbacks-🤖)
  - [x] [4.3: Handle rapid successive scoring 🤖](#step-43-handle-rapid-successive-scoring-🤖)
- [x] [Phase 5: Visual Polish](#phase-5-visual-polish)
  - [x] [5.1: Add board textures and styling 🤖](#step-51-add-board-textures-and-styling-🤖)
  - [x] [5.2: Implement peg glow effects 🤖](#step-52-implement-peg-glow-effects-🤖)
  - [x] [5.3: Add score labels and markers 🤖](#step-53-add-score-labels-and-markers-🤖)
- [ ] [Phase 6: Testing and Deployment](#phase-6-testing-and-deployment)
  - [ ] [6.1: Test all scoring scenarios 👤](#step-61-test-all-scoring-scenarios-👤)
  - [x] [6.2: Performance optimization 🤖](#step-62-performance-optimization-🤖)
  - [ ] [6.3: Deploy to production 👤](#step-63-deploy-to-production-👤)

---

## Overview

This plan implements a visual animated cribbage board that displays during scoring. The board will feature:

- **Authentic dual-peg system**: Each player has two pegs that leapfrog as in real cribbage
- **Point-by-point animation**: Each point scored animates individually
- **Zoom effect**: Board zooms in to the scoring area when points are awarded
- **Smooth transitions**: Professional-quality animations using CSS/React

### Cribbage Board Anatomy

```
Standard 121-point board layout (3 streets of 30 + finish):

STREET 1 (1-30):    ●●●●● ●●●●● ●●●●● ●●●●● ●●●●● ●●●●●
STREET 2 (31-60):   ●●●●● ●●●●● ●●●●● ●●●●● ●●●●● ●●●●●
STREET 3 (61-90):   ●●●●● ●●●●● ●●●●● ●●●●● ●●●●● ●●●●●
STREET 4 (91-120):  ●●●●● ●●●●● ●●●●● ●●●●● ●●●●● ●●●●●
FINISH (121):       ★

Each player has TWO tracks (inner/outer) running parallel.
```

### Dual-Peg System

In real cribbage, each player uses two pegs:
1. **Front peg**: Shows current score
2. **Back peg**: Shows previous score position

When scoring:
- The BACK peg leapfrogs to the new position
- The former FRONT peg becomes the new BACK peg
- This prevents cheating and shows score history

[Back to TOC](#table-of-contents)

---

## Problem Statement

Currently, the cribbage app displays scores as simple numbers (e.g., "Player: 45/121"). This lacks:

1. **Visual engagement**: No animated feedback when scoring
2. **Traditional feel**: Real cribbage uses a physical board with pegs
3. **Score context**: Hard to visualize progress around the board
4. **Excitement**: Big scores don't feel impactful

The animated cribbage board will:
- Show a visual board with holes for pegging
- Animate each point being scored
- Zoom to the action area during scoring
- Use authentic dual-peg leapfrogging
- Enhance the game's visual appeal

[Back to TOC](#table-of-contents)

---

## Phase 1: Board Component Foundation

### Step 1.1: Create SVG cribbage board layout 🤖

**Objective**: Build the static SVG structure for the cribbage board.

**Details**:
- Create `components/CribbageBoard.jsx`
- SVG-based board with 121 holes per player track
- Organize holes into 4 "streets" of 30 holes each, plus finish hole
- Two parallel tracks (player and computer)
- Group holes in sets of 5 for visual clarity (traditional board marking)

**Board Structure**:
```jsx
// Hole positions calculated for S-curve or straight layout
// Each hole: { x, y, holeNumber }
// Streets alternate direction for S-curve effect
```

**Deliverable**: Static SVG board component rendering all 242 holes (121 × 2 players)

[Back to TOC](#table-of-contents)

---

### Step 1.2: Implement dual-peg state management 🤖

**Objective**: Create state to track both pegs for each player.

**Details**:
- Track `frontPeg` and `backPeg` positions for each player
- Initial state: both pegs at position 0 (start)
- Store in game state or dedicated board state

**State Structure**:
```javascript
const [pegPositions, setPegPositions] = useState({
  player: { frontPeg: 0, backPeg: 0 },
  computer: { frontPeg: 0, backPeg: 0 }
});
```

**Deliverable**: State management for 4 peg positions

[Back to TOC](#table-of-contents)

---

### Step 1.3: Add basic peg rendering 🤖

**Objective**: Render pegs at their positions on the board.

**Details**:
- Player pegs: One color (e.g., blue)
- Computer pegs: Another color (e.g., red)
- Pegs rendered as filled circles over holes
- Slight size difference or glow to distinguish front from back peg

**Deliverable**: Visible pegs on the board at correct positions

[Back to TOC](#table-of-contents)

---

## Phase 2: Pegging Animation System

### Step 2.1: Create peg movement animation 🤖

**Objective**: Animate a peg moving from one hole to another.

**Details**:
- Use CSS transitions or framer-motion
- Peg follows path along the board (not straight line)
- Duration proportional to distance or fixed per-point
- Easing function for natural movement

**Animation Approach**:
```javascript
// Option 1: CSS transitions with calculated positions
// Option 2: framer-motion with keyframes
// Option 3: requestAnimationFrame for fine control
```

**Deliverable**: Smooth peg movement animation

[Back to TOC](#table-of-contents)

---

### Step 2.2: Implement leapfrog peg logic 🤖

**Objective**: When scoring, back peg jumps over front peg.

**Details**:
- On score: backPeg moves to (frontPeg + points)
- Swap: new frontPeg = old backPeg's destination, new backPeg = old frontPeg
- Animation shows the leapfrog visually

**Logic**:
```javascript
function movePeg(player, points) {
  const { frontPeg, backPeg } = pegPositions[player];
  const newPosition = frontPeg + points;

  // Back peg leapfrogs to new position
  setPegPositions(prev => ({
    ...prev,
    [player]: {
      frontPeg: newPosition,  // Back becomes new front
      backPeg: frontPeg       // Old front becomes new back
    }
  }));
}
```

**Deliverable**: Correct leapfrog behavior on every score

[Back to TOC](#table-of-contents)

---

### Step 2.3: Add point-by-point sequential animation 🤖

**Objective**: Animate each point individually for dramatic effect.

**Details**:
- For a 12-point hand, show 12 individual peg movements
- Configurable speed (fast for small scores, can skip for large)
- Option to "speed up" or "skip" animation
- Queue system for handling animation requests

**Animation Queue**:
```javascript
// Queue points to animate
// Process queue with delays between each point
// Allow cancellation/skip
```

**Deliverable**: Sequential point-by-point animation with skip option

[Back to TOC](#table-of-contents)

---

## Phase 3: Zoom and Focus Effects

### Step 3.1: Implement board zoom on scoring 🤖

**Objective**: Zoom the board view when scoring occurs.

**Details**:
- Default view: Full board visible
- On scoring: Zoom to ~3x centered on scoring area
- Smooth zoom transition (CSS transform: scale)
- Board container clips overflow

**Implementation**:
```jsx
<div className="overflow-hidden">
  <div style={{
    transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
    transition: 'transform 0.5s ease-out'
  }}>
    <CribbageBoard />
  </div>
</div>
```

**Deliverable**: Zoom effect when scoring begins

[Back to TOC](#table-of-contents)

---

### Step 3.2: Add focus tracking to follow pegs 🤖

**Objective**: Pan the zoomed view to follow the moving peg.

**Details**:
- Calculate viewport offset to center on active peg
- Smooth panning as peg moves along board
- Handle street transitions (peg moving around corners)

**Deliverable**: Camera follows the action during animation

[Back to TOC](#table-of-contents)

---

### Step 3.3: Create smooth zoom transitions 🤖

**Objective**: Polish zoom in/out and pan transitions.

**Details**:
- Zoom in at start of scoring
- Pan to follow during animation
- Zoom out when scoring complete
- Handle interruptions gracefully

**Deliverable**: Professional-quality zoom/pan effects

[Back to TOC](#table-of-contents)

---

## Phase 4: Integration with Game Logic

### Step 4.1: Hook into addPoints function 🤖

**Objective**: Trigger board animation when points are scored.

**Details**:
- Modify `addPoints()` to emit animation event
- Board component subscribes to scoring events
- Pass player, points, and reason to animation system

**Integration Point**:
```javascript
const addPoints = useCallback((player, points, reason) => {
  // ... existing scoring logic ...

  // Trigger board animation
  triggerPegAnimation(player, points, reason);

  return { newScore, gameEnded };
}, []);
```

**Deliverable**: Board animates automatically on every score

[Back to TOC](#table-of-contents)

---

### Step 4.2: Add animation completion callbacks 🤖

**Objective**: Game waits for animation before continuing.

**Details**:
- Animation returns a Promise or calls onComplete
- Game logic waits for animation to finish
- Prevents race conditions with rapid scoring

**Deliverable**: Synchronized game flow with animations

[Back to TOC](#table-of-contents)

---

### Step 4.3: Handle rapid successive scoring 🤖

**Objective**: Gracefully handle multiple scores in quick succession.

**Details**:
- Queue system for pending animations
- Option to batch/speed up if queue grows
- Never lose score updates
- Handle game-over during animation

**Deliverable**: Robust handling of rapid scoring scenarios

[Back to TOC](#table-of-contents)

---

## Phase 5: Visual Polish

### Step 5.1: Add board textures and styling 🤖

**Objective**: Make the board look like a real wooden cribbage board.

**Details**:
- Wood grain texture or gradient
- 3D hole depth effect (radial gradient)
- Board border/edge styling
- Optional: Different board themes

**Deliverable**: Visually appealing board design

[Back to TOC](#table-of-contents)

---

### Step 5.2: Implement peg glow effects 🤖

**Objective**: Add visual feedback to active pegs.

**Details**:
- Glow effect on peg being moved
- Pulse animation on landing
- Trail effect during movement (optional)
- Winner celebration effect at 121

**Deliverable**: Enhanced peg visual effects

[Back to TOC](#table-of-contents)

---

### Step 5.3: Add score labels and markers 🤖

**Objective**: Add reference points on the board.

**Details**:
- Labels at 0, 30, 60, 90, 120, 121
- Visual markers every 5 holes
- Current score display overlay
- "+X points" floating text during animation

**Deliverable**: Clear score reference points

[Back to TOC](#table-of-contents)

---

## Phase 6: Testing and Deployment

### Step 6.1: Test all scoring scenarios 👤

**Objective**: Verify animation works correctly in all cases.

**Test Cases**:
- [ ] Small scores (1-5 points)
- [ ] Large scores (20+ points)
- [ ] Rapid successive scores
- [ ] Score that triggers win (crossing 121)
- [ ] Both players scoring alternately
- [ ] Resume game with existing scores
- [ ] His heels (2 points on cut)

**Deliverable**: All test cases passing

[Back to TOC](#table-of-contents)

---

### Step 6.2: Performance optimization 🤖

**Objective**: Ensure smooth animation on all devices.

**Details**:
- Profile animation performance
- Optimize SVG rendering
- Use CSS transforms (GPU accelerated)
- Reduce repaints during animation

**Deliverable**: 60fps animation on target devices

[Back to TOC](#table-of-contents)

---

### Step 6.3: Deploy to production 👤

**Objective**: Release the animated cribbage board.

**Steps**:
1. Final review and testing
2. Merge branch to main
3. Push and deploy to EC2
4. Verify in production

**Deliverable**: Feature live in production

[Back to TOC](#table-of-contents)

---

## Technical Notes

### File Structure
```
components/
  CribbageBoard.jsx      # Main board component
  CribbageBoard.css      # Board styles and animations
  Peg.jsx                # Individual peg component
  BoardHole.jsx          # Hole component (optional)
```

### Dependencies
- No new dependencies required (CSS animations)
- Optional: framer-motion for complex animations

### State Flow
```
addPoints()
  → triggerPegAnimation(player, points)
  → Board zooms in
  → Back peg animates point-by-point
  → Board zooms out
  → onAnimationComplete()
  → Game continues
```

---

*Plan created: 2024-12-27*
*Status: Awaiting approval*
