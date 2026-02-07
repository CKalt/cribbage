// Single source of truth for app version
export const APP_VERSION = 'v0.2.1-b103-20260207';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Cards now fly from your hand to the play area during pegging!

Coming soon: Multiplayer mode! Challenge your friends to real-time cribbage games.

Thanks for your feedback - it helps make the game better!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
