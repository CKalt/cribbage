import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID required' },
        { status: 400 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'bug-reports');
    const archiveDir = path.join(reportsDir, 'archive');

    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json(
        { success: false, error: 'No bug reports found' },
        { status: 404 }
      );
    }

    // Create archive directory if it doesn't exist
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Find the report file by ID
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
    let foundFile = null;

    for (const file of files) {
      const filepath = path.join(reportsDir, file);
      const report = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      if (report.id === id) {
        foundFile = { filepath, filename: file, report };
        break;
      }
    }

    if (!foundFile) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Move the JSON file to archive
    const archivePath = path.join(archiveDir, foundFile.filename);
    fs.renameSync(foundFile.filepath, archivePath);

    // Move associated screenshot if it exists
    if (foundFile.report.screenshot) {
      const screenshotPath = path.join(reportsDir, foundFile.report.screenshot);
      if (fs.existsSync(screenshotPath)) {
        const archiveScreenshotPath = path.join(archiveDir, foundFile.report.screenshot);
        fs.renameSync(screenshotPath, archiveScreenshotPath);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report archived successfully'
    });
  } catch (error) {
    console.error('Error archiving report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
