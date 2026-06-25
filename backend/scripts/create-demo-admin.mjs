import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const email = 'admin@dentalcourse.test';
const password = 'Test12345';
const courseSlug = 'binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
});

const client = await pool.connect();

try {
  await client.query('BEGIN');

  const { rows: courseRows } = await client.query(
    'SELECT id, price_cents, currency FROM courses WHERE slug = $1 LIMIT 1',
    [courseSlug]
  );

  const course = courseRows[0];
  if (!course) {
    throw new Error(`Course not found: ${courseSlug}`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows: userRows } = await client.query(
    `INSERT INTO users (name, email, password_hash, role, is_verified, is_blocked)
     VALUES ($1, $2, $3, 'admin', TRUE, FALSE)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       is_verified = TRUE,
       is_blocked = FALSE
     RETURNING id, name, email, role, is_verified`,
    ['Demo Admin', email, passwordHash]
  );

  const user = userRows[0];
  const { rows: paymentRows } = await client.query(
    `INSERT INTO payments (user_id, course_id, amount_cents, currency, status, method, paid_at, metadata)
     VALUES ($1, $2, $3, $4, 'paid', 'demo_seed', NOW(), $5::jsonb)
     RETURNING id`,
    [user.id, course.id, course.price_cents, course.currency, JSON.stringify({ source: 'demo_user' })]
  );

  await client.query(
    `INSERT INTO enrollments (user_id, course_id, payment_id, progress_pct, notes)
     VALUES ($1, $2, $3, 0, 'Demo toegang met goedgekeurde betaling')
     ON CONFLICT (user_id, course_id)
     DO UPDATE SET payment_id = EXCLUDED.payment_id, notes = EXCLUDED.notes
     RETURNING id`,
    [user.id, course.id, paymentRows[0].id]
  );

  await client.query('COMMIT');

  console.log(
    JSON.stringify(
      {
        email,
        password,
        role: user.role,
        verified: user.is_verified,
        courseId: course.id,
      },
      null,
      2
    )
  );
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
  await pool.end();
}
