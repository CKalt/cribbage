// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b234-20260416';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Fixed: ghost card no longer appears in hand when playing during pegging
- Fixed: no longer forced to say "Go" twice in the same pegging round
- Fixed: computer card no longer appears duplicated in the play area

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
