const { Pool } = require('pg');
const env = require('./env');

let pool = null;

try {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });
} catch (err) {
  console.warn('⚠ PostgreSQL not available. Running in demo mode with in-memory data.');
}

// Thin query helper
async function query(text, params) {
  if (!pool) {
    throw new Error('Database not connected. Running in demo mode.');
  }
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
    console.log(`📊 Query executed in ${duration}ms | Rows: ${result.rowCount}`);
  }
  return result;
}

async function getClient() {
  if (!pool) throw new Error('Database not connected.');
  return pool.connect();
}

async function testConnection() {
  try {
    if (!pool) return false;
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');
    return true;
  } catch (err) {
    console.warn('⚠ PostgreSQL connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, query, getClient, testConnection };
