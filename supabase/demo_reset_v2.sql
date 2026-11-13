-- ============================================================================
--  Haaraya: demo reset, version 2
--
--  Replaces public.reset_demo_activity() from demo_readonly.sql, which had
--  two faults:
--    * it looked for children.parent_id (the column is parent_user_id), so
--      it stopped with an error before deleting anything;
--    * it compared children to the demo users' AUTH ids instead of their
--      profile ids, and it skipped the demo school's pupils entirely.
--
--  What it clears, for demo accounts only:
--    * reading progress and passport stamps, for the demo family's children
--      AND every pupil in a demo school (schools.type = 'demo', or a school
--      whose admin is a demo account);
--    * Odyssey logs and Odyssey book progress of the demo accounts;
--    * Gemmanti worksheet answers, ratings and teacher notes for the same
--      children, when those tables exist.
--
--  What it never touches: any real account, and the demo STRUCTURE (the demo
--  accounts, school, class, children and subscriptions stay as built).
--
--  It now returns how many rows it cleared, so the admin button can say so.
--
--  Also adds public.admin_reset_demo_activity(): the same reset, callable
--  from the website, but only by a signed-in Haaraya admin.
--
--  Run in the Supabase SQL editor AFTER demo_readonly.sql. Safe to re-run.
-- ============================================================================

-- The old function returned nothing; this one returns a summary, and
-- Postgres cannot change a return type in place, so drop it first.
drop function if exists public.reset_demo_activity();

create function public.reset_demo_activity()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  demo_ids  uuid[];   -- public.users.id of demo accounts
  demo_uids uuid[];   -- auth.users.id of demo accounts
  demo_kids uuid[];   -- children belonging to the demo family or a demo school
  n int;
  t text;
  result jsonb := '{}'::jsonb;
begin
  select array_agg(id), array_agg(auth_uid)
    into demo_ids, demo_uids
    from public.users where is_demo;

  if demo_ids is null then
    return jsonb_build_object('demo_accounts', 0);
  end if;
  result := result || jsonb_build_object('demo_accounts', array_length(demo_ids, 1));

  select array_agg(c.id) into demo_kids
    from public.children c
   where c.parent_user_id = any (demo_ids)
      or c.school_id in (
           select s.id from public.schools s
            where s.type = 'demo' or s.admin_user_id = any (demo_ids)
         );
  result := result || jsonb_build_object('demo_children', coalesce(array_length(demo_kids, 1), 0));

  -- Child activity: reading, stamps, Gemmanti worksheets.
  if demo_kids is not null then
    foreach t in array array[
      'reading_progress', 'passport_stamps',
      'worksheet_responses', 'worksheet_reviews', 'worksheet_teacher_notes'
    ] loop
      if to_regclass('public.' || t) is not null then
        execute format('delete from public.%I where child_id = any ($1)', t) using demo_kids;
        get diagnostics n = row_count;
        result := result || jsonb_build_object(t, n);
      end if;
    end loop;
  end if;

  -- Account activity: Odyssey (keyed by the auth id).
  foreach t in array array['odyssey_logs', 'odyssey_book_progress'] loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I where user_id = any ($1)', t) using demo_uids;
      get diagnostics n = row_count;
      result := result || jsonb_build_object(t, n);
    end if;
  end loop;

  return result;
end $$;

revoke all on function public.reset_demo_activity() from public, anon, authenticated;
grant execute on function public.reset_demo_activity() to service_role;

-- The website's "Reset demo data" button calls this one.
create or replace function public.admin_reset_demo_activity()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(public.current_user_role(), '') <> 'haaraya_admin' then
    raise exception 'Only a Haaraya admin can reset demo data.';
  end if;
  return public.reset_demo_activity();
end $$;

revoke all on function public.admin_reset_demo_activity() from public, anon;
grant execute on function public.admin_reset_demo_activity() to authenticated;

-- ---------------------------------------------------------------------------
--  Check it: run the reset once by hand. Expect one row of JSON such as
--  {"demo_accounts": 4, "demo_children": 6, "reading_progress": 12, ...}
-- ---------------------------------------------------------------------------
select public.reset_demo_activity() as cleared;

-- ---------------------------------------------------------------------------
--  Optional: nightly safety net at 03:00 UTC (needs the pg_cron extension;
--  Database -> Extensions -> pg_cron). Run once:
--
--    select cron.schedule('reset-demo-activity', '0 3 * * *',
--                         $$select public.reset_demo_activity()$$);
-- ---------------------------------------------------------------------------
