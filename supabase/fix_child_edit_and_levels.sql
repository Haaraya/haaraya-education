-- ============================================================================
--  Haaraya — let a parent EDIT their own child, and diagnose the level bug
--
--  Two things:
--    1. children_owner_update restated without public.current_user_id(), for
--       the same reason the insert policy was rewritten: if that helper is not
--       reachable it evaluates to NULL and every update is silently refused.
--    2. a read-back of the levels table, which is what a chosen starting level
--       is matched against. If it is empty or unreadable, every new child
--       lands with no level and the app shows Level 1.
--
--  Idempotent; safe to re-run.
-- ============================================================================

-- ---- 1. parent (and school) may update their own child ----------------------
drop policy if exists children_owner_update on public.children;
create policy children_owner_update on public.children
  for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = children.parent_user_id
        and u.auth_uid = auth.uid()
    )
    or children.school_id in (
      select public.my_teacher_school_ids()
      union
      select public.my_admin_school_ids()
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = children.parent_user_id
        and u.auth_uid = auth.uid()
    )
    or children.school_id in (
      select public.my_teacher_school_ids()
      union
      select public.my_admin_school_ids()
    )
  );

grant update on public.children to authenticated;

-- ---- 2. levels must be readable by signed-in users --------------------------
alter table public.levels enable row level security;

drop policy if exists levels_read_all on public.levels;
create policy levels_read_all on public.levels
  for select to anon, authenticated using (true);

grant select on public.levels to anon, authenticated;

-- ---- 3. diagnose the starting-level bug -------------------------------------
--  Expect 12 rows, level_number 1..12. If this returns 0 rows, the levels
--  table was never seeded and THAT is why level 5 became level 1.
select level_number, level_name, id
from public.levels
order by level_number;
