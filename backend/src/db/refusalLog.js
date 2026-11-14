import { pool } from './pool.js';

// No DB configured = silently skip. The route also catches errors.
export async function logRefusal({ patientId, message, reason }) {
  if (!pool) return;
  await pool.query(
    'INSERT INTO refusal_log (patient_id, message, reason) VALUES ($1, $2, $3)',
    [patientId, String(message).slice(0, 2000), reason],
  );
}