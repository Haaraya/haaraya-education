-- ============================================================================
--  Haaraya — READING SCHOLARSHIP  (SQL 4 of 4)
--  ----------------------------------------------------------------------------
--  Two things in this file:
--
--   1. public.reading_check_results — a table that did not exist. The
--      reading_checks table holds the QUESTIONS; a child's answers were never
--      stored anywhere, so we had no comprehension evidence at all. Worth
--      having on its own merits; the scholarship depends on it.
--
--   2. The scholarship itself: a family that finishes 10 books WITH the
--      reading check passed, spread over 8 separate days inside the 14-day
--      trial, earns one month free. Both counters measure the SAME rows, so
--      a "day" means a day a book was finished and its check passed — not
--      merely a day the app was opened. An additive reward, not a discount — the price
--      never looks negotiable, and the milestone measures evidence the
--      product worked rather than raw volume (which invites page-flipping).
--
--  Re-runnable. BEFORE YOU RUN: this file depends on public.can_see_child(uuid), created by
--  supabase/platform_rls.sql. Confirm it exists or the policy creation aborts:
--    select proname from pg_proc where proname = 'can_see_child';
--
--  Companion client file: scholarship.js
--  Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. The trial-window anchor. public.subscriptions has started_at/expires_at
--    (both date) and trial_ends_at, but no created_at — and nothing in the app
--    writes started_at, so there was no reliable moment the window opens from.
--    Added nullable, backfilled, then defaulted, so existing rows get a real
--    anchor instead of NULL.
-- ---------------------------------------------------------------------------
alter table public.subscriptions add column if not exists created_at timestamptz;

update public.subscriptions
   set created_at = coalesce(started_at::timestamptz, trial_ends_at - interval '14 days', now())
 where created_at is null;

alter table public.subscriptions alter column created_at set default now();
alter table public.subscriptions alter column created_at set not null;

-- The earned rate. Checkout reads this to price EVERY invoice while the
-- subscription stays active — it is deliberately never cleared. It lapses only
-- if the subscription itself is cancelled.
alter table public.subscriptions add column if not exists discount_pct integer;
alter table public.subscriptions add column if not exists discount_reason text;

-- ---------------------------------------------------------------------------
-- 1. Reading-check results. One row per attempt; `passed` is the credit.
-- ---------------------------------------------------------------------------
create table if not exists public.reading_check_results (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid,
  reader_key   text,                       -- fallback identity, as odyssey_logs uses
  book_code    text not null,
  passed       boolean not null default false,
  score        integer,                    -- questions right
  total        integer,                    -- questions asked
  created_at   timestamptz not null default now()
);

create index if not exists rcr_child_idx  on public.reading_check_results (child_id);
create index if not exists rcr_reader_idx on public.reading_check_results (reader_key);
create index if not exists rcr_book_idx   on public.reading_check_results (book_code);
create index if not exists rcr_passed_idx on public.reading_check_results (passed) where passed;

alter table public.reading_check_results enable row level security;

-- A parent/teacher may read results for children they can already see. This
-- reuses the guard the rest of the platform uses, so no new access rules.
-- NOTE: there is deliberately NO "child_id is null" escape here — that would
-- let any authenticated user read every unattributed row, on the one table
-- holding comprehension evidence.
drop policy if exists rcr_read_own on public.reading_check_results;
create policy rcr_read_own on public.reading_check_results
  for select to authenticated
  using (child_id is not null and public.can_see_child(child_id));

-- NOBODY inserts directly. The old `with check (true)` let any caller with the
-- publishable key POST rows naming any child and any back-dated timestamp —
-- which would have made the server-side re-count below worthless, since the
-- browser could forge the very evidence being counted.
drop policy if exists rcr_write on public.reading_check_results;
revoke insert on public.reading_check_results from anon, authenticated;

-- The only write path. SECURITY DEFINER, so it bypasses RLS deliberately,
-- but it stamps created_at itself and refuses a child the caller cannot see.
create or replace function public.record_reading_check(
  p_child_id uuid,
  p_book_code text,
  p_score integer default null,
  p_total integer default null,
  p_reader_key text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(p_book_code, '') = '' then
    raise exception 'book_code required';
  end if;
  -- A result must belong to a child this caller is entitled to see. No child,
  -- no row: an unattributed result counts for nothing anyway.
  if p_child_id is null or not public.can_see_child(p_child_id) then
    raise exception 'not permitted for this child';
  end if;

  insert into public.reading_check_results
    (child_id, reader_key, book_code, passed, score, total, created_at)
  values
    (p_child_id, p_reader_key, p_book_code, true, p_score, p_total, now());
end $$;

grant execute on function public.record_reading_check(uuid, text, integer, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Awards. One scholarship per owner, ever.
-- ---------------------------------------------------------------------------
create table if not exists public.scholarship_awards (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null,
  reward         text not null default 'reading_rate_50',
  books_counted  integer,
  days_counted   integer,
  granted_at     timestamptz not null default now()
);

create unique index if not exists scholarship_one_per_owner
  on public.scholarship_awards (owner_user_id);

alter table public.scholarship_awards enable row level security;

drop policy if exists scholarship_read_own on public.scholarship_awards;
create policy scholarship_read_own on public.scholarship_awards
  for select to authenticated
  using (owner_user_id in (select id from public.users where auth_uid = auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Grant the reward. Verifies the milestone SERVER-SIDE — never trust the
--    browser's arithmetic for something that costs money. Extends the current
--    subscription by a month and records the award.
-- ---------------------------------------------------------------------------
create or replace function public.grant_reading_scholarship(p_owner uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_books  integer := 0;
  v_days   integer := 0;
  v_start  timestamptz;
  v_needed_books integer := 10;
  v_needed_days  integer := 8;
  -- "Clearly reading" fallback: short of the bar, but unmistakably real use.
  -- A family here earns the same rate — the milestone rewards effort, and
  -- refusing someone who plainly read would cost more goodwill than it saves.
  v_soft_books   integer := 5;
  v_soft_days    integer := 4;
  v_window integer := 14;
  v_basis  text;
begin
  -- Only the owner (or staff) may claim for this account.
  if not exists (
    select 1 from public.users u
     where u.id = p_owner and u.auth_uid = auth.uid()
  ) then
    return json_build_object('ok', false, 'reason', 'not_owner');
  end if;

  if exists (select 1 from public.scholarship_awards where owner_user_id = p_owner) then
    return json_build_object('ok', true, 'reason', 'already_granted');
  end if;

  select min(coalesce(s.created_at, s.started_at::timestamptz)) into v_start
    from public.subscriptions s
   where s.owner_user_id = p_owner;
  if v_start is null then v_start := now() - (v_window || ' days')::interval; end if;

  -- Distinct books passed, and distinct days read, across every child on the
  -- account, inside the window.
  with kids as (
    select id from public.children where parent_user_id = p_owner
  ),
  hits as (
    select distinct r.child_id, r.book_code, date_trunc('day', r.created_at) as day
      from public.reading_check_results r
      join kids k on k.id = r.child_id
     where r.passed
       and r.created_at >= v_start
       and r.created_at < v_start + (v_window || ' days')::interval
  )
  select count(distinct (child_id::text || '|' || book_code)), count(distinct day)
    into v_books, v_days
    from hits;

  if v_books >= v_needed_books and v_days >= v_needed_days then
    v_basis := 'milestone';
  elsif v_books >= v_soft_books and v_days >= v_soft_days then
    v_basis := 'clearly_reading';
  else
    return json_build_object('ok', false, 'reason', 'not_met', 'books', v_books, 'days', v_days);
  end if;

  insert into public.scholarship_awards (owner_user_id, reward, books_counted, days_counted)
  values (p_owner, 'reading_rate_50', v_books, v_days)
  on conflict (owner_user_id) do nothing;

  -- The reward: 50% off for as long as they stay subscribed. The trial is NOT
  -- extended and nothing is free — the family converts to a paid plan, at the
  -- rate they earned, and keeps it while they keep paying.
  update public.subscriptions
     set discount_pct = 50,
         discount_reason = 'reading_rate:' || v_basis
   where owner_user_id = p_owner;

  return json_build_object('ok', true, 'books', v_books, 'days', v_days,
                           'basis', v_basis, 'reward', 'reading_rate_50', 'discount_pct', 50);
end $$;

grant execute on function public.grant_reading_scholarship(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. VERIFY
-- ---------------------------------------------------------------------------
--   select count(*) from public.reading_check_results;   -- 0 on a fresh install
--   select count(*) from public.scholarship_awards;      -- 0
--
--  After a child passes a reading check in the app, a row should appear:
--   select book_code, passed, score, total, created_at
--     from public.reading_check_results order by created_at desc limit 5;
--
--  The grant refuses politely until the milestone is genuinely met:
--   select public.grant_reading_scholarship('<a public.users.id you own>');
--   -- expect {"ok": false, "reason": "not_met", "books": n, "days": n}
