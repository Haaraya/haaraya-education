-- ============================================================================
--  Haaraya — write policies for registration and enrolment
--  Run AFTER supabase/enrolment_migration.sql and AFTER
--  supabase/fix_recursion_and_test.sql (the SECURITY DEFINER helpers).
--
--  Reading stays as platform_rls.sql defines it. This file only adds the
--  INSERT / UPDATE paths the app now needs, each scoped so a signed-in user
--  can only write rows they legitimately own.
--
--  Idempotent; safe to re-run.
-- ============================================================================

-- ---- helper: is the current user a teacher of this classroom? -------------
create or replace function public.teaches_classroom(p_classroom uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classrooms c
    where c.id = p_classroom
      and c.teacher_user_id = public.current_user_id()
  )
$$;
grant execute on function public.teaches_classroom(uuid) to authenticated;

-- ============================== users ======================================
--  A signed-in user may create ONLY their own profile row, and only with a
--  role that is not an admin role (no self-promotion).
drop policy if exists users_self_insert on public.users;
create policy users_self_insert on public.users
  for insert with check (
    auth_uid = auth.uid()
    and role in ('parent','teacher','school_admin')
  );

--  ...and may edit their own name/phone. Role changes are deliberately not
--  allowed here; an admin does those.
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (auth_uid = auth.uid())
  with check (auth_uid = auth.uid() and role = public.current_user_role());

-- ============================== children ===================================
--  A parent may add children to their OWN account.
drop policy if exists children_parent_insert on public.children;
create policy children_parent_insert on public.children
  for insert with check (
    parent_user_id = public.current_user_id()
  );

--  A teacher may enrol a pupil into a school they are linked to. The child is
--  school-owned (no parent login), which is why parent_user_id may be null.
drop policy if exists children_teacher_insert on public.children;
create policy children_teacher_insert on public.children
  for insert with check (
    school_id in (
      select public.my_teacher_school_ids()
      union
      select public.my_admin_school_ids()
    )
  );

--  Editing a child: their parent, their school's admin, or a teacher of the
--  school they belong to.
drop policy if exists children_owner_update on public.children;
create policy children_owner_update on public.children
  for update using (
    parent_user_id = public.current_user_id()
    or school_id in (
      select public.my_admin_school_ids()
      union
      select public.my_teacher_school_ids()
    )
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

-- ============================== schools ====================================
--  School registration: the creator must make themselves the admin.
drop policy if exists schools_self_insert on public.schools;
create policy schools_self_insert on public.schools
  for insert with check (admin_user_id = public.current_user_id());

drop policy if exists schools_admin_update on public.schools;
create policy schools_admin_update on public.schools
  for update using (
    admin_user_id = public.current_user_id()
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

-- ============================== classrooms =================================
--  You said school admins create classes and assign a teacher to each.
drop policy if exists classrooms_admin_insert on public.classrooms;
create policy classrooms_admin_insert on public.classrooms
  for insert with check (
    school_id in (select public.my_admin_school_ids())
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

drop policy if exists classrooms_admin_update on public.classrooms;
create policy classrooms_admin_update on public.classrooms
  for update using (
    school_id in (select public.my_admin_school_ids())
    or teacher_user_id = public.current_user_id()
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

-- ============================== classroom_children =========================
--  A teacher may put a pupil into their OWN class; an admin into any class in
--  their school.
drop policy if exists classroom_children_insert on public.classroom_children;
create policy classroom_children_insert on public.classroom_children
  for insert with check (
    public.teaches_classroom(classroom_id)
    or classroom_id in (
      select c.id from public.classrooms c
      where c.school_id in (select public.my_admin_school_ids())
    )
  );

drop policy if exists classroom_children_delete on public.classroom_children;
create policy classroom_children_delete on public.classroom_children
  for delete using (
    public.teaches_classroom(classroom_id)
    or classroom_id in (
      select c.id from public.classrooms c
      where c.school_id in (select public.my_admin_school_ids())
    )
  );

-- ============================== teacher_school_links =======================
--  Only a school's admin adds teachers to it.
drop policy if exists teacher_links_admin_insert on public.teacher_school_links;
create policy teacher_links_admin_insert on public.teacher_school_links
  for insert with check (
    school_id in (select public.my_admin_school_ids())
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

drop policy if exists teacher_links_admin_delete on public.teacher_school_links;
create policy teacher_links_admin_delete on public.teacher_school_links
  for delete using (
    school_id in (select public.my_admin_school_ids())
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

-- ============================== subscriptions ==============================
--  A user creates their own family subscription; a school admin their school's.
drop policy if exists subscriptions_self_insert on public.subscriptions;
create policy subscriptions_self_insert on public.subscriptions
  for insert with check (
    owner_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
  );

drop policy if exists subscriptions_self_update on public.subscriptions;
create policy subscriptions_self_update on public.subscriptions
  for update using (
    owner_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

-- ============================== access_codes ===============================
--  The codes table itself stays unreadable to ordinary users: validation and
--  consumption go through the SECURITY DEFINER functions. Admins can see the
--  codes they minted.
alter table public.access_codes enable row level security;

drop policy if exists access_codes_admin_read on public.access_codes;
create policy access_codes_admin_read on public.access_codes
  for select using (
    created_by = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

-- ---------- table-level grants ---------------------------------------------
--  RLS still filters rows; these let the role reach the tables at all.
grant insert on public.users, public.children, public.schools, public.classrooms,
                public.classroom_children, public.teacher_school_links,
                public.subscriptions
  to authenticated;

grant update on public.users, public.children, public.schools, public.classrooms,
                public.subscriptions
  to authenticated;

grant delete on public.classroom_children, public.teacher_school_links
  to authenticated;

grant select on public.access_codes to authenticated;
