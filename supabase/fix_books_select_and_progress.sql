-- ============================================================================
--  Haaraya — fix: reading progress was never recorded (2026-08-30)
-- ----------------------------------------------------------------------------
--  DIAGNOSIS (from the live site, signed in as a real parent):
--
--    real=true | role=parent | children=1 | activeChild=<uuid> | queued=0
--    readerHook=false | BOOKS count=0, rows=[], error=null
--
--  Two independent blockers were found:
--
--    1. CODE (fixed by deploying push-2026-08-30/tafiya-data.js):
--       the live reader never called the sync layer, so nothing was ever
--       queued for the database in the first place.
--
--    2. DATABASE (this file):
--       `select book_code from books` returns ZERO rows with NO error for a
--       signed-in user. That is RLS silently filtering everything — the table
--       has row-level security on but no SELECT policy for anon/authenticated.
--       The reader itself still worked because it loads pages through a
--       SECURITY DEFINER function, which bypasses RLS. But the app layer maps
--       a book CODE to its uuid with a plain select (platform-supabase.js
--       `bookIdByCode`), so that map came back empty and EVERY progress write
--       was thrown away as "unknown-book". The same empty join is why the
--       dashboards, passport and medals showed nothing.
--
--  The catalogue is public reference data (titles and codes, no personal
--  data), so a read-only grant to anon + authenticated is the right scope.
--  Nothing here touches user data or write permissions on children rows.
--
--  Run this whole file in the Supabase SQL editor, then run section 4 to
--  confirm, then `notify pgrst, 'reload schema';` at the bottom.
-- ============================================================================


-- ── 1. Public READ on the catalogue tables ──────────────────────────────────
-- Idempotent: drop-then-create so a re-run is safe.

alter table public.books enable row level security;
drop policy if exists "books are publicly readable" on public.books;
create policy "books are publicly readable"
  on public.books for select
  to anon, authenticated
  using (true);

alter table public.book_pages enable row level security;
drop policy if exists "book pages are publicly readable" on public.book_pages;
create policy "book pages are publicly readable"
  on public.book_pages for select
  to anon, authenticated
  using (true);

alter table public.book_skills enable row level security;
drop policy if exists "book skills are publicly readable" on public.book_skills;
create policy "book skills are publicly readable"
  on public.book_skills for select
  to anon, authenticated
  using (true);

-- Lookup ladders the dashboards join against.
alter table public.levels enable row level security;
drop policy if exists "levels are publicly readable" on public.levels;
create policy "levels are publicly readable"
  on public.levels for select
  to anon, authenticated
  using (true);

alter table public.strands enable row level security;
drop policy if exists "strands are publicly readable" on public.strands;
create policy "strands are publicly readable"
  on public.strands for select
  to anon, authenticated
  using (true);

-- Table-level grants (a policy alone is not enough if GRANT was never given).
grant select on public.books       to anon, authenticated;
grant select on public.book_pages  to anon, authenticated;
grant select on public.book_skills to anon, authenticated;
grant select on public.levels      to anon, authenticated;
grant select on public.strands     to anon, authenticated;


-- ── 2. Confirm the progress WRITE side is actually in place ─────────────────
-- `fix_reading_progress_writes` was recorded as already run, but it was never
-- provable while the books map was empty. These are idempotent, so re-running
-- costs nothing and removes the doubt.
--
-- Scope: a signed-in user may only write rows for a child they already own.

alter table public.reading_progress enable row level security;

drop policy if exists "own children reading progress insert" on public.reading_progress;
create policy "own children reading progress insert"
  on public.reading_progress for insert
  to authenticated
  with check (exists (
    select 1 from public.children c
    where c.id = reading_progress.child_id
      and c.parent_user_id = auth.uid()
  ));

drop policy if exists "own children reading progress update" on public.reading_progress;
create policy "own children reading progress update"
  on public.reading_progress for update
  to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = reading_progress.child_id
      and c.parent_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.children c
    where c.id = reading_progress.child_id
      and c.parent_user_id = auth.uid()
  ));

drop policy if exists "own children reading progress select" on public.reading_progress;
create policy "own children reading progress select"
  on public.reading_progress for select
  to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = reading_progress.child_id
      and c.parent_user_id = auth.uid()
  ));

alter table public.passport_stamps enable row level security;

drop policy if exists "own children stamps insert" on public.passport_stamps;
create policy "own children stamps insert"
  on public.passport_stamps for insert
  to authenticated
  with check (exists (
    select 1 from public.children c
    where c.id = passport_stamps.child_id
      and c.parent_user_id = auth.uid()
  ));

drop policy if exists "own children stamps select" on public.passport_stamps;
create policy "own children stamps select"
  on public.passport_stamps for select
  to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = passport_stamps.child_id
      and c.parent_user_id = auth.uid()
  ));

grant select, insert, update on public.reading_progress to authenticated;
grant select, insert         on public.passport_stamps  to authenticated;

-- The upsert path relies on one row per (child, book).
create unique index if not exists reading_progress_child_book_uniq
  on public.reading_progress (child_id, book_id);


-- ── 3. PostgREST caches policies and schema — make it re-read them ──────────
notify pgrst, 'reload schema';


-- ── 4. VERIFY (run these after the above; expected results in comments) ─────

-- Expect 30, not 0. This is the query that was returning nothing.
-- select count(*) from public.books;

-- Expect one row per catalogue table.
-- select tablename, policyname, cmd from pg_policies
--  where schemaname = 'public'
--    and tablename in ('books','book_pages','book_skills','levels','strands')
--  order by tablename;

-- Expect insert + update + select for reading_progress, insert + select for stamps.
-- select tablename, policyname, cmd from pg_policies
--  where schemaname = 'public'
--    and tablename in ('reading_progress','passport_stamps')
--  order by tablename, cmd;
