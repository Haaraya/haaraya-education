-- ============================================================================
--  Haaraya — Dashboard tables to build  (UUID version)
--  ----------------------------------------------------------------------------
--  Matches your existing style: uuid primary keys via gen_random_uuid(),
--  lowercase types, timestamptz. References your existing books.id (uuid).
--
--  You already have: books, book_pages, book_skills.
--  Run this top-to-bottom in the Supabase SQL editor (order matters for FKs).
--
--  Groups:
--    [ESSENTIAL]  — needed to light up the dashboards at all
--    [REFERENCE]  — small lookup tables (levels, strands); seed once
--    [TEACHER]    — only needed for the teacher / school dashboards
--    [OPTIONAL]   — gating, assignments — add when you need them
-- ============================================================================

create extension if not exists pgcrypto;


-- ========================= [REFERENCE] levels ==============================
-- The 12 Haaraya levels. The app currently hardcodes level names ("Tashi",
-- "Mataki"…); move them here so the dashboard + passport read real values.
create table public.levels (
    id           uuid primary key default gen_random_uuid(),
    level_number integer unique not null,   -- 1..12
    level_code   text    unique not null,   -- e.g. 'L1'
    level_name   text    not null,          -- e.g. 'Tashi'
    band         text,
    badge_color  text,                      -- hex for the level pill
    sort_order   integer not null,
    description  text
);

-- ========================= [REFERENCE] strands =============================
-- Reading strands (Tafiya Fiction, Non-Fiction, Folktale, …). The app
-- hardcodes these in STRANDS; mirror them here for a single source of truth.
create table public.strands (
    id          uuid primary key default gen_random_uuid(),
    name        text unique not null,       -- 'Tafiya Fiction'
    slug        text unique not null,       -- 'tafiya'
    color       text,                       -- hex
    logo_url    text,
    description text,
    is_active   boolean not null default true
);


-- ========================= [ESSENTIAL] users ===============================
-- Parent / teacher / admin accounts. If you adopt Supabase Auth, set
-- auth_uid = auth.users.id and drive RLS off it (see bottom of file).
create table public.users (
    id         uuid primary key default gen_random_uuid(),
    auth_uid   uuid unique,                 -- = auth.users.id  (null for demo rows)
    email      text unique not null,
    full_name  text not null,
    role       text not null check (role in ('parent','teacher','school_admin','haaraya_admin')),
    phone      text,
    created_at timestamptz not null default now()
);

-- ========================= [TEACHER] schools ===============================
-- Created before children so children.school_id can reference it.
create table public.schools (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    type          text not null check (type in ('school','church','community','homeschool_group','demo')),
    country       text,
    city          text,
    admin_user_id uuid references public.users(id),
    created_at    timestamptz not null default now()
);

-- ========================= [ESSENTIAL] children ============================
-- The child profiles every dashboard revolves around.
create table public.children (
    id               uuid primary key default gen_random_uuid(),
    parent_user_id   uuid not null references public.users(id) on delete cascade,
    school_id        uuid references public.schools(id),
    first_name       text not null,
    last_name        text not null,
    display_name     text not null,
    date_of_birth    date,
    current_level_id uuid references public.levels(id),
    reading_mode     text not null default 'automatic' check (reading_mode in ('automatic','choose')),
    avatar_url       text,
    created_at       timestamptz not null default now()
);

-- ========================= [ESSENTIAL] reading_progress ====================
-- One row per (child, book). Powers "continue reading", completion counts,
-- and which passport stamps a child has earned. (This currently lives in the
-- app's localStorage.)
create table public.reading_progress (
    id           uuid primary key default gen_random_uuid(),
    child_id     uuid not null references public.children(id) on delete cascade,
    book_id      uuid not null references public.books(id)    on delete cascade,
    status       text not null default 'not_started'
                 check (status in ('not_started','in_progress','completed')),
    current_page integer not null default 0,
    started_at   timestamptz,
    completed_at timestamptz,
    times_read   integer not null default 0,
    updated_at   timestamptz not null default now(),
    unique (child_id, book_id)
);

-- ========================= [ESSENTIAL] passport_stamps =====================
-- Earned stamps shown on the Reading Passport. A stamp can tie to a book,
-- a strand, or a whole level.
create table public.passport_stamps (
    id              uuid primary key default gen_random_uuid(),
    child_id        uuid not null references public.children(id) on delete cascade,
    book_id         uuid references public.books(id),
    strand_id       uuid references public.strands(id),
    level_id        uuid references public.levels(id),
    stamp_name      text not null,
    stamp_type      text not null check (stamp_type in ('book','strand','level','challenge')),
    stamp_image_url text,
    earned_at       timestamptz not null default now()
);


-- ========================= [TEACHER] classrooms ============================
create table public.classrooms (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references public.schools(id) on delete cascade,
    teacher_user_id uuid references public.users(id),
    name            text not null,
    created_at      timestamptz not null default now()
);

-- which children are in which classroom
create table public.classroom_children (
    classroom_id uuid not null references public.classrooms(id) on delete cascade,
    child_id     uuid not null references public.children(id)   on delete cascade,
    primary key (classroom_id, child_id)
);

-- a teacher can be linked to one or more schools
create table public.teacher_school_links (
    teacher_user_id uuid not null references public.users(id),
    school_id       uuid not null references public.schools(id),
    status          text not null default 'active',
    primary key (teacher_user_id, school_id)
);


-- ========================= [OPTIONAL] subscriptions ========================
-- Drives free-sample vs full-library gating per family / school.
create table public.subscriptions (
    id            uuid primary key default gen_random_uuid(),
    owner_user_id uuid references public.users(id),
    school_id     uuid references public.schools(id),
    plan_type     text not null check (plan_type in ('individual','family','school','sponsored','trial')),
    billing_cycle text check (billing_cycle in ('monthly','annual','none')),
    status        text not null check (status in ('active','expired','cancelled','trial')),
    max_children  integer,
    started_at    date,
    expires_at    date
);

-- ========================= [OPTIONAL] assignments ==========================
-- Teacher/parent assigns a specific book to a child ("read this next").
create table public.assignments (
    id                  uuid primary key default gen_random_uuid(),
    child_id            uuid not null references public.children(id) on delete cascade,
    book_id             uuid not null references public.books(id),
    assigned_by_user_id uuid references public.users(id),
    assignment_type     text not null check (assignment_type in ('teacher','parent','automatic','system')),
    status              text not null default 'assigned' check (status in ('assigned','completed','skipped')),
    assigned_at         timestamptz not null default now(),
    due_date            date
);


-- ========================= indexes =========================================
create index idx_progress_child_status on public.reading_progress(child_id, status);
create index idx_stamps_child          on public.passport_stamps(child_id);
create index idx_children_parent       on public.children(parent_user_id);
create index idx_classroom_children    on public.classroom_children(child_id);


-- ========================= convenience views ===============================
-- Read shapes the dashboards want; the app (or an RPC) can select from these.

create view public.v_child_dashboard as
select c.id as child_id, c.display_name, c.avatar_url,
       l.level_number, l.level_code, l.level_name,
       count(distinct case when rp.status='completed'   then rp.id end) as completed_books,
       count(distinct case when rp.status='in_progress' then rp.id end) as in_progress_books,
       count(distinct ps.id) as stamps_earned
from public.children c
left join public.levels l            on c.current_level_id = l.id
left join public.reading_progress rp on c.id = rp.child_id
left join public.passport_stamps  ps on c.id = ps.child_id
group by c.id, c.display_name, c.avatar_url, l.level_number, l.level_code, l.level_name;

create view public.v_passport_stamps as
select ps.id, ps.child_id, ps.stamp_name, ps.stamp_type,
       b.book_code, b.title as book_title,
       s.slug as strand, l.level_number, l.level_code,
       ps.stamp_image_url, ps.earned_at
from public.passport_stamps ps
left join public.books   b on ps.book_id   = b.id
left join public.strands s on ps.strand_id = s.id
left join public.levels  l on ps.level_id  = l.id;

create view public.v_continue_reading as
select rp.child_id, b.book_code, b.title, rp.status, rp.current_page, rp.updated_at
from public.reading_progress rp
join public.books b on rp.book_id = b.id
where rp.status = 'in_progress'
order by rp.updated_at desc;


-- ============================================================================
--  RLS (Row Level Security) — DECIDE AUTH FIRST, then uncomment & adapt.
--  ----------------------------------------------------------------------------
--  With Supabase Auth, link users.auth_uid = auth.uid() and gate every read so
--  a parent sees only their children, a teacher only their classrooms, etc.
--  Until auth exists, leave RLS off for a demo OR expose read-only data through
--  SECURITY DEFINER RPC functions (like your get_book_package).
-- ============================================================================
--
-- alter table public.children         enable row level security;
-- alter table public.reading_progress enable row level security;
-- alter table public.passport_stamps  enable row level security;
--
-- create policy parent_sees_own_children on public.children
--   for select using (
--     parent_user_id = (select id from public.users where auth_uid = auth.uid())
--   );
--
-- create policy child_progress_visible_to_parent on public.reading_progress
--   for select using (
--     child_id in (select id from public.children
--                  where parent_user_id = (select id from public.users where auth_uid = auth.uid()))
--   );
-- ============================================================================
