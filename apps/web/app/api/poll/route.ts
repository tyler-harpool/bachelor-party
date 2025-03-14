import { db } from '@/db/drizzle';
import { pollTable } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import {
  ApiError,
  HttpStatus,
  createResponse,
  createErrorResponse,
} from "@repo/ui/lib/api";

// Input validation schema
const voteSchema = z.object({
  option: z.string().min(1, "Option is required"),
});

// db connection is imported from @/db/drizzle

// GET handler - Fetch all poll options and their counts
export async function GET() {
  try {
    // Use Drizzle's built-in SQL query builder for better compatibility
    const results = await db.select({
      option: pollTable.option,
      count: sql`COUNT(*)`.mapWith(Number)
    })
    .from(pollTable)
    .groupBy(pollTable.option)
    .orderBy(sql`count DESC`);
    
    console.log('Poll results retrieved:', results);
    
    // Use the shared API response format with additional properties for better cross-platform support
    const response = createResponse({
      items: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
    
    // Add CORS headers for Tauri compatibility
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error fetching poll results:', error);
    const errorResponse = createErrorResponse(
      new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "DATABASE_ERROR",
        "Failed to fetch poll results",
        error
      )
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// POST handler - Add a new vote
export async function POST(request: NextRequest) {
  try {
    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = voteSchema.safeParse(body);
    if (!validatedData.success) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        "VALIDATION_ERROR",
        "Invalid input data",
        validatedData.error.errors
      );
    }
    
    // Check if user already voted (optional: remove this check if multiple votes are allowed)
    const existingVote = await db
      .select()
      .from(pollTable)
      .where(eq(pollTable.ipAddress, ipAddress))
      .limit(1);
    
    if (existingVote.length > 0) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        "DUPLICATE_VOTE",
        "You have already voted"
      );
    }
    
    // Insert vote
    const inserted = await db
      .insert(pollTable)
      .values({
        option: validatedData.data.option,
        ipAddress: ipAddress,
      })
      .returning();
    
    const response = createResponse({
      vote: inserted[0],
      message: 'Vote recorded successfully'
    }, HttpStatus.CREATED);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
    
  } catch (error) {
    console.error('Error recording vote:', error);
    const errorResponse = createErrorResponse(error as Error);
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// DELETE handler - Remove a vote (for testing purposes)
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        "MISSING_PARAMETER",
        "Vote ID is required"
      );
    }
    
    // Delete vote
    const deleted = await db
      .delete(pollTable)
      .where(eq(pollTable.id, parseInt(id, 10)))
      .returning();
    
    if (deleted.length === 0) {
      throw new ApiError(
        HttpStatus.NOT_FOUND,
        "RESOURCE_NOT_FOUND",
        "Vote not found"
      );
    }
    
    const response = createResponse({
      deleted: deleted[0],
      message: 'Vote deleted successfully'
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
    
  } catch (error) {
    console.error('Error deleting vote:', error);
    const errorResponse = createErrorResponse(error as Error);
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}