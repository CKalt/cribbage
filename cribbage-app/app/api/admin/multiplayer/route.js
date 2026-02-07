import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = 'chris@chrisk.com';

function getUserInfoFromToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );
    return { userId: payload.sub || null, email: payload.email || null };
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/multiplayer
 * List all active games and pending invitations
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userInfo = getUserInfoFromToken(token);

    if (!userInfo?.email || userInfo.email.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const gamesDir = path.join(process.cwd(), 'data', 'games');
    const invitesDir = path.join(process.cwd(), 'data', 'invitations');

    // Load games
    const games = [];
    if (fs.existsSync(gamesDir)) {
      const files = fs.readdirSync(gamesDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const game = JSON.parse(fs.readFileSync(path.join(gamesDir, file), 'utf8'));
          games.push({
            id: game.id,
            filename: file,
            status: game.status,
            player1: game.player1?.email || 'unknown',
            player2: game.player2?.email || 'waiting',
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
          });
        } catch (e) {
          // skip bad files
        }
      }
    }

    // Load invitations
    const invitations = [];
    if (fs.existsSync(invitesDir)) {
      const files = fs.readdirSync(invitesDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const invite = JSON.parse(fs.readFileSync(path.join(invitesDir, file), 'utf8'));
          invitations.push({
            id: invite.id,
            filename: file,
            status: invite.status,
            from: invite.from?.email || 'unknown',
            to: invite.toEmail || 'unknown',
            createdAt: invite.createdAt,
            gameId: invite.gameId || null,
          });
        } catch (e) {
          // skip bad files
        }
      }
    }

    return NextResponse.json({ success: true, games, invitations });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/multiplayer
 * Admin cleanup actions
 *
 * Body: { action: 'delete-game' | 'delete-invitation' | 'nuke-all', id?: string }
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userInfo = getUserInfoFromToken(token);

    if (!userInfo?.email || userInfo.email.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, id } = body;

    const gamesDir = path.join(process.cwd(), 'data', 'games');
    const invitesDir = path.join(process.cwd(), 'data', 'invitations');

    if (action === 'delete-game') {
      const filepath = path.join(gamesDir, `${id}.json`);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return NextResponse.json({ success: true, message: `Game ${id} deleted` });
      }
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    if (action === 'delete-invitation') {
      const filepath = path.join(invitesDir, `${id}.json`);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return NextResponse.json({ success: true, message: `Invitation ${id} deleted` });
      }
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 });
    }

    if (action === 'nuke-all') {
      let deleted = 0;
      if (fs.existsSync(gamesDir)) {
        for (const f of fs.readdirSync(gamesDir).filter(f => f.endsWith('.json'))) {
          fs.unlinkSync(path.join(gamesDir, f));
          deleted++;
        }
      }
      if (fs.existsSync(invitesDir)) {
        for (const f of fs.readdirSync(invitesDir).filter(f => f.endsWith('.json'))) {
          fs.unlinkSync(path.join(invitesDir, f));
          deleted++;
        }
      }
      return NextResponse.json({ success: true, message: `Deleted ${deleted} files` });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
