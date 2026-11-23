-- Haaraya: pupil logins (username + 4-digit PIN) for school pupils.
-- A pupil signs in through the pupil-signin Edge Function, which checks the
-- username and PIN here and signs them in to their own hidden Haaraya login.
-- The pupil-accounts Edge Function (staff only) creates logins and resets PINs.
-- A signed-in pupil can see and save only their own reading and stamps.

-- 1. The pupil role
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role = any (array['parent','teacher','school_admin','haaraya_admin','reviewer','pupil']));

-- 2. Link a child to their own login
alter table public.children add column if not exists pupil_user_id uuid unique references public.users(id) on delete set null;

-- 3. Usernames and PINs (staff of the pupil's school can read them to print cards)
create table if not exists public.pupil_logins (
  child_id     uuid primary key references public.children(id) on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9.]{3,40}$'),
  pin          text not null check (pin ~ '^[0-9]{4}$'),
  auth_uid     uuid unique,
  failed       int not null default 0,
  locked_until timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.pupil_logins enable row level security;
drop policy if exists pupil_logins_staff_read on public.pupil_logins;
create policy pupil_logins_staff_read on public.pupil_logins
  for select to authenticated using ( public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_haaraya() );
grant select on public.pupil_logins to authenticated;
-- No insert/update policies: only the Edge Functions (service role) write here.

-- 4. A signed-in pupil can see their own child record (and so their own reading,
--    stamps and class link, which all use can_see_child).
create or replace function public.can_see_child(cid uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.children c
    where c.id = cid and (
      public.current_user_role() in ('haaraya_admin','admin','staff')
      or c.parent_user_id = public.current_user_id()
      or (c.pupil_user_id is not null and c.pupil_user_id = public.current_user_id())
      or c.school_id in (
            select s.id from public.schools s where s.admin_user_id = public.current_user_id()
            union
            select l.school_id from public.teacher_school_links l where l.teacher_user_id = public.current_user_id()
         )
      or c.id in (
            select cc.child_id from public.classroom_children cc
            join public.classrooms cl on cl.id = cc.classroom_id
            where cl.teacher_user_id = public.current_user_id()
         )
    )
  )
$$;

-- 5. The pupil's school plan decides their library access.
create or replace function public.pupil_school_access()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('status', su.status, 'trial_ends_at', su.trial_ends_at)
  from public.children c
  join public.subscriptions su on su.school_id = c.school_id
  where c.pupil_user_id = public.current_user_id()
  order by (su.status = 'active') desc, su.trial_ends_at desc nulls last
  limit 1
$$;
grant execute on function public.pupil_school_access() to authenticated;

-- 6. The pupil-accounts and pupil-signin Edge Functions run as service_role,
--    which had no table rights here (applied as pupil_logins_service_grants).
grant select, insert, update on public.users to service_role;
grant select, update on public.children to service_role;
grant select, insert, update on public.pupil_logins to service_role;
grant select on public.schools, public.classrooms, public.classroom_children to service_role;
