-- ============================================================================
-- Haaraya — Reading-check (quiz) tables · DEPLOY
-- Run this ONCE in the Supabase SQL editor (service role). Creates the two
-- tables the app reads at runtime via odyssey-quiz-supabase.js, plus RLS
-- (public read, authenticated write). Flat shape = one row per book's check,
-- mirroring the authoring CSV so a re-import is a straight column load.
--
-- After this, load content with quiz_seed.sql (generated from the CSV).
-- ============================================================================

-- check_type enum (guarded so re-runs don't error)
do $$ begin
  create type check_type as enum ('phonics', 'comprehension');
exception when duplicate_object then null; end $$;

-- One reading-check per book. Correct answer stored as 0/1/2 (A/B/C).
create table if not exists reading_checks (
  id            uuid primary key default gen_random_uuid(),
  book_code     text not null unique,          -- canonical code (use the live DB code)
  book_title    text not null,
  level         int  not null check (level between 1 and 12),
  strand        text,
  kind          check_type not null default 'comprehension',

  q1_text       text not null,
  q1_spoken     text,
  q1_a          text not null, q1_a_spoken text,
  q1_b          text not null, q1_b_spoken text,
  q1_c          text not null, q1_c_spoken text,
  q1_correct    smallint not null check (q1_correct between 0 and 2),

  q2_text       text not null,
  q2_spoken     text,
  q2_a          text not null, q2_a_spoken text,
  q2_b          text not null, q2_b_spoken text,
  q2_c          text not null, q2_c_spoken text,
  q2_correct    smallint not null check (q2_correct between 0 and 2),

  q3_text       text not null,
  q3_spoken     text,
  q3_a          text not null, q3_a_spoken text,
  q3_b          text not null, q3_b_spoken text,
  q3_c          text not null, q3_c_spoken text,
  q3_correct    smallint not null check (q3_correct between 0 and 2),

  write_prompt  text,
  write_answer  text,
  retry_note    text,

  -- Ant-hunt bonus (optional; blank question = no bonus for this book).
  -- Not part of the reading score — pure fun.
  ant_bonus_question text,
  ant_bonus_a        text,
  ant_bonus_b        text,
  ant_bonus_c        text,
  ant_bonus_correct  smallint check (ant_bonus_correct between 0 and 2),
  ant_bonus_note     text,
  ant_pages          text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Every code that resolves to a check: new · legacy · live DB. One row per code.
create table if not exists reading_check_codes (
  code      text primary key,
  check_id  uuid not null references reading_checks(id) on delete cascade
);
create index if not exists reading_check_codes_check_id_idx on reading_check_codes (check_id);

-- Additive migration for databases created before the ant hunt existed.
alter table reading_checks add column if not exists ant_bonus_question text;
alter table reading_checks add column if not exists ant_bonus_a        text;
alter table reading_checks add column if not exists ant_bonus_b        text;
alter table reading_checks add column if not exists ant_bonus_c        text;
alter table reading_checks add column if not exists ant_bonus_correct  smallint;
alter table reading_checks add column if not exists ant_bonus_note     text;
alter table reading_checks add column if not exists ant_pages          text;

-- keep updated_at fresh
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists reading_checks_touch on reading_checks;
create trigger reading_checks_touch
  before update on reading_checks
  for each row execute function touch_updated_at();

-- RLS: public read (the app uses the publishable key), authenticated write.
alter table reading_checks      enable row level security;
alter table reading_check_codes enable row level security;

drop policy if exists read_checks  on reading_checks;
drop policy if exists read_codes   on reading_check_codes;
drop policy if exists write_checks on reading_checks;
drop policy if exists write_codes  on reading_check_codes;

create policy read_checks  on reading_checks      for select using (true);
create policy read_codes   on reading_check_codes for select using (true);
create policy write_checks on reading_checks      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy write_codes  on reading_check_codes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Sanity after seeding:
--   select count(*) from reading_checks;                                    -- 1 per book
--   select code from reading_check_codes group by code having count(*) > 1; -- expect 0 rows
