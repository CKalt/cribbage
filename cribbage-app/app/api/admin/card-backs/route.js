import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = 'chris@chrisk.com';
const CONFIG_FILE = path.join(process.cwd(), 'data', 'disabled-card-backs.json');

function getDisabledIds() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading disabled card backs:', e);
  }
  return [];
}

function saveDisabledIds(ids) {
  const dataDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(ids, null, 2));
}

// GET — return list of disabled card back IDs (public, no auth needed)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminEmail = searchParams.get('email');

  const disabledIds = getDisabledIds();

  // If admin is requesting, return the full list
  if (adminEmail === ADMIN_EMAIL) {
    return NextResponse.json({ success: true, disabledIds });
  }

  // Public access: just return the disabled IDs (for filtering at game start)
  return NextResponse.json({ disabledIds });
}

// POST — toggle a card back's disabled status (admin only)
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, cardBackId, disabled } = body;

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const disabledIds = getDisabledIds();

    if (disabled && !disabledIds.includes(cardBackId)) {
      disabledIds.push(cardBackId);
    } else if (!disabled) {
      const idx = disabledIds.indexOf(cardBackId);
      if (idx !== -1) disabledIds.splice(idx, 1);
    }

    saveDisabledIds(disabledIds);

    return NextResponse.json({ success: true, disabledIds });
  } catch (error) {
    console.error('Error updating card back config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
