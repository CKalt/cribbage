import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import {
  generateGameId,
  createMultiplayerGame,
  isInvitationExpired,
  INVITE_STATUS,
  GAME_STATUS
} from '@/lib/multiplayer-schema';
import { initializeGameState } from '@/lib/multiplayer-game';

/**
 * Decode JWT token to extract user ID and email
 */
function getUserInfoFromToken(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    return {
      userId: payload.sub || null,
      email: payload.email || null
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Find user ID by email
 */
function findUserIdByEmail(email) {
  const dataDir = path.join(process.cwd(), 'data');

  if (!fs.existsSync(dataDir)) return null;

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-dml-ast.json'));
  for (const file of files) {
    try {
      const odersId = file.replace('-dml-ast.json', '');
      const filepath = path.join(dataDir, file);
      const userData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      if (userData.email?.toLowerCase() === email.toLowerCase()) {
        return odersId;
      }
    } catch (e) {
      console.error('Error reading user data file:', file, e);
    }
  }

  return null;
}

/**
 * POST /api/multiplayer/invitations/[id]
 * Accept or decline an invitation
 *
 * Body: { action: 'accept' | 'decline' }
 */
export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userInfo = getUserInfoFromToken(token);

    if (!userInfo?.userId || !userInfo?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, testDeck } = body;  // testDeck is optional for testing

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "accept" or "decline"' },
        { status: 400 }
      );
    }

    // Find and load invitation
    const invitesDir = path.join(process.cwd(), 'data', 'invitations');
    const inviteFilepath = path.join(invitesDir, `${id}.json`);

    if (!fs.existsSync(inviteFilepath)) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const invitation = JSON.parse(fs.readFileSync(inviteFilepath, 'utf8'));

    // Verify this invitation is for the current user
    if (invitation.toEmail.toLowerCase() !== userInfo.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (invitation.status !== INVITE_STATUS.PENDING) {
      return NextResponse.json(
        { success: false, error: `Invitation already ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check if expired
    if (isInvitationExpired(invitation)) {
      invitation.status = INVITE_STATUS.EXPIRED;
      fs.writeFileSync(inviteFilepath, JSON.stringify(invitation, null, 2));
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    if (action === 'decline') {
      // Decline invitation
      invitation.status = INVITE_STATUS.DECLINED;
      invitation.declinedAt = new Date().toISOString();
      fs.writeFileSync(inviteFilepath, JSON.stringify(invitation, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Invitation declined'
      });
    }

    // Accept invitation - create game
    const gameId = generateGameId();
    const game = createMultiplayerGame(gameId, invitation.from.id, invitation.from.email);

    // Add player 2 (the person accepting)
    game.player2 = {
      id: userInfo.userId,
      email: userInfo.email,
      connected: true,
      lastSeen: new Date().toISOString()
    };

    // Game is now active
    game.status = GAME_STATUS.ACTIVE;

    // Randomly pick dealer for first hand (or use player1 for deterministic testing)
    const dealer = testDeck ? 'player1' : (Math.random() < 0.5 ? 'player1' : 'player2');

    // Initialize game state with dealt cards (use testDeck if provided for testing)
    game.gameState = initializeGameState(dealer, testDeck || null);

    // Both players need to discard - start with player1
    game.currentTurn = 'player1';
    game.turnStartedAt = new Date().toISOString();

    // Set last move to indicate game started
    game.lastMove = {
      by: null,
      type: 'game_start',
      description: `Game started! ${dealer === 'player1' ? invitation.from.email.split('@')[0] : userInfo.email.split('@')[0]} is dealer. Discard 2 cards to the crib.`,
      timestamp: new Date().toISOString()
    };

    // Save game
    const gamesDir = path.join(process.cwd(), 'data', 'games');
    if (!fs.existsSync(gamesDir)) {
      fs.mkdirSync(gamesDir, { recursive: true });
    }

    const gameFilepath = path.join(gamesDir, `${gameId}.json`);
    fs.writeFileSync(gameFilepath, JSON.stringify(game, null, 2));

    // Update invitation
    invitation.status = INVITE_STATUS.ACCEPTED;
    invitation.acceptedAt = new Date().toISOString();
    invitation.gameId = gameId;
    fs.writeFileSync(inviteFilepath, JSON.stringify(invitation, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted',
      gameId: gameId,
      game: {
        id: game.id,
        player1: { email: game.player1.email },
        player2: { email: game.player2.email },
        currentTurn: game.currentTurn,
        isMyTurn: game.currentTurn === 'player2'  // Accepter is always player2
      }
    });
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
