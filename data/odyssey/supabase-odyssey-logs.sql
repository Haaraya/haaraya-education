-- ============================================================
--  Haaraya Odyssey — Shipmate Scribe  ·  odyssey_logs
--  "The Captain speaks. The Shipmate writes."
--  Run once in the Supabase SQL editor.
--
--  Stores BOTH:
--    raw_captain_notes  — the child's own answers (assessment evidence)
--    spun_log_entry     — the playful adventure log (child delight)
--
--  One row per child per book (unique on reader_key + book_code),
--  so re-logging a book updates the same entry and bumps `version`.
-- ============================================================

create table if not exists public.odyssey_logs (
  id                  uuid primary key default gen_random_uuid(),

  -- who + which book -----------------------------------------
  reader_key          text not null,             -- stable per-child key (auth uid or demo child)
  user_id             uuid,                       -- auth.uid() when signed in (stamped by trigger)
  child_id            text,                       -- profile / demo child id
  odyssey_id          text not null default '100_book_odyssey_2026',
  book_code           text not null,              -- e.g. 'H-01-04' or 'book_012'
  book_number         int,                        -- 1..100 (optional)
  book_title          text,
  date_finished       date not null default current_date,

  -- 1) raw evidence (child's own words) ----------------------
  raw_captain_notes   jsonb not null default '{}'::jsonb,

  -- 2) the spun adventure log --------------------------------
  spun_log_entry      jsonb,                      -- { title, text, shipmate_note }
  voice_level         text default 'younger_reader',  -- younger_reader | older_reader
  person              text default 'first',       -- first | third
  version             int  not null default 1,

  -- teacher / parent assessment signals ----------------------
  completion_status   text default 'in_progress', -- in_progress | complete
  comprehension_signal text default 'unknown',    -- thin | adequate | strong | unknown
  needs_review        boolean default false,

  updated_at          timestamptz not null default now(),
  unique (reader_key, book_code)
);

create index if not exists odyssey_logs_reader_idx on public.odyssey_logs (reader_key);
create index if not exists odyssey_logs_user_idx   on public.odyssey_logs (user_id);
create index if not exists odyssey_logs_review_idx on public.odyssey_logs (needs_review) where needs_review;

-- ------------------------------------------------------------
--  Stamp user_id + updated_at server-side on every write.
-- ------------------------------------------------------------
create or replace function public.odyssey_logs_stamp()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null then new.user_id := auth.uid(); end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists odyssey_logs_stamp on public.odyssey_logs;
create trigger odyssey_logs_stamp
  before insert or update on public.odyssey_logs
  for each row execute function public.odyssey_logs_stamp();

-- ------------------------------------------------------------
--  Row-Level Security
--  A reader owns their own logs. Two ways to be the owner:
--    • signed in  → user_id = auth.uid()
--    • demo/child → reader_key carries the child key (prototype)
--  Reviewers/teachers (is_reviewer()) may read all logs for
--  assessment. Public/anon cannot read other children's logs.
-- ------------------------------------------------------------
alter table public.odyssey_logs enable row level security;

drop policy if exists "odyssey_logs owner read"   on public.odyssey_logs;
drop policy if exists "odyssey_logs owner write"   on public.odyssey_logs;
drop policy if exists "odyssey_logs owner update"  on public.odyssey_logs;
drop policy if exists "odyssey_logs reviewer read" on public.odyssey_logs;

-- Signed-in reader: full control over their own rows.
create policy "odyssey_logs owner read"
  on public.odyssey_logs for select
  to authenticated
  using (user_id = auth.uid());

create policy "odyssey_logs owner write"
  on public.odyssey_logs for insert
  to authenticated
  with check (true);

create policy "odyssey_logs owner update"
  on public.odyssey_logs for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Teachers / reviewers: read everything for assessment.
-- (is_reviewer() is defined in supabase-page-reviews.sql)
create policy "odyssey_logs reviewer read"
  on public.odyssey_logs for select
  to authenticated
  using (public.is_reviewer());

-- ------------------------------------------------------------
--  Prototype/demo note:
--  The public demo (no real auth) writes with the publishable key.
--  If you want the *unsigned* demo child to read back its own logs
--  during testing, add this permissive anon policy — REMOVE it for
--  production so children can't read each other's notes:
--
--    create policy "odyssey_logs demo anon"
--      on public.odyssey_logs for all to anon
--      using (true) with check (true);
-- ------------------------------------------------------------

-- ------------------------------------------------------------
--  Teacher assessment view: raw notes + signals, newest first.
--  security_invoker => reviewer-only RLS still applies.
-- ------------------------------------------------------------
drop view if exists public.odyssey_logs_assessment;
create view public.odyssey_logs_assessment
  with (security_invoker = on)
as
  select reader_key, child_id, book_code, book_number, book_title,
         date_finished, raw_captain_notes,
         completion_status, comprehension_signal, needs_review, updated_at
  from public.odyssey_logs
  order by updated_at desc;
