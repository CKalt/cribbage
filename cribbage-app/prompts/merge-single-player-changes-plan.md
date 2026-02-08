# Merge Single-Player Changes from Main into Multiplayer Branch

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Bug Fixes Reference](#bug-fixes-reference)
- [x] [Phase 1: Safe File Copies (No Conflicts)](#phase-1-safe-file-copies-no-conflicts) 🤖
  - [x] [1.1: Copy FlyingCard.jsx component from main](#11-copy-flyingcardjsx-component-from-main-🤖)
  - [x] [1.2: Copy PlayingCard.jsx updates from main](#12-copy-playingcardjsx-updates-from-main-🤖)
  - [x] [1.3: Copy ActionButtons.jsx updates from main](#13-copy-actionbuttonsjsx-updates-from-main-🤖)
  - [x] [1.4: Copy SEO files from main](#14-copy-seo-files-from-main-🤖)
  - [x] [1.5: Copy auth page styling from main](#15-copy-auth-page-styling-from-main-🤖)
  - [x] [1.6: Copy plan documents from main](#16-copy-plan-documents-from-main-🤖)
- [x] [Phase 2: Merge Shared Files with Minor Conflicts](#phase-2-merge-shared-files-with-minor-conflicts) 🤖
  - [x] [2.1: Merge globals.css — replace slideUp with flight animations](#21-merge-globalscss--replace-slideup-with-flight-animations-🤖)
  - [x] [2.2: Keep CribbageBoard.jsx as-is (multiplayer has label props)](#22-keep-cribbageboardjsx-as-is-multiplayer-has-label-props-🤖)
  - [x] [2.3: Keep deck.js as-is (multiplayer has seeded shuffle)](#23-keep-deckjs-as-is-multiplayer-has-seeded-shuffle-🤖)
  - [x] [2.4: Keep game-state/route.js as-is (multiplayer has email tracking)](#24-keep-game-stateroutejs-as-is-multiplayer-has-email-tracking-🤖)
  - [x] [2.5: Update CLAUDE.md with deployment stack info from main](#25-update-claudemd-with-deployment-stack-info-from-main-🤖)
- [x] [Phase 3: Major Integration — CribbageGame.jsx Animations](#phase-3-major-integration--cribbagegamejsx-animations) 🤖
  - [x] [3.1: Add animation imports and state variables](#31-add-animation-imports-and-state-variables-🤖)
  - [x] [3.2: Add animation refs](#32-add-animation-refs-🤖)
  - [x] [3.3: Add computer discard pre-computation to dealHands](#33-add-computer-discard-pre-computation-to-dealhands-🤖)
  - [x] [3.4: Add computer discard animation functions](#34-add-computer-discard-animation-functions-🤖)
  - [x] [3.5: Add card flight animation to pegging (selectCard + playCard)](#35-add-card-flight-animation-to-pegging-selectcard--playcard-🤖)
  - [x] [3.6: Add crib reveal animation to counting phase](#36-add-crib-reveal-animation-to-counting-phase-🤖)
  - [x] [3.7: Add recovery deal fix (needsRecoveryDealRef)](#37-add-recovery-deal-fix-needsrecoverydealref-🤖)
  - [x] [3.8: Update game state persistence with animation state](#38-update-game-state-persistence-with-animation-state-🤖)
  - [x] [3.9: Update JSX rendering with animation UI elements](#39-update-jsx-rendering-with-animation-ui-elements-🤖)
- [x] [Phase 4: Version Bump](#phase-4-version-bump) 🤖
  - [x] [4.1: Update lib/version.js](#41-update-libversionjs-🤖)
- [x] [Phase 5: Build & Verify](#phase-5-build--verify) 🤖
  - [x] [5.1: Run npm run build and fix any errors](#51-run-npm-run-build-and-fix-any-errors-🤖)
- [ ] [Phase 6: Local Testing on Mac](#phase-6-local-testing-on-mac) 👤
  - [ ] [6.1: Manual testing of single-player with animations](#61-manual-testing-of-single-player-with-animations-👤)
  - [ ] [6.2: Manual testing of multiplayer functionality](#62-manual-testing-of-multiplayer-functionality-👤)
  - [ ] [6.3: Manual testing of bug fixes](#63-manual-testing-of-bug-fixes-👤)
- [x] [Phase 7: Git Add & Commit](#phase-7-git-add--commit) 🤖
  - [x] [7.1: Git add all changed files and commit](#71-git-add-all-changed-files-and-commit-🤖)
- [x] [Phase 8: Push & Deploy to Beta](#phase-8-push--deploy-to-beta) 🤖👤
  - [x] [8.1: Push to multiplayer branch and deploy to beta](#81-push-to-multiplayer-branch-and-deploy-to-beta-🤖👤)

---

## Overview

This plan brings all single-player improvements from the `main` branch into the `multiplayer` branch. The `main` branch has 31 commits (b92–b115) with card flight animations, crib reveal animations, computer discard animations, bug fixes, SEO infrastructure, auth page styling, and UI polish. The `multiplayer` branch has 59 commits adding full multiplayer game functionality. The branches diverged at commit `c7a5156`.

**Strategy:** Manual integration (NOT `git merge`) — the branches have extreme divergence in `CribbageGame.jsx` (~1,489 lines of diff) and opposite changes in several files. We selectively bring main's improvements into multiplayer's codebase, preserving all multiplayer functionality.

**Branch:** `multiplayer` | **Deploy target:** `beta.cribbage.chrisk.com`

[Back to TOC](#table-of-contents)

---

## Problem Statement

The `multiplayer` branch is missing all single-player improvements made on `main` since the branches diverged:

1. **No card flight animations** — pegging cards don't fly, computer discard isn't animated, crib reveal has no animation
2. **No computer discard timing** — computer discard happens instantly with no visual cue
3. **Missing bug fixes** — counting state recovery (b113), double-deal prevention (b114-b115), crib highlight on restore
4. **No SEO infrastructure** — missing sitemap, robots.txt, Google Search Console verification
5. **Old auth page styling** — pages use old blue theme instead of green theme
6. **No card borders/shadows** — PlayingCard component lacks visual polish
7. **No action bar card display** — ActionButtons doesn't show the played card

A `git merge main` is NOT viable because main deleted all multiplayer files and has 1,489 lines of conflict in CribbageGame.jsx alone.

[Back to TOC](#table-of-contents)

---

## Bug Fixes Reference

All bug fixes from `main` that must be merged, ordered by criticality. The **Critical Gameplay** fixes are the highest priority. Animation-related fixes only matter after the animation features are integrated (Phase 3).

### Critical Gameplay Fixes

| Build | Commit | Description | Files |
|-------|--------|-------------|-------|
| **b115** | `032be11` | **Eliminate double-deal bug and restore crib highlight on game resume.** Replaced state-based recovery useEffect with `needsRecoveryDealRef` — a ref set ONLY in restore code. Prevents dealer toggling twice (same dealer consecutive hands). Also sets `cribRevealPhase='done'` on restore during crib counting so crib highlight shows correctly. | `CribbageGame.jsx` |
| **b114** | `43d0f8e` | **Prevent double-deal causing consecutive same dealer; keep hand visible during undercount.** Intermediate fix (superseded by b115's ref approach) but also changed `showCribHere` to depend on `cribRevealPhase` instead of `handsCountedThisRound >= 2`, fixing hand disappearing during undercount review. | `CribbageGame.jsx` |
| **b113** | `beec631` | **Recover from stuck counting state when `handsCountedThisRound >= 3`.** Added restore handler for completed counting and recovery useEffect. The useEffect approach was later replaced in b115, but the restore handler logic is still needed. | `CribbageGame.jsx` |
| **b93** | `2a4ced4` | **Bug #51: Computer says "Go" correctly.** Computer now says "Go" when it can't play during pegging, instead of wrongly asking the player to say Go on the computer's turn. **Bug #50: Hide player hand during crib counting** to reduce confusion — only crib cards shown when counting crib. **Bug #39: Green theme for signup page.** | `CribbageGame.jsx`, `app/signup/page.js` |

### Animation Feature Fixes (Apply After Phase 3)

These are iterative refinements to the animation features. The final state of each fix is what matters — earlier iterations are superseded.

| Build | Commit | Description | What It Fixed |
|-------|--------|-------------|---------------|
| **b112** | `e6a8128` | **Capture fresh DOM positions before each crib card flies.** Root cause: all 4 target positions were captured upfront, but the grid cell shifted as each card was added. Fix: call `getBoundingClientRect()` right before each card flies, using double `requestAnimationFrame`. | Crib cards 3 & 4 flew to wrong positions |
| **b111** | `90959af` | **Complete crib reveal animation overhaul.** Final stable version of crib reveal using CSS Grid overlay. | Supersedes b107–b110 |
| **b106** | `6768e4d` | **Crib pile shows full 4-card stack outside cribSelect phase.** | Crib pile disappeared after discard |
| **b101** | `be79550` | **Pegging animation flies to center of play area.** | Cards flew to edge instead of center |
| **b100** | `71b561f` | **Improve crib pile visibility; fix discard animation.** | Crib pile hard to see; discard animation glitchy |
| — | `969e872` | **Show face-up card for computer animation and fix width.** | Computer's animated card showed wrong face |
| — | `90ba4fd` | **Show played card in action bar for better visibility.** | Hard to see which card was just played |

### UI Polish (Not Bug Fixes, But Included in Merge)

| Commit | Description | Files |
|--------|-------------|-------|
| `9635cab` | Center cards and add overlapping layout for table-top feel | `CribbageGame.jsx` |
| `97bd333` | Green theme for all auth pages | Auth pages |
| `379b465` | Match input backgrounds on login and signup | Auth pages |
| `b8ad5ae` | Add `rm -rf .next` to deploy commands to prevent stale chunk errors | `CLAUDE.md` |

### Integration Notes

- **b115 is the definitive fix** for the double-deal bug. It supersedes b113 and b114. When integrating Phase 3.7, use b115's `needsRecoveryDealRef` approach directly.
- **b111 is the definitive fix** for crib reveal animation. Builds b107–b110 were iterative attempts — only the final b111 state matters.
- **Bug #51 (computer Go)** must be integrated into the pegging logic in CribbageGame.jsx. Check if multiplayer's version already has this fix — if not, port the specific `setLastGoPlayer('computer')` + `COMPUTER_GO` log event block.
- **Bug #50 (hide hand during crib)** is now handled by `cribRevealPhase` condition rather than `handsCountedThisRound >= 2`.

[Back to TOC](#table-of-contents)

---

## Phase 1: Safe File Copies (No Conflicts)

These files were changed on `main` but NOT on `multiplayer` (or are new files). They can be copied directly.

### 1.1: Copy FlyingCard.jsx component from main 🤖

**Source:** `main:components/FlyingCard.jsx` (NEW — 69 lines)
**Target:** `components/FlyingCard.jsx`

This is a new component that renders an animated card overlay using `createPortal`. It flies from a source rect to a target rect using CSS custom properties (`--fly-x`, `--fly-y`). Used by CribbageGame.jsx for pegging, discard, and crib reveal animations.

**Action:** `git show main:cribbage-app/components/FlyingCard.jsx > components/FlyingCard.jsx`

[Back to TOC](#table-of-contents)

---

### 1.2: Copy PlayingCard.jsx updates from main 🤖

**File:** `components/PlayingCard.jsx`
**Change:** Adds `border border-gray-300 shadow-sm` to revealed cards, selectable cards, and played cards (3 locations).
**Conflict risk:** NONE — file not modified on multiplayer.

[Back to TOC](#table-of-contents)

---

### 1.3: Copy ActionButtons.jsx updates from main 🤖

**File:** `components/ActionButtons.jsx`
**Change:** The "accept pending score" UI now shows the card that was played (extracted from reason string) in a compact layout instead of the old large banner with bounce animation.
**Conflict risk:** NONE — file not modified on multiplayer.

[Back to TOC](#table-of-contents)

---

### 1.4: Copy SEO files from main 🤖

**New files:**
- `app/sitemap.js` — Dynamic sitemap generator
- `public/robots.txt` — Search engine config
- `public/google6468a5b9d23d75b7.html` — Google Search Console verification

**Conflict risk:** NONE — these files don't exist on multiplayer.

[Back to TOC](#table-of-contents)

---

### 1.5: Copy auth page styling from main 🤖

**Files:**
- `app/login/page.js`
- `app/signup/page.js`
- `app/confirm/page.js`
- `app/forgot-password/page.js`
- `app/reset-password/page.js`

**Change:** Green theme (`bg-green-800` backgrounds, `bg-yellow-50` inputs, gold borders) replacing old blue/gray theme.
**Conflict risk:** NONE — auth pages not modified on multiplayer.

[Back to TOC](#table-of-contents)

---

### 1.6: Copy plan documents from main 🤖

**New files:**
- `prompts/discard-to-crib-experience-plan.md`
- `prompts/pegging-card-animation-plan.md`

**Conflict risk:** NONE — don't exist on multiplayer.

[Back to TOC](#table-of-contents)

---

## Phase 2: Merge Shared Files with Minor Conflicts

### 2.1: Merge globals.css — replace slideUp with flight animations 🤖

**File:** `app/globals.css`

Multiplayer added a `slideUp` keyframe at the end. Main replaced `slideUp` with three new animations:
- `@keyframes cardFly` — pegging card flight with arc motion
- `@keyframes cardLand` — landing pulse effect
- `@keyframes cribCardFly` — straight-line crib card reveal
- `.flying-card` class — fixed position, z-index 9999
- `.flying-card-crib` class — same but for crib reveal

**Action:** Replace multiplayer's `slideUp` block with main's animation CSS.

[Back to TOC](#table-of-contents)

---

### 2.2: Keep CribbageBoard.jsx as-is (multiplayer has label props) 🤖

**File:** `components/CribbageBoard.jsx`

Multiplayer ADDED `playerLabel`/`opponentLabel` optional props (defaulting to `'You'`/`'CPU'`). Main REMOVED these same props. The multiplayer version is correct — we need the label props for `MultiplayerGame.jsx` to show player names on the board.

**Action:** No change needed. Keep multiplayer's version.

[Back to TOC](#table-of-contents)

---

### 2.3: Keep deck.js as-is (multiplayer has seeded shuffle) 🤖

**File:** `lib/deck.js`

Main removed `seededShuffle` and test deck support. Multiplayer added `seededShuffle`, `createShuffledDeck`, and `getTestDeckSeed` for deterministic testing. The seeded shuffle only activates with `TEST_DECK_SEED` env var and doesn't affect production.

**Action:** No change needed. Keep multiplayer's version.

[Back to TOC](#table-of-contents)

---

### 2.4: Keep game-state/route.js as-is (multiplayer has email tracking) 🤖

**File:** `app/api/game-state/route.js`

Main simplified this file by removing email extraction/storage. Multiplayer needs email tracking for player lookup (invitations, game lobby). The multiplayer version has `getUserInfoFromToken()` returning `{ userId, email }` and `readUserData(userId, email)` that stores email.

**Action:** No change needed. Keep multiplayer's version.

[Back to TOC](#table-of-contents)

---

### 2.5: Update CLAUDE.md with deployment stack info from main 🤖

**File:** `CLAUDE.md`

Main updated deployment docs. Check if any useful info should be merged into multiplayer's CLAUDE.md.

**Action:** Review and cherry-pick any deployment documentation improvements.

[Back to TOC](#table-of-contents)

---

## Phase 3: Major Integration — CribbageGame.jsx Animations

This is the core of the merge. We integrate main's animation features into multiplayer's `CribbageGame.jsx` while preserving all multiplayer functionality (GameLobby, InviteFriend, MultiplayerGame, ProfileModal imports and state).

**Source reference:** `main:components/CribbageGame.jsx`
**Target:** `components/CribbageGame.jsx` (multiplayer's current version)

### 3.1: Add animation imports and state variables 🤖

**Import to add:**
```javascript
import FlyingCard from './FlyingCard';
```

**State variables to add (near existing state declarations):**
```javascript
// Card flight animation state
const [flyingCard, setFlyingCard] = useState(null);
const [landingCardIndex, setLandingCardIndex] = useState(null);

// Computer discard state
const [computerKeptHand, setComputerKeptHand] = useState(null);
const [computerDiscardCards, setComputerDiscardCards] = useState(null);
const [computerDiscardDone, setComputerDiscardDone] = useState(false);
const [cribCardsInPile, setCribCardsInPile] = useState(0);
const [computerDiscardMoment, setComputerDiscardMoment] = useState(null);

// Crib reveal animation state
const [cribRevealPhase, setCribRevealPhase] = useState('idle');
const [cribRevealedCards, setCribRevealedCards] = useState([]);
```

[Back to TOC](#table-of-contents)

---

### 3.2: Add animation refs 🤖

**Refs to add:**
```javascript
const playerPlayAreaRef = useRef(null);
const computerPlayAreaRef = useRef(null);
const computerHandRef = useRef(null);
const cribPileRef = useRef(null);
const handCardRectsRef = useRef({});
const needsRecoveryDealRef = useRef(false);
```

[Back to TOC](#table-of-contents)

---

### 3.3: Add computer discard pre-computation to dealHands 🤖

**File:** `components/CribbageGame.jsx` — `dealHands()` function

Currently, computer discard happens when the player discards (synchronous). Main changed this so the computer decides at deal time but animates at a random moment.

**Changes to `dealHands()`:**
1. Call `getComputerDiscard()` at deal time
2. Store result in `computerKeptHand` and `computerDiscardCards`
3. Pick random `computerDiscardMoment` (1-5)
4. Reset `computerDiscardDone`, `cribCardsInPile`

**New helper:** `triggerComputerDiscardAtMoment(moment)` — checks if the current moment matches and triggers animation.

[Back to TOC](#table-of-contents)

---

### 3.4: Add computer discard animation functions 🤖

**New functions:**
- `animateComputerDiscard()` — Flies face-down cards from computer hand area to crib pile, one at a time with stagger. Increments `cribCardsInPile`. On complete, sets `computerDiscardDone`.
- `applyCribDiscard()` — Called after both player and computer discards are done. Applies discard to game state (moves to crib).

**Crib pile rendering:** Show progressive pile (0, 2, or 4 face-down cards) based on `cribCardsInPile`.

[Back to TOC](#table-of-contents)

---

### 3.5: Add card flight animation to pegging (selectCard + playCard) 🤖

**Changes to `selectCard()` / card play logic:**
1. When player plays a card: capture source rect from hand card, capture target rect from play area
2. Set `flyingCard` with card data, start/end rects
3. On `FlyingCard` animation complete: apply the play to game state and set `landingCardIndex` for landing pulse
4. Computer plays: similar animation from computer hand area to play area

**Changes to `triggerComputerDiscardAtMoment()`:** Call at moments 2 and 3 (when player selects first/second card for discard).

[Back to TOC](#table-of-contents)

---

### 3.6: Add crib reveal animation to counting phase 🤖

**New functions:**
- `startCribReveal()` — Initiates sequential card reveal from crib pile to dealer's hand area
- `revealNextCribCard(index)` — Recursively reveals one card at a time. Captures fresh DOM position before each card (fix from b112). Uses `requestAnimationFrame` double-frame for accurate positions.

**Changes to counting phase:**
- When transitioning to crib counting: call `startCribReveal()` instead of instantly showing crib cards
- Set `cribRevealPhase` through `'idle'` → `'revealing'` → `'done'`
- Use `cribRevealPhase` (NOT `handsCountedThisRound`) for crib display conditions (fix from b114)

[Back to TOC](#table-of-contents)

---

### 3.7: Add recovery deal fix (needsRecoveryDealRef) 🤖

**Bug fixes from b113-b115:**
- When restoring a game where counting is already complete (`handsCountedThisRound >= 3`), set `needsRecoveryDealRef.current = true`
- Add a useEffect that checks `needsRecoveryDealRef` and triggers a new deal after 1.5s delay
- This replaces any state-based useEffect approach (which caused double-deal bugs)
- On restore during crib counting (`hands === 2`): set `cribRevealPhase = 'done'`

[Back to TOC](#table-of-contents)

---

### 3.8: Update game state persistence with animation state 🤖

**Changes to save/restore:**
- Add `cribCardsInPile`, `computerDiscardDone` to persisted state
- On restore: reset `flyingCard`, `landingCardIndex` to null
- On restore: set `cribRevealPhase` appropriately based on counting state

[Back to TOC](#table-of-contents)

---

### 3.9: Update JSX rendering with animation UI elements 🤖

**JSX additions:**
1. `ref={playerPlayAreaRef}` on player's played cards area
2. `ref={computerPlayAreaRef}` on computer's played cards area
3. `ref={computerHandRef}` on computer's face-down hand display
4. `ref={cribPileRef}` on crib pile area
5. Progressive crib pile rendering (0/2/4 cards based on `cribCardsInPile`)
6. `<FlyingCard>` component rendered when `flyingCard` state is set
7. Landing pulse class (`animate-pulse`) on `landingCardIndex`
8. Use `cribRevealPhase` for showing crib cards during counting
9. Show `cribRevealedCards` during reveal animation

[Back to TOC](#table-of-contents)

---

## Phase 4: Version Bump

### 4.1: Update lib/version.js 🤖

**File:** `lib/version.js`

Bump version to reflect the merge. Current multiplayer version is `v0.2.0`. After merge:
- Version: `v0.3.0-bXX-YYYYMMDD` (new minor version for animation feature merge)
- Update release notes to mention both multiplayer and single-player animations

[Back to TOC](#table-of-contents)

---

## Phase 5: Build & Verify

### 5.1: Run npm run build and fix any errors 🤖

Run `npm run build` and resolve any compilation errors. Common issues to watch for:
- Missing imports (FlyingCard, animation refs)
- Undefined state variables
- JSX ref mismatches

[Back to TOC](#table-of-contents)

---

## Phase 6: Local Testing on Mac

**IMPORTANT:** All changes must be tested locally on the Mac (`npm run dev`) before any commit or deployment. The user will run through the test checklist manually. No deployment to beta happens until the user confirms everything works locally.

### 6.1: Manual testing of single-player with animations 👤

Run `npm run dev` on the Mac and test in the browser:

- [ ] Start a new single-player game — deal animation works
- [ ] Discard to crib — computer discards with face-down card animation at a random moment
- [ ] Crib pile shows progressive cards (0 → 2 → 4)
- [ ] Pegging — cards fly from hand to play area when played
- [ ] Computer cards fly from computer hand area to play area
- [ ] Action bar shows the played card in the accept-score banner
- [ ] Cards have borders and shadows (PlayingCard polish)
- [ ] Counting — crib reveal animation (cards fly one-by-one from pile to display)
- [ ] Crib cards display correctly during crib counting (not stacked/overlapping)

[Back to TOC](#table-of-contents)

---

### 6.2: Manual testing of multiplayer functionality 👤

- [ ] Multiplayer menu item still appears and works
- [ ] Game lobby loads and shows invitations
- [ ] Profile modal works
- [ ] CribbageBoard shows player names (not just "You"/"CPU")
- [ ] Admin panel multiplayer tab works

[Back to TOC](#table-of-contents)

---

### 6.3: Manual testing of bug fixes 👤

These are the critical gameplay fixes from main that must be verified:

- [ ] **Bug #51 — Computer Go:** During pegging, if it's the computer's turn and it can't play, it says "Go" (not the player)
- [ ] **Bug #50 — Hide hand during crib count:** Player hand is hidden when counting the crib, only crib cards shown
- [ ] **Double-deal fix (b115):** Log out and log back in mid-game during counting — game restores without dealing twice or giving the same player the crib consecutively
- [ ] **Crib highlight on restore (b115):** Log out during crib counting, log back in — crib cards display correctly with highlight

Once all checks pass, tell Claude "local testing passed" to proceed with commit and deployment.

[Back to TOC](#table-of-contents)

---

## Phase 7: Git Add & Commit

### 7.1: Git add all changed files and commit 🤖

Git add each file individually (no wildcards, no `-A`):
- `components/FlyingCard.jsx` (new)
- `components/CribbageGame.jsx`
- `components/PlayingCard.jsx`
- `components/ActionButtons.jsx`
- `app/globals.css`
- `app/sitemap.js` (new)
- `public/robots.txt` (new)
- `public/google6468a5b9d23d75b7.html` (new)
- `app/login/page.js`
- `app/signup/page.js`
- `app/confirm/page.js`
- `app/forgot-password/page.js`
- `app/reset-password/page.js`
- `prompts/discard-to-crib-experience-plan.md` (new)
- `prompts/pegging-card-animation-plan.md` (new)
- `prompts/merge-single-player-changes-plan.md` (this plan)
- `lib/version.js`
- `CLAUDE.md` (if updated)

**✅ Completed 2026-02-08:** All 19 files staged and committed as `6b334ab` — "feat: merge single-player animations and polish from main into multiplayer" (19 files changed, 1888 insertions, 277 deletions).

[Back to TOC](#table-of-contents)

---

## Phase 8: Push & Deploy to Beta

### 8.1: Push to multiplayer branch and deploy to beta 🤖👤

Push to `multiplayer` branch, then deploy to beta:
```bash
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
  "cd cribbage-beta && git pull && cd cribbage-app && rm -rf .next && npm run build && pm2 restart cribbage-beta"
```

**✅ Completed 2026-02-08:** Pushed to origin/multiplayer and deployed to beta.cribbage.chrisk.com. Build compiled successfully in 15.5s. PM2 restarted cribbage-beta process.

[Back to TOC](#table-of-contents)

---

## Files Summary

| File | Action | Conflict Risk |
|------|--------|---------------|
| `components/FlyingCard.jsx` | Copy from main (NEW) | NONE |
| `components/PlayingCard.jsx` | Copy from main | NONE |
| `components/ActionButtons.jsx` | Copy from main | NONE |
| `app/sitemap.js` | Copy from main (NEW) | NONE |
| `public/robots.txt` | Copy from main (NEW) | NONE |
| `public/google6468a5b9d23d75b7.html` | Copy from main (NEW) | NONE |
| `app/login/page.js` | Copy from main | NONE |
| `app/signup/page.js` | Copy from main | NONE |
| `app/confirm/page.js` | Copy from main | NONE |
| `app/forgot-password/page.js` | Copy from main | NONE |
| `app/reset-password/page.js` | Copy from main | NONE |
| `prompts/discard-to-crib-experience-plan.md` | Copy from main (NEW) | NONE |
| `prompts/pegging-card-animation-plan.md` | Copy from main (NEW) | NONE |
| `app/globals.css` | Replace slideUp with flight animations | LOW |
| `components/CribbageBoard.jsx` | Keep multiplayer version | NONE |
| `lib/deck.js` | Keep multiplayer version | NONE |
| `app/api/game-state/route.js` | Keep multiplayer version | NONE |
| `components/CribbageGame.jsx` | Manual integration of animations | **EXTREME** |
| `lib/version.js` | Bump version | LOW |
| `CLAUDE.md` | Merge deployment docs | LOW |

## Files NOT Modified (Protected)

All multiplayer-specific files are preserved as-is:
- `components/MultiplayerGame.jsx`, `components/GameLobby.jsx`, `components/InviteFriend.jsx`, `components/ProfileModal.jsx`
- `lib/multiplayer-game.js`, `lib/multiplayer-schema.js`, `lib/seeded-random.js`
- All `app/api/multiplayer/` routes
- All multiplayer tests in `test-bin/`
