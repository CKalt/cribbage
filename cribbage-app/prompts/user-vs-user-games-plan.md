# User vs User Multiplayer Games - Implementation Plan

**Created**: 2026-01-09
**Author**: Claude Code
**Status**: In Progress - Phases 1-4 Complete
**Version**: v0.1.0-b82

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Architecture Decision](#architecture-decision)
- [Deployment Strategy](#deployment-strategy)
- [Phase 1: Data Schema Extension](#phase-1-data-schema-extension) ✅
  - [x] [Step 1.1: Create multiplayer game schema](#step-11-create-multiplayer-game-schema-🤖)
  - [x] [Step 1.2: Create game invitation schema](#step-12-create-game-invitation-schema-🤖)
  - [x] [Step 1.3: Update user data structure](#step-13-update-user-data-structure-🤖)
- [Phase 2: Core API Endpoints](#phase-2-core-api-endpoints) ✅
  - [x] [Step 2.1: Create game creation endpoint](#step-21-create-game-creation-endpoint-🤖)
  - [x] [Step 2.2: Create game state endpoint](#step-22-create-game-state-endpoint-🤖)
  - [x] [Step 2.3: Create move submission endpoint](#step-23-create-move-submission-endpoint-🤖)
  - [x] [Step 2.4: Create game listing endpoint](#step-24-create-game-listing-endpoint-🤖)
- [Phase 3: Invitation System](#phase-3-invitation-system) ✅
  - [x] [Step 3.1: Create player listing and search endpoint](#step-31-create-player-listing-and-search-endpoint-🤖)
  - [x] [Step 3.2: Create invitation endpoints](#step-32-create-invitation-endpoints-🤖)
  - [x] [Step 3.3: Create invitation UI component](#step-33-create-invitation-ui-component-🤖)
- [Phase 4: Game Lobby](#phase-4-game-lobby) ✅
  - [x] [Step 4.1: Create GameLobby component](#step-41-create-gamelobby-component-🤖)
  - [x] [Step 4.2: Add lobby to main menu](#step-42-add-lobby-to-main-menu-🤖)
  - [x] [Step 4.3: Implement active games list](#step-43-implement-active-games-list-🤖)
- [Phase 5: Multiplayer Game UI](#phase-5-multiplayer-game-ui)
  - [ ] [Step 5.1: Create MultiplayerGame component](#step-51-create-multiplayergame-component-🤖)
  - [ ] [Step 5.2: Implement turn-based polling](#step-52-implement-turn-based-polling-🤖)
  - [ ] [Step 5.3: Add opponent status indicators](#step-53-add-opponent-status-indicators-🤖)
  - [ ] [Step 5.4: Handle disconnection/timeout](#step-54-handle-disconnectiontimeout-🤖)
- [Phase 6: Game Logic Adaptation](#phase-6-game-logic-adaptation)
  - [ ] [Step 6.1: Extract shared game logic](#step-61-extract-shared-game-logic-🤖)
  - [ ] [Step 6.2: Implement server-side validation](#step-62-implement-server-side-validation-🤖)
  - [ ] [Step 6.3: Handle simultaneous actions](#step-63-handle-simultaneous-actions-🤖)
- [Phase 7: Testing & Deployment](#phase-7-testing--deployment)
  - [ ] [Step 7.1: Test with two accounts](#step-71-test-with-two-accounts-👤)
  - [ ] [Step 7.2: Fix identified issues](#step-72-fix-identified-issues-🤖)
  - [ ] [Step 7.3: Deploy to production](#step-73-deploy-to-production-🤖👤)
- [Phase 8: User Handles & Chat System](#phase-8-user-handles--chat-system)
  - [ ] [Step 8.1: Create user handle schema](#step-81-create-user-handle-schema-🤖)
  - [ ] [Step 8.2: Create chat message schema](#step-82-create-chat-message-schema-🤖)
  - [ ] [Step 8.3: Create profile API endpoints](#step-83-create-profile-api-endpoints-🤖)
  - [ ] [Step 8.4: Create chat API endpoints](#step-84-create-chat-api-endpoints-🤖)
  - [ ] [Step 8.5: Create profile settings UI](#step-85-create-profile-settings-ui-🤖)
  - [ ] [Step 8.6: Update leaderboard with handles](#step-86-update-leaderboard-with-handles-🤖)
  - [ ] [Step 8.7: Create chat UI components](#step-87-create-chat-ui-components-🤖)
  - [ ] [Step 8.8: Add chat notification system](#step-88-add-chat-notification-system-🤖)
  - [ ] [Step 8.9: Integrate chat with game flow](#step-89-integrate-chat-with-game-flow-🤖)
  - [ ] [Step 8.10: Handle uniqueness and migration](#step-810-handle-uniqueness-and-migration-🤖)
  - [ ] [Step 8.11: Test chat system](#step-811-test-chat-system-👤)
- [Future Enhancements](#future-enhancements)

---

## Overview

This plan outlines the implementation of user vs user multiplayer games for the Cribbage app. Currently, the app only supports single-player games against a computer opponent. This feature will allow two authenticated users to play cribbage against each other.

### Gameplay Model: Real-Time AND Asynchronous

**The multiplayer system supports both real-time and asynchronous play:**

- **Real-time play**: When both players are online simultaneously, they can play in real-time with automatic polling to detect opponent moves within seconds.

- **Asynchronous play**: Players do NOT need to be online at the same time. A player can make their move and log off. When their opponent logs in later (minutes, hours, or days), they will see the move that was made and can take their turn. This is similar to "play-by-mail" or turn-based mobile games.

- **Session persistence**: Game state is preserved across login sessions. Players can close the app, come back later, and resume exactly where they left off. When returning, players see:
  - The last move their opponent made while they were offline
  - Clear indication of whose turn it is
  - Full game history/context

### Multiple Concurrent Games

- **Many games at once**: Players can participate in multiple multiplayer games simultaneously (e.g., playing games against 5 different friends at the same time)
- **One game per opponent**: Only ONE active game between any two specific players at a time (cannot start a second game with someone until the current game is finished)
- **Game list**: Players see a list of all their active games with indicators showing which games are waiting for their move

### Single-Player vs Computer Preserved

The existing single-player mode against the computer AI remains fully available. From the main menu, players can choose:
- **Play vs Computer** - Launches the existing single-player game (unchanged)
- **Play vs Friend** - Opens the multiplayer lobby to invite/join games

This is an additive feature - no existing functionality is removed.

### How Invitations Work

**Finding players to invite:**
- **Browse all players**: See a list of all registered users (showing usernames/emails)
- **Search**: Type to filter the list by email or username
- **Status indicators**: See who is currently online, who you already have a game with

**To invite another player:**
1. Player opens "Play vs Friend" from the main menu
2. Player browses the player list or searches by email/username
3. Player clicks "Invite" next to the person they want to play
4. An invitation is created and appears in the recipient's invitation list
5. Recipient can Accept or Decline the invitation
6. If accepted, both players are placed into a new game

**Invitation visibility:**
- Players see a notification badge when they have pending invitations
- Invitations appear in the Game Lobby under "Pending Invitations"
- Invitations expire after 24 hours if not accepted/declined
- Players cannot send a new invitation to someone they already have an active game with

**Current Architecture:**
- Single-player only (vs computer AI)
- File-based storage per user (`data/{userId}-dml-ast.json`)
- REST API with Next.js app router
- Cognito authentication
- No WebSocket/real-time infrastructure

**Target Architecture:**
- Support both single-player and multiplayer modes
- Shared game state storage for multiplayer games
- Turn-based polling for real-time sync when both players online
- Persistent game state for asynchronous play across sessions
- Optional WebSocket upgrade (future)

[Back to TOC](#table-of-contents)

---

## Problem Statement

Users have requested the ability to play cribbage against friends and other human players rather than just the computer. The current architecture is designed for single-player games only, with:

1. **Per-user storage**: Each user has their own game state file
2. **No shared state**: No mechanism for two users to share a game
3. **No real-time sync**: No WebSocket or polling for live updates
4. **No player discovery**: No way to find or invite other players

**Key Challenges:**
- Synchronizing game state between two players
- Handling turn management and validation
- Managing game invitations and matchmaking
- Dealing with disconnections and timeouts
- Preventing cheating through server-side validation

[Back to TOC](#table-of-contents)

---

## Architecture Decision

**Chosen Approach: REST-based Polling with File Storage**

Given the current file-based architecture, we will:

1. **Create a shared games directory**: `data/games/{gameId}.json`
2. **Use polling for state sync**: Client polls every 2-3 seconds when waiting for opponent
3. **Server-side turn validation**: Server validates moves and manages turn order
4. **Invitation via email lookup**: Players invite others by email address

**Why not WebSockets?**
- Current infrastructure doesn't support persistent connections
- Polling is simpler to implement and debug
- File-based storage works well with polling
- Can upgrade to WebSockets later if needed

**File Structure:**
```
data/
  {userId}-dml-ast.json          # Existing per-user data
  games/
    {gameId}.json                # Multiplayer game state
  invitations/
    {inviteId}.json              # Game invitations
```

[Back to TOC](#table-of-contents)

---

## Deployment Strategy

### Beta Subdomain Approach

To allow testing the multiplayer feature without affecting the stable version:

| Environment | URL | Branch | Port |
|-------------|-----|--------|------|
| **Stable** | `cribbage.chrisk.com` | `main` | 3000 |
| **Beta** | `beta.cribbage.chrisk.com` | `multiplayer` | 3001 |

### Setup Steps

**1. Create multiplayer branch:**
```bash
git checkout -b multiplayer
git push -u origin multiplayer
```

**2. Add DNS record:**
- Add `beta.cribbage.chrisk.com` A record pointing to `3.132.10.219`

**3. Get SSL certificate for beta:**
```bash
sudo certbot --nginx -d beta.cribbage.chrisk.com
```

**4. Configure Nginx** (`/etc/nginx/conf.d/cribbage-beta.conf`):
```nginx
server {
    server_name beta.cribbage.chrisk.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/beta.cribbage.chrisk.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beta.cribbage.chrisk.com/privkey.pem;
}
```

**5. PM2 configuration** - Run two instances:
```bash
# Stable (existing)
pm2 start npm --name "cribbage" -- start

# Beta (new)
cd ~/cribbage-beta/cribbage-app
pm2 start npm --name "cribbage-beta" -- start -- -p 3001
```

**6. Clone beta repo:**
```bash
cd ~
git clone git@github.com:CKalt/cribbage.git cribbage-beta
cd cribbage-beta
git checkout multiplayer
cd cribbage-app
npm ci --ignore-scripts
npm run build
```

### Deployment Commands

**Deploy to stable (main branch):**
```bash
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
  "cd cribbage && git pull && cd cribbage-app && npm run build && pm2 restart cribbage"
```

**Deploy to beta (multiplayer branch):**
```bash
ssh -A -i ~/.ssh/chriskoin2-key-pair.pem ec2-user@cribbage.chrisk.com \
  "cd cribbage-beta && git pull && cd cribbage-app && npm run build && pm2 restart cribbage-beta"
```

### Shared Data

Both versions share the same data directories:
- `/home/ec2-user/cribbage/cribbage-app/data/` - User data and games
- `/home/ec2-user/cribbage/cribbage-app/bug-reports/` - Bug reports

This allows users to switch between versions and retain their data.

### Merging to Stable

When multiplayer is stable:
```bash
git checkout main
git merge multiplayer
git push origin main
# Deploy to stable
```

[Back to TOC](#table-of-contents)

---

## Phase 1: Data Schema Extension

### Step 1.1: Create multiplayer game schema 🤖

**File**: `lib/multiplayer-schema.js`

Create schema for multiplayer games:

```javascript
// Game statuses
export const GAME_STATUS = {
  WAITING: 'waiting',      // Waiting for opponent to join
  ACTIVE: 'active',        // Game in progress
  COMPLETED: 'completed',  // Game finished
  ABANDONED: 'abandoned'   // Player left/timed out
};

// Multiplayer game structure
export const createMultiplayerGame = (gameId, player1Id, player1Email) => ({
  id: gameId,
  status: GAME_STATUS.WAITING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // Players
  player1: {
    id: player1Id,
    email: player1Email,
    connected: true,
    lastSeen: new Date().toISOString()
  },
  player2: null,

  // Game state (same structure as single-player)
  gameState: null,

  // Turn management
  currentTurn: null,  // 'player1' or 'player2'
  turnStartedAt: null,

  // Last move info - shown to returning player who was offline
  lastMove: {
    by: null,           // 'player1' or 'player2'
    type: null,         // 'discard', 'play', 'go', 'count', etc.
    description: null,  // Human-readable: "Played 5♠ (count: 15 for 2)"
    timestamp: null
  },

  // History for replay/debugging
  moveHistory: []
});
```

**Important Constraints:**
- Only ONE active game allowed between any two players
- Before creating a game or accepting an invite, check for existing active games between the pair
- Completed/abandoned games don't count toward this limit

[Back to TOC](#table-of-contents)

---

### Step 1.2: Create game invitation schema 🤖

**File**: `lib/multiplayer-schema.js` (continued)

```javascript
export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired'
};

export const createInvitation = (inviteId, fromUser, toEmail) => ({
  id: inviteId,
  status: INVITE_STATUS.PENDING,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours

  from: {
    id: fromUser.id,
    email: fromUser.email
  },
  toEmail: toEmail,

  gameId: null  // Set when accepted
});
```

[Back to TOC](#table-of-contents)

---

### Step 1.3: Update user data structure 🤖

**File**: `lib/game-schema.js`

Add multiplayer stats to user data:

```javascript
// Add to existing schema
export const MULTIPLAYER_STATS_COLS = {
  USER_ID: 0,
  MP_WINS: 1,
  MP_LOSSES: 2,
  MP_FORFEITS: 3,
  LAST_MP_GAME: 4
};

export const createMultiplayerStatsRow = (userId) => [
  userId,  // USER_ID
  0,       // MP_WINS
  0,       // MP_LOSSES
  0,       // MP_FORFEITS
  null     // LAST_MP_GAME
];
```

[Back to TOC](#table-of-contents)

---

## Phase 2: Core API Endpoints

### Step 2.1: Create game creation endpoint 🤖

**File**: `app/api/multiplayer/games/route.js`

```javascript
// POST /api/multiplayer/games - Create new multiplayer game
// GET /api/multiplayer/games - List user's active games
```

**Functionality:**
- Authenticate user from JWT
- Generate unique game ID
- Create game file in `data/games/`
- Return game ID for sharing/invitation

[Back to TOC](#table-of-contents)

---

### Step 2.2: Create game state endpoint 🤖

**File**: `app/api/multiplayer/games/[gameId]/route.js`

```javascript
// GET /api/multiplayer/games/[gameId] - Get game state
// DELETE /api/multiplayer/games/[gameId] - Abandon game
```

**Functionality:**
- Validate user is participant
- Return full game state
- Update `lastSeen` timestamp for polling detection
- Handle opponent disconnect detection

[Back to TOC](#table-of-contents)

---

### Step 2.3: Create move submission endpoint 🤖

**Status**: ✅ Complete (2026-01-17)

**File**: `app/api/multiplayer/games/[gameId]/move/route.js`

```javascript
// POST /api/multiplayer/games/[gameId]/move - Submit a move
```

**Request body:**
```javascript
{
  moveType: 'discard' | 'play' | 'go' | 'acceptScore' | 'claimCount',
  data: {
    // Move-specific data
    cards: [...],      // For discard/play
    claimedScore: 5,   // For counting
  }
}
```

**Functionality:**
- Validate it's user's turn
- Validate move is legal
- Apply move to game state
- Switch turn to opponent
- Return updated state

[Back to TOC](#table-of-contents)

---

### Step 2.4: Create game listing endpoint 🤖

**File**: `app/api/multiplayer/games/route.js` (GET handler)

**Response:**
```javascript
{
  success: true,
  games: [
    {
      id: 'game-123',
      opponent: { email: 'friend@example.com' },
      status: 'active',
      isMyTurn: true,
      lastActivity: '2026-01-09T10:30:00Z'
    }
  ]
}
```

[Back to TOC](#table-of-contents)

---

## Phase 3: Invitation System

### Step 3.1: Create player listing and search endpoint 🤖

**File**: `app/api/multiplayer/players/route.js`

```javascript
// GET /api/multiplayer/players - List all players
// GET /api/multiplayer/players?search=foo - Search/filter players
```

**Response:**
```javascript
{
  success: true,
  players: [
    {
      id: 'user-123',
      email: 'player@example.com',
      username: 'player',           // Email prefix or display name
      isOnline: true,               // Active in last 5 minutes
      hasActiveGame: false,         // Already playing against requester
      lastSeen: '2026-01-09T10:30:00Z'
    }
  ]
}
```

**Functionality:**
- List all registered users (from data directory scan)
- Optional `search` param filters by email/username (partial match)
- Exclude self from results
- Include online status (based on recent activity)
- Flag users who already have an active game with requester
- Sort by: online first, then alphabetically

[Back to TOC](#table-of-contents)

---

### Step 3.2: Create invitation endpoints 🤖

**File**: `app/api/multiplayer/invitations/route.js`

```javascript
// POST /api/multiplayer/invitations - Send invitation
// GET /api/multiplayer/invitations - Get pending invitations
```

**File**: `app/api/multiplayer/invitations/[id]/route.js`

```javascript
// POST /api/multiplayer/invitations/[id]/accept - Accept invitation
// POST /api/multiplayer/invitations/[id]/decline - Decline invitation
```

[Back to TOC](#table-of-contents)

---

### Step 3.3: Create invitation UI component 🤖

**File**: `components/InvitationManager.jsx`

**Features:**
- Show pending invitations received
- Allow accepting/declining
- Show sent invitations and their status
- Notification badge for new invitations

[Back to TOC](#table-of-contents)

---

## Phase 4: Game Lobby

### Step 4.1: Create GameLobby component 🤖

**File**: `components/GameLobby.jsx`

**Features:**
- "Play vs Computer" button (existing flow)
- "Play vs Friend" section:
  - Search for player by email
  - Send invitation
  - View pending invitations
- "Active Games" section:
  - List of ongoing multiplayer games
  - Click to resume

[Back to TOC](#table-of-contents)

---

### Step 4.2: Add lobby to main menu 🤖

**File**: `components/CribbageGame.jsx`

Modify main menu to include:
- New game mode selection
- Link to Game Lobby for multiplayer

[Back to TOC](#table-of-contents)

---

### Step 4.3: Implement active games list 🤖

**File**: `components/ActiveGamesList.jsx`

**Features:**
- Show all active multiplayer games
- Indicate whose turn it is
- Show opponent info
- Click to join/resume game
- Visual indicator for "your turn"

[Back to TOC](#table-of-contents)

---

## Phase 5: Multiplayer Game UI

### Step 5.1: Create MultiplayerGame component 🤖

**File**: `components/MultiplayerGame.jsx`

**Key differences from single-player:**
- Opponent is another human (show their email/username)
- Wait for opponent's turn (show waiting indicator)
- Opponent's cards are hidden until appropriate
- No computer AI - all decisions by human players

[Back to TOC](#table-of-contents)

---

### Step 5.2: Implement turn-based polling 🤖

**File**: `hooks/useMultiplayerSync.js`

```javascript
// Poll for game state updates
const useMultiplayerSync = (gameId, isMyTurn) => {
  // Poll every 2 seconds when waiting for opponent
  // Stop polling when it's my turn
  // Handle state updates and conflicts
};
```

**Polling strategy:**
- When it's my turn: No polling needed
- When waiting for opponent: Poll every 2-3 seconds
- Exponential backoff if opponent seems AFK
- Show "opponent is thinking" indicator

[Back to TOC](#table-of-contents)

---

### Step 5.3: Add opponent status indicators 🤖

**UI Elements:**
- "Waiting for opponent..." message
- Opponent's last seen timestamp
- "Opponent disconnected" warning after 30s
- Turn timer (optional)

[Back to TOC](#table-of-contents)

---

### Step 5.4: Handle disconnection/timeout 🤖

**Scenarios:**
1. **Opponent AFK > 5 minutes**: Show warning, allow forfeit claim
2. **Opponent AFK > 15 minutes**: Auto-forfeit option
3. **User leaves and returns**: Resume from saved state
4. **Both players leave**: Game persists for 24 hours

[Back to TOC](#table-of-contents)

---

## Phase 6: Game Logic Adaptation

### Step 6.1: Extract shared game logic 🤖

**File**: `lib/gameLogic.js`

Extract core game logic from `CribbageGame.jsx`:
- Card dealing
- Discard validation
- Play phase logic
- Scoring calculations
- Turn management

This allows the same logic to run on both client and server.

[Back to TOC](#table-of-contents)

---

### Step 6.2: Implement server-side validation 🤖

**File**: `lib/moveValidator.js`

All moves must be validated server-side:
- Is it this player's turn?
- Is the move legal given current state?
- Are the cards valid (player actually has them)?
- Is the score claim accurate?

**Prevents cheating by:**
- Validating card ownership
- Validating score claims
- Preventing out-of-turn actions

[Back to TOC](#table-of-contents)

---

### Step 6.3: Handle simultaneous actions 🤖

**File Locking Strategy:**
- Use atomic file operations
- Check `updatedAt` timestamp before writing
- Reject stale updates
- Return current state on conflict

[Back to TOC](#table-of-contents)

---

## Phase 7: Testing & Deployment

### Step 7.1: Test with two accounts 👤

**Test Scenarios:**
1. Create game and send invitation
2. Accept invitation and start game
3. Complete full game (all phases)
4. Test disconnection/reconnection
5. Test forfeit flow
6. Test invitation expiration

[Back to TOC](#table-of-contents)

---

### Step 7.2: Fix identified issues 🤖

Address bugs and issues found during testing.

[Back to TOC](#table-of-contents)

---

### Step 7.3: Deploy to production 🤖👤

1. 🤖 Create git commit with all changes
2. 👤 Push to GitHub
3. 👤 Pull on EC2 and rebuild
4. 👤 Verify in production

[Back to TOC](#table-of-contents)

---

## Phase 8: User Handles & Chat System

This phase adds user handles (custom usernames) and a comprehensive chat system for player communication.

### Overview

**User Handles:**
- Users can create a unique handle (username) in their profile
- Handles are displayed on the leaderboard instead of email addresses
- Handles must be unique across all users
- Handles can be 3-20 characters, alphanumeric with underscores

**Chat System:**
- Players can have ongoing conversations with each other
- Chat is accessible from the leaderboard via a chat button
- Supports both live (real-time) and offline (async) messaging
- Conversations can be about current games or planning future games
- Unread message indicators and notifications

### Step 8.1: Create user handle schema 🤖

**File**: `lib/user-profile-schema.js`

```javascript
/**
 * User profile with handle
 */
export const createUserProfile = (userId, email) => ({
  id: userId,
  email: email,
  handle: null,              // Unique username, set by user
  handleSetAt: null,         // When handle was set/changed
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // Profile settings
  settings: {
    showOnlineStatus: true,  // Allow others to see when online
    allowChatInvites: true,  // Allow chat from non-friends
  }
});

/**
 * Handle validation rules
 */
export const HANDLE_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9_]+$/,  // Alphanumeric and underscores only
  RESERVED: ['admin', 'system', 'moderator', 'cribbage', 'support']
};

export const validateHandle = (handle) => {
  if (!handle) return { valid: false, error: 'Handle is required' };
  if (handle.length < HANDLE_RULES.MIN_LENGTH)
    return { valid: false, error: `Handle must be at least ${HANDLE_RULES.MIN_LENGTH} characters` };
  if (handle.length > HANDLE_RULES.MAX_LENGTH)
    return { valid: false, error: `Handle must be at most ${HANDLE_RULES.MAX_LENGTH} characters` };
  if (!HANDLE_RULES.PATTERN.test(handle))
    return { valid: false, error: 'Handle can only contain letters, numbers, and underscores' };
  if (HANDLE_RULES.RESERVED.includes(handle.toLowerCase()))
    return { valid: false, error: 'This handle is reserved' };
  return { valid: true };
};
```

[Back to TOC](#table-of-contents)

---

### Step 8.2: Create chat message schema 🤖

**File**: `lib/chat-schema.js`

```javascript
/**
 * Chat conversation between two users
 */
export const createConversation = (conversationId, user1Id, user2Id) => ({
  id: conversationId,
  participants: [user1Id, user2Id],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // Last message preview
  lastMessage: null,
  lastMessageAt: null,
  lastMessageBy: null,

  // Unread tracking per participant
  unreadCount: {
    [user1Id]: 0,
    [user2Id]: 0
  },

  // Optional link to active game
  linkedGameId: null
});

/**
 * Chat message
 */
export const createMessage = (messageId, conversationId, senderId, content) => ({
  id: messageId,
  conversationId: conversationId,
  senderId: senderId,
  content: content,
  createdAt: new Date().toISOString(),

  // Message type
  type: 'text',  // 'text', 'game_invite', 'game_result', 'system'

  // Read status per recipient
  readBy: [senderId],  // Sender has "read" their own message

  // Optional metadata
  metadata: null  // For game_invite: { gameId }, for game_result: { winner, score }
});

/**
 * Message content validation
 */
export const MESSAGE_RULES = {
  MAX_LENGTH: 500,
  MIN_LENGTH: 1
};
```

**File Structure:**
```
data/
  chat/
    conversations/
      {conversationId}.json     # Conversation metadata
    messages/
      {conversationId}/
        {timestamp}-{messageId}.json  # Individual messages (sorted by timestamp)
```

[Back to TOC](#table-of-contents)

---

### Step 8.3: Create profile API endpoints 🤖

**File**: `app/api/profile/route.js`

```javascript
// GET /api/profile - Get current user's profile
// PUT /api/profile - Update profile (including handle)
```

**File**: `app/api/profile/handle/check/route.js`

```javascript
// GET /api/profile/handle/check?handle=foo - Check if handle is available
```

**Functionality:**
- Get and update user profile
- Validate handle uniqueness before setting
- Return error if handle is taken
- Update all references when handle changes

[Back to TOC](#table-of-contents)

---

### Step 8.4: Create chat API endpoints 🤖

**File**: `app/api/chat/conversations/route.js`

```javascript
// GET /api/chat/conversations - List user's conversations
// POST /api/chat/conversations - Start new conversation with user
```

**Response for GET:**
```javascript
{
  success: true,
  conversations: [
    {
      id: 'conv-123',
      participant: {
        id: 'user-456',
        handle: 'CribbagePro',
        email: 'player@example.com',
        isOnline: true
      },
      lastMessage: 'Good game yesterday!',
      lastMessageAt: '2026-01-10T14:30:00Z',
      unreadCount: 2,
      linkedGameId: 'game-789'  // If currently playing
    }
  ]
}
```

**File**: `app/api/chat/conversations/[id]/route.js`

```javascript
// GET /api/chat/conversations/[id] - Get conversation with messages
// DELETE /api/chat/conversations/[id] - Delete/archive conversation
```

**File**: `app/api/chat/conversations/[id]/messages/route.js`

```javascript
// GET /api/chat/conversations/[id]/messages - Get messages (paginated)
// POST /api/chat/conversations/[id]/messages - Send new message
```

**File**: `app/api/chat/conversations/[id]/read/route.js`

```javascript
// POST /api/chat/conversations/[id]/read - Mark conversation as read
```

[Back to TOC](#table-of-contents)

---

### Step 8.5: Create profile settings UI 🤖

**File**: `components/ProfileSettings.jsx`

**Features:**
- View current profile information
- Set/change handle with availability check
- Real-time validation as user types
- Preview how handle will appear
- Privacy settings (online status visibility, chat invites)

**UI Flow:**
1. User opens menu → "Profile Settings"
2. Current handle shown (or "Set your handle" if not set)
3. Text input with live validation
4. "Check Availability" button
5. "Save" button (disabled until valid and available)

[Back to TOC](#table-of-contents)

---

### Step 8.6: Update leaderboard with handles 🤖

**File**: `components/Leaderboard.jsx`

**Changes:**
- Display handle instead of email (fall back to email prefix if no handle)
- Add chat button next to each player
- Show online status indicator (green dot)
- Add "Your rank" highlight for current user

**Leaderboard Row:**
```
Rank | Handle/Name     | Wins | Win% | Status | Chat
#1   | CribbageMaster  | 150  | 72%  | 🟢     | 💬
#2   | CardShark99     | 142  | 68%  | ⚫     | 💬
#3   | You (MyHandle)  | 128  | 65%  | 🟢     | -
```

[Back to TOC](#table-of-contents)

---

### Step 8.7: Create chat UI components 🤖

**File**: `components/ChatPanel.jsx`

**Features:**
- Slide-out panel or modal for chat
- Conversation list with unread indicators
- Individual conversation view with messages
- Message input with send button
- Typing indicator (optional)
- Link to game if playing against chat partner

**File**: `components/ChatConversation.jsx`

**Features:**
- Message bubbles (sender on right, receiver on left)
- Timestamps for messages
- "Seen" indicators
- Scroll to bottom on new message
- Load older messages on scroll up

**File**: `components/ChatBubble.jsx`

**Message Bubble Styling:**
- User's messages: Blue/right-aligned
- Other's messages: Gray/left-aligned
- System messages: Centered/italic
- Game invites: Special card-style display

[Back to TOC](#table-of-contents)

---

### Step 8.8: Add chat notification system 🤖

**File**: `hooks/useChatNotifications.js`

**Features:**
- Poll for new messages when chat is closed
- Show notification badge on chat icon
- Show total unread count
- Desktop notification support (optional)

**Polling Strategy:**
- When chat panel is open: Poll every 3 seconds for new messages
- When chat panel is closed: Poll every 30 seconds for unread count
- Use `lastCheckedAt` timestamp to minimize data transfer

**File**: `components/ChatNotificationBadge.jsx`

**Display:**
- Red badge with unread count
- Shown in header/menu area
- Animate on new message arrival

[Back to TOC](#table-of-contents)

---

### Step 8.9: Integrate chat with game flow 🤖

**Integration Points:**

1. **In-game chat button**: Quick access to chat with current opponent
2. **Game invite via chat**: Send game invitation as chat message
3. **Game result notification**: Automatic message when game ends
4. **"Rematch?" button**: Sends game invite via chat

**File**: `components/MultiplayerGame.jsx` (updates)

Add chat integration:
- Small chat icon in game header
- Opens chat with current opponent
- Unread indicator during game

**Chat Message Types:**
```javascript
// Regular text message
{ type: 'text', content: 'Good luck!' }

// Game invitation
{ type: 'game_invite', content: 'Want to play?', metadata: { inviteId: 'inv-123' } }

// Game result
{ type: 'game_result', content: 'Game finished!', metadata: {
  gameId: 'game-456',
  winner: 'user-789',
  score: '121-98'
}}

// System message
{ type: 'system', content: 'CribbagePro is now online' }
```

[Back to TOC](#table-of-contents)

---

### Step 8.10: Handle uniqueness and migration 🤖

**Handle Registry:**

**File**: `data/handles/registry.json`
```javascript
{
  "handles": {
    "cribbagemaster": "user-123",  // lowercase handle -> userId
    "cardshark99": "user-456"
  },
  "updatedAt": "2026-01-10T15:00:00Z"
}
```

**Migration for Existing Users:**
- Existing users without handles show email prefix on leaderboard
- Prompt to set handle on first visit after feature launch
- Handle is optional but encouraged

**Uniqueness Check Flow:**
1. User types handle
2. Frontend validates format (length, characters)
3. Frontend calls `/api/profile/handle/check?handle=foo`
4. Backend checks registry.json for collision
5. Return `{ available: true/false }`

[Back to TOC](#table-of-contents)

---

### Step 8.11: Test chat system 👤

**Test Scenarios:**
1. Set handle and verify uniqueness
2. Start conversation from leaderboard
3. Send and receive messages (both users online)
4. Send message while recipient offline (async)
5. Verify unread count updates
6. Chat during active game
7. Send game invite via chat
8. Verify game result appears in chat

[Back to TOC](#table-of-contents)

---

## Future Enhancements

The following are not part of this initial plan but could be added later:

1. **WebSocket Support**: Replace polling with real-time WebSocket connections for instant chat
2. **Random Matchmaking**: "Play vs Random" to match with any online player
3. **Spectator Mode**: Watch ongoing games
4. **Tournament Mode**: Bracket-style tournaments
5. **ELO Ranking**: Skill-based matchmaking
6. **Push Notifications**: Notify when it's your turn or new message (mobile)
7. **Friends List**: Add friends for quick access
8. **Block/Mute Users**: Prevent unwanted chat
9. **Chat Emoji/Reactions**: Quick reactions to messages
10. **Voice Chat**: Optional voice communication during games

[Back to TOC](#table-of-contents)

---

*Plan created: 2026-01-09*
*Last updated: 2026-01-12*
