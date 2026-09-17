-- ============================================================================
--  Haaraya — AUTH REPAIR
--  Fixes "Database error querying schema" on sign-in / sign-up.
--
--  That error comes from the Supabase AUTH service, before any app table is
--  touched, so it breaks EVERY login — not just demo accounts. It has three
--  usual causes, and this script addresses all three. Idempotent: safe to
--  re-run.
--
--    A. the auth service lost USAGE/SELECT on the public schema
--    B. the on_auth_user_created trigger raises, so the INSERT into
--       auth.users aborts (a missing column, a NOT NULL, an RLS surprise)
--    C. a stale/duplicate trigger left behind by an earlier migration
--
--  Run in the SQL editor as the owner (the dashboard editor is fine).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. DIAGNOSE FIRST. Run this block on its own and read the output before
--    applying the rest — it tells you which cause you actually have.
-- ---------------------------------------------------------------------------
-- Triggers currently attached to auth.users (expect exactly one of ours):
--   select tgname, pg_get_triggerdef(oid) from pg_trigger
--   where tgrelid = 'auth.users'::regclass and not tgisinternal;
--
-- Does the profile table look the way the trigger expects?
--   select column_name, is_nullable, data_type
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'users' order by ordinal_position;
--
-- Grants held by the auth roles on the public schema:
--   select nspname, defaclacl from pg_default_acl;
--   select has_schema_privilege('supabase_auth_admin', 'public', 'USAGE') as auth_admin_usage,
--          has_schema_privilege('authenticator',       'public', 'USAGE') as authenticator_usage;

-- ---------------------------------------------------------------------------
-- 1. Cause A — restore the grants the auth service needs.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role, supabase_auth_admin, authenticator;
grant select on all tables in schema public to supabase_auth_admin;
grant execute on all functions in schema public to supabase_auth_admin;

-- Keep future objects working without another repair.
alter default privileges in schema public grant usage on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Cause C — remove any stale copies of the signup trigger.
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created  on auth.users;
drop trigger if exists handle_new_user       on auth.users;
drop trigger if exists create_profile_on_signup on auth.users;

-- ---------------------------------------------------------------------------
-- 3. Cause B — make the profile trigger UNABLE to break signup.
--     The old version let any error abort the INSERT into auth.users, which
--     surfaces to the client as a schema error. Now a failure is logged as a
--     warning and the account is still created; the app creates the missing
--     profile row on first read.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.users (auth_uid, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      coalesce(new.raw_user_meta_data->>'role', 'parent')
    )
    on conflict (auth_uid) do nothing;
  exception when others then
    -- Never let profile creation take the whole signup down with it.
    raise warning 'handle_new_user failed for %: % (%)', new.id, sqlerrm, sqlstate;
  end;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The trigger runs as definer, but be explicit about who may execute it.
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

-- ---------------------------------------------------------------------------
-- 4. Backfill any auth user whose profile row went missing while the trigger
--    was failing, so existing accounts can sign in and be recognised.
-- ---------------------------------------------------------------------------
insert into public.users (auth_uid, email, full_name, role)
select u.id,
       u.email,
       coalesce(u.raw_user_meta_data->>'full_name', ''),
       coalesce(u.raw_user_meta_data->>'role', 'parent')
from auth.users u
left join public.users p on p.auth_uid = u.id
where p.auth_uid is null
on conflict (auth_uid) do nothing;

-- ---------------------------------------------------------------------------
-- 5. VERIFY. Both should come back clean.
-- ---------------------------------------------------------------------------
-- Every auth user now has exactly one profile row:
--   select count(*) as auth_users, (select count(*) from public.users) as profiles from auth.users;
--
-- Only our trigger is attached:
--   select tgname from pg_trigger
--   where tgrelid = 'auth.users'::regclass and not tgisinternal;
--
-- Then try a real sign-in. If "Database error querying schema" persists,
-- open Logs -> Auth in the dashboard: the Postgres error underneath names
-- the exact object still at fault.
