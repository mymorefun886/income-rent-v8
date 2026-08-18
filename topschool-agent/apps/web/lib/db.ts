import { db } from '@/db';
import { pool } from '@/db';

export async function dbStatus() {
  try {
    const result = await pool.query('SELECT 1');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
