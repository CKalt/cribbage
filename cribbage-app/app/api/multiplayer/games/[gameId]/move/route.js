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

    // Verify it's this player's turn
    if (game.currentTurn !== playerKey) {
      return NextResponse.json(
        { success: false, error: "It's not your turn" },
        { status: 400 }
      );
    }

    // Process the move based on type
    const moveResult = processMove(game, playerKey, moveType, data);

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
      game.scores[playerKey] += moveResult.scoreChange;
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
 * This is a simplified version - real implementation will use existing game logic
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

    case 'discard':
      // Player discarding cards to crib
      if (!data.cards || !Array.isArray(data.cards)) {
        return { success: false, error: 'Cards array required for discard' };
      }
      return {
        success: true,
        newGameState: {
          ...state,
          phase: 'play',
          [`${playerKey}Discarded`]: true,
          crib: [...(state.crib || []), ...data.cards]
        },
        nextTurn: state[`${opponentKey}Discarded`] ? playerKey : opponentKey,
        description: `${username} discarded ${data.cards.length} cards to crib`
      };

    case 'play':
      // Player playing a card in pegging
      if (!data.card) {
        return { success: false, error: 'Card required for play' };
      }
      const playedCards = [...(state.playedCards || []), data.card];
      const count = playedCards.reduce((sum, c) => sum + Math.min(c.value, 10), 0);
      let scoreChange = data.points || 0;

      return {
        success: true,
        newGameState: {
          ...state,
          playedCards,
          count,
          lastPlayedBy: playerKey
        },
        nextTurn: opponentKey,
        scoreChange,
        description: `${username} played ${data.card.rank}${data.card.suit}${scoreChange > 0 ? ` for ${scoreChange}` : ''}`
      };

    case 'go':
      // Player says "Go"
      return {
        success: true,
        newGameState: {
          ...state,
          [`${playerKey}Said`]: 'go'
        },
        nextTurn: opponentKey,
        description: `${username} said "Go"`
      };

    case 'count':
      // Player counting their hand
      const scoreForCount = data.points || 0;
      return {
        success: true,
        newGameState: {
          ...state,
          [`${playerKey}Counted`]: true,
          [`${playerKey}CountedPoints`]: scoreForCount
        },
        nextTurn: state[`${opponentKey}Counted`] ? playerKey : opponentKey,
        scoreChange: scoreForCount,
        description: `${username} counted ${scoreForCount} points`
      };

    case 'accept_count':
      // Player accepting opponent's count (for muggins support later)
      return {
        success: true,
        newGameState: state,
        nextTurn: opponentKey,
        description: `${username} accepted the count`
      };

    case 'cut':
      // Player cutting the deck
      if (!data.card) {
        return { success: false, error: 'Card required for cut' };
      }
      let cutScore = 0;
      if (data.card.rank === 'J') {
        cutScore = 2; // His heels
      }
      return {
        success: true,
        newGameState: {
          ...state,
          cutCard: data.card,
          phase: 'play'
        },
        nextTurn: opponentKey,
        scoreChange: cutScore,
        description: `${username} cut ${data.card.rank}${data.card.suit}${cutScore > 0 ? ' - His Heels for 2!' : ''}`
      };

    default:
      return { success: false, error: `Unknown move type: ${moveType}` };
  }
}
