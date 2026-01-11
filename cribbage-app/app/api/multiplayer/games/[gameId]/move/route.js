import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { getPlayerKey, GAME_STATUS } from '@/lib/multiplayer-schema';
import { processDiscard, processCut, processPlay, processCount, startNewRound, GAME_PHASE } from '@/lib/multiplayer-game';

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
 * POST /api/multiplayer/games/[gameId]/move
 * Submit a move in a multiplayer game
 *
 * Body: {
 *   moveType: 'discard' | 'play' | 'go' | 'count' | 'accept_count' | 'cut',
 *   data: { ... move-specific data ... }
 * }
 */
export async function POST(request, { params }) {
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
    const body = await request.json();
    const { moveType, data } = body;

    if (!moveType) {
      return NextResponse.json(
        { success: false, error: 'moveType is required' },
        { status: 400 }
      );
    }

    const gamesDir = path.join(process.cwd(), 'data', 'games');
    const gameFilepath = path.join(gamesDir, `${gameId}.json`);

    if (!fs.existsSync(gameFilepath)) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = JSON.parse(fs.readFileSync(gameFilepath, 'utf8'));

    // Verify user is a participant
    const playerKey = getPlayerKey(game, userInfo.userId);
    if (!playerKey) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this game' },
        { status: 403 }
      );
    }

    // Verify game is active
    if (game.status !== GAME_STATUS.ACTIVE) {
      return NextResponse.json(
        { success: false, error: `Game is not active (status: ${game.status})` },
        { status: 400 }
      );
    }

    // Special handling for discard phase - both players can discard
    const gamePhase = game.gameState?.phase;
    if (gamePhase === GAME_PHASE.DISCARDING && moveType === 'discard') {
      // Allow discard if player hasn't discarded yet
      const discardsKey = `${playerKey}Discards`;
      if (game.gameState[discardsKey]?.length > 0) {
        return NextResponse.json(
          { success: false, error: 'You have already discarded' },
          { status: 400 }
        );
      }
    } else {
      // For other phases, verify it's this player's turn
      if (game.currentTurn !== playerKey) {
        return NextResponse.json(
          { success: false, error: "It's not your turn" },
          { status: 400 }
        );
      }
    }

    // Process the move based on type
    const moveResult = processMove(game, playerKey, moveType, data, userInfo);

    if (!moveResult.success) {
      return NextResponse.json(
        { success: false, error: moveResult.error },
        { status: 400 }
      );
    }

    // Update game state
    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';

    game.gameState = moveResult.newGameState;
    game.currentTurn = moveResult.nextTurn || opponentKey;
    game.turnStartedAt = new Date().toISOString();
    game.updatedAt = new Date().toISOString();

    // Update last move for opponent visibility
    game.lastMove = {
      by: playerKey,
      type: moveType,
      description: moveResult.description,
      timestamp: new Date().toISOString()
    };

    // Add to move history
    game.moveHistory.push({
      ...game.lastMove,
      data: data
    });

    // Update scores if applicable
    if (moveResult.scoreChange) {
      // Use scorePlayer if specified (e.g., His Heels goes to dealer, not cutter)
      const scoringPlayer = moveResult.scorePlayer || playerKey;
      game.scores[scoringPlayer] += moveResult.scoreChange;
    }

    // Check for game over
    if (moveResult.gameOver || game.scores[playerKey] >= 121 || game.scores[opponentKey] >= 121) {
      game.status = GAME_STATUS.COMPLETED;
      game.winner = game.scores[playerKey] >= 121 ? playerKey :
                   game.scores[opponentKey] >= 121 ? opponentKey :
                   moveResult.winner;
    }

    // Update player activity
    game[playerKey].lastSeen = new Date().toISOString();
    game[playerKey].connected = true;

    // Save updated game
    fs.writeFileSync(gameFilepath, JSON.stringify(game, null, 2));

    return NextResponse.json({
      success: true,
      move: {
        type: moveType,
        description: moveResult.description
      },
      game: {
        id: game.id,
        status: game.status,
        currentTurn: game.currentTurn,
        isMyTurn: game.currentTurn === playerKey,
        myScore: game.scores[playerKey],
        opponentScore: game.scores[opponentKey],
        gameState: game.gameState,
        lastMove: game.lastMove,
        winner: game.winner
      }
    });
  } catch (error) {
    console.error('Error processing move:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process a move and return the new game state
 * Uses the game logic functions from lib/multiplayer-game.js
 */
function processMove(game, playerKey, moveType, data) {
  const state = game.gameState || {};
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const playerEmail = game[playerKey].email;
  const username = playerEmail.split('@')[0];

  switch (moveType) {
    case 'sync_state':
      // Special move type to synchronize full game state from client
      // Used when client has authoritative state (initial game setup, etc.)
      return {
        success: true,
        newGameState: data.gameState,
        nextTurn: data.nextTurn || opponentKey,
        description: data.description || 'Game state synchronized'
      };

    case 'discard': {
      // Player discarding cards to crib
      if (!data.cards || !Array.isArray(data.cards)) {
        return { success: false, error: 'Cards array required for discard' };
      }

      const result = processDiscard(state, playerKey, data.cards);
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        newGameState: result.newState,
        nextTurn: result.nextTurn,
        description: `${username} ${result.description}`
      };
    }

    case 'cut': {
      // Player cutting the deck
      const cutIndex = data.cutIndex ?? null;
      const result = processCut(state, playerKey, cutIndex);

      if (!result.success) {
        return result;
      }

      return {
        success: true,
        newGameState: result.newState,
        nextTurn: result.nextTurn,
        scoreChange: result.scoreChange,
        scorePlayer: result.scorePlayer,
        description: `${username} ${result.description}`
      };
    }

    case 'play': {
      // Player playing a card in pegging
      if (!data.card) {
        return { success: false, error: 'Card required for play' };
      }

      const result = processPlay(state, playerKey, data.card);
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        newGameState: result.newState,
        nextTurn: result.nextTurn,
        scoreChange: result.scoreChange,
        scorePlayer: result.scorePlayer,
        description: `${username} ${result.description}`
      };
    }

    case 'go': {
      // Player says "Go" - pass null card to processPlay
      const result = processPlay(state, playerKey, null);
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        newGameState: result.newState,
        nextTurn: result.nextTurn,
        scoreChange: result.scoreChange,
        scorePlayer: result.scorePlayer,
        description: `${username} ${result.description}`
      };
    }

    case 'count': {
      // Player counting their hand (or crib)
      const result = processCount(state, playerKey);
      if (!result.success) {
        return result;
      }

      let finalState = result.newState;

      // If counting is complete (phase changed to DEALING), start new round
      if (finalState.phase === GAME_PHASE.DEALING) {
        // Calculate current scores (will be added by caller after this returns)
        const currentP1Score = game.scores.player1 + (result.scorePlayer === 'player1' ? result.scoreChange : 0);
        const currentP2Score = game.scores.player2 + (result.scorePlayer === 'player2' ? result.scoreChange : 0);

        finalState = startNewRound(finalState, currentP1Score, currentP2Score);
      }

      return {
        success: true,
        newGameState: finalState,
        nextTurn: result.nextTurn,
        scoreChange: result.scoreChange,
        scorePlayer: result.scorePlayer,
        scoreBreakdown: result.scoreBreakdown,
        countedHand: result.countedHand,
        countPhase: result.countPhase,
        description: `${username} ${result.description}`
      };
    }

    case 'accept_count':
      // Player accepting opponent's count (for muggins support later)
      return {
        success: true,
        newGameState: state,
        nextTurn: opponentKey,
        description: `${username} accepted the count`
      };

    default:
      return { success: false, error: `Unknown move type: ${moveType}` };
  }
}
