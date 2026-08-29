-- ============================================================================
--  Haaraya — make the parent add-child insert reliable
--
--  Symptom this fixes:
--    "new row violates row-level security policy for table children"
--    when a signed-in parent adds a child, even though children_parent_insert
--    already exists.
--
--  Cause it removes:
--    the policy leaned on public.current_user_id(). If that helper is not
--    executable by the `authenticated` role (or cannot see the caller's
--    profile row), it evaluates to NULL, and `parent_user_id = NULL` is never
--    true — so every insert is refused with no useful message.
--
--  The rewritten policy asks the question directly instead: does the
--  parent_user_id being written belong to a profile row whose auth_uid is the
--  caller? No helper, no grants to get wrong.
--
--  Idempotent; safe to re-run.
-- ============================================================================

-- ---- 1. the policy, stated without the helper -------------------------------
drop policy if exists children_parent_insert on public.children;
create policy children_parent_insert on public.children
  for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = children.parent_user_id
        and u.auth_uid = auth.uid()
    )
  );

-- ---- 2. keep the helper working anyway, for the other policies --------------
--  current_user_id() must be SECURITY DEFINER (so it can read public.users
--  regardless of that table's own RLS) and executable by signed-in users.
create or replace function public.current_user_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select u.id from public.users u where u.auth_uid = auth.uid() limit 1
$$;
grant execute on function public.current_user_id() to authenticated;

create or replace function public.current_user_role()
returns text
language sql stable security definer set search_path = public as $$
  select u.role from public.users u where u.auth_uid = auth.uid() limit 1
$$;
grant execute on function public.current_user_role() to authenticated;

-- ---- 3. table privilege (RLS still filters the rows) ------------------------
grant insert on public.children to authenticated;

-- ---- 4. a parent must also be able to READ the child back -------------------
--  .insert().select() returns the row; without a matching SELECT policy the
--  insert succeeds but the app sees an empty result and reports failure.
drop policy if exists children_parent_read on public.children;
create policy children_parent_read on public.children
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = children.parent_user_id
        and u.auth_uid = auth.uid()
    )
  );

-- ---- 5. check it ------------------------------------------------------------
--  Both should return true. If current_user_id() is null here that is EXPECTED
--  in the SQL editor (it runs as postgres, with no auth.uid()); what matters is
--  that the policies exist.
select
  exists (select 1 from pg_policies
          where tablename = 'children' and policyname = 'children_parent_insert') as insert_policy,
  exists (select 1 from pg_policies
          where tablename = 'children' and policyname = 'children_parent_read')   as read_policy;
