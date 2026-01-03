// Single source of truth for app version
export const APP_VERSION = 'v0.1.0-b77';
export const RELEASE_NOTE = 'Fix notification to show at menu screen';

// Version check interval in seconds - increase as user base grows to reduce server load
// Current: 60s check + 0-60s random offset = checks spread over 60-120s window
// Scale guide: 10 users=60s, 100 users=300s (5min), 1000 users=600s (10min)
export const VERSION_CHECK_INTERVAL_SECONDS = 60;
