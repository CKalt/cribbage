// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b193-20260311';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- 33 card back designs! 12 full-card scenes (seashells, Mona Lisa, beach, farm, volcano, castle, camping, sunrise, cherry blossom, fireworks + desert, skyscraper)
- Card back persists when resuming a saved game
- Fixed celebration toasts getting stuck
- Admin card back management in the Admin Panel

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
