import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { cognitoClient, userPoolId } from '@/lib/cognito';
import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Decode JWT token to extract user ID and email
 */
function getUserInfoFromToken(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    return {
      userId: payload.sub || null,
      email: payload.email || null
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Validate handle format
 */
function validateHandle(handle) {
  if (!handle || typeof handle !== 'string') {
    return 'Handle is required';
  }

  const trimmed = handle.trim();

  if (trimmed.length < 3) {
    return 'Handle must be at least 3 characters';
  }

  if (trimmed.length > 20) {
    return 'Handle must be 20 characters or less';
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return 'Handle can only contain letters, numbers, and underscores';
  }

  if (trimmed.startsWith('_') || trimmed.endsWith('_')) {
    return 'Handle cannot start or end with an underscore';
  }

  return null;
}

/**
 * Check if handle is unique across all users
 */
function isHandleUnique(handle, excludeUserId) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) return true;

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-dml-ast.json'));
  const lowerHandle = handle.toLowerCase();

  for (const file of files) {
    const userId = file.replace('-dml-ast.json', '');
    if (userId === excludeUserId) continue;

    try {
      const filepath = path.join(dataDir, file);
      const userData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      if (userData.handle && userData.handle.toLowerCase() === lowerHandle) {
        return false;
      }
    } catch (e) {
      // skip unreadable files
    }
  }

  return true;
}

/**
 * GET /api/profile
 * Get current user's profile (email + handle)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userInfo = getUserInfoFromToken(token);

    if (!userInfo?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dataDir = path.join(process.cwd(), 'data');
    const filepath = path.join(dataDir, `${userInfo.userId}-dml-ast.json`);

    let handle = null;
    if (fs.existsSync(filepath)) {
      const userData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      handle = userData.handle || null;
    }

    return NextResponse.json({
      success: true,
      email: userInfo.email,
      handle
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update user's handle
 *
 * Body: { handle: 'MyHandle' }
 */
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userInfo = getUserInfoFromToken(token);

    if (!userInfo?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { handle } = body;

    // Validate format
    const validationError = validateHandle(handle);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const trimmedHandle = handle.trim();

    // Check uniqueness
    if (!isHandleUnique(trimmedHandle, userInfo.userId)) {
      return NextResponse.json(
        { success: false, error: 'Handle already taken' },
        { status: 409 }
      );
    }

    // Update Cognito preferred_username
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: userInfo.email,
        UserAttributes: [
          {
            Name: 'preferred_username',
            Value: trimmedHandle
          }
        ]
      });
      await cognitoClient.send(command);
    } catch (cognitoError) {
      console.error('Cognito update failed:', cognitoError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Save to local data file
    const dataDir = path.join(process.cwd(), 'data');
    const filepath = path.join(dataDir, `${userInfo.userId}-dml-ast.json`);

    let userData = {};
    if (fs.existsSync(filepath)) {
      userData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }

    userData.handle = trimmedHandle;
    fs.writeFileSync(filepath, JSON.stringify(userData, null, 2));

    return NextResponse.json({
      success: true,
      handle: trimmedHandle
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
