-- ============================================================================
--  Haaraya — DEMO ACCOUNTS AS REAL SUPABASE ACCOUNTS
--  ----------------------------------------------------------------------------
--  Makes the "Explore a demo account" logins real Supabase users backed by real
--  rows, so a demo shows exactly what the live webapp shows. After this, the app
--  has ONE data path (Supabase) — no mock/localStorage fork.
--
--  Creates (all with fixed UUIDs, so re-running is safe / idempotent):
--    * 3 auth users + public.users profiles
--        demo.parent@haaraya-demo.com   password: HaarayaDemo1!   (parent)
--        demo.teacher@haaraya-demo.com  password: HaarayaDemo1!   (teacher)
--        demo.school@haaraya-demo.com   password: HaarayaDemo1!   (school_admin)
--    * 1 demo school, 1 classroom, 7 pupils (2 of them the demo parent's)
--    * teacher<->school link, a school subscription
--    * reading progress + passport stamps for the demo reader
--    * a few assignments
--
--  The demo CHILD view needs no account of its own: children read under the
--  parent session (the app signs in the demo parent and opens the child screen).
--
--  Run AFTER the platform schema + platform_rls.sql + platform_rls_recursion_fix.sql.
--  Schema reference: supabase-dashboard-tables.sql (uuid PKs; note the CHECK
--  constraints on schools.type, users.role, reading_progress.status,
--  passport_stamps.stamp_type, subscriptions.plan_type/status and
--  assignments.assignment_type/status — values below are chosen to satisfy them).
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================== fixed ids ===================================
--  auth.users            public.users
--  parent  a…01          b…01
--  teacher a…02          b…02
--  school  a…03          b…03
-- ============================================================================

-- ---------- 1. auth users (idempotent: only inserted when absent) ----------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
select v.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       v.email, crypt('HaarayaDemo1!', gen_salt('bf')),
       now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', v.full_name)
from (values
  ('aaaa0000-0000-4000-8000-000000000001'::uuid, 'demo.parent@haaraya-demo.com',  'Demo Parent'),
  ('aaaa0000-0000-4000-8000-000000000002'::uuid, 'demo.teacher@haaraya-demo.com', 'Demo Teacher'),
  ('aaaa0000-0000-4000-8000-000000000003'::uuid, 'demo.school@haaraya-demo.com',  'Demo School Admin')
) as v(id, email, full_name)
where not exists (select 1 from auth.users u where u.email = v.email);

-- Keep the password + confirmation in sync if the rows already existed.
update auth.users set
  encrypted_password = crypt('HaarayaDemo1!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email in ('demo.parent@haaraya-demo.com','demo.teacher@haaraya-demo.com','demo.school@haaraya-demo.com');

-- ---------- 2. auth identities (required for email sign-in) ----------------
insert into auth.identities (
  id, user_id, provider, provider_id, identity_data, created_at, updated_at
)
select gen_random_uuid(), u.id, 'email', u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now()
from auth.users u
where u.email in ('demo.parent@haaraya-demo.com','demo.teacher@haaraya-demo.com','demo.school@haaraya-demo.com')
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );

-- ---------- 3. public.users profiles --------------------------------------
insert into public.users (id, auth_uid, email, full_name, role)
values
  ('bbbb0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-000000000001', 'demo.parent@haaraya-demo.com',  'Demo Parent',       'parent'),
  ('bbbb0000-0000-4000-8000-000000000002', 'aaaa0000-0000-4000-8000-000000000002', 'demo.teacher@haaraya-demo.com', 'Demo Teacher',      'teacher'),
  ('bbbb0000-0000-4000-8000-000000000003', 'aaaa0000-0000-4000-8000-000000000003', 'demo.school@haaraya-demo.com',  'Demo School Admin', 'school_admin')
on conflict (id) do update set
  auth_uid = excluded.auth_uid, email = excluded.email,
  full_name = excluded.full_name, role = excluded.role;

-- Profile-only guardian (no login) to own the demo classmates: children.parent_user_id
-- is NOT NULL, and keeping them off the demo parent leaves the family view at 2.
insert into public.users (id, auth_uid, email, full_name, role)
values ('bbbb0000-0000-4000-8000-000000000004', null, 'demo.guardian@haaraya-demo.com', 'Demo Guardian', 'parent')
on conflict (id) do update set
  email = excluded.email, full_name = excluded.full_name, role = excluded.role;

-- ---------- 4. school, classroom, links, subscription ---------------------
insert into public.schools (id, name, type, city, country, admin_user_id)
values ('cccc0000-0000-4000-8000-000000000001', 'Haaraya Demo Primary', 'demo', 'Abuja', 'Nigeria',
        'bbbb0000-0000-4000-8000-000000000003')
on conflict (id) do update set
  name = excluded.name, type = excluded.type, city = excluded.city,
  country = excluded.country, admin_user_id = excluded.admin_user_id;

insert into public.teacher_school_links (teacher_user_id, school_id, status)
select 'bbbb0000-0000-4000-8000-000000000002', 'cccc0000-0000-4000-8000-000000000001', 'active'
where not exists (
  select 1 from public.teacher_school_links
  where teacher_user_id = 'bbbb0000-0000-4000-8000-000000000002'
    and school_id = 'cccc0000-0000-4000-8000-000000000001'
);

insert into public.classrooms (id, name, school_id, teacher_user_id)
values ('dddd0000-0000-4000-8000-000000000001', 'Primary 3 · Demo',
        'cccc0000-0000-4000-8000-000000000001', 'bbbb0000-0000-4000-8000-000000000002')
on conflict (id) do update set
  name = excluded.name, school_id = excluded.school_id,
  teacher_user_id = excluded.teacher_user_id;

insert into public.subscriptions (id, school_id, plan_type, billing_cycle, status)
values ('ffff0000-0000-4000-8000-000000000001', 'cccc0000-0000-4000-8000-000000000001', 'school', 'annual', 'active')
on conflict (id) do update set
  school_id = excluded.school_id, plan_type = excluded.plan_type,
  billing_cycle = excluded.billing_cycle, status = excluded.status;

-- Family plan for the demo PARENT: getSubscription() reads owner_user_id, so
-- without this the demo family view is gated down to free samples.
insert into public.subscriptions (id, owner_user_id, plan_type, billing_cycle, status, max_children)
values ('ffff0000-0000-4000-8000-000000000002', 'bbbb0000-0000-4000-8000-000000000001', 'family', 'annual', 'active', 4)
on conflict (id) do update set
  owner_user_id = excluded.owner_user_id, plan_type = excluded.plan_type,
  billing_cycle = excluded.billing_cycle, status = excluded.status,
  max_children = excluded.max_children;

-- ---------- 5. pupils -----------------------------------------------------
--  The first two belong to the demo PARENT (family view); all seven sit in the
--  demo classroom (teacher + school views).
insert into public.children
  (id, first_name, last_name, display_name, parent_user_id, school_id, current_level_id, reading_mode)
select v.id, v.first_name, v.last_name, v.display_name, v.parent_user_id,
       'cccc0000-0000-4000-8000-000000000001',
       (select l.id from public.levels l where l.level_number = v.level_number limit 1),
       'automatic'
from (values
  ('eeee0000-0000-4000-8000-000000000001'::uuid, 'Amina',  'Bello',   'Amina Bello',   'bbbb0000-0000-4000-8000-000000000001'::uuid, 7),
  ('eeee0000-0000-4000-8000-000000000002'::uuid, 'Tunde',  'Bello',   'Tunde Bello',   'bbbb0000-0000-4000-8000-000000000001'::uuid, 4),
  ('eeee0000-0000-4000-8000-000000000003'::uuid, 'Chidi',  'Okafor',  'Chidi Okafor',  'bbbb0000-0000-4000-8000-000000000004'::uuid, 6),
  ('eeee0000-0000-4000-8000-000000000004'::uuid, 'Ngozi',  'Eze',     'Ngozi Eze',     'bbbb0000-0000-4000-8000-000000000004'::uuid, 5),
  ('eeee0000-0000-4000-8000-000000000005'::uuid, 'Yusuf',  'Sani',    'Yusuf Sani',    'bbbb0000-0000-4000-8000-000000000004'::uuid, 3),
  ('eeee0000-0000-4000-8000-000000000006'::uuid, 'Halima', 'Musa',    'Halima Musa',   'bbbb0000-0000-4000-8000-000000000004'::uuid, 8),
  ('eeee0000-0000-4000-8000-000000000007'::uuid, 'Emeka',  'Nwosu',   'Emeka Nwosu',   'bbbb0000-0000-4000-8000-000000000004'::uuid, 2)
) as v(id, first_name, last_name, display_name, parent_user_id, level_number)
on conflict (id) do update set
  first_name = excluded.first_name, last_name = excluded.last_name,
  display_name = excluded.display_name, parent_user_id = excluded.parent_user_id,
  school_id = excluded.school_id, current_level_id = excluded.current_level_id;

insert into public.classroom_children (classroom_id, child_id)
select 'dddd0000-0000-4000-8000-000000000001', c.id
from public.children c
where c.school_id = 'cccc0000-0000-4000-8000-000000000001'
  and not exists (
    select 1 from public.classroom_children cc
    where cc.classroom_id = 'dddd0000-0000-4000-8000-000000000001' and cc.child_id = c.id
  );

-- ---------- 6. reading history for the demo reader (Amina) ----------------
--  Completes the first 18 catalogue books by level/code so the passport, level
--  bar and "continue reading" all have real, live figures to show.
with picked as (
  select b.id, row_number() over (order by b.level::int nulls last, b.book_code) as rn
  from public.books b
  limit 20
)
insert into public.reading_progress
  (child_id, book_id, status, current_page, times_read, started_at, completed_at, updated_at)
select 'eeee0000-0000-4000-8000-000000000001', p.id,
       case when p.rn <= 18 then 'completed' else 'in_progress' end,
       case when p.rn <= 18 then 0 else 3 end,
       case when p.rn <= 18 then 1 else 0 end,
       now() - (p.rn || ' days')::interval,
       case when p.rn <= 18 then now() - (p.rn || ' days')::interval else null end,
       now() - (p.rn || ' days')::interval
from picked p
on conflict (child_id, book_id) do update set
  status = excluded.status, current_page = excluded.current_page,
  times_read = excluded.times_read, completed_at = excluded.completed_at,
  updated_at = excluded.updated_at;

insert into public.passport_stamps
  (child_id, book_id, stamp_name, stamp_type, earned_at)
select rp.child_id, rp.book_id, coalesce(b.title, 'Book stamp'), 'book', rp.completed_at
from public.reading_progress rp
join public.books b on b.id = rp.book_id
where rp.child_id = 'eeee0000-0000-4000-8000-000000000001'
  and rp.status = 'completed'
  and not exists (
    select 1 from public.passport_stamps ps
    where ps.child_id = rp.child_id and ps.book_id = rp.book_id and ps.stamp_type = 'book'
  );

-- ---------- 7. a few teacher assignments ---------------------------------
--  Picks 3 books, preferring ones the demo reader hasn't completed. A hard
--  `offset 18` broke here when the catalogue was exactly 18 books long.
with ranked as (
  select b.id,
         row_number() over (order by b.level::int nulls last, b.book_code) as ord,
         exists (
           select 1 from public.reading_progress rp
           where rp.child_id = 'eeee0000-0000-4000-8000-000000000001'
             and rp.book_id = b.id and rp.status = 'completed'
         ) as already_read
  from public.books b
), nextbooks as (
  select id, row_number() over (order by already_read, ord desc) as rn
  from ranked
  limit 3
), targets as (
  select c.id as child_id, row_number() over (order by c.first_name) as crn
  from public.children c
  where c.school_id = 'cccc0000-0000-4000-8000-000000000001'
)
insert into public.assignments
  (child_id, book_id, assigned_by_user_id, assignment_type, status, assigned_at, due_date)
select t.child_id, n.id, 'bbbb0000-0000-4000-8000-000000000002',
       'teacher', 'assigned', now() - (n.rn || ' days')::interval,
       (now() + interval '7 days')::date
from targets t
join nextbooks n on n.rn = 1 + (t.crn % 3)
where not exists (
  select 1 from public.assignments a
  where a.child_id = t.child_id and a.book_id = n.id
);

-- ---------- 8. verification ------------------------------------------------
--  Every row below should be non-zero. If `books` is 0 the catalogue tables
--  haven't been loaded yet and steps 6-7 seeded nothing.
select 'auth users'        as what, count(*) from auth.users where email like 'demo.%@haaraya-demo.com'
union all select 'profiles',        count(*) from public.users    where email like 'demo.%@haaraya-demo.com'
union all select 'pupils',          count(*) from public.children where school_id = 'cccc0000-0000-4000-8000-000000000001'
union all select 'classroom seats', count(*) from public.classroom_children where classroom_id = 'dddd0000-0000-4000-8000-000000000001'
union all select 'subscriptions',   count(*) from public.subscriptions where id in ('ffff0000-0000-4000-8000-000000000001','ffff0000-0000-4000-8000-000000000002')
union all select 'books completed', count(*) from public.reading_progress where child_id = 'eeee0000-0000-4000-8000-000000000001' and status = 'completed'
union all select 'passport stamps', count(*) from public.passport_stamps  where child_id = 'eeee0000-0000-4000-8000-000000000001'
union all select 'assignments',     count(*) from public.assignments a join public.children c on c.id = a.child_id where c.school_id = 'cccc0000-0000-4000-8000-000000000001';
