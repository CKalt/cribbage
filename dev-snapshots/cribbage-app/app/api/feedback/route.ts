import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const FEEDBACK_DIR = process.env.NODE_ENV === 'production' 
  ? '/var/www/cribbage/feedback'
  : path.join(process.cwd(), 'feedback');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, issue, details } = body;

    if (!user || !issue) {
      return NextResponse.json(
        { error: 'User and issue are required' },
        { status: 400 }
      );
    }

    // Ensure feedback directory exists
    await fs.mkdir(FEEDBACK_DIR, { recursive: true });

    // Create feedback file
    const feedback = {
      id: Date.now(),
      user,
      issue,
      details,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    };

    const filename = `feedback-${feedback.id}.json`;
    await fs.writeFile(
      path.join(FEEDBACK_DIR, filename),
      JSON.stringify(feedback, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! Claude will review it shortly.',
      feedbackId: feedback.id
    });

  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}