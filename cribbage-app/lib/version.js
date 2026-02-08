// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b01-20260207';
export const RELEASE_NOTE = `Cribbage v0.3.0 — Animations & Polish! 🎴

NEW in this version:
- Card flight animations during pegging
- Computer discard animation with random timing
- Crib reveal animation (cards fly one-by-one)
- Landing pulse effects on played cards
- Progressive crib pile display
- Auth page styling refresh (green theme)
- Bug fixes: dealer alternation, counting recovery, double-deal prevention

Multiplayer features still available:
- Challenge friends to real-time cribbage games
- Invite players by email

Thanks for playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
