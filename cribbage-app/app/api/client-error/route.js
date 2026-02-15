import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    // Log to stdout so PM2 captures it
    console.error('[CLIENT-ERROR]', JSON.stringify({
      timestamp: body.timestamp || new Date().toISOString(),
      error: body.name + ': ' + body.message,
      stack: body.stack,
      url: body.url,
      userAgent: body.userAgent,
      isGlobal: body.isGlobal || false,
    }));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
