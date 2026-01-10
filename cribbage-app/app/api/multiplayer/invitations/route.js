import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import {
  generateInviteId,
  createInvitation,
  isInvitationExpired,
  INVITE_STATUS,
  isGameActive
} from '@/lib/multiplayer-schema';

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
 * Check if two users already have an active game
 */
function hasActiveGameBetween(userId1, userId2) {
  const gamesDir = path.join(process.cwd(), 'data', 'games');

  if (!fs.existsSync(gamesDir)) return false;

  const files = fs.readdirSync(gamesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const filepath = path.join(gamesDir, file);
      const game = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      if (isGameActive(game)) {
        const players = [game.player1?.id, game.player2?.id];
        if (players.includes(userId1) && players.includes(userId2)) {
          return true;
        }
      }
    } catch (e) {
      console.error('Error reading game file:', file, e);
    }
  }

  return false;
}

/**
 * Check if there's already a pending invitation between two users
 */
function hasPendingInviteBetween(email1, email2) {
  const invitesDir = path.join(process.cwd(), 'data', 'invitations');

  if (!fs.existsSync(invitesDir)) return false;

  const files = fs.readdirSync(invitesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const filepath = path.join(invitesDir, file);
      const invite = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      if (invite.status === INVITE_STATUS.PENDING && !isInvitationExpired(invite)) {
        const emails = [invite.from.email.toLowerCase(), invite.toEmail.toLowerCase()];
        if (emails.includes(email1.toLowerCase()) && emails.includes(email2.toLowerCase())) {
          return true;
        }
      }
    } catch (e) {
      console.error('Error reading invite file:', file, e);
    }
  }

  return false;
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
      const userId = file.replace('-dml-ast.json', '');
      const filepath = path.join(dataDir, file);
      const userData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      if (userData.email?.toLowerCase() === email.toLowerCase()) {
        return userId;
      }
    } catch (e) {
      console.error('Error reading user data file:', file, e);
    }
  }

  return null;
}

/**
 * POST /api/multiplayer/invitations
 * Send a game invitation
 *
 * Body: { toEmail: string }
 */
export async function POST(request) {
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

    const body = await request.json();
    const { toEmail } = body;

    if (!toEmail) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Can't invite yourself
    if (toEmail.toLowerCase() === userInfo.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "You can't invite yourself" },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipientId = findUserIdByEmail(toEmail);
    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: 'User not found. They must have an account first.' },
        { status: 404 }
      );
    }

    // Check if there's already an active game between them
    if (hasActiveGameBetween(userInfo.userId, recipientId)) {
      return NextResponse.json(
        { success: false, error: 'You already have an active game with this player' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite
    if (hasPendingInviteBetween(userInfo.email, toEmail)) {
      return NextResponse.json(
        { success: false, error: 'There is already a pending invitation between you and this player' },
        { status: 400 }
      );
    }

    // Create invitation
    const inviteId = generateInviteId();
    const invitation = createInvitation(inviteId, { id: userInfo.userId, email: userInfo.email }, toEmail);

    // Save invitation
    const invitesDir = path.join(process.cwd(), 'data', 'invitations');
    if (!fs.existsSync(invitesDir)) {
      fs.mkdirSync(invitesDir, { recursive: true });
    }

    const filepath = path.join(invitesDir, `${inviteId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(invitation, null, 2));

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        toEmail: invitation.toEmail,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/multiplayer/invitations
 * Get all invitations for the current user (sent and received)
 */
export async function GET(request) {
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

    const invitesDir = path.join(process.cwd(), 'data', 'invitations');
    const received = [];
    const sent = [];

    if (fs.existsSync(invitesDir)) {
      const files = fs.readdirSync(invitesDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const filepath = path.join(invitesDir, file);
          const invite = JSON.parse(fs.readFileSync(filepath, 'utf8'));

          // Skip expired invites (but could also clean them up)
          if (isInvitationExpired(invite) && invite.status === INVITE_STATUS.PENDING) {
            continue;
          }

          // Only show pending invites
          if (invite.status !== INVITE_STATUS.PENDING) {
            continue;
          }

          const inviteInfo = {
            id: invite.id,
            createdAt: invite.createdAt,
            expiresAt: invite.expiresAt
          };

          if (invite.toEmail.toLowerCase() === userInfo.email.toLowerCase()) {
            // Received invitation
            received.push({
              ...inviteInfo,
              from: invite.from.email
            });
          } else if (invite.from.email.toLowerCase() === userInfo.email.toLowerCase()) {
            // Sent invitation
            sent.push({
              ...inviteInfo,
              to: invite.toEmail
            });
          }
        } catch (e) {
          console.error('Error reading invite file:', file, e);
        }
      }
    }

    // Sort by creation date descending
    received.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({
      success: true,
      received,
      sent,
      totalReceived: received.length,
      totalSent: sent.length
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
