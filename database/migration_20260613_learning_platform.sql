CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_cents_check;
ALTER TABLE payments ADD CONSTRAINT payments_amount_cents_check CHECK (amount_cents >= 0);

CREATE TABLE IF NOT EXISTS course_weeks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         UUID         NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    week_number       SMALLINT     NOT NULL CHECK (week_number > 0),
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    unlock_after_days INTEGER      NOT NULL DEFAULT 0 CHECK (unlock_after_days >= 0),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT course_weeks_course_week_unique UNIQUE (course_id, week_number)
);

CREATE TABLE IF NOT EXISTS lessons (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id           UUID         NOT NULL REFERENCES course_weeks (id) ON DELETE CASCADE,
    title             VARCHAR(200) NOT NULL,
    lesson_type       VARCHAR(20)  NOT NULL DEFAULT 'text'
                         CHECK (lesson_type IN ('video', 'text', 'download', 'quiz', 'assignment')),
    content           TEXT,
    video_url         TEXT,
    image_url         TEXT,
    download_url      TEXT,
    assignment_prompt TEXT,
    duration_min      INTEGER      CHECK (duration_min > 0),
    position          SMALLINT     NOT NULL CHECK (position > 0),
    is_preview        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT lessons_week_position_unique UNIQUE (week_id, position)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id    UUID        NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lesson_progress_user_lesson_unique UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID         NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL DEFAULT 'Quiz',
    pass_pct    SMALLINT     NOT NULL DEFAULT 70 CHECK (pass_pct BETWEEN 0 AND 100),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT quizzes_lesson_unique UNIQUE (lesson_id)
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id        UUID        NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
    question       TEXT        NOT NULL,
    options        JSONB       NOT NULL,
    correct_answer TEXT        NOT NULL,
    explanation    TEXT,
    position       SMALLINT    NOT NULL DEFAULT 1 CHECK (position > 0)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    quiz_id      UUID        NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
    score        SMALLINT    NOT NULL CHECK (score >= 0),
    max_score    SMALLINT    NOT NULL CHECK (max_score >= 0),
    passed       BOOLEAN     NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID     NOT NULL REFERENCES quiz_attempts (id) ON DELETE CASCADE,
    question_id UUID     NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
    answer      TEXT     NOT NULL,
    is_correct  BOOLEAN  NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS certificates (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    course_id          UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    certificate_number VARCHAR(80) NOT NULL UNIQUE,
    issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT certificates_user_course_unique UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_weeks_course_id ON course_weeks (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_week_id ON lessons (week_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates (course_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_course_weeks_updated_at') THEN
    CREATE TRIGGER trg_course_weeks_updated_at
      BEFORE UPDATE ON course_weeks
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lessons_updated_at') THEN
    CREATE TRIGGER trg_lessons_updated_at
      BEFORE UPDATE ON lessons
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

WITH course AS (
    SELECT id FROM courses WHERE slug = 'binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit'
), week_seed AS (
    SELECT * FROM (VALUES
      (1, 'Wat is gezond tandvlees?', 'Gezond tandvlees herkennen, oorzaken van ontsteking begrijpen en een zelftest invullen.', 0),
      (2, 'Correct poetsen', 'Poetstechniek, poetshulpmiddelen, video-instructies en dagelijkse oefeningen.', 7),
      (3, 'Interdentale reiniging', 'Ragers, stokers en floss correct kiezen en gebruiken.', 14),
      (4, 'Voeding en tandvlees', 'Suikers, eetmomenten en ontstekingsbevorderende gewoontes herkennen.', 21),
      (5, 'Gewoontes verbeteren', 'Een haalbare dagelijkse routine bouwen en volhouden.', 28),
      (6, 'Onderhoud en persoonlijk plan', 'Langdurig onderhoud, evaluatie, persoonlijk plan en certificaat.', 35)
    ) AS seed(week_number, title, description, unlock_after_days)
)
INSERT INTO course_weeks (course_id, week_number, title, description, unlock_after_days)
SELECT course.id, seed.week_number, seed.title, seed.description, seed.unlock_after_days
FROM course CROSS JOIN week_seed seed
ON CONFLICT (course_id, week_number) DO NOTHING;

WITH lesson_seed AS (
    SELECT * FROM (VALUES
      (1, 1, 'Gezond tandvlees herkennen', 'video', 'Je leert kleur, bloeding, zwelling en gevoeligheid beoordelen.', 'https://player.vimeo.com/video/000000001', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99', NULL, NULL, 12),
      (1, 2, 'Oorzaken van tandvleesontsteking', 'text', 'Gingivitis ontstaat meestal door plaque langs de tandvleesrand. Je leert welke signalen vragen om extra aandacht.', NULL, NULL, '/downloads/week-1-zelftest.pdf', 'Vul de zelftest in en noteer drie aandachtspunten.', 18),
      (1, 3, 'Week 1 zelftest', 'quiz', 'Beantwoord de vragen om je basiskennis te controleren.', NULL, NULL, NULL, NULL, 8),
      (2, 1, 'Poetstechniek stap voor stap', 'video', 'Leer poetsen langs de tandvleesrand zonder te hard te drukken.', 'https://player.vimeo.com/video/000000002', NULL, NULL, 'Poets twee minuten met de aangeleerde techniek en noteer waar je moeite mee hebt.', 14),
      (2, 2, 'Elektrisch of handtandenborstel', 'text', 'Kies een borstel die past bij jouw mond, motoriek en routine.', NULL, NULL, '/downloads/week-2-poetsroutine.pdf', NULL, 10),
      (3, 1, 'Ragers kiezen', 'video', 'Je leert de juiste ragermaat kiezen zonder het tandvlees te beschadigen.', 'https://player.vimeo.com/video/000000003', NULL, NULL, NULL, 12),
      (3, 2, 'Interdentale quiz', 'quiz', 'Controleer of je weet wanneer ragers, floss of stokers passend zijn.', NULL, NULL, NULL, NULL, 8),
      (4, 1, 'Voeding en ontsteking', 'text', 'Je bekijkt hoe suikerfrequentie, snacks en zure dranken je mondgezondheid beinvloeden.', NULL, NULL, '/downloads/week-4-voedingsdagboek.pdf', 'Houd drie dagen je eet- en drinkmomenten bij.', 16),
      (5, 1, 'Routine ontwerp', 'assignment', 'Maak een ochtend- en avondroutine die realistisch voelt.', NULL, NULL, '/downloads/week-5-routinekaart.pdf', 'Plan je routine voor zeven dagen en kies een herinneringsmoment.', 20),
      (6, 1, 'Persoonlijk onderhoudsplan', 'assignment', 'Bundel je belangrijkste gewoontes, hulpmiddelen en controles in een persoonlijk plan.', NULL, NULL, '/downloads/week-6-persoonlijk-plan.pdf', 'Maak je definitieve onderhoudsplan en rond alle lessen af voor je certificaat.', 25)
    ) AS seed(week_number, position, title, lesson_type, content, video_url, image_url, download_url, assignment_prompt, duration_min)
), target_weeks AS (
    SELECT cw.id, cw.week_number
    FROM course_weeks cw
    JOIN courses c ON c.id = cw.course_id
    WHERE c.slug = 'binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit'
), inserted AS (
    INSERT INTO lessons (week_id, title, lesson_type, content, video_url, image_url, download_url, assignment_prompt, duration_min, position)
    SELECT tw.id, seed.title, seed.lesson_type, seed.content, seed.video_url, seed.image_url, seed.download_url, seed.assignment_prompt, seed.duration_min, seed.position
    FROM lesson_seed seed
    JOIN target_weeks tw ON tw.week_number = seed.week_number
    ON CONFLICT (week_id, position) DO NOTHING
    RETURNING id, title, lesson_type
)
INSERT INTO quizzes (lesson_id, title)
SELECT l.id, l.title
FROM lessons l
JOIN course_weeks cw ON cw.id = l.week_id
JOIN courses c ON c.id = cw.course_id
WHERE c.slug = 'binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit'
  AND l.lesson_type = 'quiz'
ON CONFLICT (lesson_id) DO NOTHING;

WITH quiz_targets AS (
    SELECT q.id, l.title
    FROM quizzes q
    JOIN lessons l ON l.id = q.lesson_id
), question_seed AS (
    SELECT * FROM (VALUES
      ('Week 1 zelftest', 1, 'Wat veroorzaakt gingivitis meestal?', '["Te weinig plaque", "Plaque langs de tandvleesrand", "Alleen koud water", "Een witte tandkleur"]'::jsonb, 'Plaque langs de tandvleesrand', 'Plaque kan het tandvlees irriteren en ontsteking veroorzaken.'),
      ('Week 1 zelftest', 2, 'Wat is een alarmsignaal van tandvleesontsteking?', '["Bloedend tandvlees", "Gladde tanden", "Frisse adem", "Geen plaque"]'::jsonb, 'Bloedend tandvlees', 'Bloeding bij poetsen of reinigen is een belangrijk signaal.'),
      ('Interdentale quiz', 1, 'Wanneer is een rager meestal passend?', '["Bij ruimtes tussen tanden en kiezen", "Alleen bij melktanden", "Nooit bij volwassenen", "Alleen na bleken"]'::jsonb, 'Bij ruimtes tussen tanden en kiezen', 'Een rager reinigt tussenruimtes waar de borstel niet goed komt.')
    ) AS seed(lesson_title, position, question, options, correct_answer, explanation)
)
INSERT INTO quiz_questions (quiz_id, question, options, correct_answer, explanation, position)
SELECT qt.id, seed.question, seed.options, seed.correct_answer, seed.explanation, seed.position
FROM question_seed seed
JOIN quiz_targets qt ON qt.title = seed.lesson_title
WHERE NOT EXISTS (
  SELECT 1 FROM quiz_questions qq
  WHERE qq.quiz_id = qt.id AND qq.position = seed.position
);
