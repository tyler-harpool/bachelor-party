import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/auth-middleware';

// GET handler - Returns the current authenticated user
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    console.log('ME endpoint - User data:', user);
    
    // User is already authenticated by withAuth middleware
    const responseData = {
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      }
    };
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}