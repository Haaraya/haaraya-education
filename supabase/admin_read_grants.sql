-- ============================================================
-- Haaraya — Admin owner back-end read access
-- Run in the Supabase SQL editor (service role). Idempotent.
-- ------------------------------------------------------------
-- Goal: let the owner back end (Haaraya Admin) READ the live
-- operational data, WITHOUT exposing personal data to the public.
--
--   Reference data (no PII) ....... anon + authenticated
--   Operational / personal data ... authenticated Haaraya staff ONLY,
--                                    enforced by RLS (is_haaraya_admin()).
--
-- The client already signs staff in through Supabase auth
-- (auth.js / page-review reviewer sign-in), so every admin read
-- carries the staff JWT and RLS decides row visibility.
-- ============================================================

-- ---- staff predicate -------------------------------------------------
-- True when the JWT belongs to a public.users row with role haaraya_admin.
create or replace function public.is_haaraya_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.auth_uid = auth.uid()
      and u.role = 'haaraya_admin'
  );
$$;
grant execute on function public.is_haaraya_admin() to anon, authenticated;

-- ---- 1) Reference data: safe for everyone (no PII) -------------------
grant select on public.strands       to anon, authenticated;
grant select on public.levels        to anon, authenticated;
grant select on public.odyssey_books to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['strands','levels','odyssey_books'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t||'_public_read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true);',
      t||'_public_read', t);
  end loop;
end $$;

-- ---- 2) Operational / personal data: Haaraya staff only --------------
-- Table-level privilege (fixes the 42501 permission-denied) …
grant select on
  public.users, public.children, public.schools, public.classrooms,
  public.classroom_children, public.teacher_school_links,
  public.subscriptions, public.assignments, public.reading_progress
to authenticated;

-- … and RLS so ONLY a signed-in Haaraya admin can actually read the rows.
do $$
declare t text;
begin
  foreach t in array array[
    'users','children','schools','classrooms','classroom_children',
    'teacher_school_links','subscriptions','assignments','reading_progress'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t||'_admin_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_haaraya_admin());',
      t||'_admin_read', t);
  end loop;
end $$;

-- ---- 3) Every signed-in user must be able to read their OWN users row.
-- getProfile() (auth.js) looks up public.users by auth_uid to learn the
-- caller's role. Without this self-read policy that lookup returns null,
-- so the app can never tell a Haaraya admin apart from anyone else and
-- the owner back end stays locked even after the grants above.
drop policy if exists users_read_self on public.users;
create policy users_read_self on public.users
  for select to authenticated
  using (auth_uid = auth.uid());

-- NOTE: these SELECT policies are additive. Any existing owner-scoped
-- policies (a parent reading their own children, a teacher their class)
-- keep working; this simply also lets a Haaraya admin read everything.
-- If a table had NO policies before, it was previously unreadable by
-- everyone — this migration is what turns the owner back end on.
