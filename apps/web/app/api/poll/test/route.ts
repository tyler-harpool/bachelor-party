import { db } from '@/db/drizzle';
import { pollTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  ApiError,
  HttpStatus,
  createResponse,
  createErrorResponse,
} from "@repo/ui/lib/api";

// db connection is imported from @/db/drizzle

// GET handler - Run database tests and return results
export async function GET() {
  const testResults = [];
  let success = true;
  
  try {
    // Test 1: Database connection & version
    try {
      const versionResult = await db.execute('SELECT version()');
      testResults.push({
        name: 'Database Connection',
        status: 'pass',
        details: versionResult[0]?.version || 'Connected to database'
      });
    } catch (error) {
      success = false;
      testResults.push({
        name: 'Database Connection',
        status: 'fail',
        error: (error as Error).message
      });
    }
    
    // Test 2: Check if our table exists
    try {
      const tableExists = await db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'votes'
        )
      `);
      console.log('Table exists raw response:', tableExists);
      
      // PostgreSQL returns 't' (true) or 'f' (false) as a string
      const exists = tableExists && 
                     tableExists[0] && 
                     (tableExists[0].exists === true || 
                      tableExists[0].exists === 't' || 
                      String(tableExists[0].exists).toLowerCase() === 'true');
      
      // The test passes if we can check table existence, even if table doesn't exist
      testResults.push({
        name: 'Table Existence',
        status: 'pass',
        details: `Table exists: ${exists ? 'Yes' : 'No'}`
      });
    } catch (error) {
      success = false;
      testResults.push({
        name: 'Table Existence',
        status: 'fail',
        error: (error as Error).message
      });
    }
    
    // Test 3: Read operation (count records)
    try {
      const count = await db.execute('SELECT COUNT(*) FROM votes');
      console.log('Count records raw response:', count);
      
      // Handle various response formats that might be returned
      let recordCount = 0;
      if (count && count[0]) {
        if (typeof count[0].count === 'number') {
          recordCount = count[0].count;
        } else if (count[0].count) {
          recordCount = parseInt(String(count[0].count), 10) || 0;
        }
      }
      
      testResults.push({
        name: 'Read Operation',
        status: 'pass',
        details: `${recordCount} records found`
      });
    } catch (error) {
      success = false;
      testResults.push({
        name: 'Read Operation',
        status: 'fail',
        error: (error as Error).message
      });
    }
    
    // Test 4: Insert operation
    try {
      const testOption = `test_${Date.now()}`;
      const inserted = await db.insert(pollTable).values({
        option: testOption,
        ipAddress: '127.0.0.1'
      }).returning();
      
      testResults.push({
        name: 'Insert Operation',
        status: 'pass',
        details: `Inserted ID: ${inserted[0].id}`,
        insertedId: inserted[0].id
      });
      
      // Test 5: Read inserted record
      try {
        const readBack = await db.select().from(pollTable).where(eq(pollTable.id, inserted[0].id));
        testResults.push({
          name: 'Read After Insert',
          status: 'pass',
          details: `Record found with option: ${readBack[0].option}`
        });
      } catch (error) {
        success = false;
        testResults.push({
          name: 'Read After Insert',
          status: 'fail',
          error: (error as Error).message
        });
      }
      
      // Test 6: Delete operation
      try {
        const deleted = await db.delete(pollTable).where(eq(pollTable.id, inserted[0].id)).returning();
        testResults.push({
          name: 'Delete Operation',
          status: 'pass',
          details: `Deleted ID: ${deleted[0].id}`
        });
      } catch (error) {
        success = false;
        testResults.push({
          name: 'Delete Operation',
          status: 'fail',
          error: (error as Error).message
        });
      }
      
    } catch (error) {
      success = false;
      testResults.push({
        name: 'Insert Operation',
        status: 'fail',
        error: (error as Error).message
      });
    }
    
    // Return all test results using the shared API response format
    return createResponse({
      success,
      tests: testResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error running database tests:', error);
    return createErrorResponse(
      new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "TEST_ERROR",
        "Error running database tests",
        {
          error: (error as Error).message,
          tests: testResults
        }
      )
    );
  }
}