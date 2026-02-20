import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read all user data files
    const dataDir = path.join(process.cwd(), 'data');
    const stats = [];
    const expertStats = [];

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
            const nWins = gameStats[1] || 0;
            const nLosses = gameStats[2] || 0;
            const nForfeits = gameStats[3] || 0;
            const eWins = gameStats[5] || 0;
            const eLosses = gameStats[6] || 0;
            const eForfeits = gameStats[7] || 0;

            const normalGames = nWins + nLosses + nForfeits;
            const expertGames = eWins + eLosses + eForfeits;
            const primaryMode = expertGames > normalGames ? 'expert' : 'normal';

            stats.push({
              email: userEmail,
              wins: nWins,
              losses: nLosses,
              forfeits: nForfeits,
              gamesPlayed: normalGames,
              primaryMode,
              lastPlayed: gameStats[4] || null
            });
            // Expert stats — only include if they've played expert
            if (expertGames > 0) {
              expertStats.push({
                email: userEmail,
                wins: eWins,
                losses: eLosses,
                forfeits: eForfeits,
                gamesPlayed: expertGames,
                primaryMode,
                lastPlayed: gameStats[8] || null
              });
            }
          } else {
            // User has data file but no games played
            stats.push({
              email: userEmail,
              wins: 0,
              losses: 0,
              forfeits: 0,
              gamesPlayed: 0,
              primaryMode: 'normal',
              lastPlayed: null
            });
          }
        } catch (e) {
          console.error('Error reading user data file:', file, e);
        }
      }
    }

    // Sort by wins descending, then by win rate
    const sortByWins = (a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aTotal = a.wins + a.losses;
      const bTotal = b.wins + b.losses;
      if (aTotal > 0 && bTotal > 0) {
        return (b.wins / bTotal) - (a.wins / aTotal);
      }
      return 0;
    };
    stats.sort(sortByWins);
    expertStats.sort(sortByWins);

    return NextResponse.json({
      success: true,
      stats,
      expertStats,
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
