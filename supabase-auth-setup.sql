-- ============================================================
-- Haaraya — Supabase Auth setup
-- Run this ONCE in the Supabase SQL Editor.
-- Safe to re-run (uses IF EXISTS / OR REPLACE).
-- ============================================================

-- 1. Auto-create a public.users profile row whenever someone
--    signs up through Supabase Auth.
--    full_name / role come from the signup metadata; role
--    defaults to 'parent' for self-serve testers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (auth_uid, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'parent')
  )
  on conflict (auth_uid) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Make sure auth_uid is unique (one profile per auth user).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_auth_uid_key'
  ) then
    alter table public.users add constraint users_auth_uid_key unique (auth_uid);
  end if;
end $$;

-- 3. Row-Level Security: a signed-in user can read & update
--    ONLY their own profile row.
alter table public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (auth_uid = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (auth_uid = auth.uid())
  with check (auth_uid = auth.uid());

-- Note: no INSERT policy is needed — the trigger above runs as
-- SECURITY DEFINER and creates the row for us. Direct inserts by
-- clients are blocked, which is what we want.
