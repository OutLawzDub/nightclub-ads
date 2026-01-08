import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../database-wrapper.js';
import { findUserAuthByEmail, setResetPasswordToken } from '../../../services/user-auth.service.js';
import { sendResetPasswordEmail } from '../../../config/email.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await ensureDatabaseConnection();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await findUserAuthByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link' },
        { status: 200 }
      );
    }

    const resetToken = await setResetPasswordToken(email);
    await sendResetPasswordEmail(email, resetToken);

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

