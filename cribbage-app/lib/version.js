// Single source of truth for app version
export const APP_VERSION = 'v0.2.1-b142-20260219';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Fixed: Race condition during muggins overcount no longer corrupts game state (bug #80)
- Fixed: Continue button no longer appears during muggins 5-second review period
- Defensive: Restore from stuck "dealing" state clears stale counting fields

Thanks for your feedback - it helps make the game better!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
