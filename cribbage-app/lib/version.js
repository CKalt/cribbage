// Single source of truth for app version
export const APP_VERSION = 'v0.3.1-b11-20260215';
export const RELEASE_NOTE = `Cribbage v0.3.1 — Multiplayer UX Overhaul! 🎮

NEW in this version:
- Pegging now uses select-then-play: tap a card to select it, tap again to play
- Last playable card auto-plays with a single tap
- No more accidental card plays from fat-finger taps!
- Fixed card readability on mobile — cards have minimum sizes and won't get squeezed
- Fixed crib counting panel not appearing after game resume
- Crib reveal animation no longer jumps when count panel appears
- Multiplayer now matches single-player experience
- Card flight animations for discard, pegging, and crib reveal
- Run detection in multiplayer pegging (was missing!)

Thanks for playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
