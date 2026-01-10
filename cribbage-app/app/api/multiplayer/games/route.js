import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { isGameActive, getPlayerKey, GAME_STATUS } from '@/lib/multiplayer-schema';

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
 * GET /api/multiplayer/games
 * List all games for the current user
 *
 * Query params:
 *   status - Filter by status: 'active', 'completed', 'all' (default: 'active')
 */
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'active';

    const gamesDir = path.join(process.cwd(), 'data', 'games');
    const games = [];

    if (fs.existsSync(gamesDir)) {
      const files = fs.readdirSync(gamesDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const filepath = path.join(gamesDir, file);
          const game = JSON.parse(fs.readFileSync(filepath, 'utf8'));

          // Check if user is a participant
          const playerKey = getPlayerKey(game, userInfo.userId);
          if (!playerKey) continue;

          // Apply status filter
          if (statusFilter === 'active' && !isGameActive(game)) continue;
          if (statusFilter === 'completed' && game.status !== GAME_STATUS.COMPLETED) continue;

          // Get opponent info
          const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
          const opponent = game[opponentKey];

          games.push({
            id: game.id,
            status: game.status,
            opponent: opponent ? {
              email: opponent.email,
              username: opponent.email.split('@')[0]
            } : null,
            isMyTurn: game.currentTurn === playerKey,
            myScore: game.scores[playerKey],
            opponentScore: opponent ? game.scores[opponentKey] : 0,
            lastMove: game.lastMove,
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
            winner: game.winner === playerKey ? 'me' : game.winner ? 'opponent' : null
          });
        } catch (e) {
          console.error('Error reading game file:', file, e);
        }
      }
    }

    // Sort: my turn first, then by last updated
    games.sort((a, b) => {
      if (a.isMyTurn !== b.isMyTurn) {
        return a.isMyTurn ? -1 : 1;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return NextResponse.json({
      success: true,
      games,
      totalGames: games.length
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
