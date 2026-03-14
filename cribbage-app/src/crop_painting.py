#!/usr/bin/env python3
"""
Auto-crop painting card back images.

Removes the white background from ChatGPT-generated painting PNGs,
preserving the cream card body, ornate frame, and artwork.

Usage:
    python src/crop_painting.py originals/skyscraper-paiting-okeeffe.png
    python src/crop_painting.py --all
"""

import argparse
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Directories relative to project root
ORIGINALS_DIR = Path("originals")
OUTPUT_DIR = Path("public/card-backs")

# White detection threshold: pixels with ALL channels > this are "white"
WHITE_THRESHOLD = 250

# Safety margin: extra pixels to crop inward past the detected boundary
SAFETY_MARGIN = 3

# Number of sample lines to scan per edge (spread across the middle 60% to avoid corners)
NUM_SAMPLES = 20


def find_white_boundary(img_array, edge, num_samples=NUM_SAMPLES):
    """
    Scan inward from the given edge along multiple sample lines.
    Returns the number of pixels of white from that edge.

    For each sample line, finds the first non-white pixel (any channel < WHITE_THRESHOLD).
    Returns the maximum inset across all samples (conservative — removes all white).
    """
    h, w, _ = img_array.shape

    # Sample lines spread across the middle 60% of the perpendicular axis
    if edge in ('left', 'right'):
        # Sample horizontal lines at various y positions
        start = int(h * 0.2)
        end = int(h * 0.8)
        positions = np.linspace(start, end, num_samples, dtype=int)
    else:
        # Sample vertical lines at various x positions
        start = int(w * 0.2)
        end = int(w * 0.8)
        positions = np.linspace(start, end, num_samples, dtype=int)

    max_inset = 0

    for pos in positions:
        if edge == 'left':
            line = img_array[pos, :, :]  # row at y=pos, all x
            for x in range(w):
                if np.min(line[x]) < WHITE_THRESHOLD:
                    max_inset = max(max_inset, x)
                    break
        elif edge == 'right':
            line = img_array[pos, :, :]
            for x in range(w - 1, -1, -1):
                if np.min(line[x]) < WHITE_THRESHOLD:
                    inset = w - 1 - x
                    max_inset = max(max_inset, inset)
                    break
        elif edge == 'top':
            line = img_array[:, pos, :]  # column at x=pos, all y
            for y in range(h):
                if np.min(line[y]) < WHITE_THRESHOLD:
                    max_inset = max(max_inset, y)
                    break
        elif edge == 'bottom':
            line = img_array[:, pos, :]
            for y in range(h - 1, -1, -1):
                if np.min(line[y]) < WHITE_THRESHOLD:
                    inset = h - 1 - y
                    max_inset = max(max_inset, inset)
                    break

    return max_inset


def crop_painting(input_path, output_path):
    """
    Auto-crop a painting PNG, removing white background.
    Preserves cream border, ornate frame, and artwork.
    """
    img = Image.open(input_path).convert("RGB")
    img_array = np.array(img)
    h, w, _ = img_array.shape

    print(f"\nProcessing: {input_path}")
    print(f"  Original size: {w}x{h}")

    # Detect white boundaries
    left = find_white_boundary(img_array, 'left')
    right = find_white_boundary(img_array, 'right')
    top = find_white_boundary(img_array, 'top')
    bottom = find_white_boundary(img_array, 'bottom')

    print(f"  White boundaries: left={left}px, right={right}px, top={top}px, bottom={bottom}px")

    # Apply safety margin (crop a few extra pixels inward)
    left = left + SAFETY_MARGIN
    right = right + SAFETY_MARGIN
    top = top + SAFETY_MARGIN
    bottom = bottom + SAFETY_MARGIN

    # Crop
    crop_box = (left, top, w - right, h - bottom)
    cropped = img.crop(crop_box)

    new_w, new_h = cropped.size
    print(f"  Cropped size: {new_w}x{new_h}")
    print(f"  Removed: left={left}px ({left*100/w:.1f}%), right={right}px ({right*100/w:.1f}%), "
          f"top={top}px ({top*100/h:.1f}%), bottom={bottom}px ({bottom*100/h:.1f}%)")

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cropped.save(output_path, "PNG", optimize=True)
    print(f"  Saved to: {output_path}")

    return True


def main():
    parser = argparse.ArgumentParser(description="Auto-crop painting card back images")
    parser.add_argument("input", nargs="?", help="Path to a single original PNG")
    parser.add_argument("--all", action="store_true", help="Process all PNGs in originals/")
    args = parser.parse_args()

    if not args.all and not args.input:
        parser.print_help()
        sys.exit(1)

    if args.all:
        if not ORIGINALS_DIR.exists():
            print(f"Error: {ORIGINALS_DIR} directory not found")
            sys.exit(1)

        pngs = sorted(ORIGINALS_DIR.glob("*.png"))
        if not pngs:
            print(f"No PNG files found in {ORIGINALS_DIR}")
            sys.exit(1)

        print(f"Processing {len(pngs)} paintings from {ORIGINALS_DIR}/")
        success = 0
        for png in pngs:
            output = OUTPUT_DIR / png.name
            try:
                crop_painting(str(png), str(output))
                success += 1
            except Exception as e:
                print(f"  ERROR: {e}")

        print(f"\nDone: {success}/{len(pngs)} paintings processed successfully")
    else:
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"Error: {input_path} not found")
            sys.exit(1)

        output = OUTPUT_DIR / input_path.name
        crop_painting(str(input_path), str(output))
        print("\nDone!")


if __name__ == "__main__":
    main()
