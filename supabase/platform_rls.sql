-- ============================================================================
--  Haaraya — Row-Level Security for the platform (dashboard) tables
--  ----------------------------------------------------------------------------
--  Run AFTER supabase-dashboard-tables.sql (the tables must exist) and AFTER
--  supabase-auth-setup.sql (which creates public.users + the auth trigger).
--
--  These policies make platform-supabase.js (window.HaarayaPlatformDB) safe:
--  a signed-in PARENT sees only their own children + those children's progress,
--  a TEACHER only their classrooms' pupils, a SCHOOL_ADMIN only their school.
--  Demo accounts never authenticate, so they never see any of these rows —
--  they stay entirely on the in-memory mock (data/api.js).
--
--  Reference lookups (levels, strands, books) stay world-readable — they are
--  catalogue data with no personal information (grants at the bottom).
--
--  Idempotent: safe to re-run. Uses helper functions so policies stay short.
-- ============================================================================

-- ---- helper: the public.users.id for the current auth session ----
create or replace function public.current_user_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.users where auth_uid = auth.uid() limit 1
$$;

-- ---- helper: current user's role ----
create or replace function public.current_user_role()
returns text
language sql stable security definer set search_path = public as $$
  select role from public.users where auth_uid = auth.uid() limit 1
$$;

-- ---- helper: schools where the current user is the school admin ----
--  SECURITY DEFINER so these membership lookups BYPASS RLS and never let the
--  schools / teacher_school_links policies re-trigger each other (recursion).
create or replace function public.my_admin_school_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.schools where admin_user_id = public.current_user_id()
$$;

-- ---- helper: schools the current user is linked to as a teacher ----
create or replace function public.my_teacher_school_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from public.teacher_school_links
  where teacher_user_id = public.current_user_id()
$$;

-- ---- helper: is the given child owned/visible by the current user? ----
--  parent  -> owns the child
--  teacher -> child is in one of their classrooms
--  school_admin -> child is in their school
--  haaraya_admin/staff -> all
create or replace function public.can_see_child(cid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    where c.id = cid and (
      public.current_user_role() in ('haaraya_admin','admin','staff')
      or c.parent_user_id = public.current_user_id()
      or c.school_id in (
            select public.my_admin_school_ids()
            union
            select public.my_teacher_school_ids()
         )
      or c.id in (
            select cc.child_id from public.classroom_children cc
            join public.classrooms cl on cl.id = cc.classroom_id
            where cl.teacher_user_id = public.current_user_id()
         )
    )
  )
$$;

-- ============================== enable RLS ==================================
alter table public.users                enable row level security;
alter table public.children             enable row level security;
alter table public.schools              enable row level security;
alter table public.classrooms           enable row level security;
alter table public.classroom_children   enable row level security;
alter table public.teacher_school_links enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.assignments          enable row level security;
alter table public.reading_progress     enable row level security;
alter table public.passport_stamps      enable row level security;

-- ============================== users ======================================
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (
    auth_uid = auth.uid()
    or public.current_user_role() in ('haaraya_admin','admin','staff')
  );

-- Let teacher/admin dashboards read the (name,email,role) of colleagues in
-- their own school. Kept read-only.
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

-- ============================== children ====================================
drop policy if exists children_visible on public.children;
create policy children_visible on public.children
  for select using ( public.can_see_child(id) );

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
    or school_id in (
      select public.my_admin_school_ids()
      union
      select public.my_teacher_school_ids()
    )
  );

-- ============================== classroom_children ==========================
drop policy if exists classroom_children_visible on public.classroom_children;
create policy classroom_children_visible on public.classroom_children
  for select using ( public.can_see_child(child_id) );

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

-- ============================== assignments =================================
drop policy if exists assignments_visible on public.assignments;
create policy assignments_visible on public.assignments
  for select using ( public.can_see_child(child_id) );

-- ============================== reading_progress ============================
drop policy if exists progress_visible on public.reading_progress;
create policy progress_visible on public.reading_progress
  for select using ( public.can_see_child(child_id) );

-- ============================== passport_stamps =============================
drop policy if exists stamps_visible on public.passport_stamps;
create policy stamps_visible on public.passport_stamps
  for select using ( public.can_see_child(child_id) );


-- ============================================================================
--  Reference / catalogue tables stay world-readable (no personal data).
--  platform-supabase.js reads levels, strands and books to translate ids and
--  count level totals. Grant SELECT to anon + authenticated.
-- ============================================================================
grant select on public.levels  to anon, authenticated;
grant select on public.strands to anon, authenticated;
grant select on public.books   to anon, authenticated;

-- Reminder: also grant SELECT on the RLS-guarded tables to `authenticated`
-- (RLS still filters rows; the grant lets the role reach the table at all).
grant select on public.users, public.children, public.schools, public.classrooms,
                public.classroom_children, public.teacher_school_links,
                public.subscriptions, public.assignments,
                public.reading_progress, public.passport_stamps
  to authenticated;

-- ============================================================================
--  Quick verification (run signed in as a real parent via the app, or with a
--  JWT in the SQL editor's "Run as" set to that user):
--    select * from public.children;          -- only your own children
--    select * from public.reading_progress;  -- only your children's rows
--  As anon these should all return 0 rows.
-- ============================================================================
