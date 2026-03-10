// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b177-20260310';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Random card back designs! Each game picks from 16 unique styles: classic, ornate, modern art, sci-fi, and animal patterns
- Celebrations only fire for YOUR scoring events (no more congratulating computer plays)
- Back peg positions remembered when resuming a saved game

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
