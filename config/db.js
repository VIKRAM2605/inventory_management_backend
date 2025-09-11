import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const db = postgres(process.env.DATABASE_URL, {
  ssl: 'require', // Force SSL for Supabase
  connection: { options: '-c statement_timeout=30000' } 
});

export default db;