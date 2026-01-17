import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Only available in development/test mode
const isTestMode = process.env.NODE_ENV !== 'production' ||
                   process.env.ALLOW_TEST_ENDPOINTS === 'true';

const DATA_DIR = path.join(process.cwd(), 'data');
const TEST_STATE_FILE = path.join(DATA_DIR, '.test-state.json');

/**
 * POST /api/test/set-deck
 * Set the deck seed for deterministic testing
 */
export async function POST(request) {
  if (!isTestMode) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    const { seed, scenario } = await request.json();

    if (typeof seed !== 'number' || isNaN(seed)) {
      return NextResponse.json(
        { error: 'seed must be a valid number' },
        { status: 400 }
      );
    }

    const testState = {
      deckSeed: seed,
      scenario: scenario || 'custom',
      setAt: new Date().toISOString(),
      usedForGames: []
    };

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(testState, null, 2));

    console.log(`[TEST] Deck seed set to ${seed} (scenario: ${testState.scenario})`);

    return NextResponse.json({
      success: true,
      message: `Deck seed set to ${seed}`,
      testState
    });
  } catch (error) {
    console.error('[TEST] Error setting deck seed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/set-deck
 * Get current test state
 */
export async function GET(request) {
  if (!isTestMode) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    if (fs.existsSync(TEST_STATE_FILE)) {
      const testState = JSON.parse(fs.readFileSync(TEST_STATE_FILE, 'utf8'));
      return NextResponse.json({ success: true, testState });
    }

    return NextResponse.json({ success: true, testState: null });
  } catch (error) {
    console.error('[TEST] Error reading test state:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/test/set-deck
 * Clear test state (return to random mode)
 */
export async function DELETE(request) {
  if (!isTestMode) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
      console.log('[TEST] Test state cleared - returning to random mode');
    }
    return NextResponse.json({ success: true, message: 'Test state cleared' });
  } catch (error) {
    console.error('[TEST] Error clearing test state:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
