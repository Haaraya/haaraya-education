-- ============================================================================
--  Haaraya — FIX: "infinite recursion detected in policy for relation schools"
--  ----------------------------------------------------------------------------
--  Cause: schools_visible read teacher_school_links, and teacher_links_visible
--  read schools -> each table's RLS re-triggered the other's -> Postgres aborts.
--
--  Fix: resolve the two membership sets inside SECURITY DEFINER helpers, which
--  run with the owner's rights and BYPASS RLS, so evaluating one policy never
--  re-enters the other. Policies then just call the helpers.
--
--  Run AFTER platform_rls.sql. Idempotent, safe to re-run.
-- ============================================================================

-- ---- schools where the current user is the school admin ----
create or replace function public.my_admin_school_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.schools where admin_user_id = public.current_user_id()
$$;

-- ---- schools the current user is linked to as a teacher ----
create or replace function public.my_teacher_school_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from public.teacher_school_links
  where teacher_user_id = public.current_user_id()
$$;

-- ============================== schools =====================================
drop policy if exists schools_visible on public.schools;
create policy schools_visible on public.schools
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or admin_user_id = public.current_user_id()
    or id in (select public.my_teacher_school_ids())
  );

-- ============================== classrooms ==================================
drop policy if exists classrooms_visible on public.classrooms;
create policy classrooms_visible on public.classrooms
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or teacher_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
    or school_id in (select public.my_teacher_school_ids())
  );

-- ============================== teacher_school_links ========================
drop policy if exists teacher_links_visible on public.teacher_school_links;
create policy teacher_links_visible on public.teacher_school_links
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or teacher_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
  );

-- ============================== subscriptions ===============================
drop policy if exists subscriptions_visible on public.subscriptions;
create policy subscriptions_visible on public.subscriptions
  for select using (
    public.current_user_role() in ('haaraya_admin','admin','staff')
    or owner_user_id = public.current_user_id()
    or school_id in (select public.my_admin_school_ids())
  );

grant execute on function public.my_admin_school_ids()   to authenticated;
grant execute on function public.my_teacher_school_ids() to authenticated;
