import * as db from '../config/db.js';

export const getDashboard = async () => {
  const { rows: statsRows } = await db.query(
    `SELECT
       (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS students,
       (SELECT COUNT(*)::int FROM enrollments WHERE completed_at IS NULL) AS active_students,
       (SELECT COUNT(*)::int FROM enrollments WHERE completed_at IS NOT NULL) AS completed_courses,
       (SELECT COALESCE(SUM(amount_cents), 0)::int FROM payments WHERE status = 'paid') AS revenue_cents`
  );

  const { rows: enrollmentRows } = await db.query(
    `SELECT e.id, e.enrolled_at, e.progress_pct,
            u.name AS user_name, u.email AS user_email,
            c.title AS course_title
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     JOIN courses c ON c.id = e.course_id
     ORDER BY e.enrolled_at DESC
     LIMIT 10`
  );

  const recent_enrollments = enrollmentRows.map(r => ({
    id: r.id,
    enrolled_at: r.enrolled_at,
    progress_pct: r.progress_pct,
    user: { name: r.user_name, email: r.user_email },
    course: { title: r.course_title },
  }));

  return { ...statsRows[0], recent_enrollments };
};

export const listUsers = async () => {
  const { rows } = await db.query(
    `SELECT id, name, email, role, is_verified, is_blocked, profile_photo_url, created_at, last_login_at
     FROM users
     ORDER BY created_at DESC`
  );
  return rows;
};

export const setUserStatus = async (id, isBlocked) => {
  const { rows } = await db.query(
    `UPDATE users SET is_blocked = $1 WHERE id = $2
     RETURNING id, name, email, role, is_blocked`,
    [isBlocked, id]
  );
  return rows[0];
};

export const deleteUser = async (id) => {
  await db.query('DELETE FROM users WHERE id = $1 AND role <> $2', [id, 'admin']);
};

export const assignCourse = async (userId, courseId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    if (existing.rowCount > 0) {
      const { rows } = await client.query(
        `UPDATE enrollments SET notes = 'Assigned by admin' WHERE user_id = $1 AND course_id = $2
         RETURNING id, user_id, course_id, enrolled_at, progress_pct`,
        [userId, courseId]
      );
      await client.query('COMMIT');
      return rows[0];
    }

    const { rows: paymentRows } = await client.query(
      `INSERT INTO payments (user_id, course_id, amount_cents, currency, status, method, paid_at, metadata)
       VALUES ($1, $2, 0, 'EUR', 'paid', 'admin', NOW(), '{"source":"admin_assignment"}')
       RETURNING id`,
      [userId, courseId]
    );
    const { rows } = await client.query(
      `INSERT INTO enrollments (user_id, course_id, payment_id)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, course_id, enrolled_at, progress_pct`,
      [userId, courseId, paymentRows[0].id]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const createCourse = async (course) => {
  const { rows } = await db.query(
    `INSERT INTO courses
       (title, slug, short_desc, description, price_cents, currency, thumbnail_url, duration_min, level, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      course.title,
      course.slug,
      course.shortDesc || null,
      course.description,
      course.priceCents,
      course.currency,
      course.thumbnailUrl || null,
      course.durationMin || null,
      course.level,
      course.isPublished,
    ]
  );
  return rows[0];
};

export const createWeek = async (courseId, week) => {
  const { rows } = await db.query(
    `INSERT INTO course_weeks (course_id, week_number, title, description, unlock_after_days)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [courseId, week.weekNumber, week.title, week.description || null, week.unlockAfterDays]
  );
  return rows[0];
};

export const createLesson = async (weekId, lesson) => {
  const { rows } = await db.query(
    `INSERT INTO lessons
       (week_id, title, lesson_type, content, video_url, image_url, download_url, assignment_prompt, duration_min, position, is_preview)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      weekId,
      lesson.title,
      lesson.lessonType,
      lesson.content || null,
      lesson.videoUrl || null,
      lesson.imageUrl || null,
      lesson.downloadUrl || null,
      lesson.assignmentPrompt || null,
      lesson.durationMin || null,
      lesson.position,
      lesson.isPreview,
    ]
  );

  if (lesson.lessonType === 'quiz') {
    await db.query('INSERT INTO quizzes (lesson_id, title) VALUES ($1, $2) ON CONFLICT (lesson_id) DO NOTHING', [
      rows[0].id,
      lesson.title,
    ]);
  }

  return rows[0];
};

export const getPayments = async () => {
  const { rows: paymentRows } = await db.query(
    `SELECT p.id, p.mollie_id, p.amount_cents, p.currency, p.status, p.method,
            p.paid_at, p.created_at,
            u.name AS user_name, u.email AS user_email,
            c.title AS course_title
     FROM payments p
     JOIN users u ON u.id = p.user_id
     JOIN courses c ON c.id = p.course_id
     ORDER BY p.created_at DESC`
  );

  const { rows: statsRows } = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0)::int AS total_revenue,
       COUNT(CASE WHEN status = 'paid' THEN 1 END)::int AS successful_count,
       COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending_count,
       COUNT(CASE WHEN status = 'failed' THEN 1 END)::int AS failed_count
     FROM payments`
  );

  const { rows: monthlyRows } = await db.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon') AS maand,
       COALESCE(SUM(amount_cents), 0)::int AS omzet_cents
     FROM payments
     WHERE status = 'paid'
       AND paid_at >= NOW() - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', paid_at)
     ORDER BY DATE_TRUNC('month', paid_at)`
  );

  return {
    payments: paymentRows.map(p => ({
      id: p.id,
      mollie_id: p.mollie_id,
      name: p.user_name,
      email: p.user_email,
      course_title: p.course_title,
      amount_cents: p.amount_cents,
      status: p.status,
      method: p.method,
      paid_at: p.paid_at,
      created_at: p.created_at,
    })),
    stats: statsRows[0],
    monthly_revenue: monthlyRows.map(r => ({
      maand: r.maand,
      omzet: Math.round(r.omzet_cents / 100),
    })),
  };
};

export const getProgress = async () => {
  const { rows } = await db.query(
    `SELECT e.id, e.progress_pct, e.enrolled_at, e.completed_at,
            u.name AS user_name, u.email AS user_email,
            c.title AS course_title,
            (SELECT COUNT(*)::int FROM lesson_progress lp
             JOIN lessons l ON l.id = lp.lesson_id
             JOIN course_weeks w ON w.id = l.week_id
             WHERE lp.user_id = e.user_id AND w.course_id = e.course_id) AS completed_lessons,
            (SELECT MAX(lp.completed_at) FROM lesson_progress lp
             JOIN lessons l ON l.id = lp.lesson_id
             JOIN course_weeks w ON w.id = l.week_id
             WHERE lp.user_id = e.user_id AND w.course_id = e.course_id) AS last_active,
            (SELECT ROUND(AVG(qa.score)::numeric, 1)
             FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             JOIN lessons l ON l.id = q.lesson_id
             JOIN course_weeks w ON w.id = l.week_id
             WHERE qa.user_id = e.user_id AND w.course_id = e.course_id) AS quiz_avg
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     JOIN courses c ON c.id = e.course_id
     ORDER BY e.progress_pct DESC`
  );

  const { rows: statsRows } = await db.query(
    `SELECT
       ROUND(AVG(progress_pct)::numeric, 1) AS avg_progress,
       COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::int AS completed_count,
       (SELECT ROUND(AVG(score)::numeric, 1) FROM quiz_attempts) AS avg_quiz_score
     FROM enrollments`
  );

  const { rows: weekRows } = await db.query(
    `SELECT w.week_number, COUNT(lp.id)::int AS completion_count
     FROM course_weeks w
     LEFT JOIN lessons l ON l.week_id = w.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
     GROUP BY w.week_number
     ORDER BY w.week_number`
  );

  return {
    students: rows.map(r => ({
      id: r.id,
      name: r.user_name,
      email: r.user_email,
      course_title: r.course_title,
      progress_pct: r.progress_pct,
      completed_lessons: r.completed_lessons,
      last_active: r.last_active,
      quiz_avg: r.quiz_avg ? Number(r.quiz_avg) : null,
      completed_at: r.completed_at,
    })),
    stats: {
      avg_progress: statsRows[0]?.avg_progress ? Number(statsRows[0].avg_progress) : 0,
      completed_count: statsRows[0]?.completed_count || 0,
      avg_quiz_score: statsRows[0]?.avg_quiz_score ? Number(statsRows[0].avg_quiz_score) : 0,
    },
    week_completion: weekRows.map(r => ({
      week: `Week ${r.week_number}`,
      voltooid: r.completion_count,
    })),
  };
};

export const getCertificates = async () => {
  const { rows } = await db.query(
    `SELECT cert.id, cert.certificate_number, cert.issued_at,
            u.name AS user_name, u.email AS user_email,
            c.title AS course_title
     FROM certificates cert
     JOIN users u ON u.id = cert.user_id
     JOIN courses c ON c.id = cert.course_id
     ORDER BY cert.issued_at DESC`
  );

  const { rows: statsRows } = await db.query(
    `SELECT
       COUNT(*)::int AS total_issued,
       COUNT(*)::int AS total_downloaded
     FROM certificates`
  );

  return {
    certificates: rows.map(r => ({
      id: r.id,
      certificate_number: r.certificate_number,
      issued_at: r.issued_at,
      name: r.user_name,
      email: r.user_email,
      course_title: r.course_title,
    })),
    stats: statsRows[0],
  };
};

export const createQuizQuestion = async (lessonId, question) => {
  const { rows: quizRows } = await db.query(
    `INSERT INTO quizzes (lesson_id, title)
     VALUES ($1, 'Quiz')
     ON CONFLICT (lesson_id) DO UPDATE SET lesson_id = EXCLUDED.lesson_id
     RETURNING id`,
    [lessonId]
  );
  const { rows } = await db.query(
    `INSERT INTO quiz_questions (quiz_id, question, options, correct_answer, explanation, position)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, quiz_id, question, options, explanation, position`,
    [quizRows[0].id, question.question, JSON.stringify(question.options), question.correctAnswer, question.explanation || null, question.position]
  );
  return rows[0];
};
