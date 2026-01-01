import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'bug-reports');

    // Check if directory exists
    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json({
        success: true,
        reports: [],
        unreadCount: 0
      });
    }

    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
    const userReports = [];
    let unreadCount = 0;

    for (const file of files) {
      const filepath = path.join(reportsDir, file);
      const report = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      // Filter by user email
      if (report.userEmail !== email) continue;

      // Check if has unread replies
      const hasUnreadReplies = !report.seenByUser && report.replies && report.replies.length > 0;
      if (hasUnreadReplies) unreadCount++;

      userReports.push({
        id: report.id,
        filename: file,
        timestamp: report.timestamp,
        type: report.type,
        description: report.description?.substring(0, 150) + (report.description?.length > 150 ? '...' : ''),
        fullDescription: report.description,
        replies: report.replies || [],
        seenByUser: report.seenByUser,
        hasUnreadReplies
      });
    }

    // Sort by timestamp descending (newest first)
    userReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      success: true,
      reports: userReports,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
