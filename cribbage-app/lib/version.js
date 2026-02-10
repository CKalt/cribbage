// Single source of truth for app version
export const APP_VERSION = 'v0.3.1-b04-20260210';
export const RELEASE_NOTE = `Cribbage v0.3.1 — Multiplayer UX Overhaul! 🎮

NEW in this version:
- Multiplayer now matches single-player experience
- Opponent hand display (face-down during play, face-up during counting)
- Progressive crib pile visualization
- Card flight animations for discard, pegging, and crib reveal
- Separate play area stacks (your plays vs opponent's plays)
- Yellow glow highlights during counting and active phases
- Card groups now have visible container boxes
- Cut card shown alongside hand during counting
- Score breakdown display after verification
- Landing pulse animation on played cards
- Run detection in multiplayer pegging (was missing!)
- Layout reordered to match single-player visual hierarchy

Thanks for playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
