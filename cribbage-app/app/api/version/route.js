import { NextResponse } from 'next/server';
import { APP_VERSION, RELEASE_NOTE } from '@/lib/version';

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    releaseNote: RELEASE_NOTE
  });
}
