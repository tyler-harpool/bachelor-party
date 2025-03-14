import { db } from '../../../../db/drizzle';
import { usersTable } from '../../../../db/schema';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  ApiError,
  HttpStatus,
  createResponse,
  createErrorResponse,
} from "@repo/ui/lib/api";

// Input validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST handler - User login
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.safeParse(body);
    if (!validatedData.success) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        "VALIDATION_ERROR",
        "Invalid input data",
        validatedData.error.errors
      );
    }
    
    // Find user by email
    const user = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstname,
        lastName: usersTable.lastname,
        email: usersTable.email,
        password: usersTable.password,
      })
      .from(usersTable)
      .where(eq(usersTable.email, validatedData.data.email))
      .limit(1);
    
    if (user.length === 0) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedData.data.password,
      user[0].password
    );
    
    if (!isPasswordValid) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }
    
    // Create user response (exclude password)
    const { password, ...userWithoutPassword } = user[0];
    
    const response = createResponse({
      user: userWithoutPassword,
      message: 'Login successful'
    });
    
    return response;
    
  } catch (error) {
    console.error('Error during login:', error);
    return createErrorResponse(error as Error);
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}