// Single source of truth for app version
export const APP_VERSION = 'v0.2.1-b140-20260218';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Fixed: Score entry panel reliably appears when it's your turn to count
- Defense-in-depth fix: Continue button cannot appear without a submitted score
- Crib pile stack disappears cleanly when crib cards are revealed

Thanks for your feedback - it helps make the game better!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
