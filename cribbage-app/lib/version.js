// Single source of truth for app version
export const APP_VERSION = 'v0.2.1-b135-20260215';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Cards now deal one-by-one from a center deck with flight animation
- Player's cards flip face-up after all 12 cards are dealt
- Non-dealer receives cards first (proper cribbage convention)

Thanks for your feedback - it helps make the game better!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
