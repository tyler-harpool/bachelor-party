import { NextRequest } from 'next/server';
import { db } from '../../../../db/drizzle';
import { usersTable } from '../../../../db/schema';
import { createResponse, createErrorResponse } from '@repo/ui/lib/api';
import { eq } from 'drizzle-orm';

// Simple endpoint to test database connection and schema
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Check database connection by querying all users
    console.log('Test 1: Listing all users');
    const allUsers = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      firstname: usersTable.firstname,
      lastname: usersTable.lastname,
    }).from(usersTable);
    
    console.log(`Found ${allUsers.length} users in the database`);
    
    // Test 2: Inspect the database schema
    console.log('Test 2: Checking database schema');
    
    // Return all tests results
    return createResponse({
      connection: "success",
      userCount: allUsers.length,
      firstUser: allUsers.length > 0 ? {
        id: allUsers[0].id,
        email: allUsers[0].email,
        name: `${allUsers[0].firstname} ${allUsers[0].lastname}`
      } : null,
      database: {
        url: process.env.DATABASE_URL ? 'Set (masked for security)' : 'Not set',
        schema: {
          usersTable: Object.keys(usersTable),
          columnNames: {
            id: usersTable.id.name,
            firstname: usersTable.firstname.name,
            lastname: usersTable.lastname.name,
            email: usersTable.email.name
          }
        }
      }
    });
  } catch (error) {
    console.error('Error testing database:', error);
    return createErrorResponse(error as Error);
  }
}