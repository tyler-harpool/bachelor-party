import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import 'dotenv/config';

async function main() {
  console.log('Creating users table...');
  
  try {
    // Create a Neon serverless connection
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    
    // Drop existing users table if it exists
    console.log('Dropping users table if it exists...');
    await sql`DROP TABLE IF EXISTS users`;
    
    // Create users table directly using SQL
    console.log('Creating users table...');
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        createdat TIMESTAMP DEFAULT NOW() NOT NULL,
        updatedat TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('Users table creation successful');
    
    // Verify table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `;
    console.log('Users table exists:', tableExists[0].exists);
    
  } catch (error) {
    console.error('Error during database operations:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();