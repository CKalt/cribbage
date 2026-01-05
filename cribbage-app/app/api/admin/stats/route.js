import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = 'chris@chrisk.com';

// Static user ID to email mapping (from Cognito user pool)
// TODO: Consider storing email in user data files or setting up IAM role for Cognito access
const USER_EMAIL_MAP = {
  '31db1510-a011-7093-0732-7ab5770a3c98': 'jeffgreenwheel@gmail.com',
  '31eba580-9081-70ad-baeb-05d2acc7ce4f': 'cswilson@rogers.com',
  '814bd530-e011-704d-0532-5daec65d7ea3': 'steinermbsk@aol.com',
  'a12ba5d0-0031-70cc-394c-104c2c92c0a6': 'penguinracing@gmail.com',
  'b1ebc530-e011-704a-081c-2c2e6c048621': 'chris@chrisk.com',
  'd15b45f0-50f1-7064-23ce-342dbe3b06ce': 'ckwasser@gmail.com',
  'f11bc520-a081-704f-db20-36c62066b19e': 'shawnbourne@sympatico.ca',
};

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
              email: USER_EMAIL_MAP[userId] || userId,
              wins: gameStats[1] || 0,
              losses: gameStats[2] || 0,
              forfeits: gameStats[3] || 0,
              lastPlayed: gameStats[4] || null
            });
          } else {
            // User has data file but no games played
            stats.push({
              email: USER_EMAIL_MAP[userId] || userId,
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
