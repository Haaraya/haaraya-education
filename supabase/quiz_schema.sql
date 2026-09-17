-- ============================================================================
-- Haaraya — Reading-check (quiz) schema
-- Postgres / Supabase. Covers phonics + comprehension checks for every book.
--
-- Design goals baked in from what we hit in the app:
--   1. A book is reached by DIFFERENT codes in different places
--      (new: TF-01-02 · legacy: TF-01-140 · live DB: TF-01-14). So a check
--      is resolved through an ALIAS table, not a single code column.
--   2. Browser text-to-speech says phonemes wrong (/i/ -> "eye"). Every
--      question and option therefore carries an optional *_spoken override
--      that is what actually gets read aloud. Leave it NULL to let the app
--      apply its default respelling, or type the exact sound (e.g. "ih").
-- ============================================================================

-- ---- enums -----------------------------------------------------------------
create type check_type as enum ('phonics', 'comprehension');

-- ---- one reading-check per book -------------------------------------------
create table reading_checks (
  id            uuid primary key default gen_random_uuid(),
  book_code     text not null unique,          -- canonical code (use the live DB code)
  book_title    text not null,                 -- for reference / authoring only
  level         int  not null check (level between 1 and 12),
  strand        text,                           -- e.g. 'Tafiya Fiction', 'Hafwas'
  kind          check_type not null default 'comprehension',
  write_prompt  text,                           -- optional "write the word" task
  write_answer  text,
  retry_note    text,                           -- shown when the child gets one wrong
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---- every code that should resolve to this check -------------------------
-- Insert one row per code a book might carry: new, legacy, live DB, etc.
-- The reader looks a book up here first, then loads the check.
create table reading_check_codes (
  code      text primary key,                   -- e.g. 'TF-01-14', 'TF-01-140', 'TF-01-02'
  check_id  uuid not null references reading_checks(id) on delete cascade
);
create index on reading_check_codes (check_id);

-- ---- questions (ordered) ---------------------------------------------------
create table quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  check_id       uuid not null references reading_checks(id) on delete cascade,
  ordinal        int  not null,                 -- 1, 2, 3 … order shown
  prompt         text not null,                 -- VISIBLE question text
  prompt_spoken  text,                          -- OPTIONAL: exact text to read aloud
  created_at     timestamptz not null default now(),
  unique (check_id, ordinal)
);
create index on quiz_questions (check_id);

-- ---- options (ordered, exactly one correct) --------------------------------
create table quiz_options (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references quiz_questions(id) on delete cascade,
  ordinal        int  not null,                 -- 0=A, 1=B, 2=C …
  body           text not null,                 -- VISIBLE option text
  body_spoken    text,                          -- OPTIONAL: exact text to read aloud
  is_correct     boolean not null default false,
  unique (question_id, ordinal)
);
create index on quiz_options (question_id);

-- exactly one correct option per question
create unique index one_correct_per_question
  on quiz_options (question_id)
  where is_correct;

-- ---- keep updated_at fresh -------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger reading_checks_touch
  before update on reading_checks
  for each row execute function touch_updated_at();

-- ---- row-level security (read-only to the app, writes to authors) ----------
alter table reading_checks       enable row level security;
alter table reading_check_codes  enable row level security;
alter table quiz_questions       enable row level security;
alter table quiz_options         enable row level security;

-- Anyone (incl. anon) may READ the quiz content:
create policy read_checks  on reading_checks      for select using (true);
create policy read_codes   on reading_check_codes for select using (true);
create policy read_qs      on quiz_questions      for select using (true);
create policy read_opts    on quiz_options        for select using (true);

-- Only signed-in authors may write (tighten to a role/claim as you see fit):
create policy write_checks on reading_checks      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy write_codes  on reading_check_codes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy write_qs     on quiz_questions      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy write_opts   on quiz_options        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');


-- ============================================================================
-- EXAMPLE: the "Tip" book (S-01-05), a phonics check with a spoken override.
-- ============================================================================
with c as (
  insert into reading_checks (book_code, book_title, level, strand, kind, write_prompt, write_answer, retry_note)
  values ('S-01-05', 'Tip', 1, 'Soundables', 'phonics', 'Write: tip', 'tip',
          'Tip: say each word slowly and listen for the sound.')
  returning id
),
codes as (
  insert into reading_check_codes (code, check_id)
  select code, c.id from c, (values ('S-01-05'), ('S-01-050'), ('S-01-06'), ('S-01-060')) as v(code)
  returning check_id
),
q1 as (
  insert into quiz_questions (check_id, ordinal, prompt, prompt_spoken)
  -- prompt_spoken forces the SHORT i; leave NULL to use the app default.
  select c.id, 1, 'Which word has the /i/ sound?', 'Which word has the ih sound?' from c
  returning id
)
insert into quiz_options (question_id, ordinal, body, is_correct) values
  ((select id from q1), 0, 'pat', false),
  ((select id from q1), 1, 'tap', false),
  ((select id from q1), 2, 'tip', true);
