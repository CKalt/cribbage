// Single source of truth for app version
export const APP_VERSION = 'v0.2.0';
export const RELEASE_NOTE = `Welcome to Cribbage Multiplayer! 🎴

NEW: Challenge your friends to real-time cribbage games!
- Invite players by email
- Full multiplayer gameplay with turn notifications

To start a multiplayer game:
1. Click "Multiplayer" from the main menu
2. Click "New Game" and enter your opponent's email
3. They'll receive an invitation to accept

Thanks for playing!`;

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
