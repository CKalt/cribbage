import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { isGameActive } from '@/lib/multiplayer-schema';

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
 * Get all active games for a user
 */
function getUserActiveGames(userId) {
  const gamesDir = path.join(process.cwd(), 'data', 'games');
  const activeGames = [];

  if (!fs.existsSync(gamesDir)) return activeGames;

  const files = fs.readdirSync(gamesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const filepath = path.join(gamesDir, file);
      const game = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      if (isGameActive(game)) {
        if (game.player1?.id === userId || game.player2?.id === userId) {
          activeGames.push(game);
        }
      }
    } catch (e) {
      console.error('Error reading game file:', file, e);
    }
  }

  return activeGames;
}

/**
 * GET /api/multiplayer/players
 * List all players, optionally filtered by search term
 *
 * Query params:
 *   search - Optional search string to filter by email/username
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
    const search = searchParams.get('search')?.toLowerCase();

    // Get current user's active games to check who they're already playing
    const myActiveGames = getUserActiveGames(userInfo.userId);
    const opponentsInActiveGames = new Set();

    for (const game of myActiveGames) {
      if (game.player1?.id === userInfo.userId && game.player2?.id) {
        opponentsInActiveGames.add(game.player2.id);
      } else if (game.player2?.id === userInfo.userId && game.player1?.id) {
        opponentsInActiveGames.add(game.player1.id);
      }
    }

    // Read all user data files
    const dataDir = path.join(process.cwd(), 'data');
    const players = [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-dml-ast.json'));

      for (const file of files) {
        try {
          const odersId = file.replace('-dml-ast.json', '');

          // Skip self
          if (odersId === userInfo.userId) continue;

          const filepath = path.join(dataDir, file);
          const userData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

          const email = userData.email || odersId;
          const username = email.split('@')[0];
          const lastSeen = userData.lastSeen || null;
          const isOnline = lastSeen ? new Date(lastSeen) > fiveMinutesAgo : false;

          // Apply search filter
          if (search) {
            if (!email.toLowerCase().includes(search) &&
                !username.toLowerCase().includes(search)) {
              continue;
            }
          }

          players.push({
            id: odersId,
            email: email,
            username: username,
            isOnline: isOnline,
            hasActiveGame: opponentsInActiveGames.has(odersId),
            lastSeen: lastSeen
          });
        } catch (e) {
          console.error('Error reading user data file:', file, e);
        }
      }
    }

    // Sort: online first, then alphabetically by username
    players.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return a.username.localeCompare(b.username);
    });

    return NextResponse.json({
      success: true,
      players,
      totalPlayers: players.length
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
