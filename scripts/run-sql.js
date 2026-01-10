require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSqlFile(sqlFilePath) {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sqlFile = path.resolve(sqlFilePath);
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`ERROR: SQL file not found: ${sqlFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  if (!sql.trim()) {
    console.error(`ERROR: SQL file is empty: ${sqlFile}`);
    process.exit(1);
  }

  // Parse DATABASE_URL and configure SSL for Neon
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`Connecting to database...`);
    await client.connect();
    console.log(`Connected successfully.`);

    console.log(`Executing SQL from: ${sqlFile}`);
    console.log(`SQL length: ${sql.length} characters`);
    
    await client.query(sql);
    
    console.log(`✓ SQL executed successfully`);
    
  } catch (error) {
    console.error(`ERROR executing SQL:`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log(`Connection closed.`);
  }
}

// Get SQL file path from command line args
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('Usage: node scripts/run-sql.js <path-to-sql-file>');
  process.exit(1);
}

runSqlFile(sqlFilePath).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
