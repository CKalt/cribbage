// Single source of truth for app version
export const APP_VERSION = 'v0.3.0-b210-20260312';
export const RELEASE_NOTE = `Thank you for playing Cribbage! 🎴

New in this release:
- Painting cards now show cream border + ornate frame with no extra CSS border
- Auto-crop tooling removes white background, preserves artwork framing
- Tap any face-down card for a full-screen preview
- "In the style of" artist credits with mini biographies
- During counting, non-active hands are dimmed so it's clear which hand to count
- Yellow highlight stays visible during score feedback

Happy playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
