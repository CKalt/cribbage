# User vs User Multiplayer Games - Implementation Plan

**Created**: 2026-01-09
**Author**: Claude Code
**Status**: Draft - Pending Approval
**Version**: v0.1.0-b82

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Architecture Decision](#architecture-decision)
- [Phase 1: Data Schema Extension](#phase-1-data-schema-extension)
  - [ ] [Step 1.1: Create multiplayer game schema](#step-11-create-multiplayer-game-schema-🤖)
  - [ ] [Step 1.2: Create game invitation schema](#step-12-create-game-invitation-schema-🤖)
  - [ ] [Step 1.3: Update user data structure](#step-13-update-user-data-structure-🤖)
- [Phase 2: Core API Endpoints](#phase-2-core-api-endpoints)
  - [ ] [Step 2.1: Create game creation endpoint](#step-21-create-game-creation-endpoint-🤖)
  - [ ] [Step 2.2: Create game state endpoint](#step-22-create-game-state-endpoint-🤖)
  - [ ] [Step 2.3: Create move submission endpoint](#step-23-create-move-submission-endpoint-🤖)
  - [ ] [Step 2.4: Create game listing endpoint](#step-24-create-game-listing-endpoint-🤖)
- [Phase 3: Invitation System](#phase-3-invitation-system)
  - [ ] [Step 3.1: Create player search endpoint](#step-31-create-player-search-endpoint-🤖)
  - [ ] [Step 3.2: Create invitation endpoints](#step-32-create-invitation-endpoints-🤖)
  - [ ] [Step 3.3: Create invitation UI component](#step-33-create-invitation-ui-component-🤖)
- [Phase 4: Game Lobby](#phase-4-game-lobby)
  - [ ] [Step 4.1: Create GameLobby component](#step-41-create-gamelobby-component-🤖)
  - [ ] [Step 4.2: Add lobby to main menu](#step-42-add-lobby-to-main-menu-🤖)
  - [ ] [Step 4.3: Implement active games list](#step-43-implement-active-games-list-🤖)
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

**To invite another player:**
1. Player opens "Play vs Friend" from the main menu
2. Player enters the email address of the person they want to play
3. System verifies the email belongs to a registered user
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

### Step 3.1: Create player search endpoint 🤖

**File**: `app/api/multiplayer/players/search/route.js`

```javascript
// GET /api/multiplayer/players/search?email=foo@bar.com
```

**Functionality:**
- Search for users by email (partial match)
- Return list of matching players (email only, no sensitive data)
- Exclude self from results

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

## Future Enhancements

The following are not part of this initial plan but could be added later:

1. **WebSocket Support**: Replace polling with real-time WebSocket connections
2. **Random Matchmaking**: "Play vs Random" to match with any online player
3. **Game Chat**: In-game messaging between players
4. **Spectator Mode**: Watch ongoing games
5. **Tournament Mode**: Bracket-style tournaments
6. **ELO Ranking**: Skill-based matchmaking
7. **Push Notifications**: Notify when it's your turn (mobile)

[Back to TOC](#table-of-contents)

---

*Plan created: 2026-01-09*
*Last updated: 2026-01-09*
