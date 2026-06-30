-- Haaraya Platform PostgreSQL Schema v1
-- Designed for Supabase/PostgreSQL. Files such as covers, audio, pages, logos, and passport backgrounds live in storage/CDN. The database stores URLs.

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent','teacher','school_admin','haaraya_admin')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE schools (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('school','church','community','homeschool_group','demo')),
    country TEXT,
    city TEXT,
    admin_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE levels (
    id BIGSERIAL PRIMARY KEY,
    level_number INTEGER UNIQUE NOT NULL,
    level_code TEXT UNIQUE NOT NULL,
    level_name TEXT NOT NULL,
    band TEXT,
    badge_color TEXT,
    sort_order INTEGER NOT NULL,
    description TEXT
);

CREATE TABLE strands (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color TEXT,
    logo_url TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    level_id BIGINT NOT NULL REFERENCES levels(id),
    strand_id BIGINT NOT NULL REFERENCES strands(id),
    book_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    book_type TEXT NOT NULL,
    sequence_position INTEGER NOT NULL,
    page_count INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    new_hfw TEXT,
    new_phonics TEXT,
    new_morpheme TEXT,
    comprehension_focus TEXT,
    reviewed_hfws TEXT,
    reviewed_phonics TEXT,
    teaching_summary TEXT,
    source_master TEXT,
    cover_image_url TEXT,
    pdf_url TEXT,
    audio_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE book_pages (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    image_url TEXT,
    text_content TEXT,
    audio_start_time NUMERIC,
    audio_end_time NUMERIC,
    UNIQUE(book_id, page_number)
);

CREATE TABLE passport_themes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    cover_image_url TEXT,
    background_image_url TEXT,
    primary_color TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE children (
    id BIGSERIAL PRIMARY KEY,
    parent_user_id BIGINT NOT NULL REFERENCES users(id),
    school_id BIGINT REFERENCES schools(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    date_of_birth DATE,
    current_level_id BIGINT NOT NULL REFERENCES levels(id),
    reading_mode TEXT NOT NULL CHECK (reading_mode IN ('automatic','choose')),
    passport_theme_id BIGINT REFERENCES passport_themes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teacher_school_links (
    teacher_user_id BIGINT NOT NULL REFERENCES users(id),
    school_id BIGINT NOT NULL REFERENCES schools(id),
    status TEXT NOT NULL DEFAULT 'active',
    PRIMARY KEY (teacher_user_id, school_id)
);

CREATE TABLE classrooms (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id),
    teacher_user_id BIGINT REFERENCES users(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE classroom_children (
    classroom_id BIGINT NOT NULL REFERENCES classrooms(id),
    child_id BIGINT NOT NULL REFERENCES children(id),
    PRIMARY KEY (classroom_id, child_id)
);

CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT REFERENCES users(id),
    school_id BIGINT REFERENCES schools(id),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('individual','family','school','sponsored','trial')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly','annual','none')),
    status TEXT NOT NULL CHECK (status IN ('active','expired','cancelled','trial')),
    max_children INTEGER,
    started_at DATE,
    expires_at DATE
);

CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,
    child_id BIGINT NOT NULL REFERENCES children(id),
    book_id BIGINT NOT NULL REFERENCES books(id),
    assigned_by_user_id BIGINT REFERENCES users(id),
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('teacher','parent','automatic','system')),
    status TEXT NOT NULL CHECK (status IN ('assigned','completed','skipped')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date DATE
);

CREATE TABLE reading_progress (
    id BIGSERIAL PRIMARY KEY,
    child_id BIGINT NOT NULL REFERENCES children(id),
    book_id BIGINT NOT NULL REFERENCES books(id),
    status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed')),
    current_page INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    times_read INTEGER NOT NULL DEFAULT 0,
    UNIQUE(child_id, book_id)
);

CREATE TABLE passport_stamps (
    id BIGSERIAL PRIMARY KEY,
    child_id BIGINT NOT NULL REFERENCES children(id),
    book_id BIGINT REFERENCES books(id),
    strand_id BIGINT REFERENCES strands(id),
    level_id BIGINT REFERENCES levels(id),
    stamp_name TEXT NOT NULL,
    stamp_type TEXT NOT NULL CHECK (stamp_type IN ('book','strand','level','challenge')),
    stamp_image_url TEXT,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sponsored_access (
    id BIGSERIAL PRIMARY KEY,
    child_id BIGINT NOT NULL REFERENCES children(id),
    sponsor_type TEXT NOT NULL CHECK (sponsor_type IN ('haaraya','donor','school','grant','community')),
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT
);

CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo','background','cover','audio','stamp','page','passport_cover')),
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_level_strand ON books(level_id, strand_id);
CREATE INDEX idx_books_sequence ON books(level_id, sequence_position);
CREATE INDEX idx_progress_child_status ON reading_progress(child_id, status);
CREATE INDEX idx_stamps_child ON passport_stamps(child_id);
CREATE INDEX idx_assignments_child ON assignments(child_id, status);

CREATE VIEW v_book_library AS
SELECT b.id, b.book_code, b.title, b.slug, l.level_code, l.level_name, l.band,
       s.name AS strand, s.color AS strand_color, b.book_type,
       b.sequence_position, b.page_count, b.word_count,
       b.cover_image_url, b.audio_url, b.pdf_url, b.is_active
FROM books b
JOIN levels l ON b.level_id = l.id
JOIN strands s ON b.strand_id = s.id;

CREATE VIEW v_child_dashboard AS
SELECT c.id AS child_id, c.display_name, l.level_code, l.level_name, c.reading_mode,
       COUNT(DISTINCT CASE WHEN rp.status = 'completed' THEN rp.id END) AS completed_books,
       COUNT(DISTINCT CASE WHEN rp.status = 'in_progress' THEN rp.id END) AS in_progress_books,
       COUNT(DISTINCT ps.id) AS stamps_earned
FROM children c
JOIN levels l ON c.current_level_id = l.id
LEFT JOIN reading_progress rp ON c.id = rp.child_id
LEFT JOIN passport_stamps ps ON c.id = ps.child_id
GROUP BY c.id, c.display_name, l.level_code, l.level_name, c.reading_mode;

CREATE VIEW v_passport_stamps AS
SELECT ps.id, c.display_name, ps.stamp_name, ps.stamp_type, b.title AS book_title,
       s.name AS strand, l.level_code, ps.stamp_image_url, ps.earned_at
FROM passport_stamps ps
JOIN children c ON ps.child_id = c.id
LEFT JOIN books b ON ps.book_id = b.id
LEFT JOIN strands s ON ps.strand_id = s.id
LEFT JOIN levels l ON ps.level_id = l.id;
