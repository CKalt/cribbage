import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import {
  createEmptyUserData,
  createGameStatsRow,
  GAME_STATS_COLS
} from '@/lib/game-schema';

/**
 * Decode JWT token to extract user ID (sub) and email
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
 * Get the file path for a user's dml-ast data file
 */
function getUserDataPath(userId) {
  return path.join(process.cwd(), 'data', `${userId}-dml-ast.json`);
}

/**
 * Read user's dml-ast data file, creating if doesn't exist
 */
function readUserData(userId) {
  const filepath = getUserDataPath(userId);
  const dataDir = path.dirname(filepath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filepath)) {
    const emptyData = createEmptyUserData();
    fs.writeFileSync(filepath, JSON.stringify(emptyData, null, 2));
    return emptyData;
  }

  const content = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(content);
}

/**
 * Write user's dml-ast data file
 */
function writeUserData(userId, data) {
  const filepath = getUserDataPath(userId);
  const dataDir = path.dirname(filepath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

/**
 * GET /api/game-stats
 * Returns the game statistics for the authenticated user
 */
export async function GET() {
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

    const { userId } = userInfo;

    const userData = readUserData(userId);
    const statsData = userData.game_stats?.data || [];

    // Find user's stats
    const userStats = statsData.find(
      row => row[GAME_STATS_COLS.USER_ID] === userId
    );

    if (!userStats) {
      return NextResponse.json({
        success: true,
        stats: { wins: 0, losses: 0, forfeits: 0, lastPlayed: null },
        expertStats: { wins: 0, losses: 0, forfeits: 0, lastPlayed: null }
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        wins: userStats[GAME_STATS_COLS.WINS] || 0,
        losses: userStats[GAME_STATS_COLS.LOSSES] || 0,
        forfeits: userStats[GAME_STATS_COLS.FORFEITS] || 0,
        lastPlayed: userStats[GAME_STATS_COLS.LAST_PLAYED] || null
      },
      expertStats: {
        wins: userStats[GAME_STATS_COLS.EXPERT_WINS] || 0,
        losses: userStats[GAME_STATS_COLS.EXPERT_LOSSES] || 0,
        forfeits: userStats[GAME_STATS_COLS.EXPERT_FORFEITS] || 0,
        lastPlayed: userStats[GAME_STATS_COLS.EXPERT_LAST_PLAYED] || null
      }
    });
  } catch (error) {
    console.error('Error reading game stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game-stats
 * Record a game result for the authenticated user
 *
 * Body: { result: "win" | "loss" | "forfeit" }
 */
export async function POST(request) {
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

    const { userId, email } = userInfo;

    const body = await request.json();
    const { result, difficulty } = body;

    if (!result || !['win', 'loss', 'forfeit'].includes(result)) {
      return NextResponse.json(
        { success: false, error: 'Invalid result. Must be "win", "loss", or "forfeit"' },
        { status: 400 }
      );
    }

    const isExpert = difficulty === 'expert';

    const userData = readUserData(userId);
    const statsData = userData.game_stats?.data || [];

    // Find existing stats index
    const existingIndex = statsData.findIndex(
      row => row[GAME_STATS_COLS.USER_ID] === userId
    );

    let userStats;
    if (existingIndex !== -1) {
      userStats = [...statsData[existingIndex]];
      // Backfill expert columns for old rows that don't have them
      while (userStats.length < 9) {
        userStats.push(userStats.length === 8 ? null : 0);
      }
    } else {
      userStats = createGameStatsRow(userId);
    }

    // Increment the appropriate counter based on difficulty
    if (isExpert) {
      switch (result) {
        case 'win':
          userStats[GAME_STATS_COLS.EXPERT_WINS] = (userStats[GAME_STATS_COLS.EXPERT_WINS] || 0) + 1;
          break;
        case 'loss':
          userStats[GAME_STATS_COLS.EXPERT_LOSSES] = (userStats[GAME_STATS_COLS.EXPERT_LOSSES] || 0) + 1;
          break;
        case 'forfeit':
          userStats[GAME_STATS_COLS.EXPERT_FORFEITS] = (userStats[GAME_STATS_COLS.EXPERT_FORFEITS] || 0) + 1;
          break;
      }
      userStats[GAME_STATS_COLS.EXPERT_LAST_PLAYED] = new Date().toISOString();
    } else {
      switch (result) {
        case 'win':
          userStats[GAME_STATS_COLS.WINS] = (userStats[GAME_STATS_COLS.WINS] || 0) + 1;
          break;
        case 'loss':
          userStats[GAME_STATS_COLS.LOSSES] = (userStats[GAME_STATS_COLS.LOSSES] || 0) + 1;
          break;
        case 'forfeit':
          userStats[GAME_STATS_COLS.FORFEITS] = (userStats[GAME_STATS_COLS.FORFEITS] || 0) + 1;
          break;
      }
      userStats[GAME_STATS_COLS.LAST_PLAYED] = new Date().toISOString();
    }

    // Save back to data
    if (existingIndex !== -1) {
      statsData[existingIndex] = userStats;
    } else {
      statsData.push(userStats);
    }

    userData.game_stats.data = statsData;

    // Store email in user data for admin panel access
    if (email) {
      userData.email = email;
    }

    writeUserData(userId, userData);

    return NextResponse.json({
      success: true,
      message: `Recorded ${result}${isExpert ? ' (expert)' : ''}`,
      stats: {
        wins: userStats[GAME_STATS_COLS.WINS] || 0,
        losses: userStats[GAME_STATS_COLS.LOSSES] || 0,
        forfeits: userStats[GAME_STATS_COLS.FORFEITS] || 0,
        lastPlayed: userStats[GAME_STATS_COLS.LAST_PLAYED] || null
      },
      expertStats: {
        wins: userStats[GAME_STATS_COLS.EXPERT_WINS] || 0,
        losses: userStats[GAME_STATS_COLS.EXPERT_LOSSES] || 0,
        forfeits: userStats[GAME_STATS_COLS.EXPERT_FORFEITS] || 0,
        lastPlayed: userStats[GAME_STATS_COLS.EXPERT_LAST_PLAYED] || null
      }
    });
  } catch (error) {
    console.error('Error saving game stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
