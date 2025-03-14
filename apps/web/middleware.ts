import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS' && request.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  // Only apply middleware to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get the response from the endpoint
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  // For non-API routes, just continue
  return NextResponse.next();
}

// Match only API routes and OPTIONS requests 
export const config = {
  matcher: ['/api/:path*'],
};