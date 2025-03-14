import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import 'dotenv/config';

async function main() {
  console.log('Running Neon database operations...');
  
  try {
    // Create a Neon serverless connection
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    
    // Create table directly using SQL
    console.log('Creating votes table if it doesn\'t exist...');
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        option TEXT NOT NULL,
        ip_address TEXT NOT NULL
      )
    `;
    console.log('Table creation successful');
    
    // Verify table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'votes'
      )
    `;
    console.log('Votes table exists:', tableExists[0].exists);
    
    // Optional: Insert test data
    // console.log('Inserting test data...');
    // const inserted = await sql`
    //   INSERT INTO votes (option, ip_address) 
    //   VALUES ('option 1', '127.0.0.1') 
    //   RETURNING *
    // `;
    // console.log('Test data inserted:', inserted[0]);
    
  } catch (error) {
    console.error('Error during database operations:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();