// Single source of truth for app version
export const APP_VERSION = 'v0.1.0-b93';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

Bug fixes in this release:
- Fixed: Computer now correctly says "Go" when it can't play (Bug #51)
- Fixed: Crib counting now hides your hand to reduce confusion (Bug #50)
- Fixed: Create Account page now has green theme matching login (Bug #39)

Coming soon: Multiplayer mode! Challenge your friends to real-time cribbage games.

Thanks for your feedback - it helps make the game better!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
