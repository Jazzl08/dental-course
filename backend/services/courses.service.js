import * as db from '../config/db.js';
import { createError } from '../middleware/errorHandler.js';

const baseSelect = `SELECT id, title, slug, short_desc, description,
  price_cents, currency, thumbnail_url, duration_min, level, created_at
  FROM courses`;

export const getAllCourses = async () => {
  const { rows } = await db.query(
    `${baseSelect}
     WHERE is_published = TRUE
     ORDER BY created_at DESC`
  );
  return rows;
};

export const getCourseById = async (id) => {
  const { rows } = await db.query(
    `${baseSelect}
     WHERE id = $1 AND is_published = TRUE`,
    [id]
  );

  if (!rows[0]) {
    throw createError(404, 'Course not found.');
  }

  return rows[0];
};

export const getCourseBySlug = async (slug) => {
  const { rows } = await db.query(
    `SELECT c.id, c.title, c.slug, c.short_desc, c.description,
            c.price_cents, c.currency, c.thumbnail_url, c.duration_min, c.level, c.created_at,
            cw.id AS week_id, cw.week_number, cw.title AS week_title, cw.description AS week_description,
            l.id AS lesson_id, l.title AS lesson_title, l.lesson_type, l.duration_min AS lesson_duration_min,
            l.position AS lesson_position, l.is_preview
     FROM courses c
     LEFT JOIN course_weeks cw ON cw.course_id = c.id
     LEFT JOIN lessons l ON l.week_id = cw.id
     WHERE c.slug = $1 AND c.is_published = TRUE
     ORDER BY cw.week_number ASC, l.position ASC`,
    [slug]
  );

  if (!rows[0]) {
    throw createError(404, 'Course not found.');
  }

  const course = {
    id: rows[0].id,
    title: rows[0].title,
    slug: rows[0].slug,
    short_desc: rows[0].short_desc,
    description: rows[0].description,
    price_cents: rows[0].price_cents,
    currency: rows[0].currency,
    thumbnail_url: rows[0].thumbnail_url,
    duration_min: rows[0].duration_min,
    level: rows[0].level,
    created_at: rows[0].created_at,
    weeks: [],
  };

  for (const row of rows) {
    if (!row.week_id) continue;
    let week = course.weeks.find((w) => w.id === row.week_id);
    if (!week) {
      week = {
        id: row.week_id,
        week_number: row.week_number,
        title: row.week_title,
        description: row.week_description,
        lessons: [],
      };
      course.weeks.push(week);
    }
    if (row.lesson_id) {
      week.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        lesson_type: row.lesson_type,
        duration_min: row.lesson_duration_min,
        position: row.lesson_position,
        is_preview: row.is_preview,
      });
    }
  }

  return course;
};
