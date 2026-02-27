# Rich Compliment + Banter + Micro-Animation System — Implementation Plan

**Created**: 2026-02-21
**Author**: Claude Code
**Status**: Draft — Awaiting Review
**Parent**: `prompts/ai-rich-compliments-full-plan-request.md`

---

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [1. Event Taxonomy](#1-event-taxonomy)
  - [ ] [1.1 Hand-Score Events](#11-hand-score-events)
  - [ ] [1.2 Pegging Events](#12-pegging-events)
  - [ ] [1.3 Game-State Events](#13-game-state-events)
  - [ ] [1.4 Special Events](#14-special-events)
- [ ] [2. Full Compliment Library (400+ Phrases)](#2-full-compliment-library-400-phrases)
  - [ ] [2.1 Library Structure](#21-library-structure)
  - [ ] [2.2 PERFECT_29 (25 phrases)](#22-perfect_29-25-phrases)
  - [ ] [2.3 NEAR_PERFECT_28 (25 phrases)](#23-near_perfect_28-25-phrases)
  - [ ] [2.4 MONSTER_HAND_24 (30 phrases)](#24-monster_hand_24-30-phrases)
  - [ ] [2.5 BIG_HAND_20_PLUS (35 phrases)](#25-big_hand_20_plus-35-phrases)
  - [ ] [2.6 DOUBLE_RUN (25 phrases)](#26-double_run-25-phrases)
  - [ ] [2.7 TRIPLE_RUN (20 phrases)](#27-triple_run-20-phrases)
  - [ ] [2.8 FOUR_OF_A_KIND (25 phrases)](#28-four_of_a_kind-25-phrases)
  - [ ] [2.9 HUGE_CRIB (25 phrases)](#29-huge_crib-25-phrases)
  - [ ] [2.10 PEG_31 (25 phrases)](#210-peg_31-25-phrases)
  - [ ] [2.11 PEG_GO_STEAL (20 phrases)](#211-peg_go_steal-20-phrases)
  - [ ] [2.12 PEG_TRAP (20 phrases)](#212-peg_trap-20-phrases)
  - [ ] [2.13 SKUNK (25 phrases)](#213-skunk-25-phrases)
  - [ ] [2.14 COMEBACK_WIN (25 phrases)](#214-comeback_win-25-phrases)
  - [ ] [2.15 CLOSE_GAME_WIN (25 phrases)](#215-close_game_win-25-phrases)
  - [ ] [2.16 CUT_JACK (20 phrases)](#216-cut_jack-20-phrases)
  - [ ] [2.17 ZERO_HAND (25 phrases)](#217-zero_hand-25-phrases)
  - [ ] [2.18 BACK_TO_BACK_BIG_HANDS (20 phrases)](#218-back_to_back_big_hands-20-phrases)
- [ ] [3. Classic Cribbage Table Banter Tone Pack](#3-classic-cribbage-table-banter-tone-pack)
  - [ ] [3.1 Tone Characteristics](#31-tone-characteristics)
  - [ ] [3.2 Maine Lodge 1958 Phrases (150 phrases)](#32-maine-lodge-1958-phrases-150-phrases)
- [ ] [4. Micro-Animation Pool](#4-micro-animation-pool)
  - [ ] [4.1 Animation Metadata Structure](#41-animation-metadata-structure)
  - [ ] [4.2 Animation Catalog (30 Animations)](#42-animation-catalog-30-animations)
  - [ ] [4.3 CSS Implementation Approach](#43-css-implementation-approach)
  - [ ] [4.4 Pool Selection Rules](#44-pool-selection-rules)
- [ ] [5. Anti-Repetition System](#5-anti-repetition-system)
  - [ ] [5.1 Text Selection Algorithm](#51-text-selection-algorithm)
  - [ ] [5.2 Animation Selection Algorithm](#52-animation-selection-algorithm)
  - [ ] [5.3 Easter Egg Selection](#53-easter-egg-selection)
- [ ] [6. Context Awareness](#6-context-awareness)
  - [ ] [6.1 Intensity Escalation Rules](#61-intensity-escalation-rules)
  - [ ] [6.2 Perspective Switching (Player vs AI)](#62-perspective-switching-player-vs-ai)
  - [ ] [6.3 Game-State Modifiers](#63-game-state-modifiers)
- [ ] [7. Celebration Level Settings](#7-celebration-level-settings)
  - [ ] [7.1 Celebration Level Tiers](#71-celebration-level-tiers)
  - [ ] [7.2 Motion Level Tiers](#72-motion-level-tiers)
  - [ ] [7.3 Settings Integration](#73-settings-integration)
- [ ] [7A. Celebration Experience Walk-Through](#7a-celebration-experience-walk-through)
  - [ ] [7A.1 The Scenario: A 10-Hand Stretch](#7a1-the-scenario-a-10-hand-stretch)
  - [ ] [7A.2 Classic Mode Feel](#7a2-classic-mode-feel)
  - [ ] [7A.3 Lively Mode Feel](#7a3-lively-mode-feel)
  - [ ] [7A.4 Full Banter Mode Feel](#7a4-full-banter-mode-feel)
  - [ ] [7A.5 The Takeaway](#7a5-the-takeaway)
- [ ] [8. Delivery Mechanism](#8-delivery-mechanism)
  - [ ] [8.1 Toast Component Design](#81-toast-component-design)
  - [ ] [8.2 Animation Anchor Points](#82-animation-anchor-points)
  - [ ] [8.3 Integration with Existing Celebration](#83-integration-with-existing-celebration)
- [ ] [9. Determinism & Testing](#9-determinism--testing)
  - [ ] [9.1 Seeded RNG Integration](#91-seeded-rng-integration)
  - [ ] [9.2 Unit Tests](#92-unit-tests)
  - [ ] [9.3 Golden Tests](#93-golden-tests)
- [ ] [10. Performance, Safety, Accessibility](#10-performance-safety-accessibility)
  - [ ] [10.1 Performance Budget](#101-performance-budget)
  - [ ] [10.2 Accessibility](#102-accessibility)
  - [ ] [10.3 Graceful Degradation](#103-graceful-degradation)
- [ ] [11. Extra Credit](#11-extra-credit)
  - [ ] [11.1 Streak Escalation](#111-streak-escalation)
  - [ ] [11.2 AI Personality Confidence Shifts](#112-ai-personality-confidence-shifts)
  - [ ] [11.3 Rare Celebratory Animations](#113-rare-celebratory-animations)
  - [ ] [11.4 Deadpan Mode](#114-deadpan-mode)
  - [ ] [11.5 Themeable Animation Packs (Future)](#115-themeable-animation-packs-future)
- [ ] [12. Rollout Plan](#12-rollout-plan)
  - [ ] [12.1 Phase 1: Core Engine + Phrase Library](#121-phase-1-core-engine--phrase-library)
  - [ ] [12.2 Phase 2: Micro-Animations](#122-phase-2-micro-animations)
  - [ ] [12.3 Phase 3: Context Awareness + Settings](#123-phase-3-context-awareness--settings)
  - [ ] [12.4 Phase 4: Banter Tone Pack + Extra Credit](#124-phase-4-banter-tone-pack--extra-credit)

---

## Overview

[Back to TOC](#table-of-contents)

This plan designs a celebration system that makes Cribbage come alive. When a player (or the AI) scores a 24-point monster hand, nails a pegging 31, or gets skunked — the game reacts. Not with generic "Nice!" popups, but with authentic, varied, cribbage-flavored reactions paired with subtle animations.

The system replaces the existing 7-phrase `CorrectScoreCelebration` component with a deep library of 400+ phrases across 16 event types, 30 micro-animations, anti-repetition selection, context-aware intensity scaling, and user-configurable celebration levels. Everything runs through the existing `aiRandom()` seeded PRNG for deterministic testing.

**Existing infrastructure**: `components/CorrectScoreCelebration.jsx` already renders a full-screen overlay with confetti, score display, and one of 7 random messages. This plan extends that foundation rather than replacing it.

---

## Problem Statement

[Back to TOC](#table-of-contents)

The current celebration system is minimal:
- Only triggers on correct score counts (not big hands, pegging, game events)
- 7 generic phrases ("Perfect!", "Nice count!", "Well done!", etc.)
- No variation by event type, score magnitude, or game context
- No anti-repetition — same phrase can appear twice in a row
- Confetti animation is the same every time
- Uses `Math.random()` instead of `aiRandom()` (not deterministic)
- No accessibility support (no `prefers-reduced-motion`, no `aria-live`)

Players deserve reactions that match the excitement of the moment. A 29-hand should feel legendary. A zero-hand should get a sympathetic wince. A skunk should sting.

---

## 1. Event Taxonomy

[Back to TOC](#table-of-contents)

### 1.1 Hand-Score Events

[Back to TOC](#table-of-contents)

| Event | Trigger Condition | Intensity | Rarity |
|-------|------------------|-----------|--------|
| `PERFECT_29` | `handScore === 29` | legendary | ~1 in 216,580 hands |
| `NEAR_PERFECT_28` | `handScore === 28` | epic | very rare |
| `MONSTER_HAND_24` | `handScore >= 24 && handScore < 28` | high | rare |
| `BIG_HAND_20_PLUS` | `handScore >= 20 && handScore < 24` | medium | uncommon |
| `DOUBLE_RUN` | breakdown includes 2 runs of same length | medium | common |
| `TRIPLE_RUN` | breakdown includes 3 runs of same length | high | uncommon |
| `FOUR_OF_A_KIND` | breakdown includes 6 pairs from 4 matching ranks | high | uncommon |
| `HUGE_CRIB` | `cribScore >= 16` | medium | uncommon |
| `ZERO_HAND` | `handScore === 0` | low (sympathetic) | ~3% of hands |
| `BACK_TO_BACK_BIG_HANDS` | current `handScore >= 16` AND previous hand was `>= 16` | high | rare |

**Detection logic** (in `lib/celebrations/events.js`):

```javascript
export function detectHandEvents(score, breakdown, prevHandScore) {
  const events = [];
  if (score === 29) events.push('PERFECT_29');
  else if (score === 28) events.push('NEAR_PERFECT_28');
  else if (score >= 24) events.push('MONSTER_HAND_24');
  else if (score >= 20) events.push('BIG_HAND_20_PLUS');
  if (score === 0) events.push('ZERO_HAND');

  // Check breakdown strings for patterns
  const pairCount = breakdown.filter(b => b.startsWith('Pair')).length;
  const runEntries = breakdown.filter(b => b.startsWith('Run'));
  if (pairCount >= 6) events.push('FOUR_OF_A_KIND');
  if (runEntries.length >= 3) events.push('TRIPLE_RUN');
  else if (runEntries.length === 2) events.push('DOUBLE_RUN');

  if (score >= 16 && prevHandScore >= 16) events.push('BACK_TO_BACK_BIG_HANDS');
  return events;
}
```

### 1.2 Pegging Events

[Back to TOC](#table-of-contents)

| Event | Trigger Condition | Intensity |
|-------|------------------|-----------|
| `PEG_31` | `currentCount === 31` after play | medium |
| `PEG_GO_STEAL` | player earns Go point (1 pt) when opponent can't play | low |
| `PEG_TRAP` | player scores ≥ 4 pegging points on a single play (pair royal, run of 4+, or multi-score combo) | medium |

**Detection**: These fire from the existing pegging logic in `CribbageGame.jsx` where pegging scores are already calculated.

### 1.3 Game-State Events

[Back to TOC](#table-of-contents)

| Event | Trigger Condition | Intensity |
|-------|------------------|-----------|
| `SKUNK` | game ends with loser < 91 points | high |
| `DOUBLE_SKUNK` | game ends with loser < 61 points | epic |
| `COMEBACK_WIN` | winner was behind by ≥ 30 points at some point during the game | high |
| `CLOSE_GAME_WIN` | game ends with margin ≤ 5 points | medium |

**Detection**: Fire from the game-over logic. Requires tracking `maxDeficit` during the game (new state variable: largest point deficit the eventual winner faced).

### 1.4 Special Events

[Back to TOC](#table-of-contents)

| Event | Trigger Condition | Intensity |
|-------|------------------|-----------|
| `CUT_JACK` | cut card is a Jack (dealer gets 2 pts for "his heels") | low |

---

## 2. Full Compliment Library (400+ Phrases)

[Back to TOC](#table-of-contents)

### 2.1 Library Structure

[Back to TOC](#table-of-contents)

**File**: `lib/celebrations/phrases.js`

```javascript
export const PHRASE_LIBRARY = {
  PERFECT_29: {
    intensity: 'legendary',
    toneVariants: {
      classic: [...],      // 6-8 phrases
      playful: [...],      // 6-8 phrases
      competitive: [...],  // 4-6 phrases
      understated: [...],  // 4-6 phrases
      easterEgg: [...],    // 1-2 phrases (<1% rate)
    }
  },
  // ... per event
};
```

Each phrase is a string. The selection system (section 5) picks a tone variant based on context and celebration level, then picks a phrase from within that variant using anti-repetition.

### 2.2 PERFECT_29 (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "Twenty-nine! The holy grail of cribbage!"
2. "A perfect 29. You may never see another."
3. "Twenty-nine points. That's one for the record books."
4. "The mythical 29. Some players wait a lifetime."
5. "Twenty-nine! The rarest hand in cribbage."
6. "A perfect hand. The cribbage gods are smiling."
7. "Twenty-nine. Frame this one."

**Playful** (7):
1. "TWENTY-NINE! Quick, buy a lottery ticket!"
2. "A 29! Someone pinch me!"
3. "Twenty-nine?! Are you sure this deck isn't rigged?"
4. "29! That's the cribbage equivalent of a hole-in-one on a par 5!"
5. "Twenty-nine! You should probably retire now."
6. "A 29! The unicorn of cribbage hands!"
7. "Twenty-nine points! I need to sit down."

**Competitive** (6):
1. "Twenty-nine. I have no answer for that."
2. "A perfect 29. I tip my hat."
3. "Twenty-nine. You win this hand — and my respect."
4. "A 29 against me. I'll remember this."
5. "Twenty-nine. Nothing I could have done."
6. "Perfect hand. You earned every point."

**Understated** (4):
1. "Well. That's twenty-nine."
2. "Twenty-nine. Not bad."
3. "Ah. The big one."
4. "So that happened. Twenty-nine."

**Easter Egg** (1):
1. "TWENTY-NINE! *flips table, puts it back, shakes your hand*"

### 2.3 NEAR_PERFECT_28 (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "Twenty-eight! One shy of perfection."
2. "A 28 — about as good as it gets."
3. "Twenty-eight points. That's a monster."
4. "Just one point off perfect. What a hand."
5. "Twenty-eight. The second-best hand in cribbage."
6. "A 28! That cut card was almost perfect."
7. "Twenty-eight points — remarkable hand."

**Playful** (7):
1. "Twenty-eight! So close to the dream!"
2. "A 28! The 'almost had a 29' hand!"
3. "Twenty-eight — the silver medal of cribbage!"
4. "So close! That missing point is going to haunt you."
5. "28! Somewhere a 29 is jealous."
6. "Twenty-eight — if only that cut had been different!"
7. "A 28! That's still outrageous!"

**Competitive** (6):
1. "Twenty-eight. That's hard to recover from."
2. "A 28. I'm going to need a bigger boat."
3. "Twenty-eight points against me. Ouch."
4. "That hand just changed the game."
5. "Twenty-eight. Devastating."
6. "I won't forget this 28."

**Understated** (4):
1. "Twenty-eight. Could have been worse. For you."
2. "A 28. Respectable."
3. "Hmm. Twenty-eight."
4. "Twenty-eight points. Noted."

**Easter Egg** (1):
1. "Twenty-eight! *stares at the cut card with deep disappointment*"

### 2.4 MONSTER_HAND_24 (30 phrases)

[Back to TOC](#table-of-contents)

**Classic** (8):
1. "Twenty-four! That's a powerhouse hand."
2. "A 24-point hand — those don't come around often."
3. "Twenty-four! You read those discards perfectly."
4. "A two-dozen hand! Beautiful."
5. "Twenty-four points. That's textbook cribbage."
6. "What a hand — twenty-four points!"
7. "Twenty-four. The cards were in your corner."
8. "A 24! Every card pulling its weight."

**Playful** (8):
1. "Twenty-four! Did you stack this deck?"
2. "A 24! I think the cards like you."
3. "Twenty-four points! That hand had everything!"
4. "24! You must've done something right in a past life."
5. "Twenty-four! Even I'm impressed, and I'm the computer."
6. "A 24! That's a lot of points for four cards and a cut."
7. "Twenty-four — that's what the kids call 'cracked'."
8. "24 points! Now you're just showing off."

**Competitive** (8):
1. "Twenty-four against me. That stings."
2. "A 24. I'll need a big crib to answer that."
3. "Twenty-four. You're making this look easy."
4. "That 24 just flipped the momentum."
5. "Twenty-four points. I'm in trouble."
6. "A monster hand. I see you."
7. "24. I need to start discarding better."
8. "Twenty-four. Well played."

**Understated** (5):
1. "Twenty-four. Not bad at all."
2. "A 24. That'll do."
3. "Solid twenty-four."
4. "Twenty-four points. Nice work."
5. "A tidy 24."

**Easter Egg** (1):
1. "Twenty-four! *adjusts monocle* I say, well played."

### 2.5 BIG_HAND_20_PLUS (35 phrases)

[Back to TOC](#table-of-contents)

**Classic** (9):
1. "That's a big hand!"
2. "Twenty-plus! Nicely done."
3. "A twenty-pointer — strong hand."
4. "That cut card made all the difference."
5. "Quality hand. Every card connected."
6. "That's the kind of hand that wins games."
7. "A big count! Well played."
8. "Solid hand — the cards fell your way."
9. "That's how it's done."

**Playful** (9):
1. "Now we're cooking!"
2. "That hand had some spice to it!"
3. "Look at all those points!"
4. "The cards are singing for you today!"
5. "Someone's having a good day at the table!"
6. "That's what I call a full dance card!"
7. "Those cards were working overtime!"
8. "Well hello there, big hand!"
9. "Points for days!"

**Competitive** (9):
1. "Big hand. I need to answer that."
2. "That one hurt."
3. "You're pulling ahead with hands like that."
4. "I see you. Challenge accepted."
5. "That's a lot of points to give up."
6. "Twenty-plus against me. Noted."
7. "You're making the most of your cards."
8. "That hand moved the pegs in a hurry."
9. "I'll remember this one."

**Understated** (7):
1. "Nice count."
2. "Good hand."
3. "That'll work."
4. "Not bad."
5. "Decent hand."
6. "Well counted."
7. "Points on the board."

**Easter Egg** (1):
1. "That hand just did a victory lap around the board."

### 2.6 DOUBLE_RUN (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "A double run! Those cards lined up."
2. "Double run — that pair made it pay."
3. "Beautiful double run."
4. "A double run! Smart to keep those connected."
5. "Double run — the backbone of a good hand."
6. "Those runs add up fast."
7. "A textbook double run."

**Playful** (7):
1. "Double the runs, double the fun!"
2. "A double run! Your cards are doing the tango!"
3. "Two runs for the price of one!"
4. "Double run! Those cards are holding hands!"
5. "A twin-run special!"
6. "Two runs walk into a hand..."
7. "Double run city!"

**Competitive** (6):
1. "A double run — that's efficient scoring."
2. "Double run. Those discards paid off."
3. "That double run is trouble for me."
4. "Good card management to land that double run."
5. "A double run — you kept the right cards."
6. "That double run adds up in a hurry."

**Understated** (4):
1. "Double run. Solid."
2. "Clean double run."
3. "There's the double run."
4. "Nice pair for the double."

**Easter Egg** (1):
1. "A double run! That's like finding two $20 bills in the same pocket."

### 2.7 TRIPLE_RUN (20 phrases)

[Back to TOC](#table-of-contents)

**Classic** (6):
1. "A triple run! That's rare."
2. "Triple run — three of a kind meets a sequence!"
3. "That triple run is devastating."
4. "A triple run! Those cards were born to be together."
5. "Three runs from one pair — beautiful cribbage."
6. "A triple run! That's fifteen points from runs alone."

**Playful** (6):
1. "Triple run! Your cards are doing a three-part harmony!"
2. "A triple run! Three's company!"
3. "Triple the trouble!"
4. "That's a triple! The runs are multiplying!"
5. "Triple run — did you rehearse this?"
6. "Three runs?! Now you're just being greedy!"

**Competitive** (5):
1. "A triple run. That's devastating."
2. "Triple run against me. Heavy."
3. "That triple run just changed everything."
4. "Three runs. Three problems for me."
5. "I can't compete with a triple run."

**Understated** (2):
1. "Triple run. That's something."
2. "Well. Three runs."

**Easter Egg** (1):
1. "Triple run! Even the cut card is impressed."

### 2.8 FOUR_OF_A_KIND (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "Four of a kind! Twelve points in pairs alone!"
2. "Quads! That's a rare sight."
3. "Four of a kind — a dozen points just in pairs."
4. "All four! The complete set."
5. "Four of a kind! You can't ask for better pairs."
6. "Quads on the board — twelve points of pure pairs."
7. "Four matching ranks. Impressive."

**Playful** (7):
1. "Four of a kind! Are you playing poker or cribbage?"
2. "Quads! Save some for the rest of us!"
3. "All four! Did you check behind the sofa for those?"
4. "Four of a kind! The full royal family!"
5. "Quads! Those cards are having a family reunion!"
6. "All four of them showed up! What are the odds?"
7. "Four of a kind! You've collected the whole set!"

**Competitive** (6):
1. "Four of a kind. Twelve points I can't take back."
2. "Quads against me. That's a gut punch."
3. "All four. Nothing I could do about that."
4. "Four of a kind — you got lucky and you know it."
5. "Twelve points of pairs. Brutal."
6. "Quads. I need a miracle now."

**Understated** (4):
1. "Four of a kind. Sure."
2. "Quads. Of course."
3. "All four. Naturally."
4. "Well, that's all of them."

**Easter Egg** (1):
1. "Four of a kind! *checks to make sure this is still cribbage*"

### 2.9 HUGE_CRIB (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "That's a monster crib!"
2. "A loaded crib — the discards paid off big."
3. "What a crib! Everything connected."
4. "The crib came through in a huge way."
5. "Big crib! Those discards were golden."
6. "That's what a good crib looks like."
7. "Heavy crib — the cut card tied it all together."

**Playful** (7):
1. "The crib is on fire!"
2. "That crib was hiding a treasure chest!"
3. "Crib payday! Ka-ching!"
4. "That crib woke up and chose violence!"
5. "The crib just pulled its weight and then some!"
6. "A crib that good should pay rent!"
7. "Jackpot in the crib!"

**Competitive** (6):
1. "Big crib. That changes the math."
2. "The crib just swung this game."
3. "That crib hurts. A lot."
4. "I should have discarded more carefully."
5. "A crib like that is a game-changer."
6. "Those crib points just moved the needle."

**Understated** (4):
1. "Good crib."
2. "The crib produced."
3. "Crib came through."
4. "Solid crib count."

**Easter Egg** (1):
1. "That crib had more points than some people's hands!"

### 2.10 PEG_31 (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "Thirty-one! Right on the nose."
2. "Thirty-one for two — clean finish."
3. "Thirty-one! Perfect count management."
4. "That's thirty-one! Nicely played."
5. "Thirty-one on the dot."
6. "Thirty-one! Good card to have in your back pocket."
7. "Right to thirty-one. Well timed."

**Playful** (7):
1. "Thirty-one! Like you planned it all along!"
2. "Boom! Thirty-one!"
3. "Thirty-one! Did you have a calculator hidden?"
4. "Nailed the thirty-one! Smooth!"
5. "That's a thirty-one finish! Show-off!"
6. "Thirty-one! You make it look easy!"
7. "Thirty-one! *chef's kiss*"

**Competitive** (6):
1. "Thirty-one. Well played."
2. "You held that card for exactly this."
3. "Thirty-one — I should have seen that coming."
4. "That thirty-one just cost me."
5. "Smart pegging to reach thirty-one."
6. "Thirty-one. Good count control."

**Understated** (4):
1. "Thirty-one."
2. "That's the number."
3. "On the mark."
4. "Thirty-one. Two points."

**Easter Egg** (1):
1. "Thirty-one! The pegging count gods smile upon you."

### 2.11 PEG_GO_STEAL (20 phrases)

[Back to TOC](#table-of-contents)

**Classic** (6):
1. "Go! A point's a point."
2. "Go — every point counts."
3. "That's a Go. Free point."
4. "Go! You'll take it."
5. "A well-earned Go."
6. "Go — the board advances."

**Playful** (5):
1. "Go! It's not glamorous, but it's honest work."
2. "A Go! Even the small points add up!"
3. "Free point! Don't mind if I do."
4. "Go! Points are points!"
5. "A sneaky little Go!"

**Competitive** (5):
1. "Go. Keeping the pressure on."
2. "Another Go point. They add up."
3. "Go. Every peg matters in a close game."
4. "Smart play forcing the Go."
5. "Go point. Death by a thousand cuts."

**Understated** (3):
1. "Go."
2. "A point."
3. "On the board."

**Easter Egg** (1):
1. "Go! That single peg just changed the zip code of your score."

### 2.12 PEG_TRAP (20 phrases)

[Back to TOC](#table-of-contents)

**Classic** (6):
1. "What a pegging sequence!"
2. "A big pegging play! Well set up."
3. "That's expert pegging."
4. "Multiple points in one play — sharp."
5. "Beautiful pegging — you saw that coming."
6. "That play just lit up the board."

**Playful** (5):
1. "Boom! Big peg!"
2. "That peg had some heat on it!"
3. "Pegging fireworks!"
4. "That play just left a mark!"
5. "Ooh, that peg had some mustard on it!"

**Competitive** (5):
1. "I walked right into that."
2. "That trap was well laid."
3. "You set me up. Respect."
4. "I should have seen that pegging trap."
5. "That's the kind of pegging that wins games."

**Understated** (3):
1. "Nice peg."
2. "Good play."
3. "Well pegged."

**Easter Egg** (1):
1. "That pegging play should be framed and hung in a museum."

### 2.13 SKUNK (25 phrases)

[Back to TOC](#table-of-contents)

**Classic — for winner** (4):
1. "Skunk! A decisive victory."
2. "That's a skunking! Total domination."
3. "Skunked! One-sided affair."
4. "A skunk! You ran away with it."

**Classic — for loser** (4):
1. "Skunked. We don't talk about this one."
2. "That's a skunk. Tough game."
3. "Skunked — sometimes the cards just don't cooperate."
4. "A skunking. It happens to the best of us."

**Playful — for winner** (4):
1. "Skunk! Something smells like victory!"
2. "Skunked 'em! That one wasn't even close!"
3. "A skunking! Should we call it a mercy?"
4. "Skunk! Did you even need an opponent?"

**Playful — for loser** (4):
1. "Skunked! Well... there's always next game."
2. "A skunk. Let's agree to never mention this again."
3. "Skunked! Quick, someone shuffle the deck!"
4. "That skunk had stripes and a stink."

**Competitive** (5):
1. "Skunked. I underestimated you."
2. "A skunk. That's embarrassing for me."
3. "You skunked me. Fair and square."
4. "That's a skunk. I need to rethink my strategy."
5. "Skunked. Back to the drawing board."

**Understated** (3):
1. "Skunk."
2. "Well. That's a skunk."
3. "Under 91. Skunk it is."

**Easter Egg** (1):
1. "Skunked! *puts on sunglasses, walks away slowly*"

### 2.14 COMEBACK_WIN (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "What a comeback! Down and out, then back on top!"
2. "You never gave up, and it paid off!"
3. "From behind to the winner's circle!"
4. "A stunning comeback! Cribbage at its finest."
5. "Down big and fought back. That's heart."
6. "The comeback kid! Never count yourself out."
7. "That was a game for the ages."

**Playful** (7):
1. "Comeback! Like a phoenix from the ashes!"
2. "You were losing so hard I almost felt bad. Almost."
3. "From the jaws of defeat!"
4. "Comeback! They should make a movie about this game!"
5. "Down and almost out — then BOOM!"
6. "The greatest comeback since... well, ever!"
7. "You were on the ropes and came out swinging!"

**Competitive** (6):
1. "I had the lead and let it slip. Well played."
2. "You took advantage of every opening."
3. "I should have closed it out when I had the chance."
4. "Comeback win. I'll be thinking about this one."
5. "You clawed your way back. Respect."
6. "That comeback just taught me a lesson."

**Understated** (4):
1. "Nice comeback."
2. "You found a way."
3. "Came from behind."
4. "The late surge."

**Easter Egg** (1):
1. "That comeback was so good, the cribbage board is giving you a standing ovation."

### 2.15 CLOSE_GAME_WIN (25 phrases)

[Back to TOC](#table-of-contents)

**Classic** (7):
1. "A nail-biter to the end!"
2. "What a close game! Every point mattered."
3. "Down to the wire! Great game."
4. "A razor-thin margin! Could have gone either way."
5. "That game came down to the last hand."
6. "Close as can be! Well-fought on both sides."
7. "A finish for the books — margin of just a few points."

**Playful** (7):
1. "Photo finish! Someone call the judges!"
2. "That game needed overtime!"
3. "By the skin of your pegs!"
4. "I think the scoreboard needs a recount!"
5. "That game could have gone on a coin flip!"
6. "Tight game! My circuits are overheating!"
7. "Squeaked by! That was too close for comfort!"

**Competitive** (6):
1. "So close. A different cut card and I had it."
2. "By a hair. I'll get you next time."
3. "That game was decided by inches."
4. "Close game. The margins were razor thin."
5. "You edged me out. Barely."
6. "One hand's difference. Good game."

**Understated** (4):
1. "Close one."
2. "Tight game."
3. "By a nose."
4. "Slim margin."

**Easter Egg** (1):
1. "That was so close, even the pegs are sweating."

### 2.16 CUT_JACK (20 phrases)

[Back to TOC](#table-of-contents)

**Classic** (6):
1. "His heels! Two points for the dealer."
2. "A Jack on the cut — that's two free points."
3. "Cut a Jack! His heels for two."
4. "There's the Jack — two to the dealer."
5. "His heels! The cut card pays off."
6. "Jack on the cut. Two for his heels."

**Playful** (6):
1. "Jack! Two free points — don't mind if I do!"
2. "His heels! The Jack showed up to the party!"
3. "A Jack! The dealer's best friend!"
4. "His heels! Even the cut card is being generous!"
5. "Cut a Jack! Bonus points — what a deal!"
6. "The Jack of all trades shows up on the cut!"

**Competitive** (4):
1. "His heels. Two more for the dealer."
2. "The Jack favors the dealer today."
3. "His heels — those two points might matter later."
4. "A Jack cut. Every little bit helps."

**Understated** (3):
1. "His heels."
2. "Jack. Two."
3. "There it is."

**Easter Egg** (1):
1. "His heels! The Jack just sauntered in like he owns the place."

### 2.17 ZERO_HAND (25 phrases)

[Back to TOC](#table-of-contents)

**Classic — sympathetic** (7):
1. "Zero points. It happens to everyone."
2. "A goose egg. The cards weren't kind."
3. "Zero. Sometimes that's how it goes."
4. "No points this hand. Shake it off."
5. "A blank hand. Better luck next deal."
6. "Zero. The cut card didn't help."
7. "Nothing doing. Chin up."

**Playful** (7):
1. "Zero! Well... at least you can't do worse!"
2. "A big ol' goose egg! The cards owe you one."
3. "Zero points! Those cards phoned it in."
4. "Zilch! That hand took the day off."
5. "Zero! Quick, forget this hand ever happened."
6. "Nada! Even the crib is embarrassed."
7. "Zip! Those cards were on a coffee break."

**Competitive — AI scored zero** (6):
1. "Zero for me. Your discards hurt."
2. "A zero hand. You played that perfectly."
3. "Nothing for me. Well done on the discard."
4. "Zero. You read my discards like a book."
5. "Goose egg for me. I'll bounce back."
6. "Zero. That's on me."

**Understated** (4):
1. "Zero."
2. "Nothing."
3. "Goose egg."
4. "Blank."

**Easter Egg** (1):
1. "Zero points! That hand just sent a postcard from the land of nothing."

### 2.18 BACK_TO_BACK_BIG_HANDS (20 phrases)

[Back to TOC](#table-of-contents)

**Classic** (6):
1. "Back-to-back big hands! You're on a roll!"
2. "Another big one! The cards keep coming."
3. "Two strong hands in a row — momentum is yours."
4. "Back to back! This is a hot streak."
5. "Consecutive big hands — you're feeling it."
6. "Another big count! You can't be stopped."

**Playful** (6):
1. "Again?! Save some points for later!"
2. "Two in a row! Are you hiding cards?"
3. "Back to back! You've got the Midas touch!"
4. "Another one! The cards really like you today!"
5. "Two bangers in a row! What's your secret?"
6. "Déjà vu! Another monster hand!"

**Competitive** (5):
1. "Two in a row. This is getting serious."
2. "Back-to-back big hands. I'm running out of answers."
3. "Consecutive big hands. The momentum has shifted."
4. "Another big one against me. Trouble."
5. "Two in a row — you're pulling away."

**Understated** (2):
1. "Another big hand."
2. "Back to back."

**Easter Egg** (1):
1. "Two big hands in a row! At this rate, the board can't keep up with your pegs."

---

**Total phrase count**: 25+25+30+35+25+20+25+25+25+20+20+25+25+25+20+25+20 = **435 phrases**

---

## 3. Classic Cribbage Table Banter Tone Pack

[Back to TOC](#table-of-contents)

### 3.1 Tone Characteristics

[Back to TOC](#table-of-contents)

Inspired by: **Cribbage in a Maine lodge, 1958.**

- Warm but competitive — the players have been at this for decades
- Dry humor — never laugh at your own joke
- Old-school card slang — "peggin'", "the crib's loaded", "his heels"
- Subtle pride — big hands get a quiet nod, not a shout
- Respect for big hands — acknowledged with gravity, not flippancy
- Understated reactions to disaster — a zero hand gets "Wellp." not "OMG!"
- A sip of whiskey and a creak of the rocking chair between hands

### 3.2 Maine Lodge 1958 Phrases (150 phrases)

[Back to TOC](#table-of-contents)

**Big Hands (30 phrases)**:
1. "Now there's a hand."
2. "You don't see that every day."
3. "Well I'll be."
4. "Somebody fed those cards."
5. "That's a keeper."
6. "Not too shabby."
7. "Now you're talkin'."
8. "That hand's got legs."
9. "You could hang that one on the wall."
10. "Cards were runnin' your way."
11. "That's a hand and a half."
12. "The good Lord was dealin' for ya."
13. "Better than a poke in the eye."
14. "That'll move the pegs a ways."
15. "You drew the long straw on that one."
16. "Some hands you just tip your hat to."
17. "That's the one you wait for."
18. "There's your hand right there."
19. "Now that's proper cribbage."
20. "You could ride that hand all the way home."
21. "That hand just put its boots on."
22. "Cards like that don't grow on trees."
23. "Well, well, well."
24. "That's what you keep the score pegs sharp for."
25. "The cut card was feelin' generous."
26. "You won't complain about that one."
27. "That's a fireside hand."
28. "Somebody dealt you a winner."
29. "That hand's got character."
30. "The cards were cookin' tonight."

**Pegging (25 phrases)**:
1. "Sharp peggin'."
2. "You got 'em with that one."
3. "Slick play."
4. "That peg had eyes."
5. "Knew you were sittin' on that."
6. "Good card to hold back."
7. "That's how the old-timers do it."
8. "You saw that comin' a mile off."
9. "Steady hand on the pegs tonight."
10. "Clean play. Real clean."
11. "You're peggin' like you wrote the rules."
12. "That card was waitin' in the weeds."
13. "Nice bit of peggin'."
14. "Thirty-one on the money."
15. "You counted that out perfect."
16. "Good feel for the count."
17. "That play had some thought behind it."
18. "Peggin' with purpose."
19. "You don't give up easy, do ya."
20. "Smart. Real smart."
21. "That peg just earned its keep."
22. "Right on the number."
23. "Patient play. I like it."
24. "You played that close to the vest."
25. "That card did exactly what you needed."

**Zero / Bad Hands (20 phrases)**:
1. "Wellp."
2. "The cards'll come around."
3. "Can't win 'em all."
4. "Thin hand."
5. "Could use a little help from the crib."
6. "Been there."
7. "Sometimes that's how she goes."
8. "Nothin' doin'."
9. "The cards owe you one."
10. "Cold hand."
11. "That's a shaker. Shake it off."
12. "Dry well."
13. "Even the cut couldn't save that one."
14. "Tough deal."
15. "You'll get 'em next hand."
16. "Can't dress up a hand like that."
17. "Light on points."
18. "The deck wasn't feelin' charitable."
19. "That hand needed a miracle."
20. "Next hand's a new deal."

**Game / Skunk / Close (25 phrases)**:
1. "Good game. Shake on it."
2. "Down to the wire."
3. "Tight one."
4. "That one could've gone either way."
5. "Squeaker."
6. "Close as a barn door in January."
7. "That was a proper game."
8. "Right down to the last peg."
9. "You earned that one."
10. "Game well played."
11. "She was tight the whole way."
12. "Close enough to make ya sweat."
13. "That's a game you remember."
14. "Another deal, another story."
15. "The board was full of drama tonight."
16. "Skunked. Don't let it eat at ya."
17. "A skunkin'. We'll keep that between us."
18. "That was a thumpin'. Tip of the cap."
19. "You ran away with that one."
20. "Couldn't catch ya."
21. "Never in doubt. For you, anyway."
22. "You came from behind on that one."
23. "Gutsy finish."
24. "That comeback had whiskers on it."
25. "The old dog still hunts."

**Crib-Specific (15 phrases)**:
1. "The crib was loaded."
2. "That crib's heavier than a cast iron skillet."
3. "The crib came through."
4. "Good things in the crib tonight."
5. "The crib paid the bills."
6. "Somebody put the good cards in the crib."
7. "That crib had a mind of its own."
8. "Crib's got more points than the hand."
9. "The crib earned its keep."
10. "You can't complain about a crib like that."
11. "That crib's sittin' pretty."
12. "Crib came in hot."
13. "A crib worth waitin' for."
14. "The crib did the heavy liftin'."
15. "Better in the crib than against it."

**Cut Card (10 phrases)**:
1. "The cut card was kind."
2. "That cut changed everything."
3. "Nice cut."
4. "The deck had one more trick."
5. "The right card at the right time."
6. "That cut just made the hand."
7. "Cut yourself a winner there."
8. "The cut was sittin' on top waitin' for ya."
9. "Couldn't have cut it better yourself."
10. "That cut's got your name on it."

**General / His Heels (10 phrases)**:
1. "His heels. Two for the house."
2. "Jack on the cut. Dealer's reward."
3. "His heels — don't spend 'em all in one place."
4. "There's your Jack."
5. "His heels. A little somethin' for the kitty."
6. "Jack right on top. Figured."
7. "His heels — the deck's tip of the hat to the dealer."
8. "Cut a Jack. There you go."
9. "His heels. Like clockwork."
10. "Two for his heels. A fine start."

**Rare / Easter Eggs for Maine Pack (5 phrases)**:
1. "That hand's got more points than a porcupine."
2. "You're peggin' like you've got a ouija board under the table."
3. "That hand just walked in, sat down, and ordered a double."
4. "Skunked. Smells like it too."
5. "If that hand were any bigger, it'd need its own zip code."

**Total Maine Lodge 1958 pack: 30+25+20+25+15+10+10+5 = 140 phrases** (+ 10 from the General category = **150 total**)

---

## 4. Micro-Animation Pool

[Back to TOC](#table-of-contents)

### 4.1 Animation Metadata Structure

[Back to TOC](#table-of-contents)

**File**: `lib/celebrations/animations.js`

```javascript
{
  id: 'score_sparkle',
  name: 'Score Sparkle',
  intensity: 'medium',           // low | medium | high | legendary
  compatibleEvents: ['BIG_HAND_20_PLUS', 'MONSTER_HAND_24', 'PEG_31'],
  durationMs: 700,
  cooldownMs: 4000,              // min time before reuse
  anchor: 'scorePanel',          // where it plays
  cssClass: 'anim-score-sparkle',
  reducedMotionFallback: 'staticIcon',  // none | staticIcon | simpleFade
  reducedMotionIcon: '✨',
}
```

### 4.2 Animation Catalog (30 Animations)

[Back to TOC](#table-of-contents)

**Low Intensity (8)**:

| # | ID | Name | Duration | Anchor | Description |
|---|----|------|----------|--------|-------------|
| 1 | `score_glow` | Score Glow | 800ms | scorePanel | Soft gold pulse around score panel |
| 2 | `peg_nudge` | Peg Nudge | 400ms | scoreTrack | Subtle horizontal bounce on score peg |
| 3 | `card_wink` | Card Wink | 500ms | handCards | Played card does a tiny scale bounce |
| 4 | `text_fade_up` | Text Float | 600ms | toast | Phrase fades in and floats up slightly |
| 5 | `subtle_flash` | Subtle Flash | 300ms | scorePanel | Quick brightness flash on score number |
| 6 | `dot_pulse` | Dot Pulse | 700ms | scoreTrack | Small dot pulses at score position |
| 7 | `underline_draw` | Underline Draw | 500ms | toast | Line draws under the phrase text |
| 8 | `checkmark_pop` | Checkmark Pop | 400ms | toast | Small checkmark pops in next to text |

**Medium Intensity (12)**:

| # | ID | Name | Duration | Anchor | Description |
|---|----|------|----------|--------|-------------|
| 9 | `score_sparkle` | Score Sparkle | 700ms | scorePanel | 3-5 tiny sparkle particles from score |
| 10 | `stamp_effect` | Ink Stamp | 600ms | toast | Score number appears like an old ink stamp |
| 11 | `ribbon_unfurl` | Ribbon Unfurl | 800ms | toast | Small ribbon banner unfurls behind text |
| 12 | `card_fan_glow` | Card Fan Glow | 900ms | handCards | Golden glow sweeps across hand cards |
| 13 | `peg_trail` | Peg Trail | 800ms | scoreTrack | Brief glowing trail behind moving peg |
| 14 | `bounce_number` | Bounce Number | 500ms | scorePanel | Score number bounces once emphatically |
| 15 | `speech_bubble` | Speech Bubble | 1000ms | toast | Phrase appears in a wobbly speech bubble |
| 16 | `star_burst` | Star Burst | 600ms | scorePanel | Single gold star pops and fades |
| 17 | `wave_underline` | Wave Line | 700ms | toast | Wavy line animates under phrase |
| 18 | `score_ring` | Score Ring | 800ms | scorePanel | Expanding ring from score number |
| 19 | `card_shine` | Card Shine | 600ms | handCards | Diagonal light sweep across cards |
| 20 | `wobble_text` | Wobble Text | 500ms | toast | Phrase text wobbles on arrival |

**High Intensity (7)**:

| # | ID | Name | Duration | Anchor | Description |
|---|----|------|----------|--------|-------------|
| 21 | `mini_confetti` | Mini Confetti | 1200ms | scorePanel | 8-12 small confetti pieces burst from score |
| 22 | `gold_rain` | Gold Rain | 1000ms | handCards | Tiny gold particles fall over hand area |
| 23 | `firework_pop` | Firework Pop | 800ms | scorePanel | Small starburst with 6 points |
| 24 | `trophy_bounce` | Trophy Bounce | 900ms | toast | Tiny trophy icon bounces in |
| 25 | `double_sparkle` | Double Sparkle | 1000ms | scorePanel | Two overlapping sparkle bursts |
| 26 | `score_zoom` | Score Zoom | 700ms | scorePanel | Score number zooms up then settles back |
| 27 | `glow_cascade` | Glow Cascade | 1100ms | handCards | Cascading glow across each card in sequence |

**Legendary Intensity (3)**:

| # | ID | Name | Duration | Anchor | Description |
|---|----|------|----------|--------|-------------|
| 28 | `full_confetti` | Full Confetti | 2000ms | fullscreen | 20-30 confetti pieces (existing celebration style) |
| 29 | `golden_frame` | Golden Frame | 1500ms | handCards | Animated golden border draws around entire hand |
| 30 | `crown_drop` | Crown Drop | 1200ms | toast | Tiny crown icon drops in above the phrase text |

### 4.3 CSS Implementation Approach

[Back to TOC](#table-of-contents)

All animations use CSS `@keyframes` + Tailwind utility classes. No additional libraries.

**File**: `app/globals.css` — add animation keyframes
**File**: `lib/celebrations/animations.js` — animation metadata registry

Each animation is a CSS class that can be applied to a wrapper `<div>`. The celebration engine applies the class, waits for `durationMs`, then removes it. This avoids React re-renders for purely visual effects.

```css
/* Example: score sparkle */
@keyframes sparkle-pop {
  0% { opacity: 0; transform: scale(0) translateY(0); }
  50% { opacity: 1; transform: scale(1.2) translateY(-8px); }
  100% { opacity: 0; transform: scale(0.8) translateY(-16px); }
}

.anim-score-sparkle .sparkle-particle {
  animation: sparkle-pop 700ms ease-out forwards;
}

/* Reduced motion: just show a static icon */
@media (prefers-reduced-motion: reduce) {
  .anim-score-sparkle .sparkle-particle {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### 4.4 Pool Selection Rules

[Back to TOC](#table-of-contents)

```javascript
function selectAnimation(event, recentAnimations, celebrationLevel, motionLevel) {
  if (motionLevel === 'off') return null;

  const compatible = ANIMATION_POOL
    .filter(a => a.compatibleEvents.includes(event.type))
    .filter(a => intensityMatch(a.intensity, event.intensity, motionLevel))
    .filter(a => !recentAnimations.includes(a.id))       // anti-repeat
    .filter(a => !isOnCooldown(a.id, a.cooldownMs));      // cooldown

  if (compatible.length === 0) return null;

  // Weighted selection: higher-intensity animations get higher weight for higher-intensity events
  const weights = compatible.map(a => intensityWeight(a.intensity, event.intensity));
  return weightedSelect(compatible, weights, aiRandom);
}
```

- **Recent animations buffer**: Last 8 animations. Prevents same animation within 8 triggers.
- **Cooldown**: Per-animation timer. `cooldownMs` must elapse before reuse.
- **Intensity matching**: `motionLevel` gates the maximum intensity. "Subtle" only allows low/medium. "Standard" allows up to high. "Extra" allows legendary.

---

## 5. Anti-Repetition System

[Back to TOC](#table-of-contents)

### 5.1 Text Selection Algorithm

[Back to TOC](#table-of-contents)

```javascript
// lib/celebrations/selector.js

const PHRASE_HISTORY_SIZE = 10;
let recentPhrases = [];  // circular buffer of last 10 phrase indices

function selectPhrase(eventType, tonePreference, celebrationLevel) {
  const pool = PHRASE_LIBRARY[eventType];
  if (!pool) return null;

  // Pick tone variant based on preference + some randomness
  const tone = selectTone(pool.toneVariants, tonePreference, celebrationLevel);
  const phrases = pool.toneVariants[tone];

  // Easter egg check: <1% chance
  if (pool.toneVariants.easterEgg && aiRandom() < 0.008) {
    const egg = pool.toneVariants.easterEgg;
    const key = `${eventType}:easterEgg:0`;
    if (!recentPhrases.includes(key)) {
      recentPhrases.push(key);
      if (recentPhrases.length > PHRASE_HISTORY_SIZE) recentPhrases.shift();
      return egg[0];
    }
  }

  // Filter out recently used phrases
  const available = phrases
    .map((p, i) => ({ phrase: p, key: `${eventType}:${tone}:${i}` }))
    .filter(p => !recentPhrases.includes(p.key));

  // If all filtered out, clear history for this event and try again
  if (available.length === 0) {
    recentPhrases = recentPhrases.filter(k => !k.startsWith(eventType));
    return phrases[Math.floor(aiRandom() * phrases.length)];
  }

  // Uniform random selection from available
  const chosen = available[Math.floor(aiRandom() * available.length)];
  recentPhrases.push(chosen.key);
  if (recentPhrases.length > PHRASE_HISTORY_SIZE) recentPhrases.shift();
  return chosen.phrase;
}
```

### 5.2 Animation Selection Algorithm

[Back to TOC](#table-of-contents)

Same pattern as text, but with a separate buffer of size 8 and cooldown timers:

```javascript
const ANIMATION_HISTORY_SIZE = 8;
let recentAnimations = [];   // last 8 animation IDs
let cooldowns = {};          // { animId: lastUsedTimestamp }

function selectAnimation(eventType, eventIntensity, motionLevel) {
  // ... (see section 4.4)
}
```

### 5.3 Easter Egg Selection

[Back to TOC](#table-of-contents)

Easter egg phrases fire at < 1% rate (`aiRandom() < 0.008`). Easter egg animations (victory jig, etc.) fire at < 0.5% rate. Both use the same anti-repetition history — once an Easter egg fires, it won't repeat until it cycles out of the history buffer.

---

## 6. Context Awareness

[Back to TOC](#table-of-contents)

### 6.1 Intensity Escalation Rules

[Back to TOC](#table-of-contents)

Each event has a base intensity. Context modifiers can escalate or de-escalate:

| Context | Modifier |
|---------|----------|
| Player scored the hand | +0 (default perspective) |
| AI scored the hand | Switch to "competitive" or "respectful" tone |
| Score gap ≥ 30 pts (losing) | +1 intensity level (more dramatic reactions) |
| Score gap ≥ 30 pts (winning) | −1 intensity level (more subdued) |
| Near-win (≤ 8 pts to 121) | +1 intensity ("this hand matters") |
| Skunk risk (opponent < 91, you're near 121) | +1 intensity |
| Streak (2+ big hands in a row) | +1 intensity |

Intensity levels: `low → medium → high → legendary` (caps at legendary).

### 6.2 Perspective Switching (Player vs AI)

[Back to TOC](#table-of-contents)

Each event carries a `scorer` field: `'player'` or `'computer'`.

- **Player scores big**: Use `classic`, `playful`, or `understated` tones (celebrating the player)
- **Computer scores big**: Use `competitive` tone (AI acknowledging its own strong hand, or reacting to a big hand against the player)
- **Player gets zero**: Use sympathetic `playful` or `classic`
- **Computer gets zero**: Use self-deprecating `competitive`

### 6.3 Game-State Modifiers

[Back to TOC](#table-of-contents)

The celebration engine receives a `gameContext` object:

```javascript
{
  playerScore: 95,
  computerScore: 102,
  isDealer: true,
  scorer: 'player',         // who triggered the event
  prevHandScore: 8,          // for streak detection
  maxDeficit: 25,            // for comeback detection
  handsPlayed: 14,           // how deep into the game
}
```

This determines tone selection weights and intensity modifiers.

---

## 7. Celebration Level Settings

[Back to TOC](#table-of-contents)

### 7.1 Celebration Level Tiers

[Back to TOC](#table-of-contents)

| Level | Text Frequency | Tone Pool | Event Threshold |
|-------|---------------|-----------|-----------------|
| **Off** | Never | — | — |
| **Minimal** | Rare events only | understated only | score ≥ 24, SKUNK, PERFECT_29 |
| **Classic** | Major events | classic + understated | score ≥ 16, PEG_31, SKUNK, CUT_JACK |
| **Lively** | Most events | all tones | score ≥ 12, all pegging, all game events |
| **Full Banter** | All events + streaks | all tones + Maine pack | all events, lowest thresholds |

**Default**: Classic.

### 7.2 Motion Level Tiers

[Back to TOC](#table-of-contents)

| Level | Max Animation Intensity | Confetti | Description |
|-------|------------------------|----------|-------------|
| **Off** | none | no | Text only, no animations |
| **Subtle** | low | no | Glows, nudges, text effects only |
| **Standard** | high | mini only | Sparkles, stamps, small bursts |
| **Extra** | legendary | full | Full confetti, golden frames, crowns |

**Default**: Standard. Automatically drops to Off if `prefers-reduced-motion: reduce`.

### 7.3 Settings Integration

[Back to TOC](#table-of-contents)

Store in `localStorage` alongside existing `aiDifficulty`:

```javascript
localStorage.getItem('celebrationLevel');  // 'off'|'minimal'|'classic'|'lively'|'fullBanter'
localStorage.getItem('motionLevel');       // 'off'|'subtle'|'standard'|'extra'
```

Add to the existing ⋮ menu as two dropdowns or a simple picker.

---

## 7A. Celebration Experience Walk-Through

[Back to TOC](#table-of-contents)

To make the celebration levels tangible — not just abstract settings — here's a concrete simulation of how 10 consecutive hands *feel* under each mode. This is the emotional rhythm players will experience.

### 7A.1 The Scenario: A 10-Hand Stretch

[Back to TOC](#table-of-contents)

Imagine these 10 hands in a row during a game:

1. **8 points** — a quiet, ordinary hand
2. **0 points** — a goose egg, ouch
3. **20 points** — a big hand, things are looking up
4. **Peg 31** — nailed the count during pegging
5. **12 points** — decent, nothing special
6. **24 points** — a monster hand
7. **Opponent scores 18** — the AI had a strong round
8. **Go steal** — picked up a free point on a Go
9. **16 points** — solid hand
10. **Close win by 3 points** — game ends on a nail-biter

This stretch has drama: a zero hand, a 24-pointer, a pegging highlight, and a photo finish. How each mode responds tells the story of the player experience.

### 7A.2 Classic Mode Feel

[Back to TOC](#table-of-contents)

Classic mode is restrained. It speaks only when something genuinely noteworthy happens, and when it does, it keeps its voice down.

- Hands 1, 5, 9: **Silence.** No toast, no animation. These are normal hands — Classic respects that.
- Hand 2 (zero): A brief phrase appears — *"Zero. The cut card didn't help."* — with no animation. One sentence, then gone.
- Hand 3 (20 pts): A soft gold glow pulses once around the score panel. Toast reads *"That's the kind of hand that wins games."*
- Hand 4 (Peg 31): A small sparkle near the score track. *"Thirty-one! Right on the nose."*
- Hand 6 (24 pts): This is the one moment Classic gets excited. Toast reads *"Twenty-four! You read those discards perfectly."* with a score sparkle animation — 3-5 tiny particles from the score number.
- Hand 7 (opponent 18): Silence. The AI scores, no celebration for the player.
- Hand 8 (Go steal): Silence. A single Go point doesn't cross Classic's threshold.
- Hand 10 (close win): *"Down to the wire! Great game."* — a brief ribbon unfurl behind the text.

**Emotional profile**: Tasteful and table-authentic. Like playing across from someone who nods appreciatively at a good hand but doesn't make a scene. Reactions land because they're rare.

### 7A.3 Lively Mode Feel

[Back to TOC](#table-of-contents)

Lively mode celebrates more often and with more energy. It notices things Classic ignores, and adds physical flair.

- Hand 1 (8 pts): Silence. Even Lively doesn't comment on 8 points.
- Hand 2 (zero): *"Zero! Well... at least you can't do worse!"* with a text float-up animation. Light touch.
- Hand 3 (20 pts): Toast with a speech bubble wobble: *"Look at all those points!"* Score panel gets a bounce-number animation.
- Hand 4 (Peg 31): A peg bounce animation on the score track. *"Boom! Thirty-one!"*
- Hand 5 (12 pts): A quick checkmark pop. *"Not bad."* — Lively acknowledges even mid-range hands.
- Hand 6 (24 pts): Mini-confetti burst (8-12 small pieces). *"Twenty-four! Did you stack this deck?"* Score number zooms up and settles.
- Hand 7 (opponent 18): *"Big hand. I need to answer that."* — the AI acknowledges its strong round in competitive tone.
- Hand 8 (Go steal): *"Go! It's not glamorous, but it's honest work."* — a subtle peg nudge.
- Hand 9 (16 pts): *"Solid hand."* — a quick score glow.
- Hand 10 (close win): *"Photo finish! Someone call the judges!"* with a mini-confetti pop.

**Emotional profile**: Energetic but controlled. Like a friendly home game where the table reacts to big plays and nobody takes the silence personally. Every hand feels acknowledged without being overwhelming.

### 7A.4 Full Banter Mode Feel

[Back to TOC](#table-of-contents)

Full Banter holds nothing back. It pulls from the Maine Lodge tone pack, escalates on streaks, and has opinions about everything.

- Hand 1 (8 pts): *"Cards were a little thin that round."* — even quiet hands get a remark. Text float-up.
- Hand 2 (zero): *"Wellp."* — delivered Maine Lodge deadpan, with a subtle eyebrow-raise icon nudge. Perfect understated humor.
- Hand 3 (20 pts): *"Now there's a hand."* (Maine Lodge tone) with a card fan glow sweeping across the hand. Speech bubble pops in with a wobble.
- Hand 4 (Peg 31): *"Thirty-one on the money."* — peg trail animation glows behind the moving peg. Ink stamp effect on the "31."
- Hand 5 (12 pts): *"That'll do."* — checkmark pop, no fanfare but acknowledged.
- Hand 6 (24 pts): This is where Full Banter shines. *"That hand just walked in, sat down, and ordered a double."* (rare Maine Lodge Easter egg, < 1% but this is the scenario where it hits). Mini-confetti plus a gold rain effect over the hand cards. If the Easter egg doesn't fire: *"Somebody fed those cards."*
- Hand 7 (opponent 18): *"I'm not out of this yet."* — the AI shows personality, competitive tone with a determined undertone based on score differential.
- Hand 8 (Go steal): *"A sneaky little Go!"* — peg nudge animation. Full Banter notices everything.
- Hand 9 (16 pts): This is hand 3 in a row above 12. Streak escalation kicks in: *"You're on a roll tonight."* with a double sparkle animation. The streak tracker is paying attention.
- Hand 10 (close win): *"Close as a barn door in January."* (Maine Lodge) with a trophy bounce and a playful taunt: *"That one could've gone either way — but it went yours."*

**Emotional profile**: Alive, humorous, and social. Like Friday night at the lodge — the kind of game where everyone has something to say and nobody's scoring silently. The table has a personality.

### 7A.5 The Takeaway

[Back to TOC](#table-of-contents)

Each level creates a distinct emotional experience:

| Level | Feels Like |
|-------|-----------|
| **Classic** | Playing cribbage. The board, the cards, the count. Reactions are rare and earned. |
| **Lively** | Friendly competition. The table notices your good plays and commiserates on bad ones. |
| **Full Banter** | Friday night at the lodge. Everyone has something to say, the comebacks are dry, and the big hands get the respect they deserve. |

The key design constraint: **each level must feel complete on its own.** Classic isn't a lesser version of Full Banter — it's a deliberate choice. A player who picks Classic should never feel like they're missing out, just like a player who picks Full Banter should never feel overwhelmed.

[Back to TOC](#table-of-contents)

---

## 8. Delivery Mechanism

[Back to TOC](#table-of-contents)

### 8.1 Toast Component Design

[Back to TOC](#table-of-contents)

**File**: `components/CelebrationToast.jsx`

A lightweight toast that renders above the game area:

```jsx
<div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40
                pointer-events-none" aria-live="polite">
  {toast && (
    <div className={`bg-gray-900/90 text-amber-200 px-4 py-2 rounded-lg
                     border border-amber-500/30 shadow-lg text-center
                     text-sm max-w-xs ${animationClass}`}>
      {toast.phrase}
    </div>
  )}
</div>
```

- **Non-blocking**: `pointer-events-none`, positioned above controls
- **Auto-dismiss**: Fades in, stays 2-3 seconds, fades out
- **Screen reader**: `aria-live="polite"` announces phrase without interrupting

### 8.2 Animation Anchor Points

[Back to TOC](#table-of-contents)

Anchor points are `ref` targets in the existing UI:

| Anchor | Location | Used By |
|--------|----------|---------|
| `scorePanel` | Score display area (You/CPU scores) | sparkle, glow, ring, bounce, flash |
| `scoreTrack` | Cribbage board image | peg nudge, peg trail, dot pulse |
| `handCards` | Player's hand card area | card wink, card fan glow, card shine, gold rain |
| `toast` | Toast component itself | text float, stamp, ribbon, speech bubble, wobble |
| `fullscreen` | Full viewport overlay | full confetti (existing), golden frame |

### 8.3 Integration with Existing Celebration

[Back to TOC](#table-of-contents)

The existing `CorrectScoreCelebration` component fires on correct score counts. The new system **replaces** its phrase selection with the new selector, and conditionally adds a micro-animation. The full-screen confetti overlay is preserved as a "legendary" animation that only fires for 24+ hands or when `motionLevel === 'extra'`.

**Migration path**: `CorrectScoreCelebration` becomes a consumer of the celebration engine rather than owning its own phrases.

---

## 9. Determinism & Testing

[Back to TOC](#table-of-contents)

### 9.1 Seeded RNG Integration

[Back to TOC](#table-of-contents)

All selection uses `aiRandom()` from `lib/ai/rng.js` (already deployed in Phase 1). In test mode, `seedRng(42)` produces identical phrase and animation selections.

### 9.2 Unit Tests

[Back to TOC](#table-of-contents)

**File**: `__tests__/celebrations.test.js`

- `detectHandEvents(29, [...])` returns `['PERFECT_29']`
- `detectHandEvents(0, [])` returns `['ZERO_HAND']`
- `detectHandEvents(24, breakdownWith6Pairs)` returns `['MONSTER_HAND_24', 'FOUR_OF_A_KIND']`
- `selectPhrase('PERFECT_29', 'classic', 'lively')` returns a string
- `selectPhrase` never returns the same phrase twice within 10 calls (same event)
- `selectAnimation('BIG_HAND_20_PLUS', 'medium', 'standard')` returns a valid animation
- Animation cooldowns are respected
- Easter eggs fire at approximately < 1% rate over 10,000 trials
- Celebration level 'off' returns null for all events
- Celebration level 'minimal' only fires for ≥ 24 hands and skunks

### 9.3 Golden Tests

[Back to TOC](#table-of-contents)

**File**: `test-fixtures/celebration-golden.json`

10 test vectors with seed + event → expected phrase + animation:

```json
{
  "seed": 42,
  "event": "MONSTER_HAND_24",
  "context": { "scorer": "player", "celebrationLevel": "classic" },
  "expectedPhrase": "Twenty-four! That's a powerhouse hand.",
  "expectedAnimation": "score_sparkle"
}
```

Harness: celebrations disabled by default (`celebrationLevel: 'off'`).

---

## 10. Performance, Safety, Accessibility

[Back to TOC](#table-of-contents)

### 10.1 Performance Budget

[Back to TOC](#table-of-contents)

- **Event detection**: < 0.1ms (simple conditionals)
- **Phrase selection**: < 0.2ms (array filter + random pick)
- **Animation selection**: < 0.2ms (array filter + weighted pick)
- **Total per event**: < 0.5ms (well under 1ms budget)
- **Memory**: Phrase library loaded once at module init (~50KB of strings). No per-event allocations.
- **Rendering**: Micro-animations use CSS only — no JS animation loops, no `requestAnimationFrame`

### 10.2 Accessibility

[Back to TOC](#table-of-contents)

- **`prefers-reduced-motion`**: Detected via `matchMedia`. When active, `motionLevel` forced to `'off'` regardless of setting. Text phrases still appear.
- **`aria-live="polite"`** on toast: screen readers announce phrases without interrupting game flow
- **No `aria-live` on animations**: purely decorative, tagged with `aria-hidden="true"`
- **Sufficient contrast**: Toast text (amber-200 on gray-900) meets WCAG AA

### 10.3 Graceful Degradation

[Back to TOC](#table-of-contents)

- If phrase library fails to load: fallback to existing 7-phrase list in `CorrectScoreCelebration`
- If animation CSS fails: text still appears, no visual animation
- In headless harness mode: celebration engine returns events + selections but renders nothing

---

## 11. Extra Credit

[Back to TOC](#table-of-contents)

### 11.1 Streak Escalation

[Back to TOC](#table-of-contents)

Track consecutive "big" hands (≥ 16 pts). Escalation:

| Streak | Effect |
|--------|--------|
| 2 in a row | Fires `BACK_TO_BACK_BIG_HANDS` event + intensity +1 |
| 3 in a row | Phrase prefix: "Three in a row! " + highest-intensity animation |
| 4+ in a row | Easter egg territory + rarest animation pool |

Reset on any hand < 12 pts.

### 11.2 AI Personality Confidence Shifts

[Back to TOC](#table-of-contents)

Track the AI's "confidence" based on score differential:

| Differential | AI Personality |
|-------------|---------------|
| Ahead by ≥ 20 | Confident ("I'm feeling good about this one.") |
| Even (± 10) | Neutral (standard phrases) |
| Behind by ≥ 20 | Determined ("I'm not out of this yet.") |
| Behind by ≥ 40 | Desperate ("Well... miracles happen.") |

This only affects the `competitive` tone variants when the AI is the scorer.

### 11.3 Rare Celebratory Animations

[Back to TOC](#table-of-contents)

- **Victory Jig** (< 0.5% rate on game win): Tiny character icon does a brief dance
- **Hat Tip** (< 0.5% rate on PERFECT_29 / NEAR_PERFECT_28): Animated hat-tip icon
- **Lightning** (< 0.5% rate on SKUNK): Brief lightning flash at top of screen

These are in the animation pool but with extremely low selection weight.

### 11.4 Deadpan Mode

[Back to TOC](#table-of-contents)

A personality option (separate from celebration level) that uses only the `understated` tone variant + low-intensity animations:

- "Twenty-nine. Not bad."
- "Skunk." (no elaboration)
- "Go." (single word)

Selected via the ⋮ menu: **Personality**: Classic / Lively / Deadpan

### 11.5 Themeable Animation Packs (Future)

[Back to TOC](#table-of-contents)

Architecture supports swapping animation metadata objects:

| Pack | Style |
|------|-------|
| **Classic** | Gold/amber tones, subtle effects |
| **Neon** | Bright colors, glowing edges |
| **Minimal** | Monochrome, typography-focused |

Each pack overrides CSS variables for colors and provides its own `@keyframes`.

---

## 12. Rollout Plan

[Back to TOC](#table-of-contents)

### 12.1 Phase 1: Core Engine + Phrase Library

[Back to TOC](#table-of-contents)

**Files to create**:
- `lib/celebrations/events.js` — event detection functions
- `lib/celebrations/phrases.js` — full 435-phrase library
- `lib/celebrations/selector.js` — phrase selection + anti-repetition
- `lib/celebrations/index.js` — main engine (detectEvents → selectPhrase → return)

**Files to modify**:
- `components/CorrectScoreCelebration.jsx` — use new phrase selector
- `components/CribbageGame.jsx` — fire events from counting + pegging logic

**Risks**: Phrase library is large (~50KB). Bundle size increase.
**Mitigation**: Lazy-load the phrase library on first game start.
**Measure**: User feedback on phrase variety and tone.
**Rollback**: Revert to existing 7-phrase list.

### 12.2 Phase 2: Micro-Animations

[Back to TOC](#table-of-contents)

**Files to create**:
- `lib/celebrations/animations.js` — animation metadata registry
- `components/CelebrationToast.jsx` — toast component
- CSS additions to `app/globals.css` — 30 animation keyframes

**Files to modify**:
- `components/CribbageGame.jsx` — add animation anchor refs, render toast
- `components/CorrectScoreCelebration.jsx` — integrate with animation system

**Risks**: CSS animations may perform poorly on low-end phones.
**Mitigation**: All animations are CSS-only (GPU-composited). Motion level setting provides escape hatch.
**Measure**: Test on oldest supported iPhone (SE 2nd gen).
**Rollback**: Set `motionLevel: 'off'` globally.

### 12.3 Phase 3: Context Awareness + Settings

[Back to TOC](#table-of-contents)

**Files to modify**:
- `lib/celebrations/selector.js` — add context-based tone selection + intensity modifiers
- `lib/celebrations/index.js` — accept gameContext
- `components/CribbageGame.jsx` — build gameContext, add settings to ⋮ menu, track `maxDeficit` and `prevHandScore`

**Risks**: Too many settings confuse users.
**Mitigation**: Two simple settings (Celebration Level + Motion Level) with sensible defaults (Classic + Standard).
**Rollback**: Remove settings, hard-code Classic + Standard.

### 12.4 Phase 4: Banter Tone Pack + Extra Credit

[Back to TOC](#table-of-contents)

**Files to create**:
- `lib/celebrations/tones/maine-lodge.js` — 150 Maine Lodge 1958 phrases

**Files to modify**:
- `lib/celebrations/selector.js` — integrate tone pack selection, streak escalation, AI confidence
- `lib/celebrations/animations.js` — add rare Easter egg animations

**Risks**: Maine Lodge tone may not resonate with all players.
**Mitigation**: Only active at "Full Banter" celebration level. Players must opt in.
**Rollback**: Remove tone pack, revert to standard tones.

---

*End of plan. Ready for review.*
