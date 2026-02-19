// Single source of truth for app version
export const APP_VERSION = 'v0.2.1-b141-20260219';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Fixed: Score entry panel now always appears when it's your turn to count (bug #77/79)
- Fixed: Stale score breakdown from previous count no longer blocks score entry
- Fixed: Email address restored to top of screen (bug #78)
- Runtime recovery clears stale state from muggins timeout auto-save edge case

Thanks for your feedback - it helps make the game better!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
