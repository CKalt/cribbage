// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b182-20260310';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- 17 all-new card back designs! Animals, sports, space, vehicles, and nature themes
- Admin card back management in the Admin Panel
- Cut deck shows your game's card back design with slanted icon

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
