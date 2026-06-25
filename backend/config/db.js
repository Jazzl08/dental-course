import pg from 'pg';

const { Pool } = pg;

const isServerless = process.env.VERCEL === '1';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false },
  max: isServerless ? 1 : 20,
  idleTimeoutMillis: isServerless ? 0 : 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('[DB] Connected to PostgreSQL');
  } finally {
    client.release();
  }
};

export { query, getClient, testConnection, pool };
s