// Single source of truth for app version
export const APP_VERSION = 'v0.1.0-b88';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

This update improves scoring notifications - you'll now see clearer indicators when points are scored during pegging.

We fixed a bug where the game could get stuck when both players cut the same rank card.

Coming soon: Multiplayer mode! Challenge your friends to real-time cribbage games. Stay tuned!

Thanks for helping us improve the game with your feedback!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
