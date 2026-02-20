import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import {
  createEmptyUserData,
  createGameSessionRow,
  GAME_SESSIONS_COLS
} from '@/lib/game-schema';

/**
 * Decode JWT token to extract user ID (sub claim)
 * Note: This is a simple decode, not a full verification.
 * The token is already verified by Cognito on the client side.
 */
function getUserIdFromToken(token) {
  if (!token) return null;

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    return payload.sub || null;
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

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create empty data file if doesn't exist
  if (!fs.existsSync(filepath)) {
    const emptyData = createEmptyUserData();
    fs.writeFileSync(filepath, JSON.stringify(emptyData, null, 2));
    return emptyData;
  }

  // Read existing data
  const content = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(content);
}

/**
 * Write user's dml-ast data file
 */
function writeUserData(userId, data) {
  const filepath = getUserDataPath(userId);
  const dataDir = path.dirname(filepath);

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

/**
 * GET /api/game-state
 * Returns the current saved game state for the authenticated user
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userData = readUserData(userId);
    const gameSessionsData = userData.game_sessions?.data || [];

    // Find user's game session (should be at most one)
    const userSession = gameSessionsData.find(
      row => row[GAME_SESSIONS_COLS.USER_ID] === userId
    );

    const userStatsData = getStatsForUser(userData, userId);

    if (!userSession) {
      return NextResponse.json({
        success: true,
        gameState: null,
        ...userStatsData
      });
    }

    // Parse the stored game state JSON
    const gameStateJson = userSession[GAME_SESSIONS_COLS.GAME_STATE_JSON];
    const gameState = gameStateJson ? JSON.parse(gameStateJson) : null;

    return NextResponse.json({
      success: true,
      gameState,
      updatedAt: userSession[GAME_SESSIONS_COLS.UPDATED_AT],
      version: userSession[GAME_SESSIONS_COLS.VERSION],
      ...userStatsData
    });
  } catch (error) {
    console.error('Error reading game state:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper to get stats for a user from their data
 */
function getStatsForUser(userData, userId) {
  const statsData = userData.game_stats?.data || [];
  const userStats = statsData.find(row => row[0] === userId);

  if (!userStats) {
    return {
      stats: { wins: 0, losses: 0, forfeits: 0, lastPlayed: null },
      expertStats: { wins: 0, losses: 0, forfeits: 0, lastPlayed: null }
    };
  }

  return {
    stats: {
      wins: userStats[1] || 0,
      losses: userStats[2] || 0,
      forfeits: userStats[3] || 0,
      lastPlayed: userStats[4] || null
    },
    expertStats: {
      wins: userStats[5] || 0,
      losses: userStats[6] || 0,
      forfeits: userStats[7] || 0,
      lastPlayed: userStats[8] || null
    }
  };
}

/**
 * POST /api/game-state
 * Save or delete game state for the authenticated user
 *
 * Body: { gameState: {...}, version: "0.1.0-b24" }
 * Or: { action: "delete" } to remove saved game
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameState, version, action } = body;

    const userData = readUserData(userId);
    const gameSessionsData = userData.game_sessions?.data || [];

    // Find existing session index
    const existingIndex = gameSessionsData.findIndex(
      row => row[GAME_SESSIONS_COLS.USER_ID] === userId
    );

    if (action === 'delete') {
      // Remove the game session
      if (existingIndex !== -1) {
        gameSessionsData.splice(existingIndex, 1);
        userData.game_sessions.data = gameSessionsData;
        writeUserData(userId, userData);
      }

      return NextResponse.json({
        success: true,
        message: 'Game state deleted'
      });
    }

    // Save/update game state
    if (!gameState) {
      return NextResponse.json(
        { success: false, error: 'gameState is required' },
        { status: 400 }
      );
    }

    const gameStateJson = JSON.stringify(gameState);
    const newRow = createGameSessionRow(userId, gameStateJson, version || null);

    if (existingIndex !== -1) {
      // Update existing row
      gameSessionsData[existingIndex] = newRow;
    } else {
      // Add new row
      gameSessionsData.push(newRow);
    }

    userData.game_sessions.data = gameSessionsData;
    writeUserData(userId, userData);

    return NextResponse.json({
      success: true,
      message: 'Game state saved'
    });
  } catch (error) {
    console.error('Error saving game state:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
