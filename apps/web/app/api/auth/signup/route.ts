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
const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST handler - Register a new user
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = signupSchema.safeParse(body);
    if (!validatedData.success) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        "VALIDATION_ERROR",
        "Invalid input data",
        validatedData.error.errors
      );
    }
    
    // Check if email already exists
    const existingUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, validatedData.data.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        "EMAIL_EXISTS",
        "This email is already registered"
      );
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.data.password, salt);
    
    // Insert user
    const inserted = await db
      .insert(usersTable)
      .values({
        firstname: validatedData.data.firstName,
        lastname: validatedData.data.lastName,
        email: validatedData.data.email,
        password: hashedPassword,
      })
      .returning({
        id: usersTable.id,
        firstName: usersTable.firstname,
        lastName: usersTable.lastname,
        email: usersTable.email,
        createdAt: usersTable.createdat,
      });
    
    const response = createResponse({
      user: inserted[0],
      message: 'User registered successfully'
    }, HttpStatus.CREATED);
    
    return response;
    
  } catch (error) {
    console.error('Error during registration:', error);
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