// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b151-20260219';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- NEW: Expert Mode — optimal discards, smarter pegging, and overcount bluffs
- Switch between Normal and Expert at any time via the ⋮ menu — no need to logout or start a new game
- Two separate leaderboards: one for Normal, one for Expert
- Your primary mode (shown as "MAIN" on the leaderboard) is whichever mode you've played the most games in
- Mode badge on every screen so you always know your level

Try Expert Mode — but watch out for bluff overcounts!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
