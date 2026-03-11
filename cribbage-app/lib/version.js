// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b190-20260311';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- 23 card back designs! Added desert, octopus, tug boat, skyscraper, Lady Liberty, pyramids
- Card back persists when resuming a saved game
- Fixed crib cards overlapping too much during counting
- Admin card back management in the Admin Panel

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
