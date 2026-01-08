import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../database-wrapper.js';
import { updatePasswordByToken } from '../../../services/user-auth.service.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await ensureDatabaseConnection();
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    await updatePasswordByToken(token, password);

    return NextResponse.json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Invalid or expired token' },
      { status: 400 }
    );
  }
}

