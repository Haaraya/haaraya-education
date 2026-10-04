-- ============================================================================
-- Haaraya — weekly parent progress email                run once, idempotent
-- Needs privacy_tools.sql first (users.weekly_email, users.email_token).
--
-- 1. weekly_parent_digest()  one row per parent, last 7 days, per child:
--      books finished · quiz taken/passed/avg · days with reading ·
--      stamps · Odyssey stamps · next suggested book
-- 2. pg_cron: every Monday 07:00 UTC (08:00 Lagos) calls the Edge Function
--    weekly-parent-email. Also purges sign-in records older than 12 months
--    (promised in the privacy policy).
-- ============================================================================
begin;

create or replace function public.weekly_parent_digest()
returns table (email text, full_name text, email_token uuid, children jsonb)
language sql stable security definer set search_path = public as $$
  with since as (select now() - interval '7 days' as t)
  select u.email, u.full_name, u.email_token,
    jsonb_agg(jsonb_build_object(
      'name', coalesce(nullif(c.display_name, ''), c.first_name),
      'books', coalesce((select jsonb_agg(b.title order by rp.completed_at)
                 from reading_progress rp join books b on b.id = rp.book_id
                 where rp.child_id = c.id and rp.completed_at >= (select t from since)), '[]'::jsonb),
      'quiz_taken',  (select count(*) from reading_check_results r where r.child_id = c.id and r.created_at >= (select t from since)),
      'quiz_passed', (select count(*) from reading_check_results r where r.child_id = c.id and r.passed and r.created_at >= (select t from since)),
      'quiz_pct',    (select round(100.0 * sum(r.score) / nullif(sum(r.total), 0))
                      from reading_check_results r where r.child_id = c.id and r.created_at >= (select t from since)),
      'days', (select count(distinct d) from (
                 select rp.updated_at::date d from reading_progress rp where rp.child_id = c.id and rp.updated_at >= (select t from since)
                 union select r.created_at::date from reading_check_results r where r.child_id = c.id and r.created_at >= (select t from since)) x),
      'stamps', (select count(*) from passport_stamps s where s.child_id = c.id and s.earned_at >= (select t from since)),
      'stamps_total', (select count(*) from passport_stamps s where s.child_id = c.id),
      'odyssey', (select count(*) from odyssey_book_progress o
                  where o.status = 'complete' and o.completed_at >= (select t from since)
                    and (o.child_id = c.id or (o.child_id is null and o.user_id = u.auth_uid))),
      'next', (select jsonb_build_object('code', b.book_code, 'title', b.title)
               from books b join levels l on l.id = c.current_level_id
               where b.level::text = l.level_number::text
                 and not exists (select 1 from reading_progress rp
                                 where rp.child_id = c.id and rp.book_id = b.id and rp.status = 'completed')
               order by b.book_code limit 1)
    ) order by c.created_at) as children
  from users u
  join children c on c.parent_user_id = u.id
  where u.role = 'parent' and u.weekly_email and u.auth_uid is not null
    and u.email not ilike '%demo%'
  group by u.id, u.email, u.full_name, u.email_token
$$;
revoke all on function public.weekly_parent_digest() from public, anon, authenticated;

create or replace function public.weekly_email_unsubscribe(p_token uuid)
returns boolean language sql security definer set search_path = public as $$
  update users set weekly_email = false where email_token = p_token returning true
$$;
revoke all on function public.weekly_email_unsubscribe(uuid) from public, anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Schedule. Dashboard → Database → Extensions: enable pg_cron and pg_net.
-- Replace <PROJECT_REF> and <CRON_SECRET> (the same value you set with
-- `supabase secrets set CRON_SECRET=...`), then run this block.
-- ---------------------------------------------------------------------------
-- select cron.unschedule('weekly-parent-email') where exists (select 1 from cron.job where jobname = 'weekly-parent-email');
-- select cron.schedule('weekly-parent-email', '0 7 * * 1', $$
--   select net.http_post(
--     url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/weekly-parent-email',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
--     body    := '{}'::jsonb,
--     timeout_milliseconds := 60000)
-- $$);
--
-- select cron.schedule('purge-sign-in-events', '30 3 * * *',
--   $$ delete from public.sign_in_events where at < now() - interval '12 months' $$);

-- Checks
--   select email, jsonb_pretty(children) from public.weekly_parent_digest() limit 3;
--   select jobname, schedule from cron.job;
