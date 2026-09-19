-- ============================================================================
--  Haaraya — DEPLOYMENT VERIFICATION
--  Run in the Supabase SQL editor with the limit dropdown set to "No limit".
--  Read-only: creates nothing, changes nothing. Safe to run any time.
--
--  Every row tells you whether the object a migration was supposed to create
--  actually exists in THIS database. "MISSING" means that .sql was never run
--  (or was run against a different project).
-- ============================================================================

with expected(area, kind, obj, src) as (values
  -- core dashboard schema ---------------------------------------------------
  ('core schema',        'table', 'levels',                  'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'strands',                 'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'users',                   'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'schools',                 'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'children',                'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'reading_progress',        'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'passport_stamps',         'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'classrooms',              'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'classroom_children',      'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'teacher_school_links',    'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'subscriptions',           'supabase-dashboard-tables.sql'),
  ('core schema',        'table', 'assignments',             'supabase-dashboard-tables.sql'),
  -- books / reader ----------------------------------------------------------
  ('books',              'table', 'books',                   'platform_rls.sql / reader'),
  ('books',              'table', 'book_pages',              'platform_rls.sql / reader'),
  ('books',              'table', 'book_skills',             'platform_rls.sql / reader'),
  -- auth / profile ----------------------------------------------------------
  ('auth',               'func',  'current_user_id',         'fix_add_child_rls.sql'),
  ('auth',               'func',  'current_user_role',       'fix_add_child_rls.sql'),
  ('auth',               'func',  'is_haaraya_admin',        'admin_read_grants.sql'),
  -- quiz / reading checks ---------------------------------------------------
  ('reading checks',     'table', 'reading_checks',          'quiz_schema_flat.sql'),
  ('reading checks',     'table', 'reading_check_codes',     'quiz_schema_flat.sql'),
  -- about pages -------------------------------------------------------------
  ('about',              'table', 'about_pages',             'about_deploy.sql'),
  ('about',              'table', 'about_page_codes',        'about_deploy.sql'),
  -- odyssey -----------------------------------------------------------------
  ('odyssey',            'table', 'odyssey_stages',          'odyssey_schema.sql'),
  ('odyssey',            'table', 'odyssey_books',           'odyssey_schema.sql'),
  ('odyssey',            'table', 'odyssey_book_progress',   'odyssey_schema.sql'),
  ('odyssey',            'table', 'odyssey_logs',            'supabase-odyssey-logs.sql'),
  ('odyssey',            'func',  'odyssey_logs_stamp',      'supabase-odyssey-logs.sql'),
  -- saved shelf -------------------------------------------------------------
  ('reading library',    'table', 'child_saved_books',       'reading_library.sql'),
  -- scholarship -------------------------------------------------------------
  ('scholarship',        'table', 'reading_check_results',   'scholarship.sql'),
  ('scholarship',        'table', 'scholarship_awards',      'scholarship.sql'),
  ('scholarship',        'func',  'record_reading_check',    'scholarship.sql'),
  ('scholarship',        'func',  'grant_reading_scholarship','scholarship.sql'),
  -- trial guard -------------------------------------------------------------
  ('trial guard',        'table', 'trial_claims',            'trial_guard.sql'),
  ('trial guard',        'func',  'claim_trial_check',       'trial_guard.sql'),
  ('trial guard',        'func',  'claim_trial_record',      'trial_guard.sql'),
  ('trial guard',        'func',  'clear_trial_claim',       'trial_guard.sql'),
  -- page reviews ------------------------------------------------------------
  ('page reviews',       'table', 'page_reviews',            'supabase-page-reviews.sql'),
  ('page reviews',       'func',  'is_reviewer',             'supabase-page-reviews.sql'),
  ('page reviews',       'func',  'page_reviews_stamp',      'supabase-page-reviews.sql'),
  -- device guard (account sharing) ------------------------------------------
  ('device guard',       'table', 'account_devices',         'device_guard.sql'),
  ('device guard',       'table', 'sign_in_events',          'device_guard.sql'),
  ('device guard',       'func',  'register_device',         'device_guard.sql'),
  ('device guard',       'func',  'list_my_devices',         'device_guard.sql'),
  ('device guard',       'func',  'revoke_my_device',        'device_guard.sql'),
  ('device guard',       'func',  'admin_device_report',     'device_guard.sql'),
  ('device guard',       'func',  'admin_set_device_limit',  'device_guard.sql'),
  ('device guard',       'func',  'admin_revoke_devices',    'device_guard.sql')
)
select
  e.area,
  e.kind,
  e.obj,
  case
    when e.kind = 'table' and exists (
      select 1 from information_schema.tables t
       where t.table_schema = 'public' and t.table_name = e.obj
    ) then 'ok'
    when e.kind = 'func' and exists (
      select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = e.obj
    ) then 'ok'
    else '*** MISSING ***'
  end as status,
  e.src as run_this_file
from expected e
order by
  case when (
    case
      when e.kind = 'table' and exists (
        select 1 from information_schema.tables t
         where t.table_schema='public' and t.table_name=e.obj) then 1
      when e.kind = 'func' and exists (
        select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname=e.obj) then 1
      else 0 end) = 0 then 0 else 1 end,   -- missing first
  e.area, e.kind, e.obj;


-- ============================================================================
--  PART 2 — the public SELECT grants CLAUDE.md warns about.
--  These four tables must be readable by anon + authenticated or the live
--  site shows placeholder questions / empty About pages.
-- ============================================================================

select
  c.relname                                as table_name,
  c.relrowsecurity                         as rls_on,
  coalesce(count(p.polname) filter (
    where 'anon' = any(
      select rolname from pg_roles where oid = any(p.polroles)
    ) or p.polroles = '{0}'
  ), 0)                                    as anon_select_policies,
  case when bool_or(
    has_table_privilege('anon', c.oid, 'SELECT')
  ) then 'anon has SELECT' else '*** anon CANNOT select ***' end as grant_status
from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policy p on p.polrelid = c.oid and p.polcmd in ('r','*')
where n.nspname = 'public'
  and c.relname in ('reading_checks','reading_check_codes','about_pages','about_page_codes')
group by c.relname, c.relrowsecurity, c.oid
order by c.relname;


-- ============================================================================
--  PART 3 — data sanity. Zero rows in books/reading_checks is the signature
--  of the "every book shows placeholder questions" bug.
-- ============================================================================

select 'books'               as tbl, count(*) from public.books
union all select 'book_pages',        count(*) from public.book_pages
union all select 'reading_checks',    count(*) from public.reading_checks
union all select 'reading_check_codes', count(*) from public.reading_check_codes
union all select 'about_pages',       count(*) from public.about_pages
union all select 'odyssey_books',     count(*) from public.odyssey_books
union all select 'children',          count(*) from public.children
union all select 'subscriptions',     count(*) from public.subscriptions
union all select 'trial_claims',      count(*) from public.trial_claims
order by 1;
