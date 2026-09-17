-- ============================================================================
-- Haaraya — Reading-check (quiz) schema · FLAT / CSV-shaped
-- Postgres / Supabase. One row per book's check, mirroring the authoring CSV
-- (Q1_A/Q1_B/Q1_C/Q1_Correct …) so import is a straight column load.
--
-- Two things carried over from the app problems we hit:
--   1. A book is reached by DIFFERENT codes in different places
--      (new TF-01-02 · legacy TF-01-140 · live DB TF-01-14). Codes resolve
--      through the reading_check_codes ALIAS table, not one code column.
--   2. Browser TTS mis-says phonemes (/i/ -> "eye"). Every question/option has
--      an optional *_spoken column = the exact text to read aloud. NULL means
--      "use the app's default respelling".
-- ============================================================================

create type check_type as enum ('phonics', 'comprehension');

-- correct answer stored as 0/1/2 (A/B/C). Kept flexible up to 3 options.
create table reading_checks (
  id            uuid primary key default gen_random_uuid(),
  book_code     text not null unique,          -- canonical code (use the live DB code)
  book_title    text not null,
  level         int  not null check (level between 1 and 12),
  strand        text,
  kind          check_type not null default 'comprehension',

  -- Q1
  q1_text       text not null,
  q1_spoken     text,                           -- optional read-aloud override
  q1_a          text not null,
  q1_a_spoken   text,
  q1_b          text not null,
  q1_b_spoken   text,
  q1_c          text not null,
  q1_c_spoken   text,
  q1_correct    smallint not null check (q1_correct between 0 and 2),

  -- Q2
  q2_text       text not null,
  q2_spoken     text,
  q2_a          text not null,
  q2_a_spoken   text,
  q2_b          text not null,
  q2_b_spoken   text,
  q2_c          text not null,
  q2_c_spoken   text,
  q2_correct    smallint not null check (q2_correct between 0 and 2),

  -- Q3
  q3_text       text not null,
  q3_spoken     text,
  q3_a          text not null,
  q3_a_spoken   text,
  q3_b          text not null,
  q3_b_spoken   text,
  q3_c          text not null,
  q3_c_spoken   text,
  q3_correct    smallint not null check (q3_correct between 0 and 2),

  -- optional "write the word" task
  write_prompt  text,
  write_answer  text,
  retry_note    text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Every code that should resolve to a check: new, legacy, live DB, …
-- One row per code. This is the fix for the code-mismatch bug.
create table reading_check_codes (
  code      text primary key,                   -- e.g. 'TF-01-14', 'TF-01-140', 'TF-01-02'
  check_id  uuid not null references reading_checks(id) on delete cascade
);
create index on reading_check_codes (check_id);

-- keep updated_at fresh
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger reading_checks_touch
  before update on reading_checks
  for each row execute function touch_updated_at();

-- RLS: public read, authenticated write (tighten write to your author role)
alter table reading_checks      enable row level security;
alter table reading_check_codes enable row level security;
create policy read_checks  on reading_checks      for select using (true);
create policy read_codes   on reading_check_codes for select using (true);
create policy write_checks on reading_checks      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy write_codes  on reading_check_codes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');


-- ============================================================================
-- STAGING + IMPORT
-- Load the CSV into a staging table whose columns match the CSV headers
-- exactly, then fan out into reading_checks + reading_check_codes.
-- ============================================================================

create table stg_quiz (
  book_code        text,   -- new code
  legacy_book_code text,   -- legacy code
  db_book_code     text,   -- live DB code (legacy minus trailing 0), optional
  book_title       text,
  level            int,
  strand           text,
  check_type       text,
  q1_text text, q1_spoken text, q1_a text, q1_a_spoken text, q1_b text, q1_b_spoken text, q1_c text, q1_c_spoken text, q1_correct text,
  q2_text text, q2_spoken text, q2_a text, q2_a_spoken text, q2_b text, q2_b_spoken text, q2_c text, q2_c_spoken text, q2_correct text,
  q3_text text, q3_spoken text, q3_a text, q3_a_spoken text, q3_b text, q3_b_spoken text, q3_c text, q3_c_spoken text, q3_correct text,
  write_prompt text, write_answer text, retry_note text
);

-- \copy stg_quiz from 'quizzes.csv' with (format csv, header true);
--   (in the Supabase dashboard use the table import UI instead)

-- Correct answers may be authored as A/B/C or 0/1/2 — normalise to 0/1/2:
create or replace function ans_to_int(v text) returns smallint as $$
begin
  return case upper(trim(v))
    when 'A' then 0 when 'B' then 1 when 'C' then 2
    else v::smallint end;
end;
$$ language plpgsql immutable;

-- Fan staging -> checks
insert into reading_checks (
  book_code, book_title, level, strand, kind,
  q1_text,q1_spoken,q1_a,q1_a_spoken,q1_b,q1_b_spoken,q1_c,q1_c_spoken,q1_correct,
  q2_text,q2_spoken,q2_a,q2_a_spoken,q2_b,q2_b_spoken,q2_c,q2_c_spoken,q2_correct,
  q3_text,q3_spoken,q3_a,q3_a_spoken,q3_b,q3_b_spoken,q3_c,q3_c_spoken,q3_correct,
  write_prompt, write_answer, retry_note)
select
  coalesce(nullif(db_book_code,''), book_code),   -- canonical = DB code if present
  book_title, level, strand, coalesce(nullif(check_type,''),'comprehension')::check_type,
  q1_text,nullif(q1_spoken,''),q1_a,nullif(q1_a_spoken,''),q1_b,nullif(q1_b_spoken,''),q1_c,nullif(q1_c_spoken,''),ans_to_int(q1_correct),
  q2_text,nullif(q2_spoken,''),q2_a,nullif(q2_a_spoken,''),q2_b,nullif(q2_b_spoken,''),q2_c,nullif(q2_c_spoken,''),ans_to_int(q2_correct),
  q3_text,nullif(q3_spoken,''),q3_a,nullif(q3_a_spoken,''),q3_b,nullif(q3_b_spoken,''),q3_c,nullif(q3_c_spoken,''),ans_to_int(q3_correct),
  nullif(write_prompt,''), nullif(write_answer,''), nullif(retry_note,'')
from stg_quiz;

-- Fan staging -> codes (new + legacy + db, de-duplicated, blanks skipped)
insert into reading_check_codes (code, check_id)
select code, rc.id
from stg_quiz s
join reading_checks rc
  on rc.book_code = coalesce(nullif(s.db_book_code,''), s.book_code)
cross join lateral (values (s.book_code), (s.legacy_book_code), (s.db_book_code)) as v(code)
where nullif(code,'') is not null
on conflict (code) do nothing;

-- Sanity checks after import:
--   select count(*) from reading_checks;                         -- expect 1 per book
--   select code from reading_check_codes group by code having count(*) > 1;  -- expect 0
--   select book_code from reading_checks r
--     where not exists (select 1 from reading_check_codes c where c.check_id = r.id);  -- expect 0
