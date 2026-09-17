-- ============================================================================
--  Haaraya — READ-ONLY DEMO ACCOUNTS
--  ----------------------------------------------------------------------------
--  The four demo logins (reader / parent / teacher / school admin) are real
--  Supabase accounts on real rows, which is what makes a demo honest. It also
--  means any visitor can DELETE a child or scribble over a log entry and spoil
--  the demo for everyone after them.
--
--  So demo sessions are locked at the database level, in two tiers:
--
--    STRUCTURE is read-only  — children, schools, classrooms, subscriptions,
--      assignments, profiles. Nobody can delete the demo family or rename the
--      school, so the demo always looks the way you built it.
--    ACTIVITY stays writable — reading progress, passport stamps, Odyssey
--      progress and Captain's Log entries. A visitor must be able to actually
--      read a book and earn a stamp, or the demo shows nothing worth seeing.
--      public.reset_demo_activity() puts these back to the seeded state; run
--      it on a nightly schedule (Integrations -> Cron).
--
--  Enforced in Postgres, not in the UI, so it holds even if someone calls the
--  API directly.
--
--  Run AFTER supabase/demo_accounts_seed.sql. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Who is a demo user? Flag it on the profile row, so the check is one
--    lookup and a demo can be promoted/demoted without a code change.
-- ---------------------------------------------------------------------------
alter table public.users add column if not exists is_demo boolean not null default false;

update public.users
   set is_demo = true
 where lower(email) in (
   -- must match DEMO_LOGINS in app.jsx
   'demo.parent@haaraya-demo.com',   -- also backs the Demo Reader (child) view
   'demo.teacher@haaraya-demo.com',
   'demo.school@haaraya-demo.com'
 );

create or replace function public.is_demo_session()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select u.is_demo from public.users u where u.auth_uid = auth.uid()),
    false
  );
$$;

grant execute on function public.is_demo_session() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Refuse writes from a demo session on every table a demo can reach.
--    A RESTRICTIVE policy ANDs with the existing permissive ones, so the
--    ownership rules already in place stay exactly as they are — this only
--    subtracts.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  -- STRUCTURAL tables only. Activity tables are deliberately absent so a
  -- demo visitor can still read, earn stamps and write a log entry.
  tables text[] := array[
    'children', 'schools', 'classrooms', 'subscriptions', 'assignments', 'users'
  ];
begin
  foreach t in array tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('alter table public.%I enable row level security', t);

      execute format('drop policy if exists %I on public.%I', 'demo_no_insert_' || t, t);
      execute format(
        'create policy %I on public.%I as restrictive for insert to authenticated with check (not public.is_demo_session())',
        'demo_no_insert_' || t, t);

      execute format('drop policy if exists %I on public.%I', 'demo_no_update_' || t, t);
      execute format(
        'create policy %I on public.%I as restrictive for update to authenticated using (not public.is_demo_session())',
        'demo_no_update_' || t, t);

      execute format('drop policy if exists %I on public.%I', 'demo_no_delete_' || t, t);
      execute format(
        'create policy %I on public.%I as restrictive for delete to authenticated using (not public.is_demo_session())',
        'demo_no_delete_' || t, t);

      raise notice 'demo write-block applied to public.%', t;
    else
      raise notice 'skipped public.% (table not present)', t;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Nightly reset of demo ACTIVITY, so wear and tear doesn't accumulate.
--    Wipes what demo visitors generated; leaves the seeded structure alone.
-- ---------------------------------------------------------------------------
create or replace function public.reset_demo_activity()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  demo_uids uuid[];
  demo_kids uuid[];
begin
  select array_agg(auth_uid) into demo_uids from public.users where is_demo;
  if demo_uids is null then return; end if;

  select array_agg(id) into demo_kids
    from public.children
   where parent_id = any (demo_uids);

  if demo_kids is not null then
    delete from public.reading_progress where child_id = any (demo_kids);
    delete from public.passport_stamps  where child_id = any (demo_kids);
  end if;

  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'odyssey_logs') then
    delete from public.odyssey_logs where user_id = any (demo_uids);
  end if;

  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'odyssey_book_progress') then
    delete from public.odyssey_book_progress where user_id = any (demo_uids);
  end if;

  raise notice 'demo activity reset for % account(s)', array_length(demo_uids, 1);
end $$;

revoke all on function public.reset_demo_activity() from public, anon, authenticated;
grant execute on function public.reset_demo_activity() to service_role;

-- Schedule nightly (pg_cron; enable the extension first if it isn't on):
--   select cron.schedule('reset-demo-activity', '0 3 * * *',
--                        $$select public.reset_demo_activity()$$);

-- ---------------------------------------------------------------------------
-- 4. VERIFY
-- ---------------------------------------------------------------------------
-- The four demo users are flagged:
--   select email, is_demo from public.users where is_demo;
--
-- The restrictive policies exist:
--   select tablename, policyname, permissive, cmd from pg_policies
--   where schemaname = 'public' and policyname like 'demo_no_%' order by tablename, cmd;
--
-- Then, signed in AS a demo account:
--   this must FAIL with a policy violation
--     insert into public.children (parent_user_id, display_name) values (auth.uid(), 'Nope');
--   and reading a book / earning a stamp must still SUCCEED, with the
--   dashboard rendering normally throughout.
--
-- Reset by hand any time (service role):
--   select public.reset_demo_activity();
