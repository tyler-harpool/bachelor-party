import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from './drizzle';
import 'dotenv/config';

// This script can be used to run migrations programmatically
async function main() {
  console.log('Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './db/migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();