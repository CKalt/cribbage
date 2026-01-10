import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { getPlayerKey, GAME_STATUS } from '@/lib/multiplayer-schema';

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
 * GET /api/multiplayer/games/[gameId]
 * Get a specific game's state
 */
export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userInfo = getUserInfoFromToken(token);

    if (!userInfo?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { gameId } = await params;
    const gamesDir = path.join(process.cwd(), 'data', 'games');
    const gameFilepath = path.join(gamesDir, `${gameId}.json`);

    if (!fs.existsSync(gameFilepath)) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = JSON.parse(fs.readFileSync(gameFilepath, 'utf8'));

    // Check if user is a participant
    const playerKey = getPlayerKey(game, userInfo.userId);
    if (!playerKey) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this game' },
        { status: 403 }
      );
    }

    // Update last seen
    game[playerKey].lastSeen = new Date().toISOString();
    game[playerKey].connected = true;
    fs.writeFileSync(gameFilepath, JSON.stringify(game, null, 2));

    // Get opponent info
    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    const opponent = game[opponentKey];

    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        status: game.status,
        myPlayerKey: playerKey,
        opponent: opponent ? {
          email: opponent.email,
          username: opponent.email.split('@')[0],
          lastSeen: opponent.lastSeen,
          connected: opponent.connected
        } : null,
        isMyTurn: game.currentTurn === playerKey,
        currentTurn: game.currentTurn,
        myScore: game.scores[playerKey],
        opponentScore: opponent ? game.scores[opponentKey] : 0,
        lastMove: game.lastMove,
        gameState: game.gameState,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        winner: game.winner
      }
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/multiplayer/games/[gameId]
 * Abandon/forfeit a game
 */
export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userInfo = getUserInfoFromToken(token);

    if (!userInfo?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { gameId } = await params;
    const gamesDir = path.join(process.cwd(), 'data', 'games');
    const gameFilepath = path.join(gamesDir, `${gameId}.json`);

    if (!fs.existsSync(gameFilepath)) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = JSON.parse(fs.readFileSync(gameFilepath, 'utf8'));

    // Check if user is a participant
    const playerKey = getPlayerKey(game, userInfo.userId);
    if (!playerKey) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this game' },
        { status: 403 }
      );
    }

    // Can only abandon active games
    if (game.status !== GAME_STATUS.ACTIVE && game.status !== GAME_STATUS.WAITING) {
      return NextResponse.json(
        { success: false, error: 'Game is already completed' },
        { status: 400 }
      );
    }

    // Mark game as abandoned, opponent wins
    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    game.status = GAME_STATUS.ABANDONED;
    game.winner = game[opponentKey] ? opponentKey : null;
    game.updatedAt = new Date().toISOString();
    game.lastMove = {
      by: playerKey,
      type: 'forfeit',
      description: `${game[playerKey].email.split('@')[0]} forfeited the game`,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(gameFilepath, JSON.stringify(game, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Game forfeited'
    });
  } catch (error) {
    console.error('Error abandoning game:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
