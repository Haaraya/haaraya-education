-- ============================================================================
--  Haaraya: Gemmanti library switch
--
--  Run AFTER gemmanti_worksheets_v2.sql. Idempotent: safe to run more than once.
--
--  classrooms.show_library: the class teacher's switch that lets pupils open
--  the Haaraya library while they do worksheets. Off by default. The class
--  teacher (or the school admin) can change it; the existing classroom rules
--  already allow that, as they do for show_scores.
-- ============================================================================

alter table public.classrooms
  add column if not exists show_library boolean not null default false;

-- Check it worked. Expect: show_library_column = 1
select count(*) as show_library_column
  from information_schema.columns
 where table_schema = 'public' and table_name = 'classrooms' and column_name = 'show_library';
