// Single source of truth for app version
export const APP_VERSION = 'v0.3.1-b17-20260227';
export const RELEASE_NOTE = `Cribbage v0.3.1 — Celebrations + Multiplayer Merge 🎉

NEW in this version:
- Celebrations! Big hands, pegging highlights, close wins get reaction phrases
- 435 unique phrases across 17 event types — never the same reaction twice
- Micro-animations: sparkles, glows, confetti, and more
- Set your Celebration Level from the ⋮ menu: Off, Minimal, Classic, Lively, or Full Banter
- Expert Mode — optimal discards, smarter pegging, and the occasional bluff
- Multiplayer: compact 3-dot menu replaces overflow top bar
- Cards no longer overlap too much on mobile
- Deal card animation for multiplayer

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
