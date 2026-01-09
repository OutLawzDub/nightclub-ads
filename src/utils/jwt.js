import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not found in environment variables. Using default secret. This is insecure in production!');
}

export const generateToken = (payload) => {
  console.log('🔍 [JWT] generateToken - Generating token for:', payload);
  console.log('🔍 [JWT] generateToken - JWT_SECRET:', JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...` : 'null');
  console.log('🔍 [JWT] generateToken - JWT_EXPIRES_IN:', JWT_EXPIRES_IN);
  
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  
  console.log('✅ [JWT] generateToken - Token generated:', token.substring(0, 30) + '...');
  return token;
};

export const verifyToken = (token) => {
  console.log('🔍 [JWT] verifyToken - Starting verification');
  console.log('🔍 [JWT] verifyToken - Token:', token.substring(0, 30) + '...');
  console.log('🔍 [JWT] verifyToken - JWT_SECRET:', JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...` : 'null');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ [JWT] verifyToken - Token valid, decoded:', { id: decoded.id, email: decoded.email, iat: decoded.iat, exp: decoded.exp });
    return {
      valid: true,
      decoded,
    };
  } catch (error) {
    console.error('❌ [JWT] verifyToken - Error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      console.log('❌ [JWT] verifyToken - Token expired');
      return {
        valid: false,
        error: 'Token expired',
      };
    } else if (error.name === 'JsonWebTokenError') {
      console.log('❌ [JWT] verifyToken - Invalid token (JsonWebTokenError)');
      return {
        valid: false,
        error: 'Invalid token',
      };
    } else {
      console.log('❌ [JWT] verifyToken - Unknown error:', error.name);
      return {
        valid: false,
        error: 'Token verification failed',
      };
    }
  }
};
