import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Generate a short unique ID for bug reports
function generateBugReportId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BR-${dateStr}-${randomPart}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { description, debugLog, gameLog, gameState, userEmail, type } = body;

    // Create bug-reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'bug-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate unique ID and filename
    const reportId = generateBugReportId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bug-report-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    // Compile the report
    const report = {
      id: reportId,
      timestamp: new Date().toISOString(),
      userEmail: userEmail || 'unknown',
      type: type || 'MANUAL',
      description: description || 'No description provided',
      gameState: gameState || {},
      debugLog: debugLog || [],
      gameLog: gameLog || [],
      replies: [],
      seenByUser: true,  // User just submitted it, so they've "seen" it
    };

    // Write the report
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Bug report saved',
      id: reportId,
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
