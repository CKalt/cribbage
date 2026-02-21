// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b167-20260221';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- The game now reacts to your plays! Big hands, pegging highlights, close wins, and more get celebration phrases
- 435 unique phrases across 17 event types — never the same reaction twice
- Micro-animations bring the table to life: sparkles, glows, confetti, and more
- Set your Celebration Level from the ⋮ menu: Off, Minimal, Classic, Lively, or Full Banter
- Full Banter mode includes Maine Lodge 1958 table talk — dry humor, old-school slang
- Expert Mode — optimal discards, smarter pegging, and the occasional bluff to keep you on your toes

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
