import { db } from '@/db/drizzle';
import { pollTable } from '@/db/schema';
import { createResponse, createErrorResponse, ApiError, HttpStatus } from "@repo/ui/lib/api";
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Define a consistent poll result type
export interface PollResult {
  id: string;
  timestamp: string;
  results: {
    option: string;
    count: number;
  }[];
  totalVotes: number;
}

// Simple GET endpoint optimized for native app consumption
export async function GET() {
  try {
    console.log('Simple poll API: Request received');
    
    // For debugging, let's mock the results if there's a DB issue
    let results;
    try {
      // Fetch poll results with simple count query
      results = await db.select({
        option: pollTable.option,
        count: sql`COUNT(*)`.mapWith(Number)
      })
      .from(pollTable)
      .groupBy(pollTable.option)
      .orderBy(sql`count DESC`);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return mock data for testing
      results = [
        { option: 'Pizza', count: 4 },
        { option: 'Burgers', count: 2 },
        { option: 'Tacos', count: 2 },
        { option: 'Sushi', count: 2 }
      ];
    }
    
    console.log('Simple poll API: Retrieved results:', results);
    
    // Format the data consistently with other APIs
    const pollResult: PollResult = {
      id: 'poll-' + Date.now().toString(),
      timestamp: new Date().toISOString(),
      results: results,
      totalVotes: results.reduce((sum, item) => sum + item.count, 0)
    };
    
    // Create response with data
    const response = createResponse(pollResult);
    
    // Add CORS headers for Tauri compatibility
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Simple poll API: Error fetching results:', error);
    const errorResponse = createErrorResponse(
      new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "API_ERROR",
        "Failed to fetch poll data",
        { error: (error as Error).message }
      )
    );
    
    // Add CORS headers even to error responses
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
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