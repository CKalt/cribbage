// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b145-20260219';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- NEW: Expert Mode — smarter discards, pegging, and perfect counting
- Difficulty selector on the menu (Normal / Expert)
- Per-difficulty stats and Expert leaderboard tab
- "Play Again" now returns to menu so you can change settings
- Expert Mode badge shown during gameplay

Try Expert Mode for a tougher challenge!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
