-- ============================================================================
--  Haaraya — WRITE policies for reading progress + passport stamps
--  ----------------------------------------------------------------------------
--  Run AFTER supabase/platform_rls.sql (which enables RLS + adds the SELECT
--  policies and the can_see_child() helper). platform_rls.sql only grants
--  SELECT, so the app could READ dashboards but never WRITE a child's reading
--  progress. This file adds the INSERT / UPDATE side so the reader can push
--  real progress + earned stamps back to the DB (window.HaarayaProgressSync).
--
--  Scope: a signed-in user may only write rows for a child they can already
--  see (parent -> own child, teacher -> classroom pupil, admin -> all), reusing
--  the same public.can_see_child(child_id) guard as the read policies. Demo
--  accounts never authenticate, so none of this touches them.
--
--  Idempotent: safe to re-run.
-- ============================================================================

-- ============================== reading_progress ===========================
drop policy if exists progress_insert on public.reading_progress;
create policy progress_insert on public.reading_progress
  for insert with check ( public.can_see_child(child_id) );

drop policy if exists progress_update on public.reading_progress;
create policy progress_update on public.reading_progress
  for update using ( public.can_see_child(child_id) )
             with check ( public.can_see_child(child_id) );

-- ============================== passport_stamps ============================
drop policy if exists stamps_insert on public.passport_stamps;
create policy stamps_insert on public.passport_stamps
  for insert with check ( public.can_see_child(child_id) );

drop policy if exists stamps_update on public.passport_stamps;
create policy stamps_update on public.passport_stamps
  for update using ( public.can_see_child(child_id) )
            with check ( public.can_see_child(child_id) );

-- ============================================================================
--  Grants: RLS still filters rows, but the role needs table-level privilege
--  to reach the table at all. platform_rls.sql already granted SELECT; add
--  INSERT + UPDATE for the two progress tables to `authenticated`.
-- ============================================================================
grant insert, update on public.reading_progress to authenticated;
grant insert, update on public.passport_stamps  to authenticated;

-- ============================================================================
--  Verification (run signed in as a real parent via the app):
--    -- should succeed for one of your own children:
--    insert into public.reading_progress (child_id, book_id, status)
--    values ('<your-child-uuid>', '<some-book-uuid>', 'in_progress')
--    on conflict (child_id, book_id) do update set status = excluded.status;
--    -- should FAIL (0 rows / policy error) for a child that isn't yours.
-- ============================================================================
