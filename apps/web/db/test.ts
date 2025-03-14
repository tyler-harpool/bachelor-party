import { neon } from '@neondatabase/serverless';
import { pollTable } from './schema';
import { db } from './drizzle';
import 'dotenv/config';

async function testConnection() {
  try {
    // Test basic connection using Neon serverless driver
    console.log('Testing connection to Neon using serverless driver...');
    const sql = neon(process.env.DATABASE_URL!);
    const version = await sql`SELECT version()`;
    console.log('📊 Database version:', version[0].version);
    
    // Test connection using original drizzle setup
    console.log('\nTesting connection using standard Drizzle setup...');
    const result = await db.select().from(pollTable).limit(5);
    console.log('Polls found:', result.length);
    console.log(result);

    // Test insertion (uncomment to test)
    // console.log('\n📝 Testing data insertion...');
    // const inserted = await db.insert(pollTable).values({
    //   option: 'test option',
    //   ipAddress: '127.0.0.1'
    // }).returning();
    // console.log('Insert successful:', inserted);

    console.log('\n✅ Connection and queries successful!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testConnection();
