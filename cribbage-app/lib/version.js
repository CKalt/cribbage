// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b147-20260219';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- NEW: Expert Mode — optimal discards, smarter pegging, and overcount bluffs
- Difficulty selector on the menu (Normal / Expert)
- Per-difficulty stats and Expert leaderboard tab
- Mode badge shown on every screen so you always know your level
- Leaderboard shows games played and primary mode for trust

Try Expert Mode — but watch out for bluff overcounts!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
