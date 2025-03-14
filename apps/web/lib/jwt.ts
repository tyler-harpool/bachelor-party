import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';

// Types
export interface UserPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface TokenPayload extends UserPayload {
  exp?: number; // Expiration time
  iat?: number; // Issued at time
}

// Secret key management
// In production, this should be managed securely through environment variables
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'bachelor_party_app_secret_key_change_this_in_production';
  return new TextEncoder().encode(secret);
};

// Convert duration string to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([hd])$/);
  if (!match) return 24 * 60 * 60; // Default: 24 hours in seconds
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  if (unit === 'h') return value * 60 * 60; // hours to seconds
  if (unit === 'd') return value * 24 * 60 * 60; // days to seconds
  
  return 24 * 60 * 60; // Default: 24 hours in seconds
}

// Generate an authentication token
export async function generateToken(user: UserPayload, expiresIn = '24h'): Promise<string> {
  try {
    console.log('Generating token for user:', user.email);
    const secretKey = getSecretKey();
    
    // Parse expiration time
    const expirationTime = parseDuration(expiresIn);
    
    // Create and sign the JWT
    const token = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expirationTime}s`)
      .sign(secretKey);
    
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Verify a token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    console.log('Verifying token');
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    
    console.log('Token verified successfully');
    return {
      id: payload.id as number,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    // Log more specific error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    return null;
  }
}

// Generate a random token (for refresh tokens, CSRF tokens, etc.)
export function generateRandomToken(length = 32): string {
  return randomBytes(length).toString('hex');
}