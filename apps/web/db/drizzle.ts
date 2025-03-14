import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

// Create a Neon connection for HTTP mode
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
