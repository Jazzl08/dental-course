import { query } from '../config/db.js';
import { createError } from '../middleware/errorHandler.js';

export const getMyEnrollmentsService = async (userId) => {
  const { rows } = await query(
    `SELECT
       e.id,
       e.course_id,
       e.enrolled_at,
       e.progress_pct,
       e.completed_at,
       c.title,
       c.slug,
       c.short_desc,
       c.thumbnail_url,
       c.duration_min,
       c.level
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );
  return rows;
};

export const getEnrollmentByCourseService = async ({ userId, courseId }) => {
  const { rows } = await query(
    `SELECT
       e.id,
       e.course_id,
       e.enrolled_at,
       e.progress_pct,
       e.completed_at,
       c.title,
       c.slug,
       c.short_desc,
       c.thumbnail_url,
       c.duration_min,
       c.level
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1 AND e.course_id = $2`,
    [userId, courseId]
  );

  if (!rows[0]) {
    throw createError(404, 'Enrollment not found.');
  }

  return rows[0];
};

export const updateEnrollmentProgressService = async ({ userId, courseId, progressPct }) => {
  const { rows } = await query(
    `UPDATE enrollments
     SET progress_pct = $1,
         completed_at = CASE WHEN $1 = 100 THEN NOW() ELSE NULL END
     WHERE user_id = $2 AND course_id = $3
     RETURNING id, course_id, progress_pct, completed_at`,
    [progressPct, userId, courseId]
  );

  if (!rows[0]) {
    throw createError(404, 'Enrollment not found.');
  }

  return rows[0];
};
