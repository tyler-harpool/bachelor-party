import { db } from '../../../../db/drizzle';
import { usersTable } from '../../../../db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  ApiError,
  HttpStatus,
} from "@repo/ui/lib/api";
import { generateToken } from '../../../../lib/jwt';

// Input validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST handler - User login
export async function POST(request: NextRequest) {
  try {
    console.log('Login attempt started');
    // Parse request body
    const body = await request.json();
    console.log('Request body:', { email: body.email, hasPassword: !!body.password });
    
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
    console.log('Looking up user with email:', validatedData.data.email);
    const users = await db
      .select({
        id: usersTable.id,
        firstname: usersTable.firstname,
        lastname: usersTable.lastname,
        email: usersTable.email,
        password: usersTable.password,
      })
      .from(usersTable)
      .where(eq(usersTable.email, validatedData.data.email))
      .limit(1);
      
    console.log('User lookup result:', users.length > 0 ? 'User found' : 'User not found');
    
    if (users.length === 0) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }
    
    const user = users[0];
    console.log('Found user:', { id: user.id, email: user.email });
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedData.data.password,
      user.password
    );
    
    if (!isPasswordValid) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }
    
    console.log('Password verified successfully');
    
    // Create user response object (exclude password and map field names)
    const userResponse = {
      id: user.id,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email
    };
    
    // Generate JWT token
    console.log('Generating JWT token');
    const token = await generateToken(userResponse);
    console.log('Token generated successfully');
    
    // Create response data
    const responseData = {
      success: true,
      data: {
        user: userResponse,
        token,
        message: 'Login successful'
      }
    };
    
    // Create NextResponse directly to handle cookies
    const response = new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
    // Set token in cookies for web clients
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Error during login:', error);
    
    // Create error response data
    const errorInfo = error instanceof ApiError ? error : new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred during login",
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
    
    // Return error response
    return new NextResponse(JSON.stringify(responseData), {
      status: errorInfo.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
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