// Single source of truth for app version
export const APP_VERSION = 'v0.3.1-b16-20260216';
export const RELEASE_NOTE = `Cribbage v0.3.1 — Mobile UI Fixes 📱

NEW in this version:
- Multiplayer: compact 3-dot menu replaces overflow top bar
- Cards no longer overlap too much on mobile
- Deal card animation for multiplayer

Thanks for playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
