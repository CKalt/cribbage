import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { description, debugLog, gameLog, gameState } = body;

    // Create bug-reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'bug-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bug-report-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    // Compile the report
    const report = {
      timestamp: new Date().toISOString(),
      description: description || 'No description provided',
      gameState: gameState || {},
      debugLog: debugLog || [],
      gameLog: gameLog || [],
    };

    // Write the report
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Bug report saved',
      filename
    });
  } catch (error) {
    console.error('Error saving bug report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
