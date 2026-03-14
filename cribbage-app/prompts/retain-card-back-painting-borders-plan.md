# Retain Card Back Painting Borders Plan

**Created**: 2026-03-11
**Author**: Claude Code
**Status**: Ready for Review

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [ ] [Phase 1: Recover Original Images from Git](#phase-1-recover-original-images-from-git-🤖)
  - [ ] [Step 1.1: Extract originals from git history](#step-11-extract-originals-from-git-history-🤖)
- [ ] [Phase 2: Re-crop Original 11 Paintings to Match New Standard](#phase-2-re-crop-original-11-paintings-to-match-new-standard-🤖)
  - [ ] [Step 2.1: Crop white margins, keep ornate frames](#step-21-crop-white-margins-keep-ornate-frames-🤖)
  - [ ] [Step 2.2: Visual verification](#step-22-visual-verification-🤖)
- [ ] [Phase 3: Build, Commit, Deploy](#phase-3-build-commit-deploy-🤖)
  - [ ] [Step 3.1: Build and test locally](#step-31-build-and-test-locally-🤖)
  - [ ] [Step 3.2: Git add and commit](#step-32-git-add-and-commit-🤖)
  - [ ] [Step 3.3: Deploy to production](#step-33-deploy-to-production-🤖)

---

## Overview

The 11 original painting card backs (Mona Lisa, American Gothic, The Scream, etc.) were over-cropped during an earlier session — removing not just the white/cream outer margin but also the ornate gold frame and inner mat that give the card its distinctive "framed painting" look.

Meanwhile, 6 newer paintings (camping, sea shells, volcano, tractor) were cropped correctly — white margin removed, ornate frame preserved. The goal is to bring the original 11 into alignment with the new standard.

[Back to TOC](#table-of-contents)

---

## Problem Statement

### What it looks like now (over-cropped)

The original skyscraper painting currently looks like this — raw painting with no frame:

```
┌──────────────┐
│              │  <- just painting, no border/frame
│  [painting]  │     looks flat and unfinished
│              │
└──────────────┘
```

Current crop settings were 23% sides, 17%/20% top/bottom — far too aggressive. This removed:
- The cream/off-white outer margin (correct to remove)
- The ornate gold filigree frame (should have been kept)
- The inner off-white mat between frame and painting (should have been kept)

### What it should look like (new paintings' standard)

The 6 newer paintings correctly show:

```
┌──────────────────┐
│╔════════════════╗│  <- thin remaining cream at edge (hidden by CSS border-radius)
│║  ┌──────────┐  ║│  <- ornate gold frame preserved
│║  │          │  ║│  <- inner mat visible
│║  │[painting]│  ║│
│║  │          │  ║│
│║  └──────────┘  ║│
│╚════════════════╝│
└──────────────────┘
```

Crop settings for these: 10% sides, 7% top/bottom.

### Affected files (11 paintings to re-crop)

| File | Artist | Original Commit |
|------|--------|-----------------|
| `american-gothic.png` | Grant Wood | `1f9f238` |
| `the-scream.png` | Edvard Munch | `1f9f238` |
| `mona-lisa.png` | Leonardo da Vinci | `d77f3fd` |
| `lighthouse-painting-munch.png` | Edvard Munch | `33e1218` |
| `skyscraper-paiting-okeeffe.png` | Georgia O'Keeffe | `33e1218` |
| `desert-painting-dali.png` | Salvador Dalí | `33e1218` |
| `farm-painting-th-benton.png` | Thomas Hart Benton | `33e1218` |
| `pyramids-painting-jl-gerome.png` | Jean-Léon Gérôme | `33e1218` |
| `castle-painting-t-kincade.png` | Thomas Kinkade | `33e1218` |
| `sunrise-painting-shan-shui.png` | Shan Shui tradition | `33e1218` |
| `beach-painting-gauguin.png` | Paul Gauguin | `33e1218` |

All originals are 1024×1536 and recoverable from git history.

### Unaffected files (6 paintings already correct)

These were cropped correctly at 10%/7% and need no changes:
- `camping-painting-1-van-gogh.png`
- `camping-painting-2-bob-ross.png`
- `camping-painting-3-bob-ross.png`
- `sea-shells-painting-balthasa-van-der-ast.png`
- `volcano-painting-hokusai.png`
- `tractor-painting-th-benton.png`

[Back to TOC](#table-of-contents)

---

## Phase 1: Recover Original Images from Git 🤖

### Step 1.1: Extract originals from git history 🤖

Extract all 11 original (uncropped) 1024×1536 PNGs from their initial commit using `git show`:

```bash
git show 1f9f238:cribbage-app/public/card-backs/american-gothic.png > /tmp/originals/american-gothic.png
git show 1f9f238:cribbage-app/public/card-backs/the-scream.png > /tmp/originals/the-scream.png
git show d77f3fd:cribbage-app/public/card-backs/mona-lisa.png > /tmp/originals/mona-lisa.png
# ... and 8 more from commit 33e1218
```

Verify each recovered image is 1024×1536.

[Back to TOC](#table-of-contents)

---

## Phase 2: Re-crop Original 11 Paintings to Match New Standard 🤖

### Step 2.1: Crop white margins, keep ornate frames 🤖

Apply the same crop percentages used for the 6 newer paintings:
- **Left/Right**: 10% (102px from each side)
- **Top/Bottom**: 7% (107px from each side)

This removes the cream/white outer margin while preserving:
- The ornate gold filigree corner pieces
- The gold frame border lines
- The inner off-white mat

Result: ~819×1321 per image (matching the 6 newer paintings).

Python script:
```python
from PIL import Image
import os

originals_dir = '/tmp/originals'
output_dir = 'public/card-backs'

LEFT_PCT = 0.10
RIGHT_PCT = 0.10
TOP_PCT = 0.07
BOTTOM_PCT = 0.07

for f in os.listdir(originals_dir):
    if f.endswith('.png'):
        img = Image.open(os.path.join(originals_dir, f))
        w, h = img.size
        left = int(w * LEFT_PCT)
        right = int(w * (1 - LEFT_PCT))
        top = int(h * TOP_PCT)
        bottom = int(h * (1 - TOP_PCT))
        cropped = img.crop((left, top, right, bottom))
        cropped.save(os.path.join(output_dir, f), 'PNG', optimize=True)
```

### Step 2.2: Visual verification 🤖

Visually verify 3-4 representative images to confirm:
1. White/cream outer margin is gone
2. Ornate gold frame is fully intact
3. Inner off-white mat is visible
4. No painting content was clipped

Compare against the correctly-cropped new paintings for consistency.

[Back to TOC](#table-of-contents)

---

## Phase 3: Build, Commit, Deploy 🤖

### Step 3.1: Build and test locally 🤖

```bash
rm -rf .next && npm run build
```

Bump version in `lib/version.js`.

### Step 3.2: Git add and commit 🤖

Add all 11 re-cropped PNGs and version.js.

### Step 3.3: Deploy to production 🤖

Push and deploy to production.

[Back to TOC](#table-of-contents)
