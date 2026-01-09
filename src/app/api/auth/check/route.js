import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../../database-wrapper.js';
import { findUserAuthByEmail } from '../../../../services/user-auth.service.js';
import { verifyToken } from '../../../../utils/jwt.js';
import dotenv from 'dotenv';

dotenv.config();

export const dynamic = 'force-dynamic';

export async function GET(request) {
  console.log('🔍 [API /auth/check] GET request received');
  
  try {
    console.log('🔍 [API /auth/check] Ensuring database connection...');
    await ensureDatabaseConnection();
    console.log('✅ [API /auth/check] Database connected');
    
    const authHeader = request.headers.get('authorization');
    console.log('🔍 [API /auth/check] Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'null');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [API /auth/check] No authorization header or invalid format');
      return NextResponse.json(
        { authenticated: false, error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 [API /auth/check] Token extracted:', token.substring(0, 30) + '...');
    
    console.log('🔍 [API /auth/check] Verifying token...');
    const tokenResult = verifyToken(token);
    console.log('🔍 [API /auth/check] Token verification result:', {
      valid: tokenResult.valid,
      error: tokenResult.error,
      decoded: tokenResult.valid ? { id: tokenResult.decoded.id, email: tokenResult.decoded.email } : null,
    });
    
    if (!tokenResult.valid) {
      console.error('❌ [API /auth/check] Token verification failed:', tokenResult.error);
      return NextResponse.json(
        { authenticated: false, error: tokenResult.error || 'Invalid token' },
        { status: 401 }
      );
    }

    const { id, email } = tokenResult.decoded;
    console.log('🔍 [API /auth/check] Token decoded - id:', id, 'email:', email);
    
    console.log('🔍 [API /auth/check] Finding user by email:', email);
    const user = await findUserAuthByEmail(email);
    console.log('🔍 [API /auth/check] User found:', user ? { id: user.id, email: user.email } : 'null');
    
    if (!user) {
      console.log('❌ [API /auth/check] User not found');
      return NextResponse.json(
        { authenticated: false, error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.id !== id) {
      console.log('❌ [API /auth/check] Token user mismatch - token id:', id, 'user id:', user.id);
      return NextResponse.json(
        { authenticated: false, error: 'Token user mismatch' },
        { status: 401 }
      );
    }

    console.log('✅ [API /auth/check] Authentication successful for user:', { id: user.id, email: user.email });
    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('❌ [API /auth/check] Error:', error);
    console.error('❌ [API /auth/check] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
