// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b226-20260316';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Dealing pauses while the cribbage board is zoomed in
- Fixed: cards no longer bunched together during discard
- Fixed: no longer forced to say "Go" twice during pegging
- Fixed: switching screens mid-count no longer risks re-counting

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
