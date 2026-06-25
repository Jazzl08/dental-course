-- =============================================================================
-- DENTAL HYGIENE COURSE PLATFORM - COMPLETE DATABASE SCHEMA
-- Compatible with: Neon PostgreSQL, Supabase, standard PostgreSQL 14+
-- Generated for production use
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE: users
-- Stores all registered users / students
-- =============================================================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(255)        NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    role          VARCHAR(20)         NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'admin')),
    is_verified   BOOLEAN             NOT NULL DEFAULT FALSE,
    email_verification_token_hash VARCHAR(255),
    email_verification_expires_at TIMESTAMPTZ,
    password_reset_token_hash     VARCHAR(255),
    password_reset_expires_at     TIMESTAMPTZ,
    profile_photo_url TEXT,
    is_blocked    BOOLEAN             NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_name_length  CHECK (char_length(name) >= 2),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_role      ON users (role);
CREATE INDEX idx_users_created   ON users (created_at DESC);
CREATE INDEX idx_users_email_verify_token ON users (email_verification_token_hash);
CREATE INDEX idx_users_password_reset_token ON users (password_reset_token_hash);

COMMENT ON TABLE  users              IS 'Registered platform users and students';
COMMENT ON COLUMN users.role        IS 'student = normal user, admin = platform manager';
COMMENT ON COLUMN users.is_verified IS 'Whether the email address has been confirmed';

-- =============================================================================
-- TABLE: refresh_tokens
-- Stores JWT refresh tokens per user (allows multi-device & revocation)
-- =============================================================================
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255)    NOT NULL,
    expires_at  TIMESTAMPTZ     NOT NULL,
    ip_address  INET,
    user_agent  TEXT,
    revoked     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT refresh_tokens_token_unique UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires    ON refresh_tokens (expires_at);

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens; revoked=true means logged out or rotated';

-- =============================================================================
-- TABLE: courses
-- All available dental hygiene courses on the platform
-- =============================================================================
CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200)        NOT NULL,
    slug            VARCHAR(220)        NOT NULL,
    description     TEXT                NOT NULL,
    short_desc      VARCHAR(500),
    price_cents     INTEGER             NOT NULL
                        CHECK (price_cents >= 0),
    currency        CHAR(3)             NOT NULL DEFAULT 'EUR',
    thumbnail_url   TEXT,
    is_published    BOOLEAN             NOT NULL DEFAULT FALSE,
    duration_min    INTEGER             CHECK (duration_min > 0),
    level           VARCHAR(20)         NOT NULL DEFAULT 'beginner'
                        CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT courses_slug_unique  UNIQUE (slug),
    CONSTRAINT courses_title_length CHECK (char_length(title) >= 3)
);

CREATE INDEX idx_courses_slug        ON courses (slug);
CREATE INDEX idx_courses_published   ON courses (is_published) WHERE is_published = TRUE;
CREATE INDEX idx_courses_price       ON courses (price_cents);
CREATE INDEX idx_courses_level       ON courses (level);
CREATE INDEX idx_courses_created     ON courses (created_at DESC);

COMMENT ON TABLE  courses               IS 'Dental hygiene courses offered on the platform';
COMMENT ON COLUMN courses.price_cents   IS 'Price stored in smallest currency unit (eurocents)';
COMMENT ON COLUMN courses.slug          IS 'URL-friendly unique identifier e.g. tanden-poetsen-basics';
COMMENT ON COLUMN courses.duration_min  IS 'Total course duration in minutes';

-- =============================================================================
-- TABLE: payments
-- Tracks each payment attempt via Mollie
-- =============================================================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users   (id) ON DELETE RESTRICT,
    course_id       UUID            NOT NULL REFERENCES courses (id) ON DELETE RESTRICT,
    mollie_id       VARCHAR(100),
    amount_cents    INTEGER         NOT NULL CHECK (amount_cents >= 0),
    currency        CHAR(3)         NOT NULL DEFAULT 'EUR',
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'expired', 'refunded')),
    method          VARCHAR(50),
    checkout_url    TEXT,
    webhook_secret  VARCHAR(100),
    paid_at         TIMESTAMPTZ,
    failed_reason   TEXT,
    metadata        JSONB           NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT payments_mollie_unique UNIQUE (mollie_id)
);

CREATE INDEX idx_payments_user_id    ON payments (user_id);
CREATE INDEX idx_payments_course_id  ON payments (course_id);
CREATE INDEX idx_payments_mollie_id  ON payments (mollie_id);
CREATE INDEX idx_payments_status     ON payments (status);
CREATE INDEX idx_payments_paid_at    ON payments (paid_at DESC) WHERE paid_at IS NOT NULL;
CREATE INDEX idx_payments_created    ON payments (created_at DESC);

COMMENT ON TABLE  payments              IS 'Mollie payment records; one row per payment attempt';
COMMENT ON COLUMN payments.mollie_id   IS 'Mollie payment ID e.g. tr_xxxxx';
COMMENT ON COLUMN payments.status      IS 'Mirrors Mollie payment status';
COMMENT ON COLUMN payments.metadata    IS 'Raw Mollie webhook payload or extra info';

-- =============================================================================
-- TABLE: enrollments
-- Links a user to a course after a successful payment
-- =============================================================================
CREATE TABLE enrollments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users    (id) ON DELETE CASCADE,
    course_id    UUID         NOT NULL REFERENCES courses  (id) ON DELETE RESTRICT,
    payment_id   UUID         NOT NULL REFERENCES payments (id) ON DELETE RESTRICT,
    enrolled_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_pct SMALLINT     NOT NULL DEFAULT 0
                     CHECK (progress_pct BETWEEN 0 AND 100),
    notes        TEXT,

    CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user_id    ON enrollments (user_id);
CREATE INDEX idx_enrollments_course_id  ON enrollments (course_id);
CREATE INDEX idx_enrollments_payment_id ON enrollments (payment_id);
CREATE INDEX idx_enrollments_enrolled   ON enrollments (enrolled_at DESC);

COMMENT ON TABLE  enrollments              IS 'Active course access after successful payment';
COMMENT ON COLUMN enrollments.progress_pct IS 'Completion percentage 0-100';
COMMENT ON COLUMN enrollments.payment_id   IS 'The payment that unlocked this enrollment';

-- =============================================================================
-- TABLE: course_weeks
-- Six-week course structure and timed access
-- =============================================================================
CREATE TABLE course_weeks (
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

CREATE INDEX idx_course_weeks_course_id ON course_weeks (course_id);

-- =============================================================================
-- TABLE: lessons
-- Video, text, download, quiz, and assignment lessons
-- =============================================================================
CREATE TABLE lessons (
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

CREATE INDEX idx_lessons_week_id ON lessons (week_id);

-- =============================================================================
-- TABLE: lesson_progress
-- Tracks watched/completed lessons
-- =============================================================================
CREATE TABLE lesson_progress (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id    UUID        NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT lesson_progress_user_lesson_unique UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user_id ON lesson_progress (user_id);

-- =============================================================================
-- TABLE: quizzes and quiz questions
-- =============================================================================
CREATE TABLE quizzes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID         NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL DEFAULT 'Quiz',
    pass_pct    SMALLINT     NOT NULL DEFAULT 70 CHECK (pass_pct BETWEEN 0 AND 100),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT quizzes_lesson_unique UNIQUE (lesson_id)
);

CREATE TABLE quiz_questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id        UUID        NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
    question       TEXT        NOT NULL,
    options        JSONB       NOT NULL,
    correct_answer TEXT        NOT NULL,
    explanation    TEXT,
    position       SMALLINT    NOT NULL DEFAULT 1 CHECK (position > 0)
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);

CREATE TABLE quiz_attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    quiz_id      UUID        NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
    score        SMALLINT    NOT NULL CHECK (score >= 0),
    max_score    SMALLINT    NOT NULL CHECK (max_score >= 0),
    passed       BOOLEAN     NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts (user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);

CREATE TABLE quiz_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID     NOT NULL REFERENCES quiz_attempts (id) ON DELETE CASCADE,
    question_id UUID     NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
    answer      TEXT     NOT NULL,
    is_correct  BOOLEAN  NOT NULL DEFAULT FALSE
);

-- =============================================================================
-- TABLE: certificates
-- Generated after full course completion
-- =============================================================================
CREATE TABLE certificates (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    course_id          UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    certificate_number VARCHAR(80) NOT NULL UNIQUE,
    issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT certificates_user_course_unique UNIQUE (user_id, course_id)
);

CREATE INDEX idx_certificates_user_id ON certificates (user_id);
CREATE INDEX idx_certificates_course_id ON certificates (course_id);

-- =============================================================================
-- TABLE: email_logs
-- Audit trail for all transactional emails sent via Resend
-- =============================================================================
CREATE TABLE email_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID            REFERENCES users (id) ON DELETE SET NULL,
    to_email      VARCHAR(255)    NOT NULL,
    subject       VARCHAR(500)    NOT NULL,
        template_type VARCHAR(50)     NOT NULL
                                            CHECK (template_type IN (
                                                'registration',
                                                'verification',
                                                'welcome',
                                                'login_alert',
                                                'password_reset',
                                                'purchase_confirmation',
                                                'other'
                                            )),
    resend_id     VARCHAR(100),
    status        VARCHAR(20)     NOT NULL DEFAULT 'sent'
                      CHECK (status IN ('sent', 'failed', 'bounced')),
    error_message TEXT,
    metadata      JSONB           NOT NULL DEFAULT '{}',
    sent_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user_id  ON email_logs (user_id);
CREATE INDEX idx_email_logs_email    ON email_logs (to_email);
CREATE INDEX idx_email_logs_type     ON email_logs (template_type);
CREATE INDEX idx_email_logs_status   ON email_logs (status);
CREATE INDEX idx_email_logs_sent_at  ON email_logs (sent_at DESC);

COMMENT ON TABLE  email_logs               IS 'Audit trail for all emails sent via Resend API';
COMMENT ON COLUMN email_logs.resend_id     IS 'Resend message ID for tracking delivery';
COMMENT ON COLUMN email_logs.template_type IS 'Which email template was used';

-- =============================================================================
-- TRIGGER FUNCTION: auto-update updated_at on row changes
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_course_weeks_updated_at
    BEFORE UPDATE ON course_weeks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SEED DATA: sample courses (optional, remove in production)
-- =============================================================================
INSERT INTO courses (title, slug, description, short_desc, price_cents, currency, is_published, duration_min, level)
VALUES
    (
        'Binnen 6 Weken Gezond Tandvlees En Een Gezond Gebit',
        'binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit',
        'Een complete stap-voor-stap cursus voor mensen die hun tandvlees willen herstellen, bloedend tandvlees willen stoppen, slechte adem willen verminderen en weer een gezond gebit willen krijgen binnen 6 weken.',
        'Herstel je tandvlees en krijg weer een gezond gebit binnen 6 weken.',
        7999,
        'EUR',
        TRUE,
        360,
        'beginner'
    );

WITH course AS (
    SELECT id FROM courses WHERE slug = 'binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit'
), weeks AS (
    INSERT INTO course_weeks (course_id, week_number, title, description, unlock_after_days)
    SELECT id, 1, 'Wat is gezond tandvlees?', 'Gezond tandvlees herkennen, oorzaken van ontsteking begrijpen en een zelftest invullen.', 0 FROM course
    UNION ALL SELECT id, 2, 'Correct poetsen', 'Poetstechniek, poetshulpmiddelen, video-instructies en dagelijkse oefeningen.', 7 FROM course
    UNION ALL SELECT id, 3, 'Interdentale reiniging', 'Ragers, stokers en floss correct kiezen en gebruiken.', 14 FROM course
    UNION ALL SELECT id, 4, 'Voeding en tandvlees', 'Suikers, eetmomenten en ontstekingsbevorderende gewoontes herkennen.', 21 FROM course
    UNION ALL SELECT id, 5, 'Gewoontes verbeteren', 'Een haalbare dagelijkse routine bouwen en volhouden.', 28 FROM course
    UNION ALL SELECT id, 6, 'Onderhoud en persoonlijk plan', 'Langdurig onderhoud, evaluatie, persoonlijk plan en certificaat.', 35 FROM course
    RETURNING id, week_number
), inserted_lessons AS (
    INSERT INTO lessons (week_id, title, lesson_type, content, video_url, image_url, download_url, assignment_prompt, duration_min, position)
    SELECT id, 'Gezond tandvlees herkennen', 'video', 'Je leert kleur, bloeding, zwelling en gevoeligheid beoordelen.', 'https://player.vimeo.com/video/000000001', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99', NULL, NULL, 12, 1 FROM weeks WHERE week_number = 1
    UNION ALL SELECT id, 'Oorzaken van tandvleesontsteking', 'text', 'Gingivitis ontstaat meestal door plaque langs de tandvleesrand. Je leert welke signalen vragen om extra aandacht.', NULL, NULL, '/downloads/week-1-zelftest.pdf', 'Vul de zelftest in en noteer drie aandachtspunten.', 18, 2 FROM weeks WHERE week_number = 1
    UNION ALL SELECT id, 'Week 1 zelftest', 'quiz', 'Beantwoord de vragen om je basiskennis te controleren.', NULL, NULL, NULL, NULL, 8, 3 FROM weeks WHERE week_number = 1
    UNION ALL SELECT id, 'Poetstechniek stap voor stap', 'video', 'Leer poetsen langs de tandvleesrand zonder te hard te drukken.', 'https://player.vimeo.com/video/000000002', NULL, NULL, 'Poets twee minuten met de aangeleerde techniek en noteer waar je moeite mee hebt.', 14, 1 FROM weeks WHERE week_number = 2
    UNION ALL SELECT id, 'Elektrisch of handtandenborstel', 'text', 'Kies een borstel die past bij jouw mond, motoriek en routine.', NULL, NULL, '/downloads/week-2-poetsroutine.pdf', NULL, 10, 2 FROM weeks WHERE week_number = 2
    UNION ALL SELECT id, 'Ragers kiezen', 'video', 'Je leert de juiste ragermaat kiezen zonder het tandvlees te beschadigen.', 'https://player.vimeo.com/video/000000003', NULL, NULL, NULL, 12, 1 FROM weeks WHERE week_number = 3
    UNION ALL SELECT id, 'Interdentale quiz', 'quiz', 'Controleer of je weet wanneer ragers, floss of stokers passend zijn.', NULL, NULL, NULL, NULL, 8, 2 FROM weeks WHERE week_number = 3
    UNION ALL SELECT id, 'Voeding en ontsteking', 'text', 'Je bekijkt hoe suikerfrequentie, snacks en zure dranken je mondgezondheid beinvloeden.', NULL, NULL, '/downloads/week-4-voedingsdagboek.pdf', 'Houd drie dagen je eet- en drinkmomenten bij.', 16, 1 FROM weeks WHERE week_number = 4
    UNION ALL SELECT id, 'Routine ontwerp', 'assignment', 'Maak een ochtend- en avondroutine die realistisch voelt.', NULL, NULL, '/downloads/week-5-routinekaart.pdf', 'Plan je routine voor zeven dagen en kies een herinneringsmoment.', 20, 1 FROM weeks WHERE week_number = 5
    UNION ALL SELECT id, 'Persoonlijk onderhoudsplan', 'assignment', 'Bundel je belangrijkste gewoontes, hulpmiddelen en controles in een persoonlijk plan.', NULL, NULL, '/downloads/week-6-persoonlijk-plan.pdf', 'Maak je definitieve onderhoudsplan en rond alle lessen af voor je certificaat.', 25, 1 FROM weeks WHERE week_number = 6
    RETURNING id, title, lesson_type
), quiz_rows AS (
    INSERT INTO quizzes (lesson_id, title)
    SELECT id, title FROM inserted_lessons WHERE lesson_type = 'quiz'
    RETURNING id, title
)
INSERT INTO quiz_questions (quiz_id, question, options, correct_answer, explanation, position)
SELECT id, 'Wat veroorzaakt gingivitis meestal?', '["Te weinig plaque", "Plaque langs de tandvleesrand", "Alleen koud water", "Een witte tandkleur"]'::jsonb, 'Plaque langs de tandvleesrand', 'Plaque kan het tandvlees irriteren en ontsteking veroorzaken.', 1
FROM quiz_rows WHERE title = 'Week 1 zelftest'
UNION ALL
SELECT id, 'Wat is een alarmsignaal van tandvleesontsteking?', '["Bloedend tandvlees", "Gladde tanden", "Frisse adem", "Geen plaque"]'::jsonb, 'Bloedend tandvlees', 'Bloeding bij poetsen of reinigen is een belangrijk signaal.', 2
FROM quiz_rows WHERE title = 'Week 1 zelftest'
UNION ALL
SELECT id, 'Wanneer is een rager meestal passend?', '["Bij ruimtes tussen tanden en kiezen", "Alleen bij melktanden", "Nooit bij volwassenen", "Alleen na bleken"]'::jsonb, 'Bij ruimtes tussen tanden en kiezen', 'Een rager reinigt tussenruimtes waar de borstel niet goed komt.', 1
FROM quiz_rows WHERE title = 'Interdentale quiz';

-- =============================================================================
-- VERIFICATION QUERY (run after import to check everything is OK)
-- =============================================================================
-- SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
