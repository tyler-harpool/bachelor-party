import { NextResponse } from 'next/server';

// Simple test endpoint to verify API access from native app
export async function GET() {
  const response = NextResponse.json({
    success: true,
    data: {
      message: 'Test API endpoint works!',
      timestamp: new Date().toISOString()
    }
  });
  
  // Add CORS headers for Tauri compatibility
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}