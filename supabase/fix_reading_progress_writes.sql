-- ============================================================================
--  Haaraya — make book completions reach the passport
--
--  Symptom: a child finishes a book, the reader shows it done, but the passport
--  never gains the stamp.
--
--  Cause: reading_progress / passport_stamps writes are gated on
--  public.can_see_child(), a SECURITY DEFINER helper. If that function is not
--  executable by the `authenticated` role it evaluates to NULL for every real
--  user, so every insert is refused — exactly the failure that hid behind
--  add-child and the levels lookup. The sync queue then retries forever and
--  the passport stays empty.
--
--  This re-creates the helper with the right ownership and grants, restates the
--  progress/stamp policies without relying on it, and re-grants the tables.
--
--  Idempotent; safe to re-run.
-- ============================================================================

-- ---- 1. the helper, correctly defined and reachable -------------------------
create or replace function public.can_see_child(cid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    -- the child's own parent
    select 1 from public.children c
    join public.users u on u.id = c.parent_user_id
    where c.id = cid and u.auth_uid = auth.uid()
  ) or exists (
    -- a teacher or admin of the child's school
    select 1 from public.children c
    join public.teacher_school_links l on l.school_id = c.school_id
    join public.users u on u.id = l.teacher_user_id
    where c.id = cid and u.auth_uid = auth.uid()
  ) or exists (
    -- Haaraya staff
    select 1 from public.users u
    where u.auth_uid = auth.uid()
      and u.role in ('haaraya_admin', 'haaraya_staff')
  )
$$;
grant execute on function public.can_see_child(uuid) to authenticated;

-- ---- 2. a parent may write progress for their own child ---------------------
--  Stated directly, so a broken helper can never silently block reading again.
create or replace function public.owns_child(cid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    join public.users u on u.id = c.parent_user_id
    where c.id = cid and u.auth_uid = auth.uid()
  )
$$;
grant execute on function public.owns_child(uuid) to authenticated;

drop policy if exists progress_insert on public.reading_progress;
create policy progress_insert on public.reading_progress
  for insert to authenticated
  with check ( public.owns_child(child_id) or public.can_see_child(child_id) );

drop policy if exists progress_update on public.reading_progress;
create policy progress_update on public.reading_progress
  for update to authenticated
  using      ( public.owns_child(child_id) or public.can_see_child(child_id) )
  with check ( public.owns_child(child_id) or public.can_see_child(child_id) );

drop policy if exists progress_visible on public.reading_progress;
create policy progress_visible on public.reading_progress
  for select to authenticated
  using ( public.owns_child(child_id) or public.can_see_child(child_id) );

drop policy if exists stamps_insert on public.passport_stamps;
create policy stamps_insert on public.passport_stamps
  for insert to authenticated
  with check ( public.owns_child(child_id) or public.can_see_child(child_id) );

drop policy if exists stamps_update on public.passport_stamps;
create policy stamps_update on public.passport_stamps
  for update to authenticated
  using      ( public.owns_child(child_id) or public.can_see_child(child_id) )
  with check ( public.owns_child(child_id) or public.can_see_child(child_id) );

drop policy if exists stamps_visible on public.passport_stamps;
create policy stamps_visible on public.passport_stamps
  for select to authenticated
  using ( public.owns_child(child_id) or public.can_see_child(child_id) );

-- ---- 3. table privileges (RLS still filters the rows) ----------------------
grant select, insert, update on public.reading_progress to authenticated;
grant select, insert, update on public.passport_stamps  to authenticated;
--  markBookComplete() resolves a book CODE to its uuid, so books must be read.
grant select on public.books to anon, authenticated;

drop policy if exists books_read_all on public.books;
create policy books_read_all on public.books
  for select to anon, authenticated using (true);

-- ---- 4. what has actually been recorded ------------------------------------
select c.display_name,
       count(*) filter (where rp.status = 'completed') as books_completed,
       count(*) filter (where rp.status = 'in_progress') as books_in_progress
from public.children c
left join public.reading_progress rp on rp.child_id = c.id
group by c.display_name
order by c.display_name;

select c.display_name, ps.stamp_type, count(*) as stamps
from public.passport_stamps ps
join public.children c on c.id = ps.child_id
group by c.display_name, ps.stamp_type
order by c.display_name;
