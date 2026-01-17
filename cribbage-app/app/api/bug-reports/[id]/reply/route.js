import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const baseDir = path.join(process.cwd(), 'bug-reports');

    // Find the bug report by id (check main directory and archive)
    let foundFile = null;
    let foundPath = null;

    // Check main directory
    if (fs.existsSync(baseDir)) {
      const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const filepath = path.join(baseDir, file);
        try {
          const report = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          if (report.id === id) {
            foundFile = file;
            foundPath = filepath;
            break;
          }
        } catch (e) {
          // Skip invalid files
        }
      }
    }

    // Check archive directory if not found
    if (!foundPath) {
      const archiveDir = path.join(baseDir, 'archive');
      if (fs.existsSync(archiveDir)) {
        const files = fs.readdirSync(archiveDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
          const filepath = path.join(archiveDir, file);
          try {
            const report = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            if (report.id === id) {
              foundFile = file;
              foundPath = filepath;
              break;
            }
          } catch (e) {
            // Skip invalid files
          }
        }
      }
    }

    if (!foundPath) {
      return NextResponse.json(
        { success: false, error: 'Bug report not found' },
        { status: 404 }
      );
    }

    // Read, update, and write the report
    const report = JSON.parse(fs.readFileSync(foundPath, 'utf8'));

    if (!report.replies) {
      report.replies = [];
    }

    report.replies.push({
      timestamp: new Date().toISOString(),
      from: 'admin',
      message: message
    });

    // Mark as unread for user
    report.seenByUser = false;

    fs.writeFileSync(foundPath, JSON.stringify(report, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Reply added successfully',
      replyCount: report.replies.length
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
