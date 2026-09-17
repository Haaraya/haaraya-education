-- ============================================================================
-- Haaraya — finalize S-04-01: rename book + its reading check to "Femi and the Wind"
-- Resolves the last remaining title mismatch (was "The Big Wind" after a rename).
-- Touches ONLY book S-04-01 and the check currently linked to it; the other
-- "The Big Wind" book (TF-02-02) is left alone. Idempotent.
-- ============================================================================

begin;

-- 1) rename the book
update books
   set title = 'Femi and the Wind'
 where book_code = 'S-04-01';

-- 2) rename the reading check currently linked to that book
update reading_checks rc
   set book_title = 'Femi and the Wind'
  from reading_check_codes rcc
 where rcc.check_id = rc.id
   and rcc.code = 'S-04-01';

-- 3) verify — should be 0
select count(*) as mismatched_after
  from books b
  join reading_check_codes rcc on rcc.code = b.book_code
  join reading_checks      rc  on rc.id    = rcc.check_id
 where btrim(lower(b.title)) <> btrim(lower(rc.book_title));

commit;
