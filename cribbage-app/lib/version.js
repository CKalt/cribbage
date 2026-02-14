// Single source of truth for app version
export const APP_VERSION = 'v0.3.1-b09-20260214';
export const RELEASE_NOTE = `Cribbage v0.3.1 — Multiplayer UX Overhaul! 🎮

NEW in this version:
- Fixed card readability on mobile — cards now have minimum sizes and won't get squeezed
- Crib pile no longer overlaps hand cards on small screens
- Multiplayer now matches single-player experience
- Opponent hand display (face-down during play, face-up during counting)
- Progressive crib pile visualization
- Card flight animations for discard, pegging, and crib reveal
- Separate play area stacks (your plays vs opponent's plays)
- Yellow glow highlights during counting and active phases
- Run detection in multiplayer pegging (was missing!)

Thanks for playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
