-- ============================================================================
--  Haaraya — passport nationality
--
--  "Nationality" was hardcoded to "Haaraya Reader" for every child. Parents
--  now set a real country, so it needs somewhere to live.
--
--  Run AFTER supabase/passport_details_migration.sql.
--  Idempotent; safe to re-run.
-- ============================================================================

alter table public.children add column if not exists country text;

select id, display_name, country, city, date_of_birth
from public.children
order by passport_serial;
