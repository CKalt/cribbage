import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

const ADMIN_EMAIL = 'chris@chrisk.com';
const USER_POOL_ID = 'us-east-2_7plg1ZB4F';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Simple admin check
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all users from Cognito
    const client = new CognitoIdentityProviderClient({ region: 'us-east-2' });
    const command = new ListUsersCommand({ UserPoolId: USER_POOL_ID });
    const cognitoResponse = await client.send(command);

    // Build user ID to email map
    const userMap = {};
    for (const user of cognitoResponse.Users || []) {
      const sub = user.Attributes?.find(a => a.Name === 'sub')?.Value;
      const userEmail = user.Attributes?.find(a => a.Name === 'email')?.Value;
      if (sub && userEmail) {
        userMap[sub] = userEmail;
      }
    }

    // Read all user data files
    const dataDir = path.join(process.cwd(), 'data');
    const stats = [];

    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-dml-ast.json'));

      for (const file of files) {
        try {
          const userId = file.replace('-dml-ast.json', '');
          const filepath = path.join(dataDir, file);
          const userData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          const gameStats = userData.game_stats?.data?.[0];

          if (gameStats) {
            stats.push({
              email: userMap[userId] || userId,
              wins: gameStats[1] || 0,
              losses: gameStats[2] || 0,
              forfeits: gameStats[3] || 0,
              lastPlayed: gameStats[4] || null
            });
          } else {
            // User has data file but no games played
            stats.push({
              email: userMap[userId] || userId,
              wins: 0,
              losses: 0,
              forfeits: 0,
              lastPlayed: null
            });
          }
        } catch (e) {
          console.error('Error reading user data file:', file, e);
        }
      }
    }

    // Sort by last played (most recent first), nulls last
    stats.sort((a, b) => {
      if (!a.lastPlayed && !b.lastPlayed) return 0;
      if (!a.lastPlayed) return 1;
      if (!b.lastPlayed) return -1;
      return new Date(b.lastPlayed) - new Date(a.lastPlayed);
    });

    return NextResponse.json({
      success: true,
      stats,
      totalUsers: stats.length
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
