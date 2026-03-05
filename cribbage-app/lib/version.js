// Single source of truth for app version
export const APP_VERSION = 'v0.3.1-b18-20260304';
export const RELEASE_NOTE = `Cribbage v0.3.1 — Counting Phase Visual Improvements

NEW in this version:
- Non-active hands are dimmed during counting phase for clearer focus
- Yellow border no longer disappears when reviewing undercount/overcount errors
- Smooth opacity transitions between counting sub-phases

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
