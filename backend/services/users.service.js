import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { createError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

export const getMyCoursesService = async (userId) => {
  const { rows } = await query(
    `SELECT
       c.id,
       c.title,
       c.slug,
       c.short_desc,
       c.thumbnail_url,
       c.duration_min,
       c.level,
       e.enrolled_at,
       e.progress_pct,
       e.completed_at,
       p.amount_cents,
       p.currency,
       p.paid_at
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN payments p ON p.id = e.payment_id
     WHERE e.user_id = $1
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );
  return rows;
};

export const getProfileService = async (userId) => {
  const { rows } = await query(
    `SELECT id, name, email, role, is_verified, is_blocked, profile_photo_url, created_at, last_login_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) {
    throw createError(404, 'User not found.');
  }
  return rows[0];
};

export const updateProfileService = async (userId, { name, profilePhotoUrl }) => {
  const { rows } = await query(
    `UPDATE users
     SET name = $1, profile_photo_url = $2
     WHERE id = $3
     RETURNING id, name, email, role, is_verified, is_blocked, profile_photo_url, created_at, last_login_at`,
    [name, profilePhotoUrl || null, userId]
  );
  if (!rows[0]) throw createError(404, 'User not found.');
  return rows[0];
};

export const updatePasswordService = async (userId, { currentPassword, newPassword }) => {
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) throw createError(404, 'User not found.');

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw createError(400, 'Current password is incorrect.');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
};
