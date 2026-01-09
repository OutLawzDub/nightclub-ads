import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../app/api/database-wrapper.js';
import { findUserAuthByEmail } from '../services/user-auth.service.js';
import { verifyToken } from './jwt.js';
import dotenv from 'dotenv';

dotenv.config();

export const verifyAuth = async (request) => {
  try {
    await ensureDatabaseConnection();
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'No authorization token provided',
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    const tokenResult = verifyToken(token);
    
    if (!tokenResult.valid) {
      return {
        authenticated: false,
        error: tokenResult.error || 'Invalid token',
      };
    }

    const { id, email } = tokenResult.decoded;
    
    const user = await findUserAuthByEmail(email);
    
    if (!user) {
      return {
        authenticated: false,
        error: 'User not found',
      };
    }

    if (user.id !== id) {
      return {
        authenticated: false,
        error: 'Token user mismatch',
      };
    }

    return {
      authenticated: true,
      user: { id: user.id, email: user.email },
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      authenticated: false,
      error: 'Internal server error',
    };
  }
};

export const requireAuth = async (request) => {
  const authResult = await verifyAuth(request);
  
  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error || 'Authentication required' },
      { status: 401 }
    );
  }
  
  return null;
};
