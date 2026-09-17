-- ============================================================================
-- Haaraya — FIX: grant public READ on the quiz + about content tables.
--
-- Symptom: the live app showed auto-generated placeholder reading checks
-- ("Which book did you just finish reading?") and placeholder About pages for
-- EVERY book. Cause: the deploy scripts enabled RLS and created SELECT policies
-- (using (true)) but never GRANTed table privileges to the anon/authenticated
-- roles the publishable key runs as. Postgres needs BOTH a permissive RLS
-- policy AND a table GRANT; without the grant, PostgREST returns
-- "permission denied for table ...", so odyssey-quiz-supabase.js / about-supabase.js
-- get null and the reader falls back to generated samples.
--
-- Run ONCE in the Supabase SQL editor (service role). Idempotent.
-- ============================================================================

grant usage  on schema public to anon, authenticated;

-- Reading checks (the quiz the reader serves after each book)
grant select on reading_checks      to anon, authenticated;
grant select on reading_check_codes to anon, authenticated;

-- "About this book" front-matter content
grant select on about_pages         to anon, authenticated;
grant select on about_page_codes    to anon, authenticated;

-- (Writes stay restricted to authenticated authors via the existing RLS policies.)

-- ---- verify: run as anon should now return rows, not an error ---------------
--   set role anon;
--   select count(*) from reading_checks;        -- expect 469
--   select count(*) from reading_check_codes;   -- expect > 469 (aliases)
--   select count(*) from about_pages;           -- expect 1 per book
--   reset role;
