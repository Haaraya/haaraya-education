-- ============================================================================
-- Haaraya — FIX: repoint reading_check_codes so every book serves the quiz
-- that was authored FOR it (matched by title).
--
-- Safe to run in Supabase SQL Editor. Wrapped in a transaction with a
-- before/after mismatch count. Idempotent — re-running changes nothing once
-- correct. Only UPDATEs check_id on existing mapping rows (no inserts/deletes).
--
-- Disambiguation: one quiz title ("The Big Wind") exists as two checks. Each
-- book is matched to the check whose seed-code strand prefix (text before the
-- first '-') equals the book's own strand prefix.  Prereqs already verified:
--   • every book_code has a mapping row      (reconcile query #1 = empty)
--   • every quiz title matches a live book   (diagnose B = empty)
--   • no duplicate BOOK titles               (diagnose C = empty)
-- ============================================================================

begin;

-- BEFORE: how many books currently serve a mismatched quiz -------------------
select count(*) as mismatched_before
  from books b
  join reading_check_codes rcc on rcc.code = b.book_code
  join reading_checks      rc  on rc.id    = rcc.check_id
 where btrim(lower(b.title)) <> btrim(lower(rc.book_title));

-- Correct target check per book (strand-prefix disambiguates the dup title) --
with correct as (
  select b.book_code,
         rc.id as check_id,
         row_number() over (
           partition by b.book_code
           order by (split_part(rc.book_code,'-',1) = split_part(b.book_code,'-',1)) desc,
                    rc.book_code
         ) as rn
    from books b
    join reading_checks rc
      on btrim(lower(rc.book_title)) = btrim(lower(b.title))
)
update reading_check_codes rcc
   set check_id = c.check_id
  from correct c
 where c.rn = 1
   and rcc.code = c.book_code
   and rcc.check_id is distinct from c.check_id;

-- AFTER: should be 0 --------------------------------------------------------
select count(*) as mismatched_after
  from books b
  join reading_check_codes rcc on rcc.code = b.book_code
  join reading_checks      rc  on rc.id    = rcc.check_id
 where btrim(lower(b.title)) <> btrim(lower(rc.book_title));

-- Review the two counts above. If mismatched_after = 0, run:  commit;
-- If anything looks wrong, run:  rollback;
commit;
