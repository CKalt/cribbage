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

    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json(
        { success: false, error: 'No bug reports found' },
        { status: 404 }
      );
    }

    // Find the report file by ID
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
    let foundFile = null;

    for (const file of files) {
      const filepath = path.join(reportsDir, file);
      const report = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      if (report.id === id) {
        foundFile = { filepath, report };
        break;
      }
    }

    if (!foundFile) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Mark as seen
    foundFile.report.seenByUser = true;
    fs.writeFileSync(foundFile.filepath, JSON.stringify(foundFile.report, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Report marked as seen'
    });
  } catch (error) {
    console.error('Error marking report as seen:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
