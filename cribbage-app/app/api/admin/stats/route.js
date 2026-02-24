import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = 'chris@chrisk.com';

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

          // Email is stored in the user data file (set when recording game stats)
          const userEmail = userData.email || userId;

          if (gameStats) {
            // Use the most recent lastPlayed across normal (index 4) and expert (index 8)
            const normalLastPlayed = gameStats[4] || null;
            const expertLastPlayed = gameStats[8] || null;
            let lastPlayed = normalLastPlayed;
            if (expertLastPlayed && (!normalLastPlayed || new Date(expertLastPlayed) > new Date(normalLastPlayed))) {
              lastPlayed = expertLastPlayed;
            }

            stats.push({
              email: userEmail,
              wins: gameStats[1] || 0,
              losses: gameStats[2] || 0,
              forfeits: gameStats[3] || 0,
              expertWins: gameStats[5] || 0,
              expertLosses: gameStats[6] || 0,
              lastPlayed
            });
          } else {
            // User has data file but no games played
            stats.push({
              email: userEmail,
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
