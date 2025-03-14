import { neon } from '@neondatabase/serverless';
import { pollTable } from './schema';
import 'dotenv/config';

async function testNeonConnection() {
  try {
    // Test Neon serverless driver connection
    console.log('Testing connection to Neon...');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check database version
    const version = await sql`SELECT version()`;
    console.log('📊 Database version:', version[0].version);
    
    // Check if table exists
    console.log('\n📋 Checking if votes table exists...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'votes'
      )
    `;
    console.log('Table exists:', tableExists[0].exists);
    
    // If table exists, query data
    if (tableExists[0].exists) {
      const votes = await sql`SELECT * FROM votes LIMIT 5`;
      console.log(`\nFound ${votes.length} votes:`);
      console.log(votes);
      
      // Test insertion
      console.log('\n📝 Testing data insertion...');
      const inserted = await sql`
        INSERT INTO votes (option, ip_address) 
        VALUES ('test option', '127.0.0.1') 
        RETURNING *
      `;
      console.log('Insert successful:', inserted[0]);
    }
    
    console.log('\n✅ Neon connection test successful!');
  } catch (error) {
    console.error('❌ Neon database test failed:', error);
  }
}

testNeonConnection();