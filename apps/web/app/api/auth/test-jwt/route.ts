import { NextRequest } from 'next/server';
import { createResponse, createErrorResponse } from '@repo/ui/lib/api';
import { generateToken, verifyToken } from '../../../../lib/jwt';

// Simple endpoint to test JWT token generation and verification
export async function GET(request: NextRequest) {
  try {
    console.log('Testing JWT token functionality...');
    
    // Test user data
    const testUser = {
      id: 999,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    };
    
    // Test 1: Generate a token
    console.log('Test 1: Generating token');
    const token = await generateToken(testUser);
    console.log('Token generated:', token.substring(0, 20) + '...');
    
    // Test 2: Verify the token
    console.log('Test 2: Verifying token');
    const verified = await verifyToken(token);
    console.log('Verification result:', verified ? 'Success' : 'Failed');
    
    // Return test results
    return createResponse({
      tokenGeneration: "success",
      tokenVerification: verified ? "success" : "failed",
      token: token.substring(0, 20) + '...', // Only show part for security
      env: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        jwtSecret: process.env.JWT_SECRET ? 'Set (masked for security)' : 'Using default',
      },
      verifiedData: verified ? {
        id: verified.id,
        email: verified.email,
        exp: verified.exp ? new Date(verified.exp * 1000).toISOString() : null
      } : null
    });
  } catch (error) {
    console.error('Error testing JWT:', error);
    return createErrorResponse(error as Error);
  }
}