// Run: node --env-file=.env scripts/seed-accounts.js
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SALT_ROUNDS = 12;

const ADMIN_EMAIL    = 'admin@mondhygienistzoetermeer.nl';
const ADMIN_PASSWORD = 'Admin1234!';
const ADMIN_NAME     = 'Beheerder';

const STUDENT_EMAIL    = 'student@mondhygienistzoetermeer.nl';
const STUDENT_PASSWORD = 'Student1234!';
const STUDENT_NAME     = 'Demo Cursist';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---------- admin account ----------
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const { rows: adminRows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'admin', TRUE)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', is_verified = TRUE
       RETURNING id, email, role`,
      [ADMIN_NAME, ADMIN_EMAIL, adminHash]
    );
    console.log('[SEED] Admin:', adminRows[0].email, '—', adminRows[0].role);

    // ---------- student account ----------
    const studentHash = await bcrypt.hash(STUDENT_PASSWORD, SALT_ROUNDS);
    const { rows: studentRows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'student', TRUE)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, is_verified = TRUE
       RETURNING id, email, role`,
      [STUDENT_NAME, STUDENT_EMAIL, studentHash]
    );
    const studentId = studentRows[0].id;
    console.log('[SEED] Student:', studentRows[0].email, '—', studentRows[0].role);

    // ---------- pick first published course ----------
    const { rows: courseRows } = await client.query(
      `SELECT id, title, price_cents, currency FROM courses WHERE is_published = TRUE LIMIT 1`
    );

    if (courseRows.length === 0) {
      console.log('[SEED] No published course found — skipping enrollment.');
      await client.query('COMMIT');
      return;
    }

    const course = courseRows[0];
    console.log('[SEED] Found course:', course.title);

    // Check if already enrolled
    const { rows: existing } = await client.query(
      `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [studentId, course.id]
    );

    if (existing.length > 0) {
      console.log('[SEED] Student already enrolled — skipping payment/enrollment.');
      await client.query('COMMIT');
      return;
    }

    // ---------- create paid payment ----------
    const { rows: payRows } = await client.query(
      `INSERT INTO payments (user_id, course_id, amount_cents, currency, status, method, paid_at, metadata)
       VALUES ($1, $2, $3, $4, 'paid', 'admin', NOW(), '{"source":"seed"}')
       RETURNING id`,
      [studentId, course.id, course.price_cents, course.currency || 'EUR']
    );
    const paymentId = payRows[0].id;

    // ---------- create enrollment ----------
    await client.query(
      `INSERT INTO enrollments (user_id, course_id, payment_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [studentId, course.id, paymentId]
    );
    console.log('[SEED] Enrollment created for student.');

    await client.query('COMMIT');

    console.log('\n=== Accounts aangemaakt ===');
    console.log(`Admin     → ${ADMIN_EMAIL}   / ${ADMIN_PASSWORD}`);
    console.log(`Student   → ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);
    console.log('===========================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED] Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
