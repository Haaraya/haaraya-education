-- ============================================================================
--  Haaraya: Gemmanti worksheet records, version 2
--
--  Run AFTER gemmanti_worksheets.sql. Idempotent: safe to run more than once.
--
--  1. School and parent accounts are kept apart. Parent logins can no longer
--     read or write worksheet records, even for a child who also has a school
--     record. Families of school pupils get reports from the teacher instead.
--     Only the class teacher, the school admin and Haaraya admins have access.
--
--  2. classrooms.show_scores: the class teacher's switch for showing worksheet
--     scores, on by default. The class teacher (or the school admin) can
--     change it; the existing classroom rules already allow that.
-- ============================================================================

-- ---------- 1. score switch per class ---------------------------------------
alter table public.classrooms
  add column if not exists show_scores boolean not null default true;

-- ---------- 2. worksheet answers: staff only --------------------------------
drop policy if exists wr_read on public.worksheet_responses;
create policy wr_read on public.worksheet_responses
  for select to authenticated using (
    public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_haaraya()
  );

drop policy if exists wr_insert on public.worksheet_responses;
create policy wr_insert on public.worksheet_responses
  for insert to authenticated with check (
    public.gemmanti_child_enabled(child_id) and public.gemmanti_is_staff_for(child_id)
  );

drop policy if exists wr_update on public.worksheet_responses;
create policy wr_update on public.worksheet_responses
  for update to authenticated
  using ( public.gemmanti_is_staff_for(child_id) )
  with check ( public.gemmanti_child_enabled(child_id) and public.gemmanti_is_staff_for(child_id) );

-- ---------- 3. ratings: staff only ------------------------------------------
drop policy if exists wv_read on public.worksheet_reviews;
create policy wv_read on public.worksheet_reviews
  for select to authenticated using (
    public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_haaraya()
  );
-- (insert and update were already staff only; notes were already staff only)

-- ---------- 4. check it worked ---------------------------------------------
--  Expect: show_scores column present, and no policy mentioning parents.
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'classrooms' and column_name = 'show_scores') as show_scores_column,
  (select count(*) from pg_policies
    where schemaname = 'public'
      and tablename in ('worksheet_responses','worksheet_reviews','worksheet_teacher_notes')
      and (qual like '%gemmanti_is_parent%' or with_check like '%gemmanti_is_parent%')) as parent_rules_left;
