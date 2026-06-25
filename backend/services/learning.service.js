import * as db from '../config/db.js';
import { createError } from '../middleware/errorHandler.js';
import { randomUUID } from 'crypto';

const mapRowsToCourses = (rows) => {
  const courses = new Map();

  for (const row of rows) {
    if (!courses.has(row.course_id)) {
      courses.set(row.course_id, {
        id: row.course_id,
        title: row.course_title,
        slug: row.slug,
        shortDesc: row.short_desc,
        progressPct: row.progress_pct,
        completedAt: row.completed_at,
        certificateStatus: row.certificate_id ? 'beschikbaar' : row.completed_at ? 'klaar' : 'nog niet beschikbaar',
        certificateId: row.certificate_id,
        weeks: [],
      });
    }

    const course = courses.get(row.course_id);
    let week = course.weeks.find((item) => item.id === row.week_id);
    if (!week && row.week_id) {
      week = {
        id: row.week_id,
        weekNumber: row.week_number,
        title: row.week_title,
        description: row.week_description,
        unlockAfterDays: row.unlock_after_days,
        status: row.week_locked ? 'locked' : row.week_completed ? 'completed' : 'active',
        lessons: [],
      };
      course.weeks.push(week);
    }

    if (week && row.lesson_id) {
      week.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        lessonType: row.lesson_type,
        durationMin: row.lesson_duration_min,
        position: row.lesson_position,
        completedAt: row.lesson_completed_at,
      });
    }
  }

  return [...courses.values()];
};

export const getDashboard = async (userId) => {
  const { rows } = await db.query(
    `SELECT
       c.id AS course_id,
       c.title AS course_title,
       c.slug,
       c.short_desc,
       e.progress_pct,
       e.completed_at,
       cw.id AS week_id,
       cw.week_number,
       cw.title AS week_title,
       cw.description AS week_description,
       cw.unlock_after_days,
       (NOW() < e.enrolled_at + (cw.unlock_after_days || ' days')::interval) AS week_locked,
       BOOL_AND(lp.completed_at IS NOT NULL) FILTER (WHERE l.id IS NOT NULL) AS week_completed,
       l.id AS lesson_id,
       l.title AS lesson_title,
       l.lesson_type,
       l.duration_min AS lesson_duration_min,
       l.position AS lesson_position,
       lp.completed_at AS lesson_completed_at,
       cert.id AS certificate_id
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN course_weeks cw ON cw.course_id = c.id
     LEFT JOIN lessons l ON l.week_id = cw.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
     LEFT JOIN certificates cert ON cert.user_id = e.user_id AND cert.course_id = c.id
     WHERE e.user_id = $1
     GROUP BY c.id, e.id, cw.id, l.id, lp.completed_at, cert.id
     ORDER BY e.enrolled_at DESC, cw.week_number ASC, l.position ASC`,
    [userId]
  );

  const courses = mapRowsToCourses(rows);
  const completedLessons = courses.flatMap((course) => course.weeks.flatMap((week) => week.lessons)).filter((lesson) => lesson.completedAt).length;
  const totalLessons = courses.flatMap((course) => course.weeks.flatMap((week) => week.lessons)).length;

  return {
    courses,
    stats: {
      activeCourses: courses.length,
      completedLessons,
      remainingLessons: Math.max(totalLessons - completedLessons, 0),
      certificateReady: courses.some((course) => course.certificateStatus !== 'nog niet beschikbaar'),
    },
  };
};

const assertEnrollmentForLesson = async (userId, lessonId) => {
  const { rows } = await db.query(
    `SELECT e.id AS enrollment_id, e.course_id, c.title AS course_title, l.id AS lesson_id
     FROM lessons l
     JOIN course_weeks cw ON cw.id = l.week_id
     JOIN courses c ON c.id = cw.course_id
     JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
     WHERE l.id = $2
       AND NOW() >= e.enrolled_at + (cw.unlock_after_days || ' days')::interval`,
    [userId, lessonId]
  );

  if (!rows[0]) {
    throw createError(403, 'Lesson is locked or not assigned to this user.');
  }

  return rows[0];
};

export const getLesson = async (userId, courseId, lessonId) => {
  await assertEnrollmentForLesson(userId, lessonId);

  const { rows } = await db.query(
    `WITH lesson_order AS (
       SELECT l2.id,
              ROW_NUMBER() OVER (ORDER BY cw2.week_number, l2.position) AS ord
       FROM lessons l2
       JOIN course_weeks cw2 ON cw2.id = l2.week_id
       WHERE cw2.course_id = $2
     )
     SELECT
       l.id, l.title, l.lesson_type, l.content, l.video_url, l.image_url,
       l.download_url, l.assignment_prompt, l.duration_min, l.position,
       cw.week_number, cw.title AS week_title, c.id AS course_id, c.title AS course_title,
       lp.completed_at,
       q.id AS quiz_id, q.pass_pct AS quiz_pass_pct,
       qq.id AS question_id, qq.question, qq.options, qq.position AS question_position,
       lo.ord AS lesson_ord,
       CASE lo.ord
         WHEN 1 THEN FALSE
         ELSE NOT EXISTS (
           SELECT 1 FROM lesson_progress lp2
           JOIN lesson_order prev ON prev.id = lp2.lesson_id AND prev.ord = lo.ord - 1
           WHERE lp2.user_id = $1
         )
       END AS is_locked
     FROM lessons l
     JOIN course_weeks cw ON cw.id = l.week_id
     JOIN courses c ON c.id = cw.course_id
     JOIN lesson_order lo ON lo.id = l.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
     LEFT JOIN quizzes q ON q.lesson_id = l.id
     LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
     WHERE c.id = $2 AND l.id = $3
     ORDER BY qq.position ASC`,
    [userId, courseId, lessonId]
  );

  if (!rows[0]) {
    throw createError(404, 'Lesson not found.');
  }

  const lesson = {
    id: rows[0].id,
    title: rows[0].title,
    lessonType: rows[0].lesson_type,
    content: rows[0].content,
    videoUrl: rows[0].video_url,
    imageUrl: rows[0].image_url,
    downloadUrl: rows[0].download_url,
    assignmentPrompt: rows[0].assignment_prompt,
    durationMin: rows[0].duration_min,
    position: rows[0].position,
    weekNumber: rows[0].week_number,
    weekTitle: rows[0].week_title,
    courseId: rows[0].course_id,
    courseTitle: rows[0].course_title,
    completedAt: rows[0].completed_at,
    isLocked: rows[0].is_locked,
    quiz: rows[0].quiz_id
      ? {
          id: rows[0].quiz_id,
          passPct: rows[0].quiz_pass_pct ?? 70,
          questions: rows
            .filter((row) => row.question_id)
            .map((row) => ({
              id: row.question_id,
              question: row.question,
              options: row.options,
              position: row.question_position,
            })),
        }
      : null,
  };

  return lesson;
};

const recalculateEnrollment = async (client, userId, courseId) => {
  const { rows } = await client.query(
    `WITH totals AS (
       SELECT COUNT(l.id)::int AS total_lessons
       FROM lessons l
       JOIN course_weeks cw ON cw.id = l.week_id
       WHERE cw.course_id = $2
     ), completed AS (
       SELECT COUNT(lp.id)::int AS completed_lessons
       FROM lesson_progress lp
       JOIN lessons l ON l.id = lp.lesson_id
       JOIN course_weeks cw ON cw.id = l.week_id
       WHERE lp.user_id = $1 AND cw.course_id = $2
     )
     SELECT total_lessons, completed_lessons
     FROM totals, completed`,
    [userId, courseId]
  );

  const total = rows[0]?.total_lessons || 0;
  const completed = rows[0]?.completed_lessons || 0;
  const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const completedAt = total > 0 && completed >= total ? new Date() : null;

  const { rows: enrollmentRows } = await client.query(
    `UPDATE enrollments
     SET progress_pct = $1,
         completed_at = CASE WHEN $2::timestamptz IS NULL THEN completed_at ELSE COALESCE(completed_at, $2) END
     WHERE user_id = $3 AND course_id = $4
     RETURNING progress_pct, completed_at`,
    [progressPct, completedAt, userId, courseId]
  );

  return enrollmentRows[0];
};

export const completeLesson = async (userId, lessonId) => {
  const access = await assertEnrollmentForLesson(userId, lessonId);

  const { rows: lockRows } = await db.query(
    `WITH lesson_order AS (
       SELECT l2.id, ROW_NUMBER() OVER (ORDER BY cw2.week_number, l2.position) AS ord
       FROM lessons l2
       JOIN course_weeks cw2 ON cw2.id = l2.week_id
       WHERE cw2.course_id = $2
     )
     SELECT
       lo.ord,
       CASE lo.ord
         WHEN 1 THEN FALSE
         ELSE NOT EXISTS (
           SELECT 1 FROM lesson_progress lp
           JOIN lesson_order prev ON prev.id = lp.lesson_id AND prev.ord = lo.ord - 1
           WHERE lp.user_id = $1
         )
       END AS is_locked
     FROM lesson_order lo WHERE lo.id = $3`,
    [userId, access.course_id, lessonId]
  );
  if (lockRows[0]?.is_locked) {
    throw createError(403, 'Complete the previous lesson first.');
  }
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET completed_at = COALESCE(lesson_progress.completed_at, NOW())`,
      [userId, lessonId]
    );
    const progress = await recalculateEnrollment(client, userId, access.course_id);
    await client.query('COMMIT');
    return progress;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const submitQuiz = async (userId, quizId, answers) => {
  const { rows: quizRows } = await db.query(
    `SELECT q.id, q.lesson_id, q.pass_pct, cw.course_id
     FROM quizzes q
     JOIN lessons l ON l.id = q.lesson_id
     JOIN course_weeks cw ON cw.id = l.week_id
     WHERE q.id = $1`,
    [quizId]
  );
  const quiz = quizRows[0];
  if (!quiz) throw createError(404, 'Quiz not found.');
  await assertEnrollmentForLesson(userId, quiz.lesson_id);

  const { rows: lockRows } = await db.query(
    `WITH lesson_order AS (
       SELECT l2.id, ROW_NUMBER() OVER (ORDER BY cw2.week_number, l2.position) AS ord
       FROM lessons l2
       JOIN course_weeks cw2 ON cw2.id = l2.week_id
       WHERE cw2.course_id = $2
     )
     SELECT CASE lo.ord
       WHEN 1 THEN FALSE
       ELSE NOT EXISTS (
         SELECT 1 FROM lesson_progress lp
         JOIN lesson_order prev ON prev.id = lp.lesson_id AND prev.ord = lo.ord - 1
         WHERE lp.user_id = $1
       )
     END AS is_locked
     FROM lesson_order lo WHERE lo.id = $3`,
    [userId, quiz.course_id, quiz.lesson_id]
  );
  if (lockRows[0]?.is_locked) {
    throw createError(403, 'Complete the previous lesson first.');
  }

  const { rows: questionRows } = await db.query(
    'SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = $1',
    [quizId]
  );
  const correctById = new Map(questionRows.map((row) => [row.id, row.correct_answer]));
  const score = answers.filter((answer) => correctById.get(answer.questionId) === answer.answer).length;
  const maxScore = questionRows.length;
  const pct = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const passPct = quiz.pass_pct ?? 70;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, max_score, passed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, score, max_score, passed, submitted_at`,
      [userId, quizId, score, maxScore, pct >= passPct]
    );
    for (const answer of answers) {
      await client.query(
        `INSERT INTO quiz_answers (attempt_id, question_id, answer, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [rows[0].id, answer.questionId, answer.answer, correctById.get(answer.questionId) === answer.answer]
      );
    }
    if (pct >= passPct) {
      await client.query(
        `INSERT INTO lesson_progress (user_id, lesson_id, completed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, lesson_id)
         DO UPDATE SET completed_at = COALESCE(lesson_progress.completed_at, NOW())`,
        [userId, quiz.lesson_id]
      );
      await recalculateEnrollment(client, userId, quiz.course_id);
    }
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getOrCreateCertificate = async (userId, courseId) => {
  const { rows } = await db.query(
    `SELECT e.completed_at, u.name, c.title
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1 AND e.course_id = $2`,
    [userId, courseId]
  );
  const enrollment = rows[0];
  if (!enrollment) throw createError(404, 'Enrollment not found.');
  if (!enrollment.completed_at) throw createError(409, 'Course is not completed yet.');

  const certificateNumber = `DCP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const { rows: certRows } = await db.query(
    `INSERT INTO certificates (user_id, course_id, certificate_number)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, course_id)
     DO UPDATE SET issued_at = certificates.issued_at
     RETURNING id, user_id, course_id, certificate_number, issued_at`,
    [userId, courseId, certificateNumber]
  );

  return {
    ...certRows[0],
    participantName: enrollment.name,
    courseName: enrollment.title,
  };
};

export const markCertificateDownloaded = async (certificateId) => {
  await db.query(
    `UPDATE certificates SET downloaded_at = COALESCE(downloaded_at, NOW()) WHERE id = $1`,
    [certificateId]
  );
};

const escapePdf = (value) => String(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');

export const generateCertificatePdf = async (userId, courseId) => {
  const certificate = await getOrCreateCertificate(userId, courseId);
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('nl-NL');
  const lines = [
    'Certificaat van deelname',
    certificate.courseName,
    `Naam deelnemer: ${certificate.participantName}`,
    `Datum: ${issuedDate}`,
    `Certificaatnummer: ${certificate.certificate_number}`,
  ];
  const content = lines.map((line, index) => `BT /F1 ${index === 0 ? 28 : 16} Tf 72 ${720 - index * 48} Td (${escapePdf(line)}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n');
  pdf += `\ntrailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return { certificate, pdf: Buffer.from(pdf) };
};
