// Single source of truth for app version
export const APP_VERSION = 'v0.3.1-b21-20260314';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Painting cards with cream border + ornate frame
- Deck cut redesign with lift-and-reveal animation
- Smart image caching for faster loading
- Auto-award last card when both players can't play
- Tap any face-down card for a full-screen preview

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
