-- ===========================================================================
-- Haaraya — trial expiry hygiene
-- ---------------------------------------------------------------------------
-- public.subscriptions rows are written once at signup (status 'trial',
-- trial_ends_at = now() + 14 days) and never touched again, so an elapsed
-- trial still reads status='trial'. The app now computes entitlement from
-- status + trial_ends_at (see access.js), which is correct either way — but
-- dashboards and exports that only read `status` show a trial that ended
-- weeks ago as live. This settles the stored value too.
--
-- SAFE TO RE-RUN. Touches only rows whose trial window has closed.
-- ===========================================================================

-- 1. One-off backfill: close every trial whose window has passed.
update public.subscriptions
   set status = 'expired'
 where status = 'trial'
   and trial_ends_at is not null
   and trial_ends_at < now();

-- 2. What the app reads. Matches access.js exactly, so the client gate and any
--    server-side check agree. (subscription_is_active(uuid) already exists from
--    enrolment_migration.sql; this is the row-level view of the same rule.)
create or replace view public.subscription_entitlement as
select
  s.id,
  s.owner_user_id,
  s.school_id,
  s.plan_type,
  s.status,
  s.trial_ends_at,
  case
    when s.status = 'active' then true
    when s.status = 'trial'  then coalesce(s.trial_ends_at, now()) > now()
    else false
  end as is_entitled
from public.subscriptions s;

grant select on public.subscription_entitlement to anon, authenticated;

-- 3. Sanity check — run this after, expect zero rows.
-- select id, status, trial_ends_at from public.subscriptions
--  where status = 'trial' and trial_ends_at < now();
