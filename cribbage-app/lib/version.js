// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b163-20260221';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Expert Mode upgraded — the AI now counts accurately every time (no more free muggins points!)
- Expert Mode — optimal discards, smarter pegging, and honest counting
- Switch between Normal and Expert at any time via the ⋮ menu — no need to logout or start a new game
- Two separate leaderboards: one for Normal, one for Expert
- Mode badge on every screen so you always know your level

Expert Mode just got tougher — are you up for the challenge?`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
