import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { ApiError, HttpStatus, createErrorResponse } from '@repo/ui/lib/api';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<Response>
): Promise<Response> {
  try {
    // Try to authenticate the request using various methods
    const user = await authenticateRequest(request);
    
    if (!user) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Authentication required'
      );
    }
    
    console.log('Auth middleware - User authenticated:', user);
    
    // If authenticated, proceed with the handler
    return await handler(request, user);
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Create an error response using NextResponse instead of the helper
    const errorInfo = error instanceof ApiError ? error : new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred",
      error
    );
    
    const responseData = {
      success: false,
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
        details: errorInfo.details
      }
    };
    
    return NextResponse.json(responseData, {
      status: errorInfo.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Middleware to check if the user is authenticated via cookie or header
export async function authenticateRequest(request: NextRequest): Promise<any> {
  let token: string | undefined;
  
  // First try to get token from cookies (preferred for web)
  console.log('Checking for auth_token cookie...');
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie) {
    console.log('Found auth_token cookie');
    token = tokenCookie.value;
  } else {
    console.log('No auth_token cookie found');
  }
  
  // If no token in cookies, try Authorization header (for API clients)
  if (!token) {
    console.log('Checking Authorization header...');
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('Found Authorization header');
      token = authHeader.split(' ')[1];
    } else {
      console.log('No valid Authorization header found');
    }
  }
  
  // If no token found, return null
  if (!token) {
    console.log('No authentication token found');
    return null;
  }
  
  console.log('Verifying token...');
  // Verify the token
  const user = await verifyToken(token);
  
  if (user) {
    console.log('Token verified successfully for user:', user.email);
  } else {
    console.log('Token verification failed');
  }
  
  return user;
}