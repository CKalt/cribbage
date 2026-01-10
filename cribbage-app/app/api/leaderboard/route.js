import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
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

          // Email is stored in the user data file
          const userEmail = userData.email || userId;

          if (gameStats) {
            stats.push({
              email: userEmail,
              wins: gameStats[1] || 0,
              losses: gameStats[2] || 0,
              forfeits: gameStats[3] || 0,
              lastPlayed: gameStats[4] || null
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

    // Sort by wins descending, then by win rate
    stats.sort((a, b) => {
      // First by wins
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Then by win rate (if they have games)
      const aTotal = a.wins + a.losses;
      const bTotal = b.wins + b.losses;
      if (aTotal > 0 && bTotal > 0) {
        return (b.wins / bTotal) - (a.wins / aTotal);
      }
      return 0;
    });

    return NextResponse.json({
      success: true,
      stats,
      totalUsers: stats.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
