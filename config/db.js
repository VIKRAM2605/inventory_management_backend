// config/database.js
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Create multiple connection instances for better reliability
const createConnection = (options = {}) => {
  return postgres(process.env.DATABASE_URL, {
    // Aggressive timeout settings for Render
    connect_timeout: 60,           // Increased to 60 seconds
    idle_timeout: 0,              // Disable idle timeout  
    max_lifetime: 300,            // 5 minutes max lifetime
    
    // Smaller pool for pooler compatibility
    max: 3,                       // Reduced pool size
    
    // Connection settings
    ssl: 'require',
    prepare: false,               // Disable prepared statements
    
    // Aggressive retry settings
    connection: {
      options: '-c statement_timeout=60000 -c lock_timeout=30000'
    },
    
    // Debug settings
    debug: process.env.NODE_ENV === 'development',
    onnotice: () => {},
    
    ...options
  });
};

// Primary connection
const db = createConnection();

// Backup connection for retries
const dbBackup = createConnection({
  max: 1,
  connect_timeout: 30
});

export { db, dbBackup };
export default db;
