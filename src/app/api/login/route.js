import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../database-wrapper.js';
import { findUserAuthByEmail } from '../../../services/user-auth.service.js';
import { generateToken } from '../../../utils/jwt.js';
import dotenv from 'dotenv';

dotenv.config();

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await ensureDatabaseConnection();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await findUserAuthByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

