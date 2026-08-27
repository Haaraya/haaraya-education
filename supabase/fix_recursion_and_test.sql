create or replace function public.current_user_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.users where auth_uid = auth.uid() limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql stable security definer set search_path = public as $$
  select role from public.users where auth_uid = auth.uid() limit 1
$$;

create or replace function public.my_admin_school_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.schools where admin_user_id = public.current_user_id()
$$;

create or replace function public.my_teacher_school_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from public.teacher_school_links
  where teacher_user_id = public.current_user_id()
$$;

alter function public.current_user_id()        owner to postgres;
alter function public.current_user_role()      owner to postgres;
alter function public.my_admin_school_ids()    owner to postgres;
alter function public.my_teacher_school_ids()  owner to postgres;

grant execute on function public.current_user_id()       to authenticated;
grant execute on function public.current_user_role()     to authenticated;
grant execute on function public.my_admin_school_ids()   to authenticated;
grant execute on function public.my_teacher_school_ids() to authenticated;

drop policy if exists schools_visible on public.schools;
create policy schools_visible on public.schools
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or admin_user_id = public.current_user_id()
    or id in (select public.my_teacher_school_ids())
  );

drop policy if exists classrooms_visible on public.classrooms;
create policy classrooms_visible on public.classrooms
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or teacher_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
    or school_id in (select public.my_teacher_school_ids())
  );

drop policy if exists teacher_links_visible on public.teacher_school_links;
create policy teacher_links_visible on public.teacher_school_links
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or teacher_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
  );

drop policy if exists subscriptions_visible on public.subscriptions;
create policy subscriptions_visible on public.subscriptions
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or owner_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
  );

drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (
    auth_uid = auth.uid()
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

drop policy if exists users_colleague_read on public.users;
create policy users_colleague_read on public.users
  for select using (
    id in (
      select l.teacher_user_id from public.teacher_school_links l
      where l.school_id in (
        select public.my_admin_school_ids()
        union
        select public.my_teacher_school_ids()
      )
    )
  );

grant select on public.users, public.children, public.schools, public.classrooms,
                public.classroom_children, public.teacher_school_links,
                public.subscriptions, public.assignments,
                public.reading_progress, public.passport_stamps
  to authenticated;

set local role authenticated;
set local request.jwt.claims = '{"sub":"f62618ae-9d50-4889-88a8-04a17aeec3e1","role":"authenticated"}';

select id, email, role, full_name from public.users where auth_uid = auth.uid();

reset role;
