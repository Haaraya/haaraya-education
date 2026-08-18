-- ============================================================================
--  Haaraya — WRITE policies for assignments ("read this next")
--  ----------------------------------------------------------------------------
--  Run AFTER supabase/platform_rls.sql (which enables RLS on public.assignments
--  and adds the SELECT policy `assignments_visible` + the can_see_child()
--  helper) and AFTER supabase/platform_write_policies.sql.
--
--  platform_rls.sql only grants SELECT on assignments, so a teacher/parent
--  could READ a child's assignments but never CREATE one. This file adds the
--  INSERT / UPDATE / DELETE side so the teacher & parent dashboards can assign
--  a book to a child (window.HaarayaPlatformDB.assignBook / assignBookTo*).
--
--  Scope: a signed-in user may only write assignment rows for a child they can
--  already see (parent -> own child, teacher -> classroom pupil,
--  school_admin -> pupil in their school, admin -> all) — the same
--  public.can_see_child(child_id) guard as the read + progress policies.
--  Demo accounts never authenticate, so none of this touches them.
--
--  Idempotent: safe to re-run.
-- ============================================================================

-- ============================== assignments ================================
drop policy if exists assignments_insert on public.assignments;
create policy assignments_insert on public.assignments
  for insert with check ( public.can_see_child(child_id) );

drop policy if exists assignments_update on public.assignments;
create policy assignments_update on public.assignments
  for update using ( public.can_see_child(child_id) )
             with check ( public.can_see_child(child_id) );

drop policy if exists assignments_delete on public.assignments;
create policy assignments_delete on public.assignments
  for delete using ( public.can_see_child(child_id) );

-- ============================================================================
--  Grants: RLS still filters rows, but the role needs table-level privilege to
--  reach the table at all. platform_rls.sql already granted SELECT; add
--  INSERT + UPDATE + DELETE for assignments to `authenticated`.
-- ============================================================================
grant insert, update, delete on public.assignments to authenticated;

-- ============================================================================
--  Verification (run signed in as a real teacher/parent via the app):
--    -- should succeed for a child you can see:
--    insert into public.assignments (child_id, book_id, assignment_type, status)
--    values ('<a-visible-child-uuid>', '<some-book-uuid>', 'teacher', 'assigned');
--    -- should FAIL (0 rows / policy error) for a child that isn't yours.
--    delete from public.assignments where id = '<that-row-id>';
-- ============================================================================
