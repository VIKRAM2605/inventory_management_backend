// config/database.js
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Use the direct PostgreSQL connection string, not the Supabase URL
const db = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  connection: { 
    options: '-c statement_timeout=300000' 
  },
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export default db;
