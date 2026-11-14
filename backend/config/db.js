// Postgres is optional: no DATABASE_URL (or DB down) must never break /api/analyze or /api/chat.
// Load dotenv BEFORE importing this file (put `import 'dotenv/config'` first in server.js).
import pg from 'pg';

export const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 3000, // DB down = fail fast, not hang the request
      idleTimeoutMillis: 30000,
    })
  : null;

if (pool) pool.on('error', (err) => console.error('[db] idle client error:', err.message));