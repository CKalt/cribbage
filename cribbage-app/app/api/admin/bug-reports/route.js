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

    const reportsDir = path.join(process.cwd(), 'bug-reports');
    const reports = [];

    // Read from main directory
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const filepath = path.join(reportsDir, file);
          const report = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          reports.push({
            refNum: report.refNum || 0,
            id: report.id,
            email: report.userEmail,
            timestamp: report.timestamp,
            type: report.type,
            description: report.description?.substring(0, 100) + (report.description?.length > 100 ? '...' : ''),
            fullDescription: report.description,
            replyCount: report.replies?.length || 0,
            replies: report.replies || [],
            archived: false
          });
        } catch (e) {
          console.error('Error reading report:', file, e);
        }
      }
    }

    // Read from archive directory
    const archiveDir = path.join(reportsDir, 'archive');
    if (fs.existsSync(archiveDir)) {
      const files = fs.readdirSync(archiveDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const filepath = path.join(archiveDir, file);
          const report = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          reports.push({
            refNum: report.refNum || 0,
            id: report.id,
            email: report.userEmail,
            timestamp: report.timestamp,
            type: report.type,
            description: report.description?.substring(0, 100) + (report.description?.length > 100 ? '...' : ''),
            fullDescription: report.description,
            replyCount: report.replies?.length || 0,
            replies: report.replies || [],
            archived: true
          });
        } catch (e) {
          console.error('Error reading archived report:', file, e);
        }
      }
    }

    // Sort by timestamp descending (newest first)
    reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      success: true,
      reports,
      totalReports: reports.length
    });
  } catch (error) {
    console.error('Error fetching admin bug reports:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
