// Two-level cache: in-memory Map (fast) + Postgres llm_cache (survives restarts).
// Every DB error is swallowed: a cache problem must never break a request.
import { pool } from '../db/pool.js';

const mem = new Map();
const MAX_MEM = 200;

export async function cacheGet(key) {
  if (mem.has(key)) return mem.get(key);
  if (!pool) return null;
  try {
    const r = await pool.query('SELECT response FROM llm_cache WHERE key = $1', [key]);
    if (r.rows[0]) {
      mem.set(key, r.rows[0].response);
      return r.rows[0].response;
    }
  } catch (err) {
    console.error('[cache] read failed:', err.message);
  }
  return null;
}

export async function cacheSet(key, value) {
  mem.set(key, value);
  if (mem.size > MAX_MEM) mem.delete(mem.keys().next().value); // drop oldest
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO llm_cache (key, response) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET response = EXCLUDED.response, created_at = now()`,
      [key, JSON.stringify(value)],
    );
  } catch (err) {
    console.error('[cache] write failed:', err.message);
  }
}